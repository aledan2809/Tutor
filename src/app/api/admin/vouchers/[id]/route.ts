import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { logAudit } from "@/lib/audit";
import { withErrorHandler } from "@/lib/api-handler";

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const voucher = await prisma.voucher.update({
    where: { id },
    data: {
      isActive: body.isActive,
      maxUses: body.maxUses,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    },
  });

  return NextResponse.json(voucher);
}

async function _DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;

  await prisma.voucher.delete({ where: { id } });

  await logAudit({
    action: "DELETE_VOUCHER",
    performedById: session!.user.id,
    targetType: "Voucher",
    metadata: { voucherId: id },
  });

  return NextResponse.json({ success: true });
}

export const PATCH = withErrorHandler(_PATCH);
export const DELETE = withErrorHandler(_DELETE);
