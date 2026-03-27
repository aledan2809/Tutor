import { NextRequest, NextResponse } from "next/server";
import { requireWatcherOrInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { getStudentProgressSummary } from "@/lib/predictive-analytics";

export async function GET(req: NextRequest) {
  const { error, session } = await requireWatcherOrInstructor();
  if (error) return error;

  const userId = session!.user.id;
  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  // Find students the watcher/instructor monitors
  // Watchers: see students in same domain enrollments where watcher has WATCHER role
  const watcherEnrollments = session!.user.enrollments.filter(
    (e) =>
      e.roles.includes("WATCHER" as never) ||
      e.roles.includes("INSTRUCTOR" as never) ||
      e.roles.includes("ADMIN" as never)
  );

  const domainIds = domainId
    ? [domainId]
    : watcherEnrollments.map((e) => e.domainId);

  // Get all students enrolled in these domains
  const studentEnrollments = await prisma.enrollment.findMany({
    where: {
      domainId: { in: domainIds },
      roles: { hasSome: ["STUDENT"] },
      isActive: true,
      userId: { not: userId },
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      domain: { select: { id: true, name: true, slug: true, icon: true } },
    },
  });

  // Group by student
  const studentMap = new Map<
    string,
    {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      domains: { id: string; name: string; slug: string; icon: string | null }[];
    }
  >();

  for (const enrollment of studentEnrollments) {
    const existing = studentMap.get(enrollment.userId);
    if (existing) {
      existing.domains.push(enrollment.domain);
    } else {
      studentMap.set(enrollment.userId, {
        id: enrollment.user.id,
        name: enrollment.user.name,
        email: enrollment.user.email,
        image: enrollment.user.image,
        domains: [enrollment.domain],
      });
    }
  }

  // Get summary for each student
  const students = await Promise.all(
    Array.from(studentMap.values()).map(async (student) => {
      const summary = await getStudentProgressSummary(
        student.id,
        domainId ?? undefined
      );
      return {
        ...student,
        ...summary,
      };
    })
  );

  return NextResponse.json({
    students,
    totalStudents: students.length,
    domains: domainIds,
  });
}
