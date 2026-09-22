import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET /api/admin/vouchers/[id]/redemptions — who used this code, when, and until when their access
 * runs. The voucher page shows only how many times it was used; this is the other half of the trail:
 * from a code to the accounts it opened (the list of accounts answers the same question from its end,
 * by searching for the code).
 */
async function _GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const { id } = await params;

  const rows = await prisma.voucherRedemption.findMany({
    where: { voucherId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      createdAt: true,
      sessionId: true,
      user: { select: { id: true, name: true, email: true, subscriptionEndsAt: true, stripeSubscriptionId: true } },
    },
  });

  return NextResponse.json({
    redemptions: rows.map((r) => ({
      at: r.createdAt,
      name: r.user.name,
      email: r.user.email,
      accessEndsAt: r.user.subscriptionEndsAt,
      // A code used at a card payment (the discount) rather than one that opened a free year.
      paysByCard: r.user.stripeSubscriptionId !== null || r.sessionId !== null,
    })),
  });
}

export const GET = withErrorHandler(_GET);
