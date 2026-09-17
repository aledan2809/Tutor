import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { reminderInput } from "@/lib/reminder-schema";
import { isGuardianOf, isParentOf } from "@/lib/guardian";
import { activeSetters, setByLabel } from "@/lib/guardian-lock";
import { refuseIfPaused } from "@/lib/access-gate";

/** The reminder must belong to this child (defence-in-depth alongside the guardian gate). */
async function reminderOfChild(childId: string, rid: string) {
  const r = await prisma.studyReminder.findUnique({ where: { id: rid }, select: { userId: true } });
  return r && r.userId === childId;
}

async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; rid: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const paused = await refuseIfPaused(session.user.id);
  if (paused) return paused;
  const { id: childId, rid } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await reminderOfChild(childId, rid))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = reminderInput.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  // A change by a parent makes the reminder theirs: the child can no longer change it. A family
  // tutor's change leaves it as it was (guardian-lock.ts).
  const asParent = await isParentOf(session.user.id, childId);
  const reminder = await prisma.studyReminder.update({
    where: { id: rid },
    data: { ...parsed.data, ...(asParent ? { setById: session.user.id } : {}) },
  });
  // Labelled exactly as the list labels it (setByLabel): a tutor's change of a reminder the other
  // parent set still shows that parent, not „you" (review r6, U5).
  const setBy = reminder.setById ? [reminder.setById] : [];
  const [owners, tutors] = await Promise.all([activeSetters(childId, setBy), activeSetters(childId, setBy, "TUTOR")]);
  return NextResponse.json({ reminder: { ...reminder, ...setByLabel(reminder.setById, session.user.id, owners, tutors) } });
}

async function _DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; rid: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const paused = await refuseIfPaused(session.user.id);
  if (paused) return paused;
  const { id: childId, rid } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await reminderOfChild(childId, rid))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.studyReminder.delete({ where: { id: rid } });
  return NextResponse.json({ success: true });
}

export const PATCH = withErrorHandler(_PATCH);
export const DELETE = withErrorHandler(_DELETE);
