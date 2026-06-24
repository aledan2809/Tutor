import { NextRequest, NextResponse } from "next/server";
import { requireWatcher } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { sendScheduleNow } from "@/lib/escalation/watcher-reports";

/** POST — build + deliver this schedule's report immediately (test/preview). */
async function _POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireWatcher();
  if (error) return error;
  const parentId = session!.user.id;
  const { id } = await params;

  const s = await prisma.watcherReportSchedule.findUnique({ where: { id } });
  if (!s || s.parentId !== parentId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await sendScheduleNow(id);
  if (!result.ok) return NextResponse.json({ error: "Nu am putut trimite." }, { status: 400 });
  return NextResponse.json(result);
}

export const POST = withErrorHandler(_POST);
