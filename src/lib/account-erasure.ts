/**
 * Erasing an account: after a parent's „no”, after no parent answered (Alex, 28.09.2026: „Nu poti
 * pastra datele unui cont refuzat”), after 12 months in the pause with nobody signing in
 * (inactive-accounts.ts, 29.09.2026), or by a person's decision (scripts/erase-account.ts).
 *
 * The account row goes, and with it everything tied to it by a database link (answers, progress,
 * sessions, notifications, family links…). Some tables point at a user WITHOUT such a link and would
 * be left behind by a plain delete: those are emptied first, in the same transaction; so are other
 * people's notifications that name the account. Uploaded files and certificates go after the rows.
 *
 * What stays, without the person: payments (moved to a holder account with no one behind it, when a
 * person or the inactivity sweep erases an account that paid once), the commissions it earned others
 * (a referral's earnings outlive the referred account) and those already paid out to it, and the
 * discount codes it created (a family may still hold one).
 *
 * The Legal Hub, for an account with a parent's consent story:
 *  - after a „no” or no answer, it is told BEFORE anything is deleted (SUBJECT_ERASED), under the
 *    account's consent lock, so the proof can't be missing for an account that is gone; the Hub refuses
 *    „no answer” when a parent did answer, and that answer is applied instead;
 *  - for any other reason (inactivity, a person's decision) it is told AFTER the delete, through a
 *    record retried every hour — so it never holds an erasure for an account that was kept after all.
 *
 * Never erased automatically: staff accounts, and an account still paying (a card subscription, an
 * extra subject or seat bought next to it) or owed commissions — money has to be stopped or settled by a
 * person first. Those are stopped, a person is told, and scripts/erase-account.ts finishes them.
 */
import { readdir, rm, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendAppEmail } from "@/lib/email";
import { erasureRequestId, recordGuardianEvent } from "@/lib/legal/guardian";
import { consentReminderId, consentToId, consentTokenId, parseConsentReminderToken } from "@/lib/parent-consent";
import { forgetConsentStop, loadConsentState } from "@/lib/parent-consent-server";
import { runningAddons, type AddonEntry } from "@/lib/checkout-facts";
import { ERASED_PAYMENTS_HOLDER_ID } from "@/lib/erased-holder";
import { getLegalDocument } from "@/lib/legal-doc";

export type ErasureReason = "GUARDIAN_REFUSED" | "NO_GUARDIAN_ANSWER" | "INACTIVE" | "OTHER";
export type ErasureResult =
  | { erased: true }
  | {
      erased: false;
      why: "no-account" | "protected" | "has-payments" | "legal-unavailable" | "not-due" | "answered";
    };

const LICENTA_DIR = process.env.LICENTA_UPLOAD_DIR || "/var/www/tutor-uploads/licenta";
const CERTIFICATES_DIR = path.join(process.cwd(), "public", "certificates");
const DAY_MS = 24 * 60 * 60 * 1000;
export { ERASED_PAYMENTS_HOLDER_ID };
/** An erasure the Hub still has to hear about (INACTIVE, OTHER: told after the delete). */
const reportId = (userId: string) => `erasure-report:${userId}`;

type Options = {
  /** INACTIVE: the last sign of life the sweep saw. A sign-in after it means the account is kept. */
  activitySince?: Date;
  /** Past payments move to the holder and the rest goes (nothing may still be paying or owed). */
  keepPayments?: boolean;
};

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type Db = typeof prisma | Tx;

/** Money still moving on an account: what a person has to stop or settle before it can go. */
export type MoneyFacts = { payments: number; card: boolean; addons: AddonEntry[]; owedCommissions: number };

export async function moneyFacts(userId: string, db: Db = prisma): Promise<MoneyFacts | null> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true, _count: { select: { payments: true } } },
  });
  if (!u) return null;
  // One after the other: inside a transaction the queries share one connection.
  const addons = await runningAddons(userId, db as typeof prisma);
  const owedCommissions = await db.referralEarning.count({ where: { promoterId: userId, status: { in: ["PENDING", "PAYABLE"] } } });
  return { payments: u._count.payments, card: u.stripeSubscriptionId !== null, addons, owedCommissions };
}

/** Still paying or owed something: never erased without a person. */
export const stillMoving = (m: MoneyFacts) => m.card || m.addons.length > 0 || m.owedCommissions > 0;

