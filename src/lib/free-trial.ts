/**
 * free-trial.ts — the 7 free days, counted once per account.
 *
 * The flyer and the site promise „7 zile gratuite". Until 16.09.2026 there were two different
 * trials: a free account (no card) and 14 days that every plan added again at card checkout.
 * Alex's decision (16.09): 7 days on both paths, 7 IN TOTAL — whoever pays on day 3 of a free
 * account gets only the days still owed, not a fresh week.
 *
 * The count starts at account creation and uses whole elapsed days, rounded down: a payment
 * made 2 days and 20 hours after signup still gets 5 days. Rounding down can give up to a few
 * hours more than 7×24h, never less — the promise is „7 zile", so the error goes the parent's way.
 *
 * Pure (no DB) so the rule is testable.
 */

export const FREE_TRIAL_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Free days this account is still owed, out of FREE_TRIAL_DAYS. 0 once the week is used up. */
export function remainingFreeTrialDays(accountCreatedAt: Date, now: Date = new Date()): number {
  const elapsedWholeDays = Math.floor((now.getTime() - accountCreatedAt.getTime()) / DAY_MS);
  return Math.min(FREE_TRIAL_DAYS, Math.max(0, FREE_TRIAL_DAYS - Math.max(0, elapsedWholeDays)));
}

/**
 * Trial days to ask the payment page for: never more than the plan allows, never more than the
 * account is still owed. 0 means "charge at once" — the caller then sends no trial at all
 * (Stripe rejects a trial of 0 days).
 */
export function checkoutTrialDays(
  planTrialDays: number | null | undefined,
  accountCreatedAt: Date,
  now: Date = new Date(),
): number {
  if (!planTrialDays || planTrialDays <= 0) return 0;
  return Math.min(planTrialDays, remainingFreeTrialDays(accountCreatedAt, now));
}
