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
 * Family plan (planKey) — other plans are paid in full. Since 16.09.2026 the site has its own
 * code with the same settings (ONV126S), so the two channels can be measured apart.
 *
 * `previewVoucher` answers the question before checkout — on the packages page and on the
 * parents' page — so a price is only ever shown discounted when checkout would accept the code.
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

type UsabilityProblem = {
  code: "VOUCHER_INVALID" | "VOUCHER_EXPIRED" | "VOUCHER_LIMIT_REACHED";
  message: string;
};

/** The checks that don't depend on the plan: exists and active, not expired, not over its limit. */
function usabilityProblem(voucher: VoucherForCheckout | null, now: Date): UsabilityProblem | null {
  if (!voucher || !voucher.isActive) return { code: "VOUCHER_INVALID", message: "Invalid voucher code" };
  if (voucher.expiresAt && voucher.expiresAt < now) return { code: "VOUCHER_EXPIRED", message: "Voucher has expired" };
  if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
    return { code: "VOUCHER_LIMIT_REACHED", message: "Voucher usage limit reached" };
  }
  return null;
}

export function checkVoucherForCheckout(
  voucher: VoucherForCheckout | null,
  opts: { alreadyUsedByUser: boolean; planKey: string | null; now?: Date },
): VoucherCheckoutResult {
  const problem = usabilityProblem(voucher, opts.now ?? new Date());
  if (problem || !voucher) {
    return { ok: false, ...(problem ?? { code: "VOUCHER_INVALID", message: "Invalid voucher code" }) };
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

// ─── Before checkout: what the page may promise ───

export type VoucherPreview = {
  code: string;
  discountPercent: number;
  recurring: boolean;
  planKey: string | null;
  expiresAt: Date | null;
};

export type VoucherPreviewErrorCode =
  | UsabilityProblem["code"]
  | "VOUCHER_ALREADY_USED"
  /** A 100% code opens access without payment — it belongs on the activation page, not here. */
  | "VOUCHER_FREE_ACCESS";

export type VoucherPreviewResult =
  | { ok: true; preview: VoucherPreview }
  | { ok: false; code: VoucherPreviewErrorCode; message: string };

/**
 * May this code be shown as a discount on a price, before any plan is chosen? Same order as
 * checkout, minus the plan check (the page applies the discount only to the plan it names).
 */
export function previewVoucher(
  voucher: (VoucherForCheckout & { code: string }) | null,
  opts: { alreadyUsedByUser: boolean; now?: Date },
): VoucherPreviewResult {
  const problem = usabilityProblem(voucher, opts.now ?? new Date());
  if (problem || !voucher) {
    return { ok: false, ...(problem ?? { code: "VOUCHER_INVALID", message: "Invalid voucher code" }) };
  }
  if (voucher.discountPercent >= 100) {
    return { ok: false, code: "VOUCHER_FREE_ACCESS", message: "Free-access code: use the activation page" };
  }
  if (voucher.discountPercent <= 0) {
    return { ok: false, code: "VOUCHER_INVALID", message: "Invalid voucher code" };
  }
  if (voucher.oncePerUser && opts.alreadyUsedByUser) {
    return { ok: false, code: "VOUCHER_ALREADY_USED", message: "Voucher already used by this account" };
  }
  return {
    ok: true,
    preview: {
      code: voucher.code,
      discountPercent: voucher.discountPercent,
      recurring: voucher.recurring,
      planKey: voucher.planKey,
      expiresAt: voucher.expiresAt,
    },
  };
}

/** Does a previewed code discount this plan? A code without a plan works on any plan. */
export function previewAppliesToPlan(preview: Pick<VoucherPreview, "planKey">, planKey: string | null | undefined): boolean {
  return !preview.planKey || preview.planKey === planKey;
}

/**
 * Price after a percentage discount, in minor units (bani). Integer math — 3320 at 25% is
 * exactly 2490, which is what the Stripe page shows for the same coupon.
 */
export function discountedMinorUnits(priceMinor: number, percentOff: number): number {
  return Math.round((priceMinor * (100 - percentOff)) / 100);
}
