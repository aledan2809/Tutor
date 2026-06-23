import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { reminderInput } from "@/lib/reminder-schema";

async function ownReminder(userId: string, id: string) {
  const r = await prisma.studyReminder.findUnique({ where: { id }, select: { userId: true } });
  return r && r.userId === userId;
}

async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await ownReminder(session.user.id, id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = reminderInput.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  const reminder = await prisma.studyReminder.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ reminder });
}

async function _DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await ownReminder(session.user.id, id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.studyReminder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export const PATCH = withErrorHandler(_PATCH);
export const DELETE = withErrorHandler(_DELETE);
