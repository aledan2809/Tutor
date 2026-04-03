import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { logAudit } from "@/lib/audit";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const createVoucherSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  discountPercent: z.number().int().min(1).max(100),
  maxUses: z.number().int().min(1).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

async function _GET(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [vouchers, total] = await Promise.all([
    prisma.voucher.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    }),
    prisma.voucher.count(),
  ]);

  return NextResponse.json({ vouchers, total, page, totalPages: Math.ceil(total / limit) });
}

async function _POST(req: NextRequest) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = createVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.voucher.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return NextResponse.json({ error: "Voucher code already exists" }, { status: 409 });
  }

  const voucher = await prisma.voucher.create({
    data: {
      code: parsed.data.code,
      discountPercent: parsed.data.discountPercent,
      maxUses: parsed.data.maxUses ?? null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      createdById: session!.user.id,
    },
  });

  await logAudit({
    action: "GENERATE_VOUCHER",
    performedById: session!.user.id,
    targetType: "Voucher",
    metadata: { code: voucher.code, discountPercent: voucher.discountPercent },
  });

  return NextResponse.json(voucher, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
