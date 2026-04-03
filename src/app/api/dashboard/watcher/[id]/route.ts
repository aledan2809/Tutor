import { NextRequest, NextResponse } from "next/server";
import { requireWatcherOrInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { getStudentProgressSummary } from "@/lib/predictive-analytics";
import { withErrorHandler } from "@/lib/api-handler";

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireWatcherOrInstructor();
  if (error) return error;

  const { id: studentId } = await params;

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

  return NextResponse.json({
    student: {
      ...student,
      domains: studentEnrollments.map((e) => e.domain),
    },
    domainSummaries,
  });
}

export const GET = withErrorHandler(_GET);
