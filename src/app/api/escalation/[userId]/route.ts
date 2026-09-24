import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { cancelEscalation } from "@/lib/escalation/engine";
import { withErrorHandler } from "@/lib/api-handler";
import { teachesStudent } from "@/lib/teaching-scope";
import { isGuardianOf } from "@/lib/guardian";

/**
 * GET /api/escalation/[userId] — Get escalation history for a user
 * Admin/Instructor only
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  // Self, the superadmin, a teacher who teaches this student, or the child's guardian. A teaching
  // role on some OTHER subject is not a pass to a child's reminder history (teaching-scope.ts).
  const isSelf = session.user.id === userId;
  const allowed =
    isSelf ||
    (await teachesStudent(session.user, userId)) ||
    (await isGuardianOf(session.user.id, userId));

  if (!allowed) {
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
async function _DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  // Cancelling someone's reminders: the superadmin, or a teacher who teaches this student.
  if (!(await teachesStudent(session.user, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cancelled = await cancelEscalation(userId);

  return NextResponse.json({ success: true, cancelledCount: cancelled });
}

export const GET = withErrorHandler(_GET);
export const DELETE = withErrorHandler(_DELETE);
