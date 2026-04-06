import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { logAudit } from "@/lib/audit";
import { withErrorHandler } from "@/lib/api-handler";
import { signImpersonationToken, IMPERSONATION_TTL_MS } from "@/lib/impersonation";

async function _POST(
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

  // C06: Generate temporary signed JWT with TTL
  const token = signImpersonationToken({
    adminId: session!.user.id,
    impersonatedUserId: id,
    exp: Date.now() + IMPERSONATION_TTL_MS,
  });

  return NextResponse.json({
    message: "Impersonation logged",
    targetUser,
    token,
    expiresIn: IMPERSONATION_TTL_MS,
  });
}

export const POST = withErrorHandler(_POST);
