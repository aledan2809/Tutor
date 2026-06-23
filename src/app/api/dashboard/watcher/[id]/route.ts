import { NextRequest, NextResponse } from "next/server";
import { requireWatcherOrInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { getStudentProgressSummary } from "@/lib/predictive-analytics";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf, watcherSeesAllStudents } from "@/lib/guardian";

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireWatcherOrInstructor();
  if (error) return error;

  const { id: studentId } = await params;

  // Parent scoping: a pure parent watcher may only view a linked child.
  if (
    !watcherSeesAllStudents(session!.user) &&
    !(await isGuardianOf(session!.user.id, studentId))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify watcher has access to this student's domains
  const watcherDomainIds = session!.user.enrollments
    .filter(
      (e) =>
        e.roles.includes("WATCHER" as never) ||
        e.roles.includes("INSTRUCTOR" as never) ||
        e.roles.includes("ADMIN" as never)
    )
    .map((e) => e.domainId);

  const studentEnrollments = await prisma.enrollment.findMany({
    where: {
      userId: studentId,
      domainId: { in: watcherDomainIds },
      roles: { hasSome: ["STUDENT"] },
      isActive: true,
    },
    include: {
      domain: { select: { id: true, name: true, slug: true, icon: true } },
    },
  });

  if (studentEnrollments.length === 0) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Get per-domain summaries
  const domainSummaries = await Promise.all(
    studentEnrollments.map(async (enrollment) => {
      const summary = await getStudentProgressSummary(studentId, enrollment.domainId);
      return {
        domain: enrollment.domain,
        ...summary,
      };
    })
  );

  // Session log — each session + its result (score).
  const sessions = await prisma.session.findMany({
    where: { userId: studentId },
    orderBy: { startedAt: "desc" },
    take: 25,
    select: { id: true, type: true, subject: true, startedAt: true, endedAt: true, score: true },
  });
  const sessionLog = sessions.map((s) => ({
    id: s.id,
    type: s.type,
    subject: s.subject,
    startedAt: s.startedAt,
    completed: s.endedAt != null,
    score: s.score,
  }));

  // Reminder log — each reminder/escalation touch, with the channel + whether it
  // was actually sent + whether the child acknowledged it.
  const events = await prisma.escalationEvent.findMany({
    where: { userId: studentId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      level: true,
      channel: true,
      status: true,
      sentAt: true,
      acknowledgedAt: true,
      createdAt: true,
      metadata: true,
    },
  });
  const reminderLog = events.map((e) => ({
    id: e.id,
    channel: e.channel,
    level: e.level,
    sent: e.sentAt != null,
    acknowledged: e.acknowledgedAt != null,
    reason: ((e.metadata as Record<string, unknown> | null)?.reason as string) ?? null,
    at: e.sentAt ?? e.createdAt,
  }));

  return NextResponse.json({
    student: {
      ...student,
      domains: studentEnrollments.map((e) => e.domain),
    },
    domainSummaries,
    sessionLog,
    reminderLog,
  });
}

export const GET = withErrorHandler(_GET);
