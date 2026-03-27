import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recommendSessionType } from "@/lib/session-engine";
import { getXpInfo, getStreakInfo } from "@/lib/gamification";
import { z } from "zod";

const dashboardQuerySchema = z.object({
  domainId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = dashboardQuerySchema.safeParse({
    domainId: searchParams.get("domainId") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const domainId = parsed.data.domainId;

  try {
  // Get enrollments with domain info
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, isActive: true },
    include: { domain: true },
  });

  if (enrollments.length === 0) {
    return NextResponse.json({
      streak: { current: 0, longest: 0, isDecayed: false, canRecover: false },
      xp: { total: 0, level: "Cadet", progressToNext: 0, nextLevel: null, xpToNextLevel: 0 },
      domains: [],
      recentSessions: [],
      weakAreas: [],
      recommendation: null,
    });
  }

  const activeDomainId = domainId || enrollments[0]?.domainId;

  // Use gamification system for XP and streak
  const [xpInfo, streakInfo] = await Promise.all([
    activeDomainId ? getXpInfo(userId, activeDomainId) : null,
    activeDomainId ? getStreakInfo(userId, activeDomainId) : null,
  ]);

  // Per-domain progress
  const domainProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const progress = await prisma.progress.findMany({
        where: { userId },
      });

      // Filter progress entries that belong to this domain by matching questions
      const domainQuestions = await prisma.question.findMany({
        where: { domainId: enrollment.domainId, status: "PUBLISHED" },
        select: { subject: true, topic: true },
      });
      const domainTopicKeys = new Set(
        domainQuestions.map((q) => `${q.subject}:${q.topic}`)
      );
      const domainProgress = progress.filter((p) =>
        domainTopicKeys.has(`${p.subject}:${p.topic}`)
      );

      const domainSessions = await prisma.session.findMany({
        where: { userId, domainId: enrollment.domainId, endedAt: { not: null } },
        select: { score: true },
      });

      const domainAttempts = domainProgress.reduce((s, p) => s + p.totalAttempts, 0);
      const domainCorrect = domainProgress.reduce((s, p) => s + p.correctAttempts, 0);

      // Get gamification data for this domain
      const gam = await prisma.userGamification.findUnique({
        where: { userId_domainId: { userId, domainId: enrollment.domainId } },
      });

      return {
        domainId: enrollment.domainId,
        domainName: enrollment.domain.name,
        domainSlug: enrollment.domain.slug,
        domainIcon: enrollment.domain.icon,
        roles: enrollment.roles,
        xp: gam?.xp ?? 0,
        level: gam?.level ?? "Cadet",
        streak: gam?.streak ?? 0,
        accuracy: domainAttempts > 0 ? Math.round((domainCorrect / domainAttempts) * 100) : 0,
        sessionsCompleted: domainSessions.length,
        topicsStudied: domainProgress.length,
      };
    })
  );

  // Recent sessions (last 10)
  const recentSessions = await prisma.session.findMany({
    where: {
      userId,
      endedAt: { not: null },
      ...(domainId ? { domainId } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 10,
    include: {
      _count: { select: { attempts: true } },
    },
  });

  // Weak areas
  const weakAreas = await prisma.weakArea.findMany({
    where: { userId },
    orderBy: { errorRate: "desc" },
    take: 5,
  });

  // Recommendation for active domain
  let recommendation = null;
  if (activeDomainId) {
    recommendation = await recommendSessionType(userId, activeDomainId);
  }

  return NextResponse.json({
    streak: streakInfo
      ? {
          current: streakInfo.streak,
          longest: streakInfo.longestStreak,
          isDecayed: streakInfo.isDecayed,
          canRecover: streakInfo.canRecover,
          lastUpdate: streakInfo.lastUpdate,
        }
      : { current: 0, longest: 0, isDecayed: false, canRecover: false },
    xp: xpInfo
      ? {
          total: xpInfo.xp,
          level: xpInfo.level,
          progressToNext: xpInfo.progressToNext,
          nextLevel: xpInfo.nextLevel,
          xpToNextLevel: xpInfo.xpToNextLevel,
        }
      : { total: 0, level: "Cadet", progressToNext: 0, nextLevel: null, xpToNextLevel: 0 },
    domains: domainProgress,
    recentSessions: recentSessions.map((s) => ({
      id: s.id,
      type: s.type,
      domainId: s.domainId,
      score: s.score !== null ? Math.round(s.score) : null,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      questionsAnswered: s._count.attempts,
    })),
    weakAreas: weakAreas.map((w) => ({
      subject: w.subject,
      topic: w.topic,
      errorRate: Math.round(w.errorRate * 100),
      suggestion: w.suggestion,
    })),
    recommendation,
  });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
