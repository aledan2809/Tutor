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

/** JSON shape for the browser (dates as ISO strings). */
export function serializePreview(preview: VoucherPreview) {
  return { ...preview, expiresAt: preview.expiresAt ? preview.expiresAt.toISOString() : null };
}
