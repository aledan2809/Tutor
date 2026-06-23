import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { reminderInput } from "@/lib/reminder-schema";
import { isGuardianOf } from "@/lib/guardian";

/**
 * Guardian-scoped study schedule for a child. A parent manages the child's
 * "Program" from the Watcher; mirrors /api/student/reminders but operates on
 * the child's userId and is gated by an active guardian link.
 */
async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const reminders = await prisma.studyReminder.findMany({
    where: { userId: childId },
    orderBy: [{ hour: "asc" }, { minute: "asc" }],
  });
  return NextResponse.json({ reminders });
}

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = reminderInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  const reminder = await prisma.studyReminder.create({
    data: {
      userId: childId,
      label: parsed.data.label ?? null,
      window: parsed.data.window,
      sessionType: parsed.data.sessionType,
      daysOfWeek: parsed.data.daysOfWeek,
      hour: parsed.data.hour,
      minute: parsed.data.minute,
      domainSlug: parsed.data.domainSlug ?? null,
      timezone: "Europe/Bucharest",
      isActive: parsed.data.isActive ?? true,
    },
  });
  return NextResponse.json({ reminder }, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
