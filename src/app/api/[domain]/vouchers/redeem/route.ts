import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const redeemSchema = z.object({
  code: z.string().min(1).max(50),
});

async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid voucher code" }, { status: 400 });
  }

  const code = parsed.data.code.toUpperCase();

  // Atomic transaction: check validity + mark as used in one operation
  // Prevents TOCTOU race condition with concurrent redeem requests
  const result = await prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      return { error: "Voucher not found", status: 404 };
    }

    if (!voucher.isActive) {
      return { error: "Voucher is no longer active", status: 400 };
    }

    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      return { error: "Voucher has expired", status: 400 };
    }

    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
      return { error: "Voucher has reached maximum uses", status: 400 };
    }

    // Atomically increment usedCount
    const updated = await tx.voucher.update({
      where: {
        id: voucher.id,
        // Double-check within transaction to prevent race
        ...(voucher.maxUses !== null
          ? { usedCount: { lt: voucher.maxUses } }
          : {}),
      },
      data: {
        usedCount: { increment: 1 },
      },
    });

    return {
      voucher: {
        id: updated.id,
        code: updated.code,
        discountPercent: updated.discountPercent,
      },
    };
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status as number }
    );
  }

  return NextResponse.json({
    success: true,
    discountPercent: result.voucher!.discountPercent,
    voucherId: result.voucher!.id,
  });
}

export const POST = withErrorHandler(_POST);
