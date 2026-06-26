/**
 * Which student functions a package unlocks — pure, code-defined (no schema /
 * billing coupling). Free accounts keep every SUBJECT but get a limited set of
 * functions; paid accounts additionally unlock the premium functions (full exam
 * simulations, structured lessons, calendar sync, advanced progress analytics).
 *
 * Gating is driven by `subscriptionStatus` only (a stable field), so this stays
 * decoupled from however plans/prices are modelled in the billing layer — the
 * same contract as plan-channels.ts (whose `isPaidStatus` we reuse so "what
 * counts as paid" has a single source of truth).
 */

import { isPaidStatus } from "./plan-channels";

export type PlanFeature =
  | "exam_simulations"
  | "structured_lessons"
  | "calendar_sync"
  | "advanced_progress";

export const ALL_FEATURES: PlanFeature[] = [
  "exam_simulations",
  "structured_lessons",
  "calendar_sync",
  "advanced_progress",
];

/**
 * Functions that require a paid package. Any function not listed here is free
 * for everyone — this is the single policy knob for feature tiering.
 */
export const PAID_FEATURES: PlanFeature[] = [
  "exam_simulations",
  "structured_lessons",
  "calendar_sync",
  "advanced_progress",
];

export { isPaidStatus };

/** Whether a given function is unlocked for the supplied subscription status. */
export function hasFeature(
  feature: PlanFeature,
  subscriptionStatus: string | null | undefined,
): boolean {
  if (!PAID_FEATURES.includes(feature)) return true;
  return isPaidStatus(subscriptionStatus);
}

/** The functions unlocked for the supplied subscription status. */
export function unlockedFeatures(
  subscriptionStatus: string | null | undefined,
): PlanFeature[] {
  return ALL_FEATURES.filter((f) => hasFeature(f, subscriptionStatus));
}

/**
 * Map of every function → unlocked boolean, for the entitlements endpoint and
 * the UI soft-lock. Server-truth: the client renders what this map says.
 */
export function featureMap(
  subscriptionStatus: string | null | undefined,
): Record<PlanFeature, boolean> {
  return ALL_FEATURES.reduce(
    (acc, f) => {
      acc[f] = hasFeature(f, subscriptionStatus);
      return acc;
    },
    {} as Record<PlanFeature, boolean>,
  );
}
