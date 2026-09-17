/**
 * Reads what resolveAccess (access.ts) needs from the database: the account, its parents, whether
 * it is staff or company-covered, and the platform switch that turns the pause on.
 */
import { prisma } from "@/lib/prisma";
import { hasAnyOrgProvidedAccess } from "@/lib/org-entitlement";
import { resolveAccess, seatHolder, type Access } from "@/lib/access";

export const ACCESS_TRIAL_SETTING = "accessTrial";

const PERSON_SELECT = {
  createdAt: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  freeForever: true,
  isSuperAdmin: true,
  subscriptionPlan: { select: { name: true, familyPlanKey: true, maxParents: true, maxChildren: true, maxTutors: true } },
} as const;

// The switch changes once, by hand; re-reading it on every request would cost a query per answer.
const SWITCH_TTL_MS = 30_000;
let cachedSwitch: { value: Date | null; readAt: number } | null = null;

/** When the 7-day trial + pause was switched on for the platform, or null while it is off. */
export async function loadPauseStartsAt(): Promise<Date | null> {
  if (cachedSwitch && Date.now() - cachedSwitch.readAt < SWITCH_TTL_MS) return cachedSwitch.value;
  const row = await prisma.appSetting.findUnique({ where: { key: ACCESS_TRIAL_SETTING }, select: { value: true } });
  const raw = (row?.value as { startsAt?: unknown } | null)?.startsAt;
  const date = typeof raw === "string" ? new Date(raw) : null;
  const value = date && !Number.isNaN(date.getTime()) ? date : null;
  cachedSwitch = { value, readAt: Date.now() };
  return value;
}

/** Forget the cached switch (after the administrator changes it). */
export function forgetPauseSwitch(): void {
  cachedSwitch = null;
}

/**
 * The accounts in `userIds` that are paused right now — for the cron sweeps, which must not send
 * reminders, alerts or reports to a paused family. While the pause is switched off nobody is
 * paused and this costs one cached read.
 */
export async function pausedUserIds(userIds: Iterable<string>, now: Date = new Date()): Promise<Set<string>> {
  const paused = new Set<string>();
  if (!(await loadPauseStartsAt())) return paused;
  for (const id of new Set(userIds)) {
    if ((await loadAccess(id, now))?.kind === "paused") paused.add(id);
  }
  return paused;
}

/** Who has the family's plan when it leaves this parent out, as the dashboard and messages name it. */
export type SeatHolderNote = { name: string | null; plan: string; parents: number; upgrade: string | null };

/**
 * For a parent on the trial or paused: the other parent whose plan already covers the children but
 * has no seat for this one (seatHolder in access.ts), or null. Read only for such accounts.
 */
export async function loadSeatHolder(userId: string): Promise<SeatHolderNote | null> {
  const links = await prisma.guardian.findMany({
    where: { parentId: userId, status: "active", relation: "PARENT" },
    select: {
      child: {
        select: {
          guardianLinks: {
            where: { status: "active", relation: "PARENT", parentId: { not: userId } },
            orderBy: { createdAt: "asc" },
            select: { parent: { select: { ...PERSON_SELECT, name: true } } },
          },
        },
      },
    },
  });
  const found = seatHolder(links.map((l) => l.child.guardianLinks.map((g) => g.parent)));
  if (!found) return null;
  return { name: found.holder.name, plan: found.plan.label, parents: found.plan.maxParents, upgrade: found.upgrade?.label ?? null };
}

/** This account's access right now, or null when the account doesn't exist. */
export async function loadAccess(userId: string, now: Date = new Date()): Promise<Access | null> {
  const [user, pauseStartsAt] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...PERSON_SELECT,
        isOrgAdmin: true,
        accountRole: true,
        guardianLinks: { where: { status: "active", relation: "PARENT" }, select: { parent: { select: PERSON_SELECT } } },
        // As a parent: the other parents of the same children (the second parent of Family Duo /
        // Family Trio is covered by the first one's plan). As a family tutor: they don't buy a package.
        childrenLinks: {
          where: { status: "active", relation: { in: ["PARENT", "TUTOR"] } },
          select: {
            relation: true,
            createdAt: true,
            child: {
              select: {
                guardianLinks: {
                  where: { status: "active", relation: "PARENT", parentId: { not: userId } },
                  select: { createdAt: true, parent: { select: PERSON_SELECT } },
                },
              },
            },
          },
        },
        // An instructor/admin of a subject doesn't buy a package; a learner does.
        enrollments: { where: { isActive: true }, select: { roles: true } },
      },
    }),
    loadPauseStartsAt(),
  ]);
  if (!user) return null;

  const teaches = user.enrollments.some((e) => e.roles.includes("INSTRUCTOR") || e.roles.includes("ADMIN"));
  const learns = user.enrollments.some((e) => e.roles.includes("STUDENT"));
  // A family's tutor doesn't buy a package — unless the account learns itself: a pupil accepted as
  // „tutor" by a family (a sibling, a classmate) would otherwise never be paused.
  const familyTutor =
    user.childrenLinks.some((l) => l.relation === "TUTOR") &&
    user.accountRole !== "STUDENT" &&
    !(user.accountRole == null && learns);
  const base = {
    now,
    pauseStartsAt,
    self: user,
    parents: user.guardianLinks.map((g) => g.parent),
    coParentGroups: user.childrenLinks
      .filter((l) => l.relation === "PARENT")
      .map((l) => ({ linkedAt: l.createdAt, others: l.child.guardianLinks.map((g) => ({ person: g.parent, linkedAt: g.createdAt })) })),
    tutorFamilies: user.childrenLinks
      .filter((l) => l.relation === "TUTOR")
      .flatMap((l) => l.child.guardianLinks.map((g) => g.parent)),
    staff: user.isOrgAdmin || user.accountRole === "TUTOR" || familyTutor || teaches,
  };
  const withoutCompany = resolveAccess({ ...base, orgCovered: false });
  if (withoutCompany.kind === "full") return withoutCompany;
  // One more query, only for accounts that aren't already covered: a company-paid learner must
  // never see a trial countdown or a pause.
  return (await hasAnyOrgProvidedAccess(userId)) ? { kind: "full", reason: "org" } : withoutCompany;
}
