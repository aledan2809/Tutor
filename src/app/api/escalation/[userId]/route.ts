import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { cancelEscalation } from "@/lib/escalation/engine";

/**
 * GET /api/escalation/[userId] — Get escalation history for a user
 * Admin/Instructor only
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  // Only allow self, admin, or instructor
  const isSelf = session.user.id === userId;
  const isPrivileged =
    session.user.isSuperAdmin ||
    session.user.enrollments.some((e) =>
      e.roles.includes("ADMIN") || e.roles.includes("INSTRUCTOR")
    );

  if (!isSelf && !isPrivileged) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  const events = await prisma.escalationEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ events });
}

/**
 * DELETE /api/escalation/[userId] — Cancel active escalation for a user
 * Admin/Instructor only
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  const isPrivileged =
    session.user.isSuperAdmin ||
    session.user.enrollments.some((e) =>
      e.roles.includes("ADMIN") || e.roles.includes("INSTRUCTOR")
    );

  if (!isPrivileged) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cancelled = await cancelEscalation(userId);

  return NextResponse.json({ success: true, cancelledCount: cancelled });
}
