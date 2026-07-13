import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireSuperAdmin();
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

  const definedKeys = Object.keys(body).filter((k) => body[k] !== undefined);
  const onlyToggle = definedKeys.length === 1 && definedKeys[0] === "isActive";
  await logAudit({
    action: onlyToggle ? "TOGGLE_AD" : "EDIT_AD",
    performedById: session!.user.id,
    targetType: "AdPlacement",
    metadata: { adId: id, changes: definedKeys },
  });

  return NextResponse.json(ad);
}

async function _DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  await prisma.adPlacement.delete({ where: { id } });

  await logAudit({
    action: "DELETE_AD",
    performedById: session!.user.id,
    targetType: "AdPlacement",
    metadata: { adId: id },
  });

  return NextResponse.json({ success: true });
}

export const PATCH = withErrorHandler(_PATCH);
export const DELETE = withErrorHandler(_DELETE);
