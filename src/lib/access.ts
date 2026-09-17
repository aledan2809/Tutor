/**
 * access.ts — who may use the app right now: fully, on the 7-day trial, or paused.
 *
 * Alex's decisions of 16.09.2026:
 *  - Without a card, a family gets the whole package for 7 days (WhatsApp/SMS aside — those are
 *    paid per message, see meteredChannelsCovered).
 *  - On day 8 without payment the account is paused, the child's AND the parent's: no practice, no
 *    reminders, no alerts, no report. Nothing is deleted; paying brings everything back.
 *  - Accounts that already existed get their 7 days from the moment the pause is switched on.
 *  - Accounts marked „Gratuit permanent" by an administrator (friends, testers) are never paused
 *    and get no trial messages. Tutors/instructors are never paused either.
 *
 * The pause is a platform switch (AppSetting `accessTrial.startsAt`). While it is off, nothing is
 * paused and a free account keeps today's free tier — the switch lets the owner mark the accounts
 * that stay free before anyone's clock starts.
 *
 * Pure (no DB): the loader in access-server.ts reads the rows and calls resolveAccess.
 */
import { isPaidSubscriber } from "@/lib/escalation/segmentation";
import { FREE_TRIAL_DAYS, remainingFreeTrialDays } from "@/lib/free-trial";
import {
  canAddParent,
  getFamilyPlan,
  individualPlan,
  resolveFamilyPlanFromRecord,
  seatsChild,
  type FamilyPlan,
  type SubscriptionPlanSeatFields,
} from "@/lib/family";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The fields of an account that decide its own access. */
export type AccessPerson = {
  id?: string;
  createdAt: Date;
  subscriptionStatus: string | null;
  subscriptionEndsAt: Date | null;
  freeForever: boolean;
  isSuperAdmin: boolean;
  /** The plan it pays for — an individual plan (Elev) covers only its own account. */
  subscriptionPlan?: SubscriptionPlanSeatFields | null;
  /** As a parent: add-on seats paid for next to the plan, and their children in link order (seatsChild). */
  paidExtraChildSeats?: number | null;
  childIds?: string[];
};

export type AccessInput = {
  now: Date;
  /** When the platform switched the 7-day trial + pause on; null = switched off. */
  pauseStartsAt: Date | null;
  self: AccessPerson;
  /** Active PARENT guardians of this account (a child's parents). */
  parents: AccessPerson[];
  /**
   * The other parents of this account's children, per child, with when each one was linked. In Family
   * Duo / Family Trio the second parent has no subscription of their own — the family's is on the first
   * parent's account — and the plan's parent seats go in the order the parents were linked.
   */
  coParentGroups?: CoParentGroup[];
  /** The other parents of one child, all linked before this account (for callers without link dates). */
  coParents?: AccessPerson[];
  /** The parents of the children this account tutors: a plan with a tutor's seat covers the tutor. */
  tutorFamilies?: AccessPerson[];
  /** Enrolled in a subject a company pays for. */
  orgCovered: boolean;
  /** Tutor, instructor or company administrator: they don't buy a package. */
  staff: boolean;
};

/** One child of this account: when this account was linked to it, and the child's other parents. */
export type CoParentGroup = { linkedAt: Date; others: { person: AccessPerson; linkedAt: Date }[] };

export type FullReason = "paid" | "family_paid" | "free_forever" | "staff" | "org";

export type Access =
  /** Everything the package includes. */
  | { kind: "full"; reason: FullReason }
  /** The whole package until `endsAt` (via the account's own trial or its parent's). */
  | { kind: "trial"; endsAt: Date; daysLeft: number; via: "own" | "family" }
  /** Pause switched off and nothing paid: today's free tier, nothing is blocked. */
  | { kind: "free" }
  /** Trial over, nothing paid. `payer` is who can lift it: the account itself or its parent. */
  | { kind: "paused"; since: Date; payer: "self" | "parent" };

/**
 * When this account's 7 days start: at creation, or at the switch for accounts older than it
 * (Alex: existing accounts get their week from the launch).
 */
export function trialStartOf(createdAt: Date, pauseStartsAt: Date | null): Date {
  return pauseStartsAt && createdAt.getTime() < pauseStartsAt.getTime() ? pauseStartsAt : createdAt;
}

export function trialEndOf(createdAt: Date, pauseStartsAt: Date | null): Date {
  return new Date(trialStartOf(createdAt, pauseStartsAt).getTime() + FREE_TRIAL_DAYS * DAY_MS);
}

