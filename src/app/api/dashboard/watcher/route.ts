import { NextRequest, NextResponse } from "next/server";
import { requireWatcherOrInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";
import { getStudentProgressSummary } from "@/lib/predictive-analytics";
import { withErrorHandler } from "@/lib/api-handler";
import { getLinkedChildIds, requestedWatcherDomains, watcherScope } from "@/lib/guardian";
import { refuseIfPaused } from "@/lib/access-gate";

async function _GET(req: NextRequest) {
  const { error, session } = await requireWatcherOrInstructor();
  if (error) return error;
  // Proba gratuită s-a încheiat fără plată: contul e în pauză (access.ts).
  const paused = await refuseIfPaused(session!.user.id);
  if (paused) return paused;

  const userId = session!.user.id;
  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  // Scoping PER SUBJECT (guardian.ts `watcherScope`): where they teach, every student of that
  // subject; where they are only a parent, their own children and nobody else. A subject id in the
  // URL counts only if they have a role on it.
  const scope = requestedWatcherDomains(watcherScope(session!.user.enrollments), domainId);
  const linkedChildIds = scope.watchOnly.length ? await getLinkedChildIds(userId) : [];
  const visible = [
    ...(scope.teaching.length ? [{ domainId: { in: scope.teaching }, userId: { not: userId } }] : []),
    ...(scope.watchOnly.length && linkedChildIds.length
      ? [{ domainId: { in: scope.watchOnly }, userId: { in: linkedChildIds } }]
      : []),
  ];

  // Get students in these domains, scoped to the watcher's allowed set.
  const studentEnrollments = visible.length === 0 ? [] : await prisma.enrollment.findMany({
    where: {
      roles: { hasSome: ["STUDENT"] },
      isActive: true,
      OR: visible,
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
    domains: [...scope.teaching, ...scope.watchOnly],
  });
}

export const GET = withErrorHandler(_GET);
