/**
 * The facts a checkout is priced from (checkout-price.ts): whether the payer is still in the free
 * week, whether anyone in the family has Telegram connected, who the plan's subjects belong to and
 * how many they are, and the discount the family locked in at its first card payment.
 *
 * Also what is bought next to the plan — a subject or a child's seat. Each is its own Stripe
 * subscription (the broker can't change one), kept in a list on the payer: the list is what counts
 * the place, what the payment page shows with its own „Gestionează” and what a later plan doesn't
 * bill again.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { individualPlan, trialEndOf, trialStartOf } from "@/lib/access";
import { loadPauseStartsAt } from "@/lib/access-server";
import { remainingFreeTrialDays } from "@/lib/free-trial";
import { paysByCard } from "@/lib/card-subscription";
import { isParentOf } from "@/lib/guardian";
import { activeSetters } from "@/lib/guardian-lock";
import type { SubscriptionPlanSeatFields } from "@/lib/family";
import { forInterval, planMonthlyMinor, subjectMonthlyMinor, type DiscountBase } from "@/lib/checkout-price";

/** Setting key on the payer: the lifetime discount of the family's card subscription. */
export const LOCKED_DISCOUNT_KEY = "checkoutDiscount";
/** Setting key on the payer: the subjects paid for, and whose they are. */
export const PAID_SUBJECTS_KEY = "paidSubjects";
/** Setting key on the payer: the subscriptions bought next to the plan that are still running. */
export const ADDONS_KEY = "addonSubscriptions";
/** Setting key on the payer: the checkout sessions of those that have ended (an activation after it counts nothing). */
export const ENDED_ADDONS_KEY = "addonSubscriptionsEnded";

export type LockedDiscount = {
  percent: number;
  base: DiscountBase;
  telegram: boolean;
  interval: "MONTH" | "YEAR";
  at: string;
};

export type PaidSubjects = {
  learnerId: string | null;
  count: number;
  /** The checkout whose activation recorded them: the same activation delivered again changes nothing. */
  sessionId?: string;
};

export type AddonType = "subject_addon" | "child_addon";

export type AddonEntry = {
  type: AddonType;
  /** The broker's checkout session: every callback of the subscription carries it. */
  sessionId: string;
  /** Whose subject it pays for (a subject add-on). */
  learnerId: string | null;
  /** The subject it was bought for (a subject add-on). */
  domainId: string | null;
  at: string;
  /**
   * Whether its place is inside the plan's subject count (a subject add-on): set when it's bought, and
   * again when a later plan records its terms. Its end gives a place back only when it is.
   */
  counted?: boolean;
  /**
   * Subjects the learner already had beyond the paid count when this was bought (a child linked with
   * more subjects than were paid for): its end doesn't take those away. Set when the purchase counted;
   * gone once a later plan bills the learner's subjects again.
   */
  kept?: number;
};

/** The client inside prisma.$transaction (the app's client is an extended one), or the client itself. */
type Db = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

const SEAT_FIELDS = { name: true, familyPlanKey: true, maxParents: true, maxChildren: true, maxTutors: true } as const;
const DOMAIN_FACTS = { isActive: true, visibility: true, organizationId: true } as const;
const CARD_FIELDS = { id: true, subscriptionStatus: true, subscriptionEndsAt: true, stripeSubscriptionId: true } as const;

type DomainFacts = { isActive: boolean; visibility: string; organizationId: string | null };

/** A subject that is billed: public, active, not paid for by a company. */
function billedDomain(domain: DomainFacts | null | undefined): boolean {
  return !!domain && domain.isActive && domain.visibility === "PUBLIC" && domain.organizationId === null;
}

/** A learner's subjects as billed: active, as a learner, in a billed subject. */
function billableWhere(learnerId: string): Prisma.EnrollmentWhereInput {
  return { userId: learnerId, isActive: true, roles: { has: "STUDENT" }, domain: { isActive: true, visibility: "PUBLIC", organizationId: null } };
}

