import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";

/** The break must belong to this child (defence-in-depth alongside the guardian gate). */
async function breakOfChild(childId: string, bid: string) {
  const b = await prisma.studyBreak.findUnique({ where: { id: bid }, select: { userId: true } });
  return b && b.userId === childId;
}

async function _DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; bid: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId, bid } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await breakOfChild(childId, bid))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.studyBreak.delete({ where: { id: bid } });
  return NextResponse.json({ success: true });
}

export const DELETE = withErrorHandler(_DELETE);