/**
 * Free days left, in whole days rounded down the parent's way (same count as card checkout —
 * see free-trial.ts): 7 on the first day, 1 on the seventh, 0 from the moment the week is over.
 */
export function trialDaysLeft(createdAt: Date, pauseStartsAt: Date | null, now: Date): number {
  // The same count as card checkout, from the same start (review r6, K4).
  return remainingFreeTrialDays(trialStartOf(createdAt, pauseStartsAt), now);
}

/**
 * Paying for access right now: a paid subscription, or one whose renewal failed while Stripe is
 * still retrying (past_due). A declined card doesn't lock a paying family out on renewal day; if
 * Stripe gives up it cancels the subscription, and that ends it. (WhatsApp/SMS stay stricter:
 * meteredChannelsCovered sends nothing paid while a payment is failing.)
 */
export function payingForAccess(p: Pick<AccessPerson, "subscriptionStatus" | "subscriptionEndsAt">): boolean {
  if (isPaidSubscriber(p)) return true;
  return p.subscriptionStatus === "past_due" && !(p.subscriptionEndsAt && p.subscriptionEndsAt.getTime() < Date.now());
}

export { individualPlan };

/**
 * Access another account in the family can lend: a family plan paid for (or retrying), „Gratuit
 * permanent", or the platform administrator. An Elev subscription doesn't: otherwise a parent could
 * link a child in the free week and then cover them with the cheapest plan.
 */
export function paysForFamily(p: AccessPerson): boolean {
  return p.isSuperAdmin || p.freeForever || (payingForAccess(p) && !individualPlan(p.subscriptionPlan));
}

/**
 * The plan has a seat for a second parent (Family Duo, Family Trio). A row without a plan, or with
 * a plan that isn't a family one, keeps covering as before: the accounts marked paid by hand.
 */
export function secondParentSeat(plan: SubscriptionPlanSeatFields | null | undefined): boolean {
  const resolved = resolveFamilyPlanFromRecord(plan);
  return resolved === null || resolved.maxParents >= 2;
}

/**
 * Access the other parent of the same children borrows: a plan paid for with a seat for a second
 * parent, „Gratuit permanent", or the platform administrator. Family is for one parent: otherwise a
 * second adult linked to a Family child would get Family Duo for free.
 */
export function paysForSecondParent(p: AccessPerson): boolean {
  return p.isSuperAdmin || p.freeForever || (payingForAccess(p) && !individualPlan(p.subscriptionPlan) && secondParentSeat(p.subscriptionPlan));
}

/** How many parents the payer's plan takes: no limit for „Gratuit permanent", the administrator, or a row without a family plan. */
function parentSeats(p: Pick<AccessPerson, "isSuperAdmin" | "freeForever" | "subscriptionPlan">): number {
  if (p.isSuperAdmin || p.freeForever) return Infinity;
  const resolved = resolveFamilyPlanFromRecord(p.subscriptionPlan);
  return resolved === null ? Infinity : resolved.maxParents;
}

/**
 * The other parents of one child whose plan seats the parent linked at `linkedAt`. The payer always
 * holds a seat of their own; the child's other adults take the rest in the order they were linked.
 * Family Duo seats the payer and ONE more parent — also when the payer linked the child last (the
 * other two were linked in the free week): counted by link order alone, all three were covered
 * (review r6, A2). Shared by access (resolveAccess) and the paid channels (coveredAsSecondParent),
 * so the two can't disagree about who holds the second seat (A1).
 */
export function seatingPayers<P extends AccessPerson>(linkedAt: Date, others: { person: P; linkedAt: Date }[]): P[] {
  return others
    .filter((payer) => {
      if (!paysForSecondParent(payer.person)) return false;
      const earlier = others.filter((o) => o !== payer && o.linkedAt.getTime() < linkedAt.getTime()).length;
      return 1 + earlier + 1 <= parentSeats(payer.person);
    })
    .map((payer) => payer.person);
}

/** The plan has a seat for a tutor (Trio, Family Trio); a row without a family plan keeps covering. */
export function tutorSeat(plan: SubscriptionPlanSeatFields | null | undefined): boolean {
  const resolved = resolveFamilyPlanFromRecord(plan);
  return resolved === null || resolved.maxTutors >= 1;
}

