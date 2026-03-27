import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  // Prevent self-ban or self-demotion
  if (id === session!.user.id) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.isBanned === "boolean") {
    updateData.isBanned = body.isBanned;
    updateData.bannedReason = body.isBanned ? (body.bannedReason || null) : null;

    await logAudit({
      action: body.isBanned ? "BAN_USER" : "UNBAN_USER",
      performedById: session!.user.id,
      targetUserId: id,
      targetType: "User",
      metadata: body.isBanned ? { reason: body.bannedReason } : undefined,
    });
  }

  if (typeof body.isSuperAdmin === "boolean") {
    updateData.isSuperAdmin = body.isSuperAdmin;

    await logAudit({
      action: "ROLE_CHANGE",
      performedById: session!.user.id,
      targetUserId: id,
      targetType: "User",
      metadata: { isSuperAdmin: body.isSuperAdmin },
    });
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      isSuperAdmin: true,
      isBanned: true,
      bannedReason: true,
    },
  });

  return NextResponse.json(user);
}
