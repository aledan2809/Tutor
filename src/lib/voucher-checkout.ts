/**
 * voucher-checkout.ts — may this voucher be used at card checkout, and which coupon should
 * the Stripe broker create for it?
 *
 * Pure (no DB) so the rules are testable: the checkout route loads the voucher, the plan's
 * key and whether this account already used the code, then asks here. 100% vouchers are
 * meant for /api/activate, but nothing stops someone typing one on the packages page, so a
 * 100% code is never turned into a permanent (forever) discount here.
 *
 * The flyer „cât o cafea” (V126S) is the reason for the three settings: the discount stays on
 * every monthly payment of the subscription it was used on (recurring → Stripe coupon
 * duration "forever"), the same account may not use the code again, e.g. after cancelling
 * and coming back (oncePerUser, remembered in VoucherRedemption), and it only works on the
 * Family plan (planKey) — other plans are paid in full.
 */

export type VoucherForCheckout = {
  id: string;
  discountPercent: number;
  isActive: boolean;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  recurring: boolean;
  oncePerUser: boolean;
  planKey: string | null;
};

export type VoucherCheckoutErrorCode =
  | "VOUCHER_INVALID"
  | "VOUCHER_EXPIRED"
  | "VOUCHER_LIMIT_REACHED"
  | "VOUCHER_WRONG_PLAN"
  | "VOUCHER_ALREADY_USED";

export type BrokerCoupon = {
  percentOff: number;
  duration: "once" | "forever";
  metadata: { voucherId: string };
};

export type VoucherCheckoutResult =
  | { ok: true; coupon: BrokerCoupon }
  | { ok: false; code: VoucherCheckoutErrorCode; message: string; planKey?: string };

/** Codes are stored upper-case (admin API); people type them however they like. */
export function normalizeVoucherCode(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
}

export function checkVoucherForCheckout(
  voucher: VoucherForCheckout | null,
  opts: { alreadyUsedByUser: boolean; planKey: string | null; now?: Date },
): VoucherCheckoutResult {
  const now = opts.now ?? new Date();
  if (!voucher || !voucher.isActive) {
    return { ok: false, code: "VOUCHER_INVALID", message: "Invalid voucher code" };
  }
  if (voucher.expiresAt && voucher.expiresAt < now) {
    return { ok: false, code: "VOUCHER_EXPIRED", message: "Voucher has expired" };
  }
  if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
    return { ok: false, code: "VOUCHER_LIMIT_REACHED", message: "Voucher usage limit reached" };
  }
  if (voucher.planKey && voucher.planKey !== opts.planKey) {
    return {
      ok: false,
      code: "VOUCHER_WRONG_PLAN",
      message: `Voucher is valid only for the ${voucher.planKey} plan`,
      planKey: voucher.planKey,
    };
  }
  if (voucher.oncePerUser && opts.alreadyUsedByUser) {
    return { ok: false, code: "VOUCHER_ALREADY_USED", message: "Voucher already used by this account" };
  }
  return {
    ok: true,
    coupon: {
      percentOff: voucher.discountPercent,
      duration: voucher.recurring && voucher.discountPercent < 100 ? "forever" : "once",
      metadata: { voucherId: voucher.id },
    },
  };
}
