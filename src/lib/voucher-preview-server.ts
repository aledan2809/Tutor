import { prisma } from "@/lib/prisma";
import {
  normalizeVoucherCode,
  previewVoucher,
  type VoucherPreview,
  type VoucherPreviewResult,
} from "@/lib/voucher-checkout";

/**
 * Loads a code and answers `previewVoucher` for this account (null when no code was given).
 * Shared by signup, the packages page and the pending-code API, so the three can't disagree
 * about whether a discount may be shown.
 */
export async function loadVoucherPreview(rawCode: unknown, userId: string | null): Promise<VoucherPreviewResult | null> {
  const code = normalizeVoucherCode(rawCode);
  if (!code) return null;
  const voucher = await prisma.voucher.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      discountPercent: true,
      isActive: true,
      expiresAt: true,
      maxUses: true,
      usedCount: true,
      recurring: true,
      oncePerUser: true,
      planKey: true,
    },
  });
  const alreadyUsedByUser =
    voucher?.oncePerUser && userId
      ? Boolean(
          await prisma.voucherRedemption.findUnique({
            where: { voucherId_userId: { voucherId: voucher.id, userId } },
            select: { id: true },
          }),
        )
      : false;
  return previewVoucher(voucher, { alreadyUsedByUser });
}

/**
 * The plan a 100% code gives a year of: the code's own package, monthly. Only the monthly plan — a
 * yearly plan of the same package is a different price and isn't what the code gives. `null` for a
 * code made for no package; `"missing"` when its package no longer exists: activating it without one
 * would count the account as paying for a whole family (access.ts), so the code isn't applied.
 * Shared by signup and /api/activate so the two can't disagree (review r6, P3 / P7).
 */
export async function planForCodeYear(
  db: Pick<typeof prisma, "subscriptionPlan">,
  planKey: string | null
): Promise<{ id: string } | null | "missing"> {
  if (!planKey) return null;
  const plan = await db.subscriptionPlan.findFirst({
    where: { familyPlanKey: planKey, isActive: true, interval: "MONTH" },
    orderBy: { price: "asc" },
    select: { id: true },
  });
  return plan ?? "missing";
}

/** JSON shape for the browser (dates as ISO strings). */
export function serializePreview(preview: VoucherPreview) {
  return { ...preview, expiresAt: preview.expiresAt ? preview.expiresAt.toISOString() : null };
}
