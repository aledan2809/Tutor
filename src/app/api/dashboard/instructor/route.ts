import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/watcher-instructor-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error, session } = await requireInstructor();
  if (error) return error;

  const userId = session!.user.id;
  const instructorDomainIds = session!.user.enrollments
    .filter((e) =>
      e.roles.includes("INSTRUCTOR" as never) || e.roles.includes("ADMIN" as never)
    )
    .map((e) => e.domainId);

  const [studentCount, groupCount, activeGoals, unreadMessages, recentSessions] =
    await Promise.all([
      prisma.enrollment.count({
        where: {
          domainId: { in: instructorDomainIds },
          roles: { hasSome: ["STUDENT"] },
          isActive: true,
        },
      }),
      prisma.group.count({
        where: {
          domainId: { in: instructorDomainIds },
          createdById: userId,
          isActive: true,
        },
      }),
      prisma.instructorGoal.count({
        where: { instructorId: userId, isCompleted: false },
      }),
      prisma.instructorMessage.count({
        where: { recipientId: userId, isRead: false },
      }),
      prisma.session.findMany({
        where: {
          domainId: { in: instructorDomainIds },
          endedAt: { not: null },
        },
        orderBy: { startedAt: "desc" },
        take: 10,
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
    ]);

  return NextResponse.json({
    stats: {
      totalStudents: studentCount,
      totalGroups: groupCount,
      activeGoals,
      unreadMessages,
    },
    recentActivity: recentSessions.map((s) => ({
      id: s.id,
      studentName: s.user.name,
      studentId: s.user.id,
      type: s.type,
      score: s.score !== null ? Math.round(s.score) : null,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
    })),
    domains: instructorDomainIds,
  });
}
