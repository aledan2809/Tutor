import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { reminderInput } from "@/lib/reminder-schema";
import { isGuardianOf } from "@/lib/guardian";
import { activeSetters, setByLabel } from "@/lib/guardian-lock";
import { refuseIfPaused } from "@/lib/access-gate";

/**
 * Guardian-scoped study schedule for a child. A parent manages the child's
 * "Program" from the Watcher; mirrors /api/student/reminders but operates on
 * the child's userId and is gated by an active guardian link.
 *
 * What a PARENT creates or changes is marked as theirs, and the child can no longer change it
 * (guardian-lock.ts); the child's own reminders stay the child's until a parent edits one. A family
 * tutor can help with the schedule, but their edits don't lock anything.
 */
async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const paused = await refuseIfPaused(session.user.id);
  if (paused) return paused;
  const { id: childId } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const reminders = await prisma.studyReminder.findMany({
    where: { userId: childId },
    orderBy: [{ hour: "asc" }, { minute: "asc" }],
  });
  const [owners, tutors] = await Promise.all([
    activeSetters(childId, reminders.map((r) => r.setById)),
    activeSetters(childId, reminders.map((r) => r.setById), "TUTOR"),
  ]);
  return NextResponse.json({
    reminders: reminders.map((r) => ({ ...r, ...setByLabel(r.setById, session.user.id, owners, tutors) })),
  });
}

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const paused = await refuseIfPaused(session.user.id);
  if (paused) return paused;
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
      // Who added it: a parent's locks for the child, a tutor's is only named (guardian-lock.ts).
      setById: session.user.id,
    },
  });
  return NextResponse.json({ reminder: { ...reminder, setBy: "you", setByName: null } }, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
