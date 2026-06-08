/**
 * pricing.ts — single source of truth for the promotional pricing display.
 *
 * The amounts shown on the marketing pages (/preturi, /parinte) are the PROMO prices
 * (extra −25% off). The normal price = amount / PROMO_FACTOR. Until PROMO_END the normal
 * price is struck through (red) next to the promo; after PROMO_END the promo is over →
 * the normal price is shown as the price (no strike, no promo banner). Data-driven so the
 * switch happens automatically on the date — no code change needed at expiry.
 */

export const PROMO_FACTOR = 0.75; // promo = normal × 0.75  ⇒  normal = promo / 0.75
export const PROMO_END = new Date("2026-09-01T00:00:00+03:00"); // promo valid "până la 31.08.2026"

/** True while the promo is still running (default: now). */
export function isPromoActive(now: Date = new Date()): boolean {
  return now < PROMO_END;
}

/** The pre-promo (normal) price for a given promo amount. */
export function normalFromPromo(amount: number): number {
  return amount / PROMO_FACTOR;
}

/** Format a RON amount: RO uses a comma decimal, EN a dot. Always 2 decimals. */
export function fmtPrice(amount: number, locale: string): string {
  const s = amount.toFixed(2);
  return locale === "en" ? s : s.replace(".", ",");
}
