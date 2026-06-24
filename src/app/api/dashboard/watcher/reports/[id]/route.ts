import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWatcher } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";

const patchInput = z.object({
  childId: z.string().nullable().optional(),
  cadence: z.enum(["daily", "weekly"]).optional(),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  hour: z.number().int().min(0).max(23).optional(),
  minute: z.number().int().min(0).max(59).optional(),
  channels: z.array(z.enum(["EMAIL", "PUSH", "TELEGRAM"])).min(1).max(3).optional(),
  sections: z.array(z.enum(["sessions", "discipline", "weaknesses", "results"])).min(1).max(4).optional(),
  isActive: z.boolean().optional(),
});

async function ownSchedule(parentId: string, id: string) {
  const s = await prisma.watcherReportSchedule.findUnique({ where: { id } });
  return s && s.parentId === parentId ? s : null;
}

/** PATCH — update a parent-owned schedule. */
async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireWatcher();
  if (error) return error;
  const parentId = session!.user.id;
  const { id } = await params;
  if (!(await ownSchedule(parentId, id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = patchInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  const d = parsed.data;

  if (d.childId && !(await isGuardianOf(parentId, d.childId)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data: Record<string, unknown> = {};
  if (d.childId !== undefined) data.childId = d.childId;
  if (d.cadence !== undefined) {
    data.cadence = d.cadence;
    if (d.cadence === "daily") data.dayOfWeek = null;
  }
  if (d.dayOfWeek !== undefined) data.dayOfWeek = d.dayOfWeek;
  if (d.hour !== undefined) data.hour = d.hour;
  if (d.minute !== undefined) data.minute = d.minute;
  if (d.channels !== undefined) data.channels = d.channels;
  if (d.sections !== undefined) data.sections = d.sections;
  if (d.isActive !== undefined) data.isActive = d.isActive;

  const schedule = await prisma.watcherReportSchedule.update({ where: { id }, data });
  return NextResponse.json({ schedule });
}

/** DELETE — remove a parent-owned schedule. */
async function _DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireWatcher();
  if (error) return error;
  const parentId = session!.user.id;
  const { id } = await params;
  if (!(await ownSchedule(parentId, id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.watcherReportSchedule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const PATCH = withErrorHandler(_PATCH);
export const DELETE = withErrorHandler(_DELETE);
