/**
 * checkout-price.ts — what a family pays (delivery 2, decisions of Alex 16–17.09.2026).
 *
 *  - Paying during the 7 free days: −30% for as long as the subscription lasts.
 *  - Telegram connected by anyone in the family at payment: −10% more, kept after disconnecting.
 *  - The discounts don't add up: the larger of a renewing code (V126S −25%) and the trial offer,
 *    then Telegram on top. Family: code + Telegram 22,41 · trial + Telegram 20,92.
 *  - The plan's price covers the first subject; the 2nd is −15%, from the 3rd −25%, from the normal
 *    price. The lifetime discount applies to every subject, and to an extra child's seat too.
 *  - Annual = ten months of the monthly price, discounts included, with the free days left.
 *
 * Amounts are computed here and sent to the payment service as the prices themselves: a discounted
 * price renews unchanged, so the discount lasts as long as the subscription without a coupon, and
 * the parent is charged exactly the figure the page showed (no rounding of a percentage coupon).
 *
 * Pure (no DB): the checkout routes read the facts and call these.
 */
import { childDiscountPercent, subjectDiscountPercent } from "@/lib/family";
import { discountedMinorUnits } from "@/lib/voucher-checkout";

export const TRIAL_PAYMENT_PERCENT = 30;
export const TELEGRAM_PERCENT = 10;
/** An annual subscription costs this many months of the monthly price. */
export const MONTHS_PAID_PER_YEAR = 10;

export type DiscountBase = "trial" | "code" | null;

/** The one discount a payment carries for the life of its subscription. */
export type LifetimeDiscount = {
  /** Where the main part comes from: the trial offer, a renewing code, or nothing. */
  base: DiscountBase;
  basePercent: number;
  telegram: boolean;
  /** The two together: 30 then 10 = 37; 25 then 10 = 32.5. */
  percent: number;
};

export function lifetimeDiscount(input: { trialActive: boolean; codePercent: number | null; telegram: boolean }): LifetimeDiscount {
  const trial = input.trialActive ? TRIAL_PAYMENT_PERCENT : 0;
  const code = Math.max(0, Math.min(99, input.codePercent ?? 0));
  const basePercent = Math.max(trial, code);
  const base: DiscountBase = basePercent === 0 ? null : trial >= code ? "trial" : "code";
  const telegram = input.telegram;
  const percent = combinePercents(basePercent, telegram ? TELEGRAM_PERCENT : 0);
  return { base, basePercent, telegram, percent };
}

/**
 * How a checkout carries its discount. A renewing code (V126S) or the trial offer goes into the prices
 * themselves, for the life of the subscription. A code that doesn't renew (a referral welcome code)
 * is used only when it beats the trial offer, and only on the first payment: the prices then carry
 * Telegram alone, and the code travels as a one-time coupon.
 */
export type CheckoutDiscount = {
  /** Percent built into every price (lifetime). */
  pricesPercent: number;
  /** A one-time coupon on the first payment, when a non-renewing code wins. */
  onceCouponPercent: number | null;
  /** The code is what's applied (so its use is recorded); false when the trial offer won. */
  codeUsed: boolean;
  base: DiscountBase;
  telegram: boolean;
  /** Off the first payment, both parts together. */
  firstPaymentPercent: number;
};

export function checkoutDiscount(input: {
  trialActive: boolean;
  code: { percent: number; renews: boolean } | null;
  telegram: boolean;
}): CheckoutDiscount {
  const code = input.code && input.code.percent > 0 && input.code.percent < 100 ? input.code : null;
  const lifetime = lifetimeDiscount({
    trialActive: input.trialActive,
    codePercent: code?.renews ? code.percent : null,
    telegram: input.telegram,
  });
  const onceWins = code !== null && !code.renews && code.percent > lifetime.basePercent;
  if (onceWins) {
    const pricesPercent = input.telegram ? TELEGRAM_PERCENT : 0;
    return {
      pricesPercent,
      onceCouponPercent: code.percent,
      codeUsed: true,
      base: "code",
      telegram: input.telegram,
      firstPaymentPercent: combinePercents(code.percent, pricesPercent),
    };
  }
  return {
    pricesPercent: lifetime.percent,
    onceCouponPercent: null,
    codeUsed: lifetime.base === "code",
    base: lifetime.base,
    telegram: input.telegram,
    firstPaymentPercent: lifetime.percent,
  };
}

