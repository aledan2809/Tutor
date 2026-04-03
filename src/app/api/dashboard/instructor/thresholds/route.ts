import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const thresholdSchema = z.object({
  studentId: z.string().min(1),
  domainId: z.string().min(1),
  metric: z.enum(["streak", "score", "session_missed"]),
  operator: z.enum(["lt", "gt", "eq"]).default("lt"),
  value: z.number().int(),
  action: z.enum(["notify_instructor", "notify_watcher"]).default("notify_instructor"),
});

async function _GET(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const thresholds = await prisma.escalationThreshold.findMany({
    where: {
      instructorId: session!.user.id,
      ...(studentId ? { studentId } : {}),
      isActive: true,
    },
    include: {
      student: { select: { id: true, name: true } },
      domain: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ thresholds });
}

async function _POST(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const body = await req.json();
  const parsed = thresholdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const threshold = await prisma.escalationThreshold.create({
    data: {
      instructorId: session!.user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json(threshold, { status: 201 });
}

async function _DELETE(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const thresholdId = searchParams.get("id");
  if (!thresholdId) {
    return NextResponse.json({ error: "Missing threshold id" }, { status: 400 });
  }

  await prisma.escalationThreshold.update({
    where: { id: thresholdId, instructorId: session!.user.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
export const DELETE = withErrorHandler(_DELETE);