/** Does the reason for erasing still hold? Read under the account's consent lock. */
async function reasonHolds(userId: string, reason: ErasureReason, opts: Options): Promise<boolean> {
  if (reason === "GUARDIAN_REFUSED") {
    // On the stored answer, not on the age: a refusal holds past the learner's 16th birthday.
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { parentConsentRefusedAt: true, parentConsentAt: true } });
    return !!u?.parentConsentRefusedAt && !u.parentConsentAt;
  }
  if (reason === "NO_GUARDIAN_ANSWER") {
    const s = await loadConsentState(userId);
    return s.kind === "blocked" && s.reason === "no-answer";
  }
  if (reason === "INACTIVE" && opts.activitySince) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { lastLoginAt: true } });
    return !u?.lastLoginAt || u.lastLoginAt.getTime() <= opts.activitySince.getTime();
  }
  return true;
}

/** Tables that name an account without a database link: emptied for an id, account or not. */
async function deleteUnlinked(tx: Tx, userId: string) {
  await tx.examAttempt.deleteMany({ where: { userId } });
  await tx.licentaDocument.deleteMany({ where: { userId } });
  await tx.studyBreak.deleteMany({ where: { userId } });
  await tx.parentNudge.deleteMany({ where: { OR: [{ parentId: userId }, { childId: userId }] } });
  await tx.questionFeedback.deleteMany({ where: { userId } });
  await tx.watcherReportSchedule.deleteMany({ where: { OR: [{ parentId: userId }, { childId: userId }] } });
  await tx.adminAuditLog.deleteMany({ where: { targetUserId: userId } });
  // Other people's notifications about this account: a parent's (parent-monitor, parent-nudge: childId),
  // a teacher's or a parent's (curriculum-lag, threshold-monitor: studentId; the call alert:
  // studentUserId), a parent's trial messages naming the children (access-lifecycle: aboutUserIds).
  await tx.notification.deleteMany({
    where: {
      OR: [
        { metadata: { path: ["childId"], equals: userId } },
        { metadata: { path: ["studentId"], equals: userId } },
        { metadata: { path: ["studentUserId"], equals: userId } },
        { metadata: { path: ["aboutUserIds"], array_contains: [userId] } },
      ],
    },
  });
}