/**
 * The payer's own free week: the days still owed (what checkout gives), whether it runs now, and when
 * it ends (same rule as access.ts). The account's creation date can be passed when the caller already
 * has it.
 */
export async function payerTrial(
  userId: string,
  now: Date = new Date(),
  createdAt?: Date,
): Promise<{ active: boolean; daysLeft: number; endsAt: Date } | null> {
  const [user, pauseStartsAt] = await Promise.all([
    createdAt ? Promise.resolve({ createdAt }) : prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    loadPauseStartsAt(),
  ]);
  if (!user) return null;
  const daysLeft = remainingFreeTrialDays(trialStartOf(user.createdAt, pauseStartsAt), now);
  return { active: daysLeft > 0, daysLeft, endsAt: trialEndOf(user.createdAt, pauseStartsAt) };
}

/**
 * Telegram connected by anyone in the family (Alex 17.09): the payer, one of the payer's children,
 * or one of the payer's parents (a learner paying for themselves). The family's links first, then its
 * members: the work grows with the family, not with everyone who connected Telegram.
 */
export async function familyHasTelegram(userId: string): Promise<boolean> {
  const links = await prisma.guardian.findMany({
    where: { OR: [{ parentId: userId }, { childId: userId }], status: "active", relation: "PARENT" },
    select: { parentId: true, childId: true },
  });
  const family = [...new Set([userId, ...links.flatMap((l) => [l.parentId, l.childId])])];
  return (await prisma.user.count({ where: { id: { in: family }, telegramChatId: { not: null } } })) > 0;
}

/**
 * Whose subjects a plan pays for: the payer's own on a plan for one learner (Elev); on a family plan,
 * the child the plan seats — the first one linked. Null while no child is linked yet.
 */
export async function planLearner(payerId: string, plan: SubscriptionPlanSeatFields | null, db: Db = prisma): Promise<string | null> {
  return individualPlan(plan) ? payerId : firstLinkedChild(payerId, db);
}

/** The child a family plan seats first: the first one linked. */
export async function firstLinkedChild(parentId: string, db: Db = prisma): Promise<string | null> {
  const first = await db.guardian.findFirst({
    where: { parentId, status: "active", relation: "PARENT" },
    orderBy: { createdAt: "asc" },
    select: { childId: true },
  });
  return first?.childId ?? null;
}

/**
 * The subjects a learner has chosen, as billed: active, as a learner, in a public subject that no
 * company pays for. At least one — the plan's price covers the first.
 */
export async function billableSubjectCount(learnerId: string | null): Promise<number> {
  if (!learnerId) return 1;
  return Math.max(1, await prisma.enrollment.count({ where: billableWhere(learnerId) }));
}

/**
 * The subjects a plan bills for this learner: the ones chosen, less the ones still paid by their own
 * subscriptions (bought next to an earlier plan and not stopped) — those aren't billed twice.
 */
export async function subjectsToBill(payerId: string, learnerId: string | null): Promise<number> {
  const [chosen, addons] = await Promise.all([billableSubjectCount(learnerId), runningAddons(payerId)]);
  const bySubscription = addons.filter((a) => a.type === "subject_addon" && a.learnerId === learnerId).length;
  return Math.max(1, chosen - bySubscription);
}

/**
 * A plan's monthly price. An annual package is priced from its monthly one — the row a price change
 * edits — so a year stays ten months of today's monthly price; without one, from the annual row.
 */
export async function monthlyPlanPriceMinor(plan: { price: number; interval: string; familyPlanKey?: string | null }): Promise<number> {
  if (plan.interval !== "YEAR" || !plan.familyPlanKey) return planMonthlyMinor(plan);
  const monthly = await prisma.subscriptionPlan.findFirst({
    where: { isActive: true, interval: "MONTH", familyPlanKey: plan.familyPlanKey },
    orderBy: { price: "asc" },
    select: { price: true },
  });
  return monthly ? monthly.price : planMonthlyMinor(plan);
}

