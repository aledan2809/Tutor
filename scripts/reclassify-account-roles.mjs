#!/usr/bin/env node
/**
 * Find accounts that are really parents (or family tutors) but carry a STUDENT
 * enrollment, and give them the right one.
 *
 * Registering with a subject always granted STUDENT, and the parent menu keys on
 * NOT being a student — so every parent who signed themselves up has been reading
 * the learner menu. New signups pick a role now; this is for the ones already here.
 *
 * DRY RUN BY DEFAULT. Nothing is written without --apply, and every applied change
 * is journalled so `--rollback` can put it back exactly.
 *
 *   node scripts/reclassify-account-roles.mjs                       # inspect
 *   node scripts/reclassify-account-roles.mjs --apply --performed-by admin@x
 *   node scripts/reclassify-account-roles.mjs --apply --include id1,id2 ...
 *   node scripts/reclassify-account-roles.mjs --rollback reclassify-<ts>.json
 *
 * Run it against production ONLY after a pg_dump, and read the report line by line
 * before applying: the rule is conservative, but the list is real people.
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { classifyAccount } from "./lib/reclassify-rule.mjs";

const prisma = new PrismaClient();
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};

const APPLY = has("--apply");
const INCLUDE = new Set((val("--include") ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const PERFORMED_BY = val("--performed-by");
const ROLLBACK = val("--rollback");
const OUT_DIR = val("--out") ?? ".";

/** Everything that means "this account studies". Any one of them blocks a change. */
async function studyActivity(userId, user) {
  const [
    sessions,
    attempts,
    examAttempts,
    examSessions,
    dailyChallengeAttempts,
    studySessions,
    lessonProgress,
    assessments,
    curriculumChecks,
    gam,
    ownReminders,
  ] = await Promise.all([
    prisma.session.count({ where: { userId } }),
    prisma.attempt.count({ where: { userId } }),
    prisma.examAttempt.count({ where: { userId } }).catch(() => 0),
    prisma.examSession.count({ where: { userId } }).catch(() => 0),
    prisma.dailyChallengeAttempt.count({ where: { userId } }).catch(() => 0),
    prisma.studySession.count({ where: { userId } }).catch(() => 0),
    prisma.lessonProgress.count({ where: { userId } }).catch(() => 0),
    prisma.assessment.count({ where: { userId } }).catch(() => 0),
    prisma.curriculumCheck.count({ where: { userId } }).catch(() => 0),
    prisma.userGamification.findFirst({ where: { userId }, select: { xp: true, lastActivityDate: true } }),
    prisma.studyReminder.count({ where: { userId } }).catch(() => 0),
  ]);
  return {
    sessions,
    attempts,
    examAttempts,
    examSessions,
    dailyChallengeAttempts,
    studySessions,
    lessonProgress,
    assessments,
    curriculumChecks,
    gamificationXp: (gam?.xp ?? 0) > 0 || gam?.lastActivityDate ? 1 : 0,
    schoolYearSet: user.schoolYear != null ? 1 : 0,
    ownReminders,
  };
}

async function collectSignals(user) {
  const userId = user.id;
  const [
    asParent,
    asTutor,
    isChild,
    invited,
    reportSchedules,
    parentEscalations,
    parentNudges,
    magicQuizzes,
    payments,
  ] = await Promise.all([
    prisma.guardian.count({ where: { parentId: userId, relation: "PARENT", status: "active" } }),
    prisma.guardian.count({ where: { parentId: userId, relation: "TUTOR", status: "active" } }),
    prisma.guardian.count({ where: { childId: userId, status: "active" } }),
    prisma.familyInvite.count({ where: { inviterId: userId, targetRole: "CHILD" } }).catch(() => 0),
    prisma.watcherReportSchedule.count({ where: { parentId: userId } }).catch(() => 0),
    prisma.parentEscalation.count({ where: { parentId: userId } }).catch(() => 0),
    prisma.parentNudge.count({ where: { parentId: userId } }).catch(() => 0),
    prisma.magicQuiz.count({ where: { userId } }).catch(() => 0),
    prisma.payment.count({ where: { userId } }).catch(() => 0),
  ]);

  return {
    isSuperAdmin: user.isSuperAdmin,
    hasAdminOrInstructorRole: user.enrollments.some(
      (e) => e.roles.includes("ADMIN") || e.roles.includes("INSTRUCTOR")
    ),
    isBanned: !!user.isBanned,
    guardianOfAsParent: asParent,
    guardianOfAsTutor: asTutor,
    invitedAChild: invited,
    usedParentFeatures: reportSchedules + parentEscalations + parentNudges,
    hasPaidFamilyPlan: false, // filled by the caller (needs the plan record)
    isSomeonesChild: isChild > 0,
    studyActivity: await studyActivity(userId, user),
    weakSignals: { magicQuizzes, payments },
  };
}