async function removeFiles(userId: string, licenta: string[]) {
  const root = path.resolve(LICENTA_DIR);
  for (const f of licenta) {
    const full = path.resolve(root, f);
    if (!full.startsWith(root + path.sep)) continue;
    await unlink(full).catch(() => undefined);
  }
  // Certificates live under public/certificates/<userId>/ (lib/certificate.ts).
  const certsRoot = path.resolve(CERTIFICATES_DIR);
  const certs = path.resolve(certsRoot, userId);
  if (/^[A-Za-z0-9_-]+$/.test(userId) && certs.startsWith(certsRoot + path.sep)) {
    await rm(certs, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** An e-mail to every platform administrator; true when at least one transport accepted one. */
export async function tellAdmins(subject: string, html: string): Promise<boolean> {
  const admins = await prisma.user.findMany({ where: { isSuperAdmin: true, email: { not: null } }, select: { email: true } });
  let delivered = false;
  for (const a of admins) {
    if (await sendAppEmail({ to: a.email as string, subject, html }).catch(() => false)) delivered = true;
  }
  return delivered;
}

const REASON_RO: Record<ErasureReason, string> = {
  GUARDIAN_REFUSED: "un părinte a refuzat",
  NO_GUARDIAN_ANSWER: "niciun părinte n-a răspuns",
  INACTIVE: "inactiv 12 luni",
  OTHER: "cerere",
};

/**
 * Held for money: a person is told what to stop or settle, and the command that finishes it. Told again
 * every 30 days while it stays held; a notice no transport accepted is tried again on the next run.
 */
async function holdForPerson(userId: string, reason: ErasureReason, money: MoneyFacts): Promise<void> {
  const identifier = `erasure-held:${userId}`;
  if (await prisma.verificationToken.findFirst({ where: { identifier, expires: { gt: new Date() } }, select: { token: true } })) return;
  const steps = [
    money.card ? "oprește abonamentul cu cardul (brokerul Stripe)" : null,
    money.addons.length
      ? `oprește abonamentele separate (materii / locuri în plus), din brokerul Stripe: ${money.addons.map((a) => `<code>${a.sessionId}</code>`).join(", ")}`
      : null,
    money.owedCommissions
      ? `decontează comisioanele de recomandare neplătite ale contului (${money.owedCommissions}): plătește-le sau anulează-le`
      : null,
  ].filter(Boolean);
  const delivered = await tellAdmins(
    "eTutor.ro: un cont de șters are plăți — e nevoie de tine",
    `<p>Contul <code>${userId}</code> trebuie șters (${REASON_RO[reason]}), dar ${
      steps.length ? "mai are bani în mișcare" : "are plăți"
    }, așa că e doar oprit.</p>
${steps.length ? `<p>Întâi:</p><ul>${steps.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
<p>Apoi, în cel mult 30 de zile, rulează pe server <code>npx tsx scripts/erase-account.ts --user ${userId} --reason ${reason} --keep-payments --apply</code>. Plățile rămân, fără nimic despre persoană.</p>`,
  );
  if (!delivered) {
    logger.error("Account held for payments, but no administrator could be told; retried next run", undefined, { userId, reason });
    return;
  }
  await prisma.verificationToken
    .create({ data: { identifier, token: `held:${userId}:${reason}:${Date.now()}`, expires: new Date(Date.now() + 30 * DAY_MS) } })
    .catch(() => undefined);
}

/** The Hub hears of an erasure it wasn't told of beforehand (INACTIVE, OTHER); false = retry later. */
async function reportErasure(userId: string, reason: ErasureReason): Promise<boolean> {
  const r = await recordGuardianEvent({ event: "SUBJECT_ERASED", subjectRef: userId, requestId: erasureRequestId(userId), reason });
  if (!r.ok && r.why !== "subject-erased") return false;
  await prisma.verificationToken.deleteMany({ where: { identifier: reportId(userId) } });
  return true;
}

/** Cron: the erasures the Hub still has to hear about. */
export async function flushErasureReports(): Promise<{ reported: number; pending: number }> {
  const rows = await prisma.verificationToken.findMany({
    where: { identifier: { startsWith: "erasure-report:" } },
    select: { identifier: true, token: true },
    take: 500,
  });
  let reported = 0;
  for (const row of rows) {
    const [, userId, reason] = row.token.split(":");
    if (!userId || !reason) continue;
    if (await reportErasure(userId, reason as ErasureReason).catch(() => false)) reported++;
  }
  return { reported, pending: rows.length - reported };
}

export async function eraseAccount(userId: string, reason: ErasureReason, opts: Options = {}): Promise<ErasureResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      isSuperAdmin: true,
      accountRole: true,
      parentConsentRequestedAt: true,
      parentConsentEmail: true,
      enrollments: { select: { roles: true } },
    },
  });
  if (!user) {
    // Gone already — but rows written under its id after it went (a session still open) are removed.
    await prisma.$transaction((tx) => deleteUnlinked(tx, userId));
    return { erased: false, why: "no-account" };
  }
  const roles = user.enrollments.flatMap((e) => e.roles as string[]);
  if (
    user.isSuperAdmin ||
    user.accountRole === "TUTOR" ||
    roles.includes("INSTRUCTOR") ||
    roles.includes("ADMIN") ||
    userId === ERASED_PAYMENTS_HOLDER_ID
  ) {
    logger.warn("Account erasure refused: staff account", { userId, reason });
    return { erased: false, why: "protected" };
  }
  const money = (await moneyFacts(userId)) as MoneyFacts;
  if (stillMoving(money) || (money.payments > 0 && !opts.keepPayments)) {
    logger.warn("Account erasure held: money on the account, a person has to finish it", { userId, reason });
    await holdForPerson(userId, reason, money);
    return { erased: false, why: "has-payments" };
  }

  // 1. The reason still holds?
  const due = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${consentTokenId(userId)}))`;
    return reasonHolds(userId, reason, opts);
  });
  if (!due) return { erased: false, why: "not-due" };

  // 2. After a parent's „no” or silence, the Hub first (outside any transaction).
  const consentReason = reason === "GUARDIAN_REFUSED" || reason === "NO_GUARDIAN_ANSWER";
  const reportAfter = !consentReason && user.parentConsentRequestedAt !== null;
  if (consentReason) {
    const marked = await recordGuardianEvent({ event: "SUBJECT_ERASED", subjectRef: userId, requestId: erasureRequestId(userId), reason });
    if (!marked.ok && marked.why !== "subject-erased") {
      if (marked.why === "answer-exists" && marked.storedEvent) {
        // A parent answered after all (the answer reached the Hub but not us): apply it, erase nothing.
        const now = new Date();
        await prisma.user.update({
          where: { id: userId },
          data:
            marked.storedEvent === "GIVEN"
              ? { parentConsentAt: now, parentConsentRefusedAt: null, parentConsentEmail: null }
              : { parentConsentRefusedAt: now, parentConsentAt: null },
        });
        forgetConsentStop(userId);
        return { erased: false, why: "answered" };
      }
      return { erased: false, why: "legal-unavailable" };
    }
  }

  // 3. Delete, re-checking the reason and the money under the lock.
  let licenta: string[] = [];
  const email = user.email;
  let outcome: "deleted" | "not-due" | "money" = "not-due";
  try {
    outcome = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${consentTokenId(userId)}))`;
        if (!(await reasonHolds(userId, reason, opts))) return "not-due" as const;
        const nowMoney = await moneyFacts(userId, tx);
        if (!nowMoney) return "deleted" as const;
        if (stillMoving(nowMoney) || (nowMoney.payments > 0 && !opts.keepPayments)) return "money" as const;
        // Read under the lock: a file added a moment ago goes too. A file that can't be removed after the
        // commit is picked up by the hourly sweep of files nobody owns (sweepOrphanFiles).
        licenta = (await tx.licentaDocument.findMany({ where: { userId }, select: { filePath: true } })).map((d) => d.filePath);
        await deleteUnlinked(tx, userId);
        // Linked, but kept on delete (SET NULL) — and they carry the child's own work or address.
        await tx.magicQuiz.deleteMany({ where: { userId } });
        await tx.familyInvite.deleteMany({
          where: { OR: [{ acceptedById: userId }, ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : [])] },
        });
        await tx.user.updateMany({ where: { createdByParentId: userId }, data: { createdByParentId: null } });
        // Links and limits keyed by the account, its address, or the parent address it was given.
        await tx.verificationToken.deleteMany({
          where: {
            OR: [
              { identifier: { contains: userId } },
              ...(email
                ? [
                    { identifier: { equals: email, mode: "insensitive" as const } },
                    { identifier: { endsWith: `:${email}`, mode: "insensitive" as const } },
                  ]
                : []),
              ...(user.parentConsentEmail ? [{ identifier: consentToId(user.parentConsentEmail) }] : []),
            ],
          },
        });
        // What stays without the person goes to the holder: past payments, commissions already paid out
        // to this account, the discount codes it created. A referral's earnings outlive the referred
        // account on their own (ReferralEarning.referralId is set to null).
        const paidOut = await tx.referralEarning.count({ where: { promoterId: userId, status: "PAID" } });
        const vouchers = await tx.voucher.count({ where: { createdById: userId } });
        if (nowMoney.payments > 0 || paidOut > 0 || vouchers > 0) {
          await tx.user.createMany({
            data: [{ id: ERASED_PAYMENTS_HOLDER_ID, name: "Plăți ale conturilor șterse", isBanned: true, freeForever: true }],
            skipDuplicates: true,
          });
          await tx.user.updateMany({ where: { id: ERASED_PAYMENTS_HOLDER_ID, freeForever: false }, data: { freeForever: true } });
          await tx.payment.updateMany({ where: { userId }, data: { userId: ERASED_PAYMENTS_HOLDER_ID } });
          await tx.referralEarning.updateMany({ where: { promoterId: userId, status: "PAID" }, data: { promoterId: ERASED_PAYMENTS_HOLDER_ID } });
          await tx.voucher.updateMany({ where: { createdById: userId }, data: { createdById: ERASED_PAYMENTS_HOLDER_ID } });
        }
        if (reportAfter) {
          await tx.verificationToken.create({
            data: { identifier: reportId(userId), token: `report:${userId}:${reason}`, expires: new Date(Date.now() + 365 * DAY_MS) },
          });
        }
        await tx.user.delete({ where: { id: userId } });
        return "deleted" as const;
      },
      { timeout: 30_000, maxWait: 10_000 },
    );
  } catch (err) {
    // Deleted by another run in the meantime: erased all the same.
    if ((err as { code?: string })?.code === "P2025") outcome = "deleted";
    else throw err;
  }

  if (outcome === "money") {
    const again = await moneyFacts(userId);
    if (again) await holdForPerson(userId, reason, again);
    return { erased: false, why: "has-payments" };
  }
  if (outcome === "not-due") {
    if (consentReason) {
      // The Hub holds an erasure for an account that stays (it changed in the seconds the Hub was asked):
      // a person has to look at it — the Hub will refuse any later answer for this child.
      logger.error("The Legal Hub recorded an erasure, but the account was kept", undefined, { userId, reason });
      await tellAdmins(
        "eTutor.ro: Legal Hub și eTutor nu se mai potrivesc pentru un cont",
        `<p>Legal Hub a înregistrat ștergerea contului <code>${userId}</code> (${REASON_RO[reason]}), dar contul s-a schimbat între timp și a rămas. Hub-ul nu mai primește răspunsuri pentru el. Verifică-l și decide: îl ștergi cu <code>npx tsx scripts/erase-account.ts --user ${userId} --reason OTHER --apply</code> sau notezi excepția.</p>`,
      );
    }
    return { erased: false, why: "not-due" };
  }

  forgetConsentStop(userId);
  await removeFiles(userId, licenta);
  logger.info("Account erased", { userId, reason });
  if (reportAfter) await reportErasure(userId, reason).catch(() => false);
  return { erased: true };
}

export type SweepResult = {
  erasedRefused: number;
  erasedNoAnswer: number;
  /** Refused or long waiting, but still paying or owed: a person has to finish these. */
  heldForPayments: number;
  /** Not erased this run: the Hub unreachable, a failure (retried next run). */
  failed: number;
};

/**
 * Reads candidates in pages by id — all of them, within the time the run has. „After this id", not a
 * row cursor: the last account of a page may be erased while the page is handled.
 */
async function* pages<T extends { id: string }>(read: (after: string | undefined) => Promise<T[]>, until: number) {
  let after: string | undefined;
  while (Date.now() < until) {
    const page = await read(after);
    if (page.length === 0) return;
    yield page;
    if (page.length < 200) return;
    after = page[page.length - 1].id;
  }
}

/** The reminder records of an account's waiting period: when it no longer waits, they no longer count. */
async function dropReminders(userId: string) {
  await prisma.verificationToken.deleteMany({
    where: {
      OR: [
        { identifier: { startsWith: `parent-consent-reminder:${userId}:` } },
        { identifier: { startsWith: `parent-consent-reminder-fail:${userId}:` } },
      ],
    },
  });
}

/**
 * The cron sweep (/api/cron/account-retention): refusals whose erasure didn't finish at the time (the
 * Hub was unreachable, the server restarted) and accounts no parent answered for — erased only after
 * the last reminder of their waiting period went out, once the day it named is over
 * (consent-reminders.ts). An account that no longer waits by then (a parent linked it, it turned 16)
 * loses those reminders: if it is ever stopped again, its parent gets a new last reminder and two days.
 */
export async function eraseLapsedConsentAccounts(now: Date = new Date(), budgetMs = 15 * 60_000): Promise<SweepResult> {
  const result: SweepResult = { erasedRefused: 0, erasedNoAnswer: 0, heldForPayments: 0, failed: 0 };
  const until = Date.now() + budgetMs;
  const since17 = new Date(Date.UTC(now.getUTCFullYear() - 17, now.getUTCMonth(), now.getUTCDate()));
  // Without the consent text in the Hub no parent could have answered: nobody is erased for silence then.
  const textOnline = (await getLegalDocument("parental_consent", "ro")).ok;
  if (!textOnline) logger.error("The parental consent text can't be loaded from the Legal Hub: no-answer erasures wait");

  const tally = (r: ErasureResult, ok: "erasedRefused" | "erasedNoAnswer") => {
    if (r.erased) result[ok]++;
    else if (r.why === "has-payments") result.heldForPayments++;
    else if (r.why === "legal-unavailable") result.failed++;
  };

  for await (const page of pages(
    (after) =>
      prisma.user.findMany({
        where: { ...(after ? { id: { gt: after } } : {}), parentConsentRefusedAt: { not: null }, parentConsentAt: null },
        select: { id: true },
        orderBy: { id: "asc" },
        take: 200,
      }),
    until,
  )) {
    for (const { id } of page) {
      try {
        tally(await eraseAccount(id, "GUARDIAN_REFUSED"), "erasedRefused");
      } catch (err) {
        result.failed++;
        logger.error("Consent erasure failed for one account", err, { userId: id });
      }
    }
  }

  // Waiting for an answer, minors only, and the date the last reminder of this period named is over.
  if (textOnline) for await (const page of pages(
    (after) =>
      prisma.user.findMany({
        where: {
          ...(after ? { id: { gt: after } } : {}),
          parentConsentRequestedAt: { not: null },
          parentConsentAt: null,
          parentConsentRefusedAt: null,
          birthDate: { gt: since17 },
        },
        select: { id: true, parentConsentRequestedAt: true },
        orderBy: { id: "asc" },
        take: 200,
      }),
    until,
  )) {
    const period = new Map(page.map((p) => [p.id, p.parentConsentRequestedAt?.getTime()]));
    const markers = await prisma.verificationToken.findMany({
      where: { identifier: { in: page.map((p) => consentReminderId(p.id, "two_days_before")) } },
      select: { identifier: true, token: true },
    });
    for (const marker of markers) {
      const id = marker.identifier.slice("parent-consent-reminder:".length, -":two_days_before".length);
      const named = parseConsentReminderToken(marker.token);
      if (!named || named.requestedAt !== period.get(id) || named.eraseOn > now.getTime()) continue;
      try {
        const r = await eraseAccount(id, "NO_GUARDIAN_ANSWER");
        tally(r, "erasedNoAnswer");
        if (!r.erased && r.why === "not-due") await dropReminders(id);
      } catch (err) {
        result.failed++;
        logger.error("Consent erasure failed for one account", err, { userId: id });
      }
    }
  }
  return result;
}

/** The daily limits on consent e-mails are only needed for a day: expired ones go (they hold addresses). */
export async function purgeConsentCounters(now: Date = new Date()): Promise<number> {
  const r = await prisma.verificationToken.deleteMany({
    where: {
      expires: { lt: now },
      OR: [{ identifier: { startsWith: "parent-consent-to:" } }, { identifier: { startsWith: "parent-consent-sent:" } }],
    },
  });
  return r.count;
}

/**
 * Files nobody owns any more — an erasure's files that couldn't be removed right after it (a disk
 * hiccup, a restart): the hourly sweep removes them once a day old. Only what the app itself writes
 * there: uploaded licență files (flat in LICENTA_DIR) and certificate folders named after an account.
 */
export async function sweepOrphanFiles(now: Date = new Date()): Promise<number> {
  const oldEnough = (t: Date) => now.getTime() - t.getTime() > DAY_MS;
  let removed = 0;
  const root = path.resolve(LICENTA_DIR);
  const files = await readdir(root).catch(() => [] as string[]);
  if (files.length) {
    const owned = new Set((await prisma.licentaDocument.findMany({ select: { filePath: true } })).map((d) => path.resolve(root, d.filePath)));
    for (const f of files) {
      const full = path.resolve(root, f);
      if (owned.has(full) || !full.startsWith(root + path.sep)) continue;
      const st = await stat(full).catch(() => null);
      if (!st?.isFile() || !oldEnough(st.mtime)) continue;
      if (await unlink(full).then(() => true).catch(() => false)) removed++;
    }
  }
  const certsRoot = path.resolve(CERTIFICATES_DIR);
  const dirs = (await readdir(certsRoot).catch(() => [] as string[])).filter((d) => /^c[a-z0-9]{20,}$/.test(d));
  if (dirs.length) {
    const alive = new Set((await prisma.user.findMany({ where: { id: { in: dirs } }, select: { id: true } })).map((u) => u.id));
    for (const d of dirs) {
      if (alive.has(d)) continue;
      const full = path.resolve(certsRoot, d);
      const st = await stat(full).catch(() => null);
      if (!st?.isDirectory() || !oldEnough(st.mtime)) continue;
      if (await rm(full, { recursive: true, force: true }).then(() => true).catch(() => false)) removed++;
    }
  }
  return removed;
}