function settingValue<T>(value: unknown, check: (v: Record<string, unknown>) => boolean): T | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return check(value as Record<string, unknown>) ? (value as T) : null;
}

function addonList(value: unknown): AddonEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is AddonEntry =>
      !!v &&
      typeof v === "object" &&
      typeof (v as AddonEntry).sessionId === "string" &&
      ((v as AddonEntry).type === "subject_addon" || (v as AddonEntry).type === "child_addon"),
  );
}

/** The subscriptions bought next to the plan that are still running, oldest first. */
export async function runningAddons(payerId: string, db: Db = prisma): Promise<AddonEntry[]> {
  const row = await db.setting.findUnique({ where: { userId_key: { userId: payerId, key: ADDONS_KEY } }, select: { value: true } });
  return addonList(row?.value);
}

/** Holds the payer's row until the transaction ends: the list and the counts change together. */
async function lockPayer(tx: Db, payerId: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${payerId} FOR NO KEY UPDATE`;
}

function writeAddons(tx: Db, payerId: string, list: AddonEntry[]) {
  const value = list as unknown as Prisma.InputJsonValue;
  return tx.setting.upsert({
    where: { userId_key: { userId: payerId, key: ADDONS_KEY } },
    create: { userId: payerId, key: ADDONS_KEY, value },
    update: { value },
  });
}

async function changePaidSubjects(tx: Db, payerId: string, delta: 1 | -1): Promise<void> {
  // Never below one; only on an account whose card subscription counted its subjects.
  await tx.$executeRaw`
    UPDATE "Setting"
    SET "value" = jsonb_set(
          "value",
          '{count}',
          to_jsonb(GREATEST(1, COALESCE(("value"->>'count')::int, 1) + ${delta}::int))
        ),
        "updatedAt" = NOW()
    WHERE "userId" = ${payerId} AND "key" = ${PAID_SUBJECTS_KEY}`;
}

async function endedAddonSessions(tx: Db, payerId: string): Promise<string[]> {
  const row = await tx.setting.findUnique({ where: { userId_key: { userId: payerId, key: ENDED_ADDONS_KEY } }, select: { value: true } });
  return Array.isArray(row?.value) ? row.value.filter((v): v is string => typeof v === "string") : [];
}

/** The payer as the transaction sees it, after the lock: card fields and the plan's seats. */
function lockedPayer(tx: Db, payerId: string) {
  return tx.user.findUnique({ where: { id: payerId }, select: { ...CARD_FIELDS, subscriptionPlan: { select: SEAT_FIELDS } } });
}

/**
 * The plan's subject count and the learner it counts, when a subject bought on its own subscription
 * belongs to it: bought for that learner — the one the count names, or, for a family that paid before
 * linking a child, the child the plan seats now. One bought for another learner (left from an earlier
 * plan, or a child no longer the plan's) doesn't move this plan's count. Null otherwise.
 */
async function countedPaidSubjects(
  tx: Db,
  payerId: string,
  plan: SubscriptionPlanSeatFields | null,
  learnerId: string | null,
): Promise<{ paid: PaidSubjects; learner: string | null } | null> {
  const row = await tx.setting.findUnique({ where: { userId_key: { userId: payerId, key: PAID_SUBJECTS_KEY } }, select: { value: true } });
  const paid = settingValue<PaidSubjects>(row?.value, (v) => typeof v.count === "number");
  if (!paid) return null;
  const learner = paid.learnerId ?? (await planLearner(payerId, plan, tx));
  return learnerId === null || learner === null || learner === learnerId ? { paid, learner } : null;
}

/**
 * At the activation of a subscription bought next to the plan: its place is counted — one more subject
 * paid, or one more child's seat — together with its entry in the list and what the purchase turns on
 * (`turnOn`, given the transaction: the subject it was bought for), in one transaction. A callback
 * delivered again (the broker retries, Stripe resends) counts it once, and the subject is on exactly
 * when its place is counted — an add-on ending meanwhile sees both. `granted` is false when it was
 * already counted; `entry` is null when the subscription has already ended (an activation delivered
 * after its end counts nothing and turns nothing on).
 */
export async function grantAddon(
  payerId: string,
  entry: AddonEntry,
  turnOn?: (db: typeof prisma) => Promise<void>,
): Promise<{ granted: boolean; entry: AddonEntry | null }> {
  return prisma.$transaction(async (tx) => {
    await lockPayer(tx, payerId);
    if ((await endedAddonSessions(tx, payerId)).includes(entry.sessionId)) return { granted: false, entry: null };
    const list = await runningAddons(payerId, tx);
    const known = list.find((a) => a.sessionId === entry.sessionId);
    if (known) return { granted: false, entry: known };
    let saved = entry;
    if (entry.type === "child_addon") {
      await tx.user.update({ where: { id: payerId }, data: { paidExtraChildSeats: { increment: 1 } } });
    } else {
      const payer = await lockedPayer(tx, payerId);
      const counted = await countedPaidSubjects(tx, payerId, payer?.subscriptionPlan ?? null, entry.learnerId);
      const learner = entry.learnerId ?? counted?.learner ?? null;
      saved = { ...entry, counted: counted !== null };
      if (counted && learner) {
        // The learner's other subjects beyond the count, now: those were there before this purchase.
        const others = await tx.enrollment.count({
          where: { ...billableWhere(learner), ...(entry.domainId ? { domainId: { not: entry.domainId } } : {}) },
        });
        saved = { ...saved, kept: Math.max(0, others - counted.paid.count) };
      }
      if (counted) await changePaidSubjects(tx, payerId, 1);
    }
    await writeAddons(tx, payerId, [...list, saved]);
    // The family helpers take the client; they don't open a transaction of their own.
    if (turnOn) await turnOn(tx as unknown as typeof prisma);
    return { granted: true, entry: saved };
  });
}

/**
 * When such a subscription ends: its place goes with its entry — a child's seat, or a paid subject that
 * was counted — and, for a subject, at most one of the learner's subjects is switched off, the
 * subscription's own first, only when the learner has more than the places still paid plus the ones it
 * already had beyond the count when it was bought. All in one transaction with a record of the end, so a
 * delivery repeated after a failure — or an activation delivered late — finds nothing left to do. Null
 * when the entry isn't in the list.
 */
export async function endAddon(payerId: string, sessionId: string): Promise<{ entry: AddonEntry; switchedOff: number } | null> {
  return prisma.$transaction(async (tx) => {
    await lockPayer(tx, payerId);
    const ended = await endedAddonSessions(tx, payerId);
    if (!ended.includes(sessionId)) {
      const value = [...ended, sessionId] as unknown as Prisma.InputJsonValue;
      await tx.setting.upsert({
        where: { userId_key: { userId: payerId, key: ENDED_ADDONS_KEY } },
        create: { userId: payerId, key: ENDED_ADDONS_KEY, value },
        update: { value },
      });
    }
    const list = await runningAddons(payerId, tx);
    const found = list.find((a) => a.sessionId === sessionId);
    if (!found) return null;
    await writeAddons(tx, payerId, list.filter((a) => a.sessionId !== sessionId));
    if (found.type === "child_addon") {
      // The gt:0 guard clamps at zero.
      await tx.user.updateMany({ where: { id: payerId, paidExtraChildSeats: { gt: 0 } }, data: { paidExtraChildSeats: { decrement: 1 } } });
      return { entry: found, switchedOff: 0 };
    }
    // A place is given back when it was counted, even if the plan counts another learner since (a family
    // plan's first child unlinked): the count stays what the plan and the running subscriptions pay for.
    if (!found.counted) return { entry: found, switchedOff: 0 };
    const payer = await lockedPayer(tx, payerId);
    const counted = await countedPaidSubjects(tx, payerId, payer?.subscriptionPlan ?? null, found.learnerId);
    await changePaidSubjects(tx, payerId, -1);
    if (!counted) return { entry: found, switchedOff: 0 };
    // Only next to the card subscription that counts subjects, for a learner it still counts: the payer
    // or the payer's child. Without them nothing is limited.
    const learner = counted.learner;
    if (!payer || !learner || !(await paysByCard(payer, tx))) return { entry: found, switchedOff: 0 };
    if (learner !== payerId) {
      const link = await tx.guardian.findUnique({
        where: { parentId_childId: { parentId: payerId, childId: learner } },
        select: { status: true, relation: true },
      });
      if (link?.status !== "active" || link.relation !== "PARENT") return { entry: found, switchedOff: 0 };
    }
    const allowed = Math.max(1, counted.paid.count - 1) + (found.kept ?? 0);
    const switchedOff = await switchOffOneSubject(tx, payerId, learner, allowed, found.domainId);
    return { entry: found, switchedOff };
  });
}

/**
 * At the activation of a card subscription: keep its terms on the payer's account — the lifetime
 * discount (for add-ons bought later: a subject, a child) and the subjects paid for. Subjects still
 * paid by their own subscriptions weren't billed by this plan (subjectsToBill), so they count on top:
 * each is marked as counted by this plan, with nothing kept from an earlier count — the plan billed
 * every subject those don't pay. A checkout from before these terms existed carries none, and nothing
 * is written. The same activation delivered again (`sessionId`) changes nothing: what was bought since
 * is already in the count.
 */
export async function recordCheckoutTerms(
  payerId: string,
  metadata: Record<string, unknown> | undefined,
  sessionId?: string,
): Promise<void> {
  if (!metadata || typeof metadata.discountPercent !== "number") return;
  const discount: LockedDiscount = {
    percent: metadata.discountPercent,
    base: metadata.discountBase === "trial" || metadata.discountBase === "code" ? metadata.discountBase : null,
    telegram: metadata.telegram === true,
    interval: metadata.interval === "YEAR" ? "YEAR" : "MONTH",
    at: new Date().toISOString(),
  };
  const learnerId = typeof metadata.learnerId === "string" ? metadata.learnerId : null;
  const billed = typeof metadata.subjects === "number" && metadata.subjects >= 1 ? Math.floor(metadata.subjects) : 1;
  await prisma.$transaction(async (tx) => {
    await lockPayer(tx, payerId);
    if (sessionId) {
      const row = await tx.setting.findUnique({ where: { userId_key: { userId: payerId, key: PAID_SUBJECTS_KEY } }, select: { value: true } });
      if (settingValue<PaidSubjects>(row?.value, (v) => typeof v.count === "number")?.sessionId === sessionId) return;
    }
    const list = await runningAddons(payerId, tx);
    // The same subscriptions subjectsToBill left out of the bill.
    const recounted = list.map((a): AddonEntry => {
      if (a.type !== "subject_addon") return a;
      return { type: a.type, sessionId: a.sessionId, learnerId: a.learnerId, domainId: a.domainId, at: a.at, counted: a.learnerId === learnerId };
    });
    const bySubscription = recounted.filter((a) => a.counted).length;
    const subjects: PaidSubjects = { learnerId, count: billed + bySubscription, ...(sessionId ? { sessionId } : {}) };
    await tx.setting.upsert({
      where: { userId_key: { userId: payerId, key: LOCKED_DISCOUNT_KEY } },
      create: { userId: payerId, key: LOCKED_DISCOUNT_KEY, value: discount },
      update: { value: discount },
    });
    await tx.setting.upsert({
      where: { userId_key: { userId: payerId, key: PAID_SUBJECTS_KEY } },
      create: { userId: payerId, key: PAID_SUBJECTS_KEY, value: subjects },
      update: { value: subjects },
    });
    if (list.length > 0) await writeAddons(tx, payerId, recounted);
  });
}

/**
 * Whose card subscription pays this learner's subjects, and for how many. Only the learner and the
 * learner's parents can pay for them, so only their counts are read (by the index on the payer). A
 * count holds while the card subscription that wrote it runs — a code year, an account marked paid by
 * hand or an ended subscription limits nothing (the pause does) — and for the learner it names: the one
 * the checkout counted, or, for a family that paid before linking a child, the child the plan seats.
 */
export async function subjectPayerFor(learnerId: string): Promise<{ payerId: string; count: number } | null> {
  const parents = await prisma.guardian.findMany({
    where: { childId: learnerId, status: "active", relation: "PARENT" },
    select: { parentId: true },
  });
  const rows = await prisma.setting.findMany({
    where: { key: PAID_SUBJECTS_KEY, userId: { in: [learnerId, ...parents.map((p) => p.parentId)] } },
    orderBy: { updatedAt: "desc" },
    select: { userId: true, value: true },
  });
  for (const row of rows) {
    const paid = settingValue<PaidSubjects>(row.value, (v) => typeof v.count === "number");
    if (!paid || !row.userId) continue;
    const payer = await prisma.user.findUnique({
      where: { id: row.userId },
      select: { ...CARD_FIELDS, subscriptionPlan: { select: SEAT_FIELDS } },
    });
    if (!payer || !(await paysByCard(payer))) continue;
    const counted = paid.learnerId ?? (await planLearner(row.userId, payer.subscriptionPlan));
    if (counted === learnerId) return { payerId: row.userId, count: paid.count };
  }
  return null;
}

/**
 * The payer whose paid places are all in use, when turning this subject on for the learner needs one
 * more; null when it's allowed — not a billed subject, already on, room left, or nothing counted. The
 * caller can pass the subject's facts when it already loaded them.
 */
export async function subjectNeedsPayment(
  learnerId: string,
  domainId: string,
  domain?: DomainFacts | null,
): Promise<{ payerId: string; count: number } | null> {
  const facts = domain !== undefined ? domain : await prisma.domain.findUnique({ where: { id: domainId }, select: DOMAIN_FACTS });
  if (!billedDomain(facts)) return null;
  const payer = await subjectPayerFor(learnerId);
  if (!payer) return null;
  const active = await prisma.enrollment.findMany({ where: billableWhere(learnerId), select: { domainId: true } });
  if (active.some((e) => e.domainId === domainId)) return null;
  return active.length >= payer.count ? payer : null;
}

/**
 * The subject a subject add-on was bought for (checkout metadata), when it may be turned on: the
 * learner is the payer or still the payer's child, and the subject is still a billed one. The purchase
 * is the place, so the count isn't checked again (a child linked with more subjects than were paid for
 * still gets the one bought). A learner paying for themselves doesn't undo a subject a parent removed
 * (guardian-lock.ts).
 */
export async function boughtSubjectTarget(
  payerId: string,
  learnerId: unknown,
  domainId: unknown,
): Promise<{ learnerId: string; domainId: string; setById: string | null } | null> {
  if (typeof learnerId !== "string" || typeof domainId !== "string") return null;
  if (learnerId !== payerId && !(await isParentOf(payerId, learnerId))) return null;
  const [domain, existing] = await Promise.all([
    prisma.domain.findUnique({ where: { id: domainId }, select: DOMAIN_FACTS }),
    prisma.enrollment.findUnique({
      where: { userId_domainId: { userId: learnerId, domainId } },
      select: { isActive: true, setById: true },
    }),
  ]);
  if (!billedDomain(domain)) return null;
  if (learnerId === payerId && existing && !existing.isActive && existing.setById) {
    if ((await activeSetters(learnerId, [existing.setById])).size > 0) return null;
  }
  return { learnerId, domainId, setById: learnerId === payerId ? null : payerId };
}

/**
 * When a subject's own subscription ends and the learner has more billed subjects than it may keep
 * (`allowed`: the places still paid, plus the ones it had beyond the count before the purchase): one of
 * them is switched off — the ending subscription's own subject if it is still on, otherwise the newest —
 * as set by the payer (a parent's removal the child can't undo — guardian-lock.ts). What was done in it
 * is kept, and reminders that opened it open the default subject instead, as when a parent removes one.
 * A removed subject that left its place free means nothing needs switching off.
 */
async function switchOffOneSubject(
  tx: Db,
  payerId: string,
  learnerId: string,
  allowed: number,
  preferDomainId: string | null,
): Promise<number> {
  const active = await tx.enrollment.findMany({
    where: billableWhere(learnerId),
    orderBy: { updatedAt: "desc" },
    select: { id: true, domainId: true, domain: { select: { slug: true } } },
  });
  if (active.length <= allowed) return 0;
  const off = active.find((e) => e.domainId === preferDomainId) ?? active[0];
  await tx.enrollment.update({ where: { id: off.id }, data: { isActive: false, setById: payerId } });
  await tx.studyReminder.updateMany({ where: { userId: learnerId, domainSlug: off.domain.slug }, data: { domainSlug: null } });
  return 1;
}

/**
 * What the next subject costs the payer, on its own subscription: the plan's monthly price with the
 * subject's discount (2nd −15%, from the 3rd −25%) and the discount locked in at the card payment,
 * billed like the main subscription (a year = ten months). The subject's place is counted among the
 * ones the learner has — a family that paid before a child with several subjects was linked already
 * has more than it paid for. Null without a counted card subscription.
 */
export async function subjectAddonQuote(payerId: string): Promise<{
  subjectIndex: number;
  minor: number;
  interval: "MONTH" | "YEAR";
  planName: string;
} | null> {
  const [paid, locked, payer] = await Promise.all([
    paidSubjects(payerId),
    lockedDiscount(payerId),
    prisma.user.findUnique({ where: { id: payerId }, select: { subscriptionPlan: { select: { ...SEAT_FIELDS, price: true, interval: true } } } }),
  ]);
  const plan = payer?.subscriptionPlan;
  if (!paid || !plan) return null;
  const learnerId = paid.learnerId ?? (await planLearner(payerId, plan));
  const [monthly, active] = await Promise.all([
    monthlyPlanPriceMinor(plan),
    learnerId ? prisma.enrollment.count({ where: billableWhere(learnerId) }) : Promise.resolve(0),
  ]);
  const interval = locked?.interval ?? (plan.interval === "YEAR" ? "YEAR" : "MONTH");
  const subjectIndex = Math.max(paid.count, active) + 1;
  return {
    subjectIndex,
    minor: forInterval(subjectMonthlyMinor(monthly, subjectIndex, locked?.percent ?? 0), interval),
    interval,
    planName: plan.name,
  };
}

/** The discount the family locked in at its card payment, or null (none paid by card yet). */
export async function lockedDiscount(payerId: string): Promise<LockedDiscount | null> {
  const row = await prisma.setting.findUnique({ where: { userId_key: { userId: payerId, key: LOCKED_DISCOUNT_KEY } }, select: { value: true } });
  return settingValue<LockedDiscount>(row?.value, (v) => typeof v.percent === "number");
}

/** The subjects paid for by the payer's card subscription, or null (nothing counted: no limit). */
export async function paidSubjects(payerId: string): Promise<PaidSubjects | null> {
  const row = await prisma.setting.findUnique({ where: { userId_key: { userId: payerId, key: PAID_SUBJECTS_KEY } }, select: { value: true } });
  return settingValue<PaidSubjects>(row?.value, (v) => typeof v.count === "number");
}
