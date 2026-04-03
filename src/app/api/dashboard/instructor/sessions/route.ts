import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-handler";

const assignSessionSchema = z.object({
  studentIds: z.array(z.string()).min(1),
  domainId: z.string().min(1),
  type: z.string().default("practice"),
  subject: z.string().optional(),
});

async function _POST(req: NextRequest) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const body = await req.json();
  const parsed = assignSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { studentIds, domainId, type, subject } = parsed.data;

  // Create sessions for each student
  const sessions = await Promise.all(
    studentIds.map((studentId) =>
      prisma.session.create({
        data: {
          userId: studentId,
          domainId,
          type,
          subject,
          metadata: {
            assignedBy: session!.user.id,
            assignedAt: new Date().toISOString(),
          },
        },
      })
    )
  );

  // Create notifications for each student
  await prisma.notification.createMany({
    data: studentIds.map((studentId) => ({
      userId: studentId,
      type: "session_assigned",
      title: "New Session Assigned",
      message: `Your instructor has assigned a ${type} session for you.`,
      metadata: { domainId, type, assignedBy: session!.user.id },
    })),
  });

  return NextResponse.json({ sessions, count: sessions.length }, { status: 201 });
}

export const POST = withErrorHandler(_POST);
