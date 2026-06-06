import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { logAudit } from "@/lib/audit";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const patchSchema = z.object({
  code: z.string().min(3).max(50).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Build a partial update — only the fields actually provided.
  const data: {
    code?: string;
    discountPercent?: number;
    maxUses?: number | null;
    expiresAt?: Date | null;
    isActive?: boolean;
  } = {};

  if (parsed.data.code !== undefined) {
    const code = parsed.data.code.toUpperCase();
    const existing = await prisma.voucher.findUnique({ where: { code } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Voucher code already exists" }, { status: 409 });
    }
    data.code = code;
  }
  if (parsed.data.discountPercent !== undefined) data.discountPercent = parsed.data.discountPercent;
  if (parsed.data.maxUses !== undefined) data.maxUses = parsed.data.maxUses;
  if (parsed.data.expiresAt !== undefined)
    data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  const voucher = await prisma.voucher.update({ where: { id }, data });

  await logAudit({
    action: "EDIT_VOUCHER",
    performedById: session!.user.id,
    targetType: "Voucher",
    metadata: { voucherId: id, fields: Object.keys(data) },
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
