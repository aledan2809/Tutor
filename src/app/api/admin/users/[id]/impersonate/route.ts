import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await params;

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await logAudit({
    action: "IMPERSONATE",
    performedById: session!.user.id,
    targetUserId: id,
    targetType: "User",
    metadata: { targetEmail: targetUser.email },
  });

  // Return target user info for client-side session override
  // In production, this would generate a temporary token
  return NextResponse.json({
    message: "Impersonation logged",
    targetUser,
  });
}
