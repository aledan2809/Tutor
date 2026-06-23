import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";
import { fireNudge } from "@/lib/escalation/parent-nudge";

const nudgeInput = z.object({
  message: z.string().trim().min(1).max(300),
  // null/omitted = one-shot; otherwise repeat every N minutes.
  intervalMin: z.number().int().min(5).max(240).nullable().optional(),
});

/** GET — active nudges for this child (guardian only). */
async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const nudges = await prisma.parentNudge.findMany({
    where: { childId, active: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, message: true, intervalMin: true, fireCount: true, lastFiredAt: true, createdAt: true },
  });
  return NextResponse.json({ nudges });
}

/** POST — create a nudge and fire it immediately (guardian only). */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = nudgeInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const intervalMin = parsed.data.intervalMin ?? null;
  // Fire the first one now so the parent sees instant effect; cron handles repeats.
  await fireNudge(childId, parsed.data.message);
  const nudge = await prisma.parentNudge.create({
    data: {
      parentId: session.user.id,
      childId,
      message: parsed.data.message,
      intervalMin,
      active: intervalMin != null, // one-shot is done after this first fire
      fireCount: 1,
      lastFiredAt: new Date(),
    },
    select: { id: true, message: true, intervalMin: true, fireCount: true, lastFiredAt: true, createdAt: true },
  });
  return NextResponse.json({ nudge }, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