/** Two discounts one after the other, as one percentage (two decimals). */
export function combinePercents(first: number, second: number): number {
  return Math.round((100 - ((100 - first) * (100 - second)) / 100) * 100) / 100;
}

/** A price in minor units with a percentage off, rounded to the ban (the codes' rule, voucher-checkout.ts). */
export const percentOff = discountedMinorUnits;

/**
 * The monthly price of the N-th subject (1-based) under a lifetime discount: first the subject's own
 * discount from the normal price, then the lifetime one. Rounded at each step, like the page shows it.
 */
export function subjectMonthlyMinor(planMonthlyMinor: number, subjectIndex: number, lifetimePercent: number): number {
  return percentOff(percentOff(planMonthlyMinor, subjectDiscountPercent(subjectIndex)), lifetimePercent);
}

/** An extra child's monthly seat (2nd −20%, from the 3rd −30%), then the lifetime discount. */
export function childSeatMonthlyMinor(planMonthlyMinor: number, childIndex: number, lifetimePercent: number): number {
  return percentOff(percentOff(planMonthlyMinor, childDiscountPercent(childIndex)), lifetimePercent);
}

/**
 * „Treci pe Family Duo": the difference between the package with one more parent and the current one,
 * with the family's lifetime discount — the family ends up paying exactly the bigger package's price.
 */
export function parentUpgradeMonthlyMinor(planMonthlyMinor: number, upgradeMonthlyMinor: number, lifetimePercent: number): number {
  return percentOff(Math.max(0, upgradeMonthlyMinor - planMonthlyMinor), lifetimePercent);
}

export type BillingInterval = "MONTH" | "YEAR";

/** A monthly amount billed for the interval: annual = ten months of it. */
export function forInterval(monthlyMinor: number, interval: BillingInterval): number {
  return interval === "YEAR" ? monthlyMinor * MONTHS_PAID_PER_YEAR : monthlyMinor;
}

export type SubjectLine = {
  /** 1-based: the plan's price covers subject 1. */
  index: number;
  /** The subject's own discount (0 / 15 / 25). */
  subjectPercent: number;
  /** Before the lifetime discount, for the interval. */
  normalMinor: number;
  /** What is charged for the interval. */
  minor: number;
};

/** The lines of a checkout: one per subject paid for (at least one). */
export function subjectLines(input: {
  planMonthlyMinor: number;
  subjects: number;
  lifetimePercent: number;
  interval: BillingInterval;
}): SubjectLine[] {
  const count = Math.max(1, Math.floor(input.subjects));
  return Array.from({ length: count }, (_, i) => {
    const index = i + 1;
    return {
      index,
      subjectPercent: subjectDiscountPercent(index),
      normalMinor: forInterval(percentOff(input.planMonthlyMinor, subjectDiscountPercent(index)), input.interval),
      minor: forInterval(subjectMonthlyMinor(input.planMonthlyMinor, index, input.lifetimePercent), input.interval),
    };
  });
}

/** Sum of lines, in minor units. */
export function totalMinor(lines: { minor: number }[]): number {
  return lines.reduce((sum, l) => sum + l.minor, 0);
}

/**
 * The monthly price of a plan row. Annual rows are stored at ten months (create-annual-plans script),
 * so their month is a tenth of it.
 */
export function planMonthlyMinor(plan: { price: number; interval: string }): number {
  return plan.interval === "YEAR" ? Math.round(plan.price / MONTHS_PAID_PER_YEAR) : plan.price;
}
