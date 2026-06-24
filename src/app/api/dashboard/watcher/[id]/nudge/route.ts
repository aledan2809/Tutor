import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";
import { fireNudge } from "@/lib/escalation/parent-nudge";
import { reminderImminent } from "@/lib/escalation/reminders";

const nudgeInput = z.object({
  message: z.string().trim().min(1).max(300),
  // null/omitted = one-shot; otherwise repeat every N minutes.
  intervalMin: z.number().int().min(5).max(240).nullable().optional(),
  // Series end ("până la 18:00" / "peste 4h") as an ISO datetime; null = use caps.
  untilAt: z.string().datetime().nullable().optional(),
  // Channels to deliver on; default in-app push + Telegram.
  channels: z.array(z.enum(["PUSH", "TELEGRAM", "WHATSAPP", "EMAIL"])).min(1).max(4).optional(),
  // Deep-link to the targeted session (relative path only, e.g. /dashboard/practice?...).
  url: z.string().startsWith("/").max(300).optional(),
});

const MAX_SERIES_HOURS = 12;

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

  const now = new Date();
  const intervalMin = parsed.data.intervalMin ?? null;

  // Validate the series end (must be future + within a sane cap).
  let untilAt: Date | null = null;
  if (parsed.data.untilAt) {
    untilAt = new Date(parsed.data.untilAt);
    if (untilAt.getTime() <= now.getTime()) {
      return NextResponse.json({ error: "Ora de final trebuie să fie în viitor." }, { status: 400 });
    }
    if (untilAt.getTime() - now.getTime() > MAX_SERIES_HOURS * 3_600_000) {
      untilAt = new Date(now.getTime() + MAX_SERIES_HOURS * 3_600_000);
    }
  }

  // No-overlap: don't start when the child already has a scheduled session imminent.
  if (await reminderImminent(childId, now, 25)) {
    return NextResponse.json(
      { error: "Urmează o sesiune programată în curând — nu pornesc un memento acum." },
      { status: 400 }
    );
  }

  const channels = parsed.data.channels ?? ["PUSH", "TELEGRAM"];
  const url = parsed.data.url ?? "/dashboard/practice";
  // Fire the first one now so the parent sees instant effect; cron handles repeats.
  await fireNudge(childId, parsed.data.message, channels, url);
  const nudge = await prisma.parentNudge.create({
    data: {
      parentId: session.user.id,
      childId,
      message: parsed.data.message,
      intervalMin,
      untilAt,
      channels,
      url,
      active: intervalMin != null, // one-shot is done after this first fire
      fireCount: 1,
      lastFiredAt: now,
    },
    select: { id: true, message: true, intervalMin: true, fireCount: true, lastFiredAt: true, createdAt: true },
  });
  return NextResponse.json({ nudge }, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
