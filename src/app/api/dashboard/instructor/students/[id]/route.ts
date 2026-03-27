import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { getStudentProgressSummary, predictFailureRisk } from "@/lib/predictive-analytics";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const { id: studentId } = await params;
  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  const instructorDomainIds = session!.user.enrollments
    .filter((e) =>
      e.roles.includes("INSTRUCTOR" as never) || e.roles.includes("ADMIN" as never)
    )
    .map((e) => e.domainId);

  // Verify student is in instructor's domains
  const studentEnrollments = await prisma.enrollment.findMany({
    where: {
      userId: studentId,
      domainId: { in: instructorDomainIds },
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

  // Get progress per domain
  const domainProgress = await Promise.all(
    studentEnrollments
      .filter((e) => !domainId || e.domainId === domainId)
      .map(async (enrollment) => {
        const [summary, risk] = await Promise.all([
          getStudentProgressSummary(studentId, enrollment.domainId),
          predictFailureRisk(studentId, enrollment.domainId),
        ]);

        return {
          domain: enrollment.domain,
          ...summary,
          risk,
        };
      })
  );

  // Get goals set by instructor
  const goals = await prisma.instructorGoal.findMany({
    where: {
      studentId,
      instructorId: session!.user.id,
      ...(domainId ? { domainId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  // Get group memberships
  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId: studentId },
    include: {
      group: { select: { id: true, name: true, domainId: true } },
    },
  });

  return NextResponse.json({
    student: {
      ...student,
      domains: studentEnrollments.map((e) => e.domain),
    },
    domainProgress,
    goals,
    groups: groupMemberships.map((gm) => gm.group),
  });
}
