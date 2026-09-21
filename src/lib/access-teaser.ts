/**
 * The numbers a paused account still sees (Alex, 16.09.2026: „ceva clar, dar insuficient").
 *
 * Only counts leave the server — how many exercises, on how many days, how many weak topics.
 * The details they would unlock (which topics, the chart, the report) are never loaded here, so
 * the blurred shapes on the page are shapes, not hidden data someone could reveal.
 */
import { prisma } from "@/lib/prisma";
import { loadVoucherPreview } from "@/lib/voucher-preview-server";
import { previewAppliesToPlan } from "@/lib/voucher-checkout";
import { familyHasTelegram, payerTrial, planLearner, subjectsToBill } from "@/lib/checkout-facts";
import { packagePrice } from "@/lib/package-price";

export type TeaserStats = {
  /** Questions answered (voided ones left out). */
  exercises: number;
  /** Distinct days with a finished session. */
  practicedDays: number;
  /** Best current streak across subjects. */
  streak: number;
  /** Level in the subject with the most points. */
  level: string | null;
  /** Topics under 60% accuracy after at least 5 answers (see updateWeakAreas). */
  weakTopics: number;
};

const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Bucharest" });
const DAY_MS = 24 * 60 * 60 * 1000;

/** Counts for one learner, all time or inside `window` (e.g. the trial week before a pause). */
export async function teaserStats(userId: string, window?: { since: Date; until: Date }): Promise<TeaserStats> {
  const inWindow = window ? { gte: window.since, lt: window.until } : undefined;
  const [exercises, sessions, gamification, weakTopics] = await Promise.all([
    prisma.attempt.count({ where: { userId, voided: false, ...(inWindow ? { createdAt: inWindow } : {}) } }),
    prisma.session.findMany({
      where: { userId, endedAt: inWindow ?? { not: null } },
      select: { endedAt: true },
    }),
    prisma.userGamification.findMany({ where: { userId }, select: { streak: true, xp: true, level: true } }),
    prisma.weakArea.count({ where: { userId } }),
  ]);
  const best = [...gamification].sort((a, b) => b.xp - a.xp)[0];
  const days = new Set(sessions.map((s) => (s.endedAt ? dayKey(s.endedAt) : ""))).size;
  return {
    exercises,
    // A week of 7×24 hours ending in the evening touches 8 calendar dates; the screen says „N/7"
    // (review r6, sweep S5).
    practicedDays: window ? Math.min(days, Math.ceil((window.until.getTime() - window.since.getTime()) / DAY_MS)) : days,
    streak: gamification.reduce((max, g) => Math.max(max, g.streak), 0),
    level: best?.level ?? null,
    weakTopics,
  };
}

export type TeaserOffer = {
  planKey: "FAMILY" | "ELEV";
  /** Subjects the plan would bill: the learner's chosen ones, at least one. */
  subjects: number;
  /** A month before any discount (the subject discounts included). */
  normal: number;
  /** A month as it renews, with the discounts that stay. */
  price: number;
  /** The first payment: lower than `price` when a code that doesn't renew comes off it. */
  first: number;
  /** The code checkout would apply (kept on the account), or null. */
  code: string | null;
  /** When paying now still gets the −30% of the free week: the moment that ends (ISO). */
  trialOfferEndsAt: string | null;
  /** −10% for Telegram connected by someone in the family. */
  telegram: boolean;
};

/**
 * What the payer would be charged now for the plan, by the rules checkout charges by (checkout-price.ts,
 * delivery 2): the subjects the learner has chosen, the −30% while the payer's own free week runs, the
 * code kept on the account, and Telegram. Shown on the pause screen and in the trial messages, so
 * neither can promise a figure the payment page wouldn't charge. Major units (lei).
 */
export async function teaserOffer(payerId: string, planKey: "FAMILY" | "ELEV", now: Date = new Date()): Promise<TeaserOffer | null> {
  const [plan, payer, telegram] = await Promise.all([
    prisma.subscriptionPlan.findFirst({
      where: { isActive: true, interval: "MONTH", familyPlanKey: planKey },
      select: { price: true, familyPlanKey: true, maxParents: true, maxChildren: true, maxTutors: true },
      orderBy: { price: "asc" },
    }),
    prisma.user.findUnique({ where: { id: payerId }, select: { pendingVoucherCode: true, createdAt: true } }),
    familyHasTelegram(payerId),
  ]);
  if (!plan || !payer) return null;
  // As checkout bills them: the learner's subjects, less the ones still paid by their own subscriptions.
  const [trial, subjects, pending] = await Promise.all([
    payerTrial(payerId, now, payer.createdAt),
    planLearner(payerId, plan).then((learnerId) => subjectsToBill(payerId, learnerId)),
    payer.pendingVoucherCode ? loadVoucherPreview(payer.pendingVoucherCode, payerId) : Promise.resolve(null),
  ]);
  const preview = pending?.ok && previewAppliesToPlan(pending.preview, planKey) ? pending.preview : null;
  const trialActive = trial?.active === true;
  const priced = packagePrice(
    { ...plan, price: plan.price / 100, interval: "MONTH" },
    { trialActive, telegram, subjects: { self: subjects, child: { count: subjects } } },
    preview,
  );
  return {
    planKey,
    subjects: priced.subjects,
    normal: priced.normal / 100,
    price: priced.total / 100,
    first: priced.first / 100,
    code: priced.discount.codeUsed && preview ? preview.code : null,
    trialOfferEndsAt: priced.discount.base === "trial" && trial ? trial.endsAt.toISOString() : null,
    telegram: priced.discount.telegram,
  };
}