async function rollback(file) {
  const journal = JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(`Rollback: ${journal.length} account(s) from ${file}\n`);
  for (const row of journal) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: row.userId },
        data: { accountRole: row.before.accountRole },
      });
      for (const e of row.before.enrollments) {
        await tx.enrollment.update({ where: { id: e.id }, data: { roles: { set: e.roles } } });
      }
      for (const id of row.createdEnrollmentIds ?? []) {
        await tx.enrollment.delete({ where: { id } }).catch(() => {});
      }
    });
    console.log(`  restored ${row.email}`);
  }
  console.log("\nDone.");
}

async function main() {
  if (ROLLBACK) return rollback(ROLLBACK);

  if (APPLY && !PERFORMED_BY) {
    console.error("--apply requires --performed-by <superadmin email> (it is written to the audit log).");
    process.exit(1);
  }
  let performerId = null;
  if (APPLY) {
    const performer = await prisma.user.findUnique({
      where: { email: PERFORMED_BY },
      select: { id: true, isSuperAdmin: true },
    });
    if (!performer?.isSuperAdmin) {
      console.error(`--performed-by must be a superadmin account (got: ${PERFORMED_BY}).`);
      process.exit(1);
    }
    performerId = performer.id;
  }

  // Only accounts that currently carry STUDENT — the rest already look right.
  const users = await prisma.user.findMany({
    where: { enrollments: { some: { roles: { has: "STUDENT" } } } },
    select: {
      id: true,
      email: true,
      name: true,
      isSuperAdmin: true,
      isBanned: true,
      schoolYear: true,
      accountRole: true,
      subscriptionStatus: true,
      subscriptionPlan: { select: { maxParents: true, maxChildren: true } },
      enrollments: { select: { id: true, domainId: true, roles: true } },
    },
  });

  const rows = [];
  for (const u of users) {
    const signals = await collectSignals(u);
    const plan = u.subscriptionPlan;
    signals.hasPaidFamilyPlan =
      ["active", "trialing"].includes(u.subscriptionStatus ?? "") &&
      !!plan &&
      ((plan.maxChildren ?? 0) > 0 || (plan.maxParents ?? 0) > 0);
    rows.push({ user: u, signals, ...classifyAccount(signals) });
  }

  const by = (v) => rows.filter((r) => r.verdict === v);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(OUT_DIR, `reclassify-${stamp}.report.md`);

  const md = [
    `# Reclasificare roluri de cont — ${new Date().toISOString()}`,
    ``,
    `Conturi cu enrollment STUDENT examinate: **${rows.length}**`,
    ``,
    `| verdict | număr |`,
    `|---|---|`,
    ...["APPLY", "REVIEW", "KEEP", "SKIP"].map((v) => `| ${v} | ${by(v).length} |`),
    ``,
    `## De aplicat (${by("APPLY").length})`,
    ``,
    `| email | nume | rol nou | motive |`,
    `|---|---|---|---|`,
    ...by("APPLY").map(
      (r) => `| ${r.user.email} | ${r.user.name ?? ""} | ${r.role} | ${r.reasons.join("; ")} |`
    ),
    ``,
    `## De revizuit manual (${by("REVIEW").length}) — aplicate doar cu \`--include <id>\``,
    ``,
    `| id | email | rol propus | motive |`,
    `|---|---|---|---|`,
    ...by("REVIEW").map(
      (r) => `| ${r.user.id} | ${r.user.email} | ${r.role} | ${r.reasons.join("; ")} |`
    ),
    ``,
    `## Neatinse (${by("KEEP").length + by("SKIP").length})`,
    ``,
    ...by("KEEP").slice(0, 50).map((r) => `- ${r.user.email} — ${r.reasons.join("; ")}`),
    by("KEEP").length > 50 ? `- …și încă ${by("KEEP").length - 50}` : "",
    ``,
  ].join("\n");
  fs.writeFileSync(reportPath, md);

  console.log(md.split("\n").slice(0, 40).join("\n"));
  console.log(`\nRaport complet: ${reportPath}`);

  const targets = rows.filter(
    (r) => r.verdict === "APPLY" || (r.verdict === "REVIEW" && INCLUDE.has(r.user.id))
  );

  if (!APPLY) {
    console.log(`\nDRY RUN — nimic nu s-a scris. ${targets.length} cont(uri) ar fi modificate.`);
    console.log(`Citește raportul linie cu linie, apoi rulează cu --apply --performed-by <email>.`);
    return;
  }

  const journal = [];
  for (const r of targets) {
    const before = {
      accountRole: r.user.accountRole,
      enrollments: r.user.enrollments.map((e) => ({ id: e.id, roles: e.roles })),
    };
    const createdEnrollmentIds = [];

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: r.user.id }, data: { accountRole: r.role } });

      // Drop STUDENT; an enrollment left with no role becomes WATCHER so the
      // child still shows up in their monitoring list.
      for (const e of r.user.enrollments) {
        if (!e.roles.includes("STUDENT")) continue;
        const rest = e.roles.filter((x) => x !== "STUDENT");
        await tx.enrollment.update({
          where: { id: e.id },
          data: { roles: { set: rest.length ? rest : ["WATCHER"] } },
        });
      }

      // WATCHER is per-domain: without one in each of the child's domains, the
      // child would not appear at all.
      const children = await tx.guardian.findMany({
        where: { parentId: r.user.id, status: "active" },
        select: { childId: true },
      });
      for (const c of children) {
        const childDomains = await tx.enrollment.findMany({
          where: { userId: c.childId, isActive: true, roles: { has: "STUDENT" } },
          select: { domainId: true },
        });
        for (const d of childDomains) {
          const existing = await tx.enrollment.findUnique({
            where: { userId_domainId: { userId: r.user.id, domainId: d.domainId } },
            select: { id: true, roles: true },
          });
          if (!existing) {
            const created = await tx.enrollment.create({
              data: { userId: r.user.id, domainId: d.domainId, roles: ["WATCHER"] },
              select: { id: true },
            });
            createdEnrollmentIds.push(created.id);
          } else if (!existing.roles.includes("WATCHER")) {
            await tx.enrollment.update({
              where: { id: existing.id },
              data: { roles: { set: [...existing.roles, "WATCHER"] }, isActive: true },
            });
          }
        }
      }

      await tx.adminAuditLog.create({
        data: {
          action: "ROLE_CHANGE",
          targetType: "User",
          targetUserId: r.user.id,
          performedById: performerId,
          metadata: {
            script: "reclassify-account-roles",
            before,
            after: { accountRole: r.role },
            reasons: r.reasons,
          },
        },
      });
    });

    journal.push({ userId: r.user.id, email: r.user.email, before, createdEnrollmentIds });
    console.log(`  ✓ ${r.user.email} → ${r.role}`);
  }

  const journalPath = path.join(OUT_DIR, `reclassify-${stamp}.json`);
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2));
  console.log(`\nAplicat pe ${journal.length} cont(uri). Jurnal pentru revenire: ${journalPath}`);
  console.log(`Revenire: node scripts/reclassify-account-roles.mjs --rollback ${journalPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
