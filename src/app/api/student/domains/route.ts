import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      domain: {
        include: {
          _count: {
            select: {
              questions: { where: { status: "PUBLISHED" } },
              enrollments: true,
            },
          },
        },
      },
    },
  });

  // Get progress for each domain
  const domains = await Promise.all(
    enrollments.map(async (enrollment) => {
      // Get domain-specific topics to scope progress
      const domainQuestions = await prisma.question.findMany({
        where: { domainId: enrollment.domainId, status: "PUBLISHED" },
        select: { subject: true, topic: true },
      });
      const domainTopicKeys = new Set(
        domainQuestions.map((q) => `${q.subject}:${q.topic}`)
      );

      const allProgress = await prisma.progress.findMany({
        where: { userId: session.user.id },
      });
      const progress = allProgress.filter((p) =>
        domainTopicKeys.has(`${p.subject}:${p.topic}`)
      );

      const sessions = await prisma.session.findMany({
        where: {
          userId: session.user.id,
          domainId: enrollment.domainId,
          endedAt: { not: null },
        },
        select: { score: true },
      });

      const totalAttempts = progress.reduce((s, p) => s + p.totalAttempts, 0);
      const correctAttempts = progress.reduce((s, p) => s + p.correctAttempts, 0);
      const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((s, sess) => s + (sess.score || 0), 0) / sessions.length)
        : 0;

      // Get gamification data for this domain
      const gam = await prisma.userGamification.findUnique({
        where: { userId_domainId: { userId: session.user.id, domainId: enrollment.domainId } },
      });

      return {
        id: enrollment.domain.id,
        name: enrollment.domain.name,
        slug: enrollment.domain.slug,
        icon: enrollment.domain.icon,
        description: enrollment.domain.description,
        roles: enrollment.roles,
        enrolledAt: enrollment.createdAt,
        stats: {
          questionsAvailable: enrollment.domain._count.questions,
          totalStudents: enrollment.domain._count.enrollments,
          topicsStudied: progress.length,
          accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
          sessionsCompleted: sessions.length,
          avgScore,
          xp: gam?.xp ?? 0,
          level: gam?.level ?? "Cadet",
          streak: gam?.streak ?? 0,
        },
      };
    })
  );

  // Get available domains not yet enrolled
  const enrolledDomainIds = enrollments.map((e) => e.domainId);
  const availableDomains = await prisma.domain.findMany({
    where: {
      isActive: true,
      id: { notIn: enrolledDomainIds },
    },
    include: {
      _count: {
        select: {
          questions: { where: { status: "PUBLISHED" } },
          enrollments: true,
        },
      },
    },
  });

  return NextResponse.json({
    enrolled: domains,
    available: availableDomains.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      icon: d.icon,
      description: d.description,
      questionsAvailable: d._count.questions,
      totalStudents: d._count.enrollments,
    })),
  });
  } catch (error) {
    console.error("Domains API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}
