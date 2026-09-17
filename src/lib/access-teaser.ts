/**
 * The numbers a paused account still sees (Alex, 16.09.2026: „ceva clar, dar insuficient").
 *
 * Only counts leave the server — how many exercises, on how many days, how many weak topics.
 * The details they would unlock (which topics, the chart, the report) are never loaded here, so
 * the blurred shapes on the page are shapes, not hidden data someone could reveal.
 */
import { prisma } from "@/lib/prisma";
import { loadVoucherPreview } from "@/lib/voucher-preview-server";
import { discountedMinorUnits, previewAppliesToPlan } from "@/lib/voucher-checkout";

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
  normal: number;
  price: number;
  code: string | null;
};

/**
 * The price the pause screen shows the payer: the plan's monthly price, with the code kept on the
 * account when checkout would accept it for that plan. Major units (lei).
 */
export async function teaserOffer(payerId: string, planKey: "FAMILY" | "ELEV"): Promise<TeaserOffer | null> {
  const [plan, payer] = await Promise.all([
    prisma.subscriptionPlan.findFirst({
      where: { isActive: true, interval: "MONTH", familyPlanKey: planKey },
      select: { price: true },
      orderBy: { price: "asc" },
    }),
    prisma.user.findUnique({ where: { id: payerId }, select: { pendingVoucherCode: true } }),
  ]);
  if (!plan) return null;
  const pending = payer?.pendingVoucherCode ? await loadVoucherPreview(payer.pendingVoucherCode, payerId) : null;
  const applies = pending?.ok && previewAppliesToPlan(pending.preview, planKey) ? pending.preview : null;
  return {
    planKey,
    normal: plan.price / 100,
    price: applies ? discountedMinorUnits(plan.price, applies.discountPercent) / 100 : plan.price / 100,
    code: applies?.code ?? null,
  };
}
