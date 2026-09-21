/**
 * What a package costs a family, as the pages show it — the same rules checkout charges by
 * (checkout-price.ts). Shared by Abonament and the annual comparison page, so the two can't disagree.
 * Pure; prices in, from /api/plans, are major units (33.2); results are minor units (bani).
 */
import { individualPlan, resolveFamilyPlanFromRecord, type SubscriptionPlanSeatFields } from "@/lib/family";
import { previewAppliesToPlan } from "@/lib/voucher-checkout";
import {
  checkoutDiscount,
  percentOff,
  planMonthlyMinor,
  subjectLines,
  totalMinor,
  type CheckoutDiscount,
  type DiscountBase,
} from "@/lib/checkout-price";

export type PricedPlan = SubscriptionPlanSeatFields & { price: number; interval: "MONTH" | "YEAR" | "ONE_TIME" };

export type PricingFacts = {
  /** The payer's own free week is running (and the account doesn't pay yet). */
  trialActive: boolean;
  /** Telegram connected by anyone in the family. */
  telegram: boolean;
  /** Subjects each kind of plan bills: the payer's own (Elev) or the first linked child's. */
  subjects?: { self: number; child: { count: number } | null } | null;
  /**
   * The discount a card subscription keeps (checkout-facts LockedDiscount): its price, instead of a new
   * checkout's. No code, no trial offer — they were decided at that payment.
   */
  locked?: { percent: number; base: DiscountBase; telegram: boolean } | null;
};

export type CodePreview = { planKey: string | null; discountPercent: number; recurring: boolean };

export type PackagePrice = {
  discount: CheckoutDiscount;
  subjects: number;
  /** Charged each period once any first-payment coupon is gone. */
  total: number;
  /** Before any discount (subject discounts included). */
  normal: number;
  /** The first payment. */
  first: number;
};

export function packagePrice(plan: PricedPlan, facts: PricingFacts, code: CodePreview | null, opts: { telegram?: boolean } = {}): PackagePrice {
  const key = resolveFamilyPlanFromRecord(plan)?.key ?? null;
  const applies = code && previewAppliesToPlan(code, key) ? { percent: code.discountPercent, renews: code.recurring } : null;
  const discount: CheckoutDiscount = facts.locked
    ? {
        pricesPercent: facts.locked.percent,
        onceCouponPercent: null,
        codeUsed: false,
        base: facts.locked.base,
        telegram: facts.locked.telegram,
        firstPaymentPercent: facts.locked.percent,
      }
    : checkoutDiscount({ trialActive: facts.trialActive, code: applies, telegram: opts.telegram ?? facts.telegram });
  // A one-time package is one payment, not per subject (checkout bills it as one line).
  const subjects =
    plan.interval === "ONE_TIME" ? 1 : individualPlan(plan) ? (facts.subjects?.self ?? 1) : (facts.subjects?.child?.count ?? 1);
  const priceMinor = Math.round(plan.price * 100);
  const monthly = plan.interval === "ONE_TIME" ? priceMinor : planMonthlyMinor({ price: priceMinor, interval: plan.interval });
  const lines = subjectLines({
    planMonthlyMinor: monthly,
    subjects,
    lifetimePercent: discount.pricesPercent,
    interval: plan.interval === "YEAR" ? "YEAR" : "MONTH",
  });
  const total = totalMinor(lines);
  const normal = lines.reduce((sum, l) => sum + l.normalMinor, 0);
  // A code that doesn't renew comes off the first payment only.
  const first = discount.onceCouponPercent ? percentOff(total, discount.onceCouponPercent) : total;
  return { discount, subjects, total, normal, first };
}
