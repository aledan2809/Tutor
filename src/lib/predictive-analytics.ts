import { prisma } from "@/lib/prisma";

interface PredictiveResult {
  studentId: string;
  domainId: string;
  failureProbability: number; // 0-100
  trend: "improving" | "declining" | "stable";
  factors: string[];
  recommendation: string;
}

export async function predictFailureRisk(
  studentId: string,
  domainId: string
): Promise<PredictiveResult> {
  const [progress, sessions, weakAreas, gamification, examSessions] =
    await Promise.all([
      prisma.progress.findMany({ where: { userId: studentId, domainId } }),
      prisma.session.findMany({
        where: { userId: studentId, domainId, endedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 20,
        select: { score: true, startedAt: true },
      }),
      prisma.weakArea.findMany({
        where: { userId: studentId, domainId },
        orderBy: { errorRate: "desc" },
      }),
      prisma.userGamification.findFirst({
        where: { userId: studentId, domainId },
      }),
      prisma.examSession.findMany({
        where: { userId: studentId, domainId, status: "COMPLETED" },
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: { score: true, passed: true, submittedAt: true },
      }),
    ]);

  const factors: string[] = [];
  let riskScore = 50; // baseline

  // Factor 1: Recent session scores trend
  if (sessions.length >= 3) {
    const recentScores = sessions.slice(0, 5).map((s) => s.score ?? 0);
    const olderScores = sessions.slice(5, 10).map((s) => s.score ?? 0);
    const recentAvg =
      recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.length
      ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
      : recentAvg;

    if (recentAvg < olderAvg - 10) {
      riskScore += 15;
      factors.push("Declining session scores");
    } else if (recentAvg > olderAvg + 10) {
      riskScore -= 15;
      factors.push("Improving session scores");
    }
  } else {
    riskScore += 10;
    factors.push("Insufficient session data");
  }

  // Factor 2: Weak areas count
  const highErrorAreas = weakAreas.filter((w) => w.errorRate > 0.5);
  if (highErrorAreas.length > 5) {
    riskScore += 15;
    factors.push(`${highErrorAreas.length} topics with >50% error rate`);
  } else if (highErrorAreas.length > 2) {
    riskScore += 8;
    factors.push(`${highErrorAreas.length} weak topics`);
  }

  // Factor 3: Streak / activity
  if (gamification) {
    if (gamification.streak === 0) {
      riskScore += 12;
      factors.push("Broken streak (inactive)");
    } else if (gamification.streak < 3) {
      riskScore += 5;
      factors.push("Low activity streak");
    } else if (gamification.streak >= 7) {
      riskScore -= 10;
      factors.push("Strong daily streak");
    }
  } else {
    riskScore += 15;
    factors.push("No gamification data");
  }

  // Factor 4: Exam history
  if (examSessions.length > 0) {
    const failedExams = examSessions.filter((e) => !e.passed);
    if (failedExams.length > examSessions.length / 2) {
      riskScore += 15;
      factors.push(
        `Failed ${failedExams.length}/${examSessions.length} recent exams`
      );
    }
    const lastExam = examSessions[0];
    if (lastExam.score !== null && lastExam.score < 60) {
      riskScore += 10;
      factors.push(`Last exam score: ${Math.round(lastExam.score)}%`);
    }
  }

  // Factor 5: Mastery levels
  const avgMastery =
    progress.length > 0
      ? progress.reduce((a, b) => a + b.masteryLevel, 0) / progress.length
      : 0;
  if (avgMastery < 0.3) {
    riskScore += 10;
    factors.push("Low overall mastery");
  } else if (avgMastery > 0.7) {
    riskScore -= 10;
    factors.push("High overall mastery");
  }

  // Factor 6: Session frequency (days since last session)
  if (sessions.length > 0) {
    const daysSinceLastSession = Math.floor(
      (Date.now() - new Date(sessions[0].startedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastSession > 7) {
      riskScore += 12;
      factors.push(`${daysSinceLastSession} days since last session`);
    } else if (daysSinceLastSession > 3) {
      riskScore += 5;
      factors.push(`${daysSinceLastSession} days since last session`);
    }
  }

  // Clamp to 0-100
  const failureProbability = Math.max(0, Math.min(100, riskScore));

  // Determine trend
  let trend: PredictiveResult["trend"] = "stable";
  if (sessions.length >= 6) {
    const recent = sessions.slice(0, 3).map((s) => s.score ?? 0);
    const older = sessions.slice(3, 6).map((s) => s.score ?? 0);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg > olderAvg + 5) trend = "improving";
    else if (recentAvg < olderAvg - 5) trend = "declining";
  }

  // Generate recommendation
  let recommendation = "Continue current study plan.";
  if (failureProbability > 70) {
    recommendation =
      "Immediate intervention needed. Consider intensive review sessions and 1-on-1 support.";
  } else if (failureProbability > 50) {
    recommendation =
      "At risk. Increase study frequency and focus on weak areas.";
  } else if (failureProbability > 30) {
    recommendation =
      "Monitor closely. Encourage consistent daily practice.";
  }

  return {
    studentId,
    domainId,
    failureProbability,
    trend,
    factors,
    recommendation,
  };
}

export async function getStudentProgressSummary(
  studentId: string,
  domainId?: string
) {
  const [sessions, progress, weakAreas, gamification, examSessions] =
    await Promise.all([
      prisma.session.findMany({
        where: { userId: studentId, ...(domainId ? { domainId } : {}), endedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 20,
        include: { _count: { select: { attempts: true } } },
      }),
      prisma.progress.findMany({ where: { userId: studentId, ...(domainId ? { domainId } : {}) } }),
      prisma.weakArea.findMany({
        where: { userId: studentId, ...(domainId ? { domainId } : {}) },
        orderBy: { errorRate: "desc" },
        take: 10,
      }),
      prisma.userGamification.findMany({
        where: { userId: studentId, ...(domainId ? { domainId } : {}) },
      }),
      prisma.examSession.findMany({
        where: { userId: studentId, ...(domainId ? { domainId } : {}), status: "COMPLETED" },
        orderBy: { submittedAt: "desc" },
        take: 10,
        select: { score: true, passed: true, submittedAt: true, domainId: true },
      }),
    ]);

  const totalAttempts = progress.reduce((s, p) => s + p.totalAttempts, 0);
  const correctAttempts = progress.reduce((s, p) => s + p.correctAttempts, 0);
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  const totalXp = gamification.reduce((s, g) => s + g.xp, 0);
  const currentStreak = gamification.length > 0 ? Math.max(...gamification.map((g) => g.streak)) : 0;
  const longestStreak = gamification.length > 0 ? Math.max(...gamification.map((g) => g.longestStreak)) : 0;

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      type: s.type,
      domainId: s.domainId,
      score: s.score !== null ? Math.round(s.score) : null,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      questionsAnswered: s._count.attempts,
    })),
    progress: {
      totalAttempts,
      correctAttempts,
      accuracy,
      topicsStudied: progress.length,
    },
    weakAreas: weakAreas.map((w) => ({
      subject: w.subject,
      topic: w.topic,
      errorRate: Math.round(w.errorRate * 100),
      suggestion: w.suggestion,
    })),
    gamification: {
      totalXp,
      currentStreak,
      longestStreak,
      level: gamification[0]?.level ?? "Cadet",
    },
    examHistory: examSessions.map((e) => ({
      score: e.score !== null ? Math.round(e.score) : null,
      passed: e.passed,
      submittedAt: e.submittedAt,
      domainId: e.domainId,
    })),
  };
}