/**
 * Access a family's tutor borrows from the family that pays for the tutor's seat — so a tutor who is
 * also a learner (a university student) isn't paused while the family pays for their seat.
 */
export function paysForTutor(p: AccessPerson): boolean {
  return p.isSuperAdmin || p.freeForever || (payingForAccess(p) && !individualPlan(p.subscriptionPlan) && tutorSeat(p.subscriptionPlan));
}

/**
 * A parent left out of the family's plan: each of their children is covered by another parent's plan,
 * and the first such plan (in link order) has a seat limit that leaves them out. They are shown who
 * has the plan and which plan takes one more parent — never a second Family for the same child.
 * `children` holds, per child, the child's other parents in link order. Null when some child isn't
 * covered: then buying a plan is the way in.
 */
export function seatHolder<P extends AccessPerson>(children: P[][]): { holder: P; plan: FamilyPlan; upgrade: FamilyPlan | null } | null {
  if (children.length === 0 || !children.every((others) => others.some(paysForFamily))) return null;
  for (const holder of children.flat()) {
    if (holder.isSuperAdmin || holder.freeForever || !paysForFamily(holder)) continue;
    const plan = resolveFamilyPlanFromRecord(holder.subscriptionPlan);
    if (!plan) continue;
    const next = canAddParent(plan, plan.maxParents).upgradeTo;
    const upgrade = next && getFamilyPlan(next).maxParents > plan.maxParents ? getFamilyPlan(next) : null;
    return { holder, plan, upgrade };
  }
  return null;
}

function familyReason(payers: AccessPerson[]): FullReason {
  return payers.some((p) => (payingForAccess(p) && !individualPlan(p.subscriptionPlan)) || p.isSuperAdmin) ? "family_paid" : "free_forever";
}

export function resolveAccess(input: AccessInput): Access {
  const { now, pauseStartsAt, self, parents } = input;
  const groups: CoParentGroup[] =
    input.coParentGroups ??
    (input.coParents?.length ? [{ linkedAt: now, others: input.coParents.map((person) => ({ person, linkedAt: new Date(0) })) }] : []);
  // A second parent is covered while the payer's plan has a seat for them (seatingPayers): Family Duo
  // takes two parents, not every adult who links the child.
  const seatPayers = groups.flatMap(({ linkedAt, others }) => seatingPayers(linkedAt, others));
  const tutorFamilies = input.tutorFamilies ?? [];

  if (self.isSuperAdmin) return { kind: "full", reason: "staff" };
  if (self.freeForever) return { kind: "full", reason: "free_forever" };
  if (payingForAccess(self)) return { kind: "full", reason: "paid" };
  // A parent's plan covers the children it has seats for, in link order (family.ts seatsChild).
  const seatedParents = parents.filter((p) => paysForFamily(p) && seatsChild(p, self.id, p.childIds));
  if (seatedParents.length > 0) return { kind: "full", reason: familyReason(seatedParents) };
  if (seatPayers.length > 0) return { kind: "full", reason: familyReason(seatPayers) };
  if (tutorFamilies.some(paysForTutor)) return { kind: "full", reason: familyReason(tutorFamilies.filter(paysForTutor)) };
  if (input.orgCovered) return { kind: "full", reason: "org" };
  if (input.staff) return { kind: "full", reason: "staff" };

  // The account's own week, or its parent's: the later one counts (a child can join mid-week).
  const candidates: { endsAt: Date; daysLeft: number; via: "own" | "family" }[] = [
    { endsAt: trialEndOf(self.createdAt, pauseStartsAt), daysLeft: trialDaysLeft(self.createdAt, pauseStartsAt, now), via: "own" },
    ...parents.map((p) => ({
      endsAt: trialEndOf(p.createdAt, pauseStartsAt),
      daysLeft: trialDaysLeft(p.createdAt, pauseStartsAt, now),
      via: "family" as const,
    })),
  ];
  const running = candidates
    .filter((c) => c.endsAt.getTime() > now.getTime())
    .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0];
  if (running) return { kind: "trial", ...running };

  if (!pauseStartsAt) return { kind: "free" };
  const since = candidates.map((c) => c.endsAt).sort((a, b) => b.getTime() - a.getTime())[0];
  return { kind: "paused", since, payer: parents.length > 0 ? "parent" : "self" };
}

/** Paid functions (simulations, lessons, calendar, advanced progress) are open. */
export function accessOpensPaidFeatures(access: Access): boolean {
  return access.kind === "full" || access.kind === "trial";
}
