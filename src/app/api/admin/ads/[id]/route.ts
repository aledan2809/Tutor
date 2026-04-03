import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { withErrorHandler } from "@/lib/api-handler";

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const ad = await prisma.adPlacement.update({
    where: { id },
    data: {
      name: body.name,
      slot: body.slot,
      imageUrl: body.imageUrl,
      clickUrl: body.clickUrl,
      priority: body.priority,
      isActive: body.isActive,
    },
  });

  return NextResponse.json(ad);
}

async function _DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  await prisma.adPlacement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export const PATCH = withErrorHandler(_PATCH);
export const DELETE = withErrorHandler(_DELETE);
