import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";

/** The nudge must belong to this child (defence-in-depth alongside the guardian gate). */
async function nudgeOfChild(childId: string, nid: string) {
  const n = await prisma.parentNudge.findUnique({ where: { id: nid }, select: { childId: true } });
  return n && n.childId === childId;
}

/** DELETE — stop a running nudge (guardian only). */
async function _DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; nid: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId, nid } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await nudgeOfChild(childId, nid))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.parentNudge.update({ where: { id: nid }, data: { active: false } });
  return NextResponse.json({ success: true });
}

export const DELETE = withErrorHandler(_DELETE);
