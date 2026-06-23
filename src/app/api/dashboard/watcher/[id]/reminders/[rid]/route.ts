import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { reminderInput } from "@/lib/reminder-schema";
import { isGuardianOf } from "@/lib/guardian";

/** The reminder must belong to this child (defence-in-depth alongside the guardian gate). */
async function reminderOfChild(childId: string, rid: string) {
  const r = await prisma.studyReminder.findUnique({ where: { id: rid }, select: { userId: true } });
  return r && r.userId === childId;
}

async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; rid: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId, rid } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await reminderOfChild(childId, rid))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = reminderInput.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  const reminder = await prisma.studyReminder.update({ where: { id: rid }, data: parsed.data });
  return NextResponse.json({ reminder });
}

async function _DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; rid: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
