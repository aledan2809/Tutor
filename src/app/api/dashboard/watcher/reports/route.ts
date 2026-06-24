import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWatcher } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf, getLinkedChildIds } from "@/lib/guardian";

const scheduleInput = z.object({
  childId: z.string().nullable().optional(), // null = toți copiii
  cadence: z.enum(["daily", "weekly"]),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  channels: z.array(z.enum(["EMAIL", "PUSH", "TELEGRAM"])).min(1).max(3),
  sections: z.array(z.enum(["sessions", "discipline", "weaknesses", "results"])).min(1).max(4),
  isActive: z.boolean().optional(),
});

/** GET — this parent's report schedules + the children they can scope to. */
async function _GET() {
  const { error, session } = await requireWatcher();
  if (error) return error;
  const parentId = session!.user.id;

  const [schedules, childIds] = await Promise.all([
    prisma.watcherReportSchedule.findMany({
      where: { parentId },
      orderBy: { createdAt: "asc" },
    }),
    getLinkedChildIds(parentId),
  ]);
  const children = childIds.length
    ? await prisma.user.findMany({
        where: { id: { in: childIds } },
        select: { id: true, name: true, email: true },
      })
    : [];

  return NextResponse.json({ schedules, children });
}

/** POST — create a report schedule (parent-owned). */
async function _POST(req: NextRequest) {
  const { error, session } = await requireWatcher();
  if (error) return error;
  const parentId = session!.user.id;

  const parsed = scheduleInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  const d = parsed.data;

  // Weekly needs a day; daily ignores it.
  if (d.cadence === "weekly" && (d.dayOfWeek == null))
    return NextResponse.json({ error: "Alege ziua săptămânii." }, { status: 400 });

  // If scoped to a specific child, the parent must be its guardian.
  if (d.childId && !(await isGuardianOf(parentId, d.childId)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const schedule = await prisma.watcherReportSchedule.create({
    data: {
      parentId,
      childId: d.childId ?? null,
      cadence: d.cadence,
      dayOfWeek: d.cadence === "weekly" ? d.dayOfWeek! : null,
      hour: d.hour,
      minute: d.minute,
      channels: d.channels,
      sections: d.sections,
      isActive: d.isActive ?? true,
    },
  });
  return NextResponse.json({ schedule }, { status: 201 });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
