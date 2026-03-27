import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ─── XP Constants ───

export const XP_REWARDS = {
  CORRECT_ANSWER: 10,
  FAST_ANSWER_BONUS: 5, // < 5 seconds
  SESSION_COMPLETE: 50,
  PERFECT_SCORE: 100,
  DAILY_CHALLENGE_MULTIPLIER: 2,
} as const;

const FAST_ANSWER_THRESHOLD_MS = 5000;

// ─── Default Level Thresholds ───

const DEFAULT_LEVELS = [
  { name: "Cadet", minXp: 0, rank: 1 },
  { name: "Co-pilot", minXp: 500, rank: 2 },
  { name: "Captain", minXp: 2000, rank: 3 },
  { name: "Instructor", minXp: 5000, rank: 4 },
] as const;

// ─── Achievement Definitions ───

export interface AchievementDef {
  slug: string;
  name: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { slug: "first_blood", name: "First Blood", description: "Complete your first session" },
  { slug: "perfect_score", name: "Perfect Score", description: "Score 100% on a quiz" },
  { slug: "marathon_7", name: "Marathon", description: "Maintain a 7-day streak" },
  { slug: "exam_ready", name: "Exam Ready", description: "Score 90%+ across all topics" },
  { slug: "speed_demon", name: "Speed Demon", description: "Answer correctly in under 5 seconds" },
  { slug: "milestone_10", name: "10 Lessons", description: "Complete 10 sessions" },
  { slug: "milestone_50", name: "50 Lessons", description: "Complete 50 sessions" },
  { slug: "milestone_100", name: "100 Lessons", description: "Complete 100 sessions" },
];

// ─── Types ───

interface StoredAchievement {
  slug: string;
  unlockedAt: string;
}

interface XpEventResult {
  xpAwarded: number;
  newXp: number;
  level: string;
  levelUp: boolean;
  newAchievements: string[];
}

// ─── Helper: Get or create user gamification record ───

async function getOrCreateGamification(userId: string, domainId: string) {
  return prisma.userGamification.upsert({
    where: { userId_domainId: { userId, domainId } },
    update: {},
    create: { userId, domainId },
  });
}

// ─── Helper: Get level thresholds for a domain ───

async function getLevelThresholds(domainId: string) {
  const custom = await prisma.levelConfig.findMany({
    where: { domainId },
    orderBy: { rank: "asc" },
  });
  if (custom.length > 0) return custom;
  return DEFAULT_LEVELS as unknown as { name: string; minXp: number; rank: number }[];
}

// ─── Helper: Calculate level from XP ───

function calculateLevel(xp: number, levels: { name: string; minXp: number }[]): string {
  let current = levels[0]?.name ?? "Cadet";
  for (const lvl of levels) {
    if (xp >= lvl.minXp) current = lvl.name;
  }
  return current;
}

// ─── Award XP on correct answer ───

export async function awardAnswerXp(
  userId: string,
  domainId: string,
  isCorrect: boolean,
  timeSpentMs: number | null
): Promise<{ xpAwarded: number }> {
  if (!isCorrect) return { xpAwarded: 0 };

  let xp = XP_REWARDS.CORRECT_ANSWER;
  if (timeSpentMs !== null && timeSpentMs < FAST_ANSWER_THRESHOLD_MS) {
    xp += XP_REWARDS.FAST_ANSWER_BONUS;
  }

  const gam = await getOrCreateGamification(userId, domainId);

  await prisma.userGamification.update({
    where: { id: gam.id },
    data: { xp: { increment: xp } },
  });

  // Check speed demon achievement
  if (timeSpentMs !== null && timeSpentMs < FAST_ANSWER_THRESHOLD_MS) {
    await tryUnlockAchievement(userId, domainId, "speed_demon");
  }

  // Update weekly leaderboard
  await updateLeaderboard(userId, domainId, xp);

  return { xpAwarded: xp };
}

// ─── Award XP on session complete ───

export async function awardSessionCompleteXp(
  userId: string,
  domainId: string,
  score: number,
  totalQuestions: number
): Promise<XpEventResult> {
  const gam = await getOrCreateGamification(userId, domainId);
  const levels = await getLevelThresholds(domainId);
  const oldLevel = gam.level;

  let xp = XP_REWARDS.SESSION_COMPLETE;
  if (score === 100 && totalQuestions > 0) {
    xp += XP_REWARDS.PERFECT_SCORE;
  }

  const newXp = gam.xp + xp;
  const newLevel = calculateLevel(newXp, levels);

  // Update streak
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let newStreak = gam.streak;
  let longestStreak = gam.longestStreak;

  if (gam.lastActivityDate) {
    const lastDate = new Date(gam.lastActivityDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = gam.streak + 1;
    } else if (diffDays === 0) {
      // Same day, no change
    } else {
      // Missed days — streak decayed, start fresh
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  if (newStreak > longestStreak) {
    longestStreak = newStreak;
  }

  await prisma.userGamification.update({
    where: { id: gam.id },
    data: {
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      longestStreak,
      lastActivityDate: now,
    },
  });

  // Update leaderboard
  await updateLeaderboard(userId, domainId, xp);

  // Check achievements
  const newAchievements: string[] = [];

  // First Blood
  if (await tryUnlockAchievement(userId, domainId, "first_blood")) {
    newAchievements.push("first_blood");
  }

  // Perfect Score
  if (score === 100 && totalQuestions > 0) {
    if (await tryUnlockAchievement(userId, domainId, "perfect_score")) {
      newAchievements.push("perfect_score");
    }
  }

  // Marathon (7-day streak)
  if (newStreak >= 7) {
    if (await tryUnlockAchievement(userId, domainId, "marathon_7")) {
      newAchievements.push("marathon_7");
    }
  }

  // Session milestones
  const sessionCount = await prisma.session.count({
    where: { userId, domainId, endedAt: { not: null } },
  });
  for (const milestone of [10, 50, 100]) {
    if (sessionCount >= milestone) {
      const slug = `milestone_${milestone}`;
      if (await tryUnlockAchievement(userId, domainId, slug)) {
        newAchievements.push(slug);
      }
    }
  }

  // Exam Ready (90%+ all topics)
  await checkExamReady(userId, domainId, newAchievements);

  return {
    xpAwarded: xp,
    newXp,
    level: newLevel,
    levelUp: newLevel !== oldLevel,
    newAchievements,
  };
}

// ─── Streak recovery session ───

export async function recoverStreak(
  userId: string,
  domainId: string
): Promise<{ success: boolean; streak: number }> {
  const gam = await getOrCreateGamification(userId, domainId);

  if (!gam.lastActivityDate) {
    return { success: false, streak: 0 };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = new Date(gam.lastActivityDate);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

  // Only allow recovery if streak decayed (missed 1-3 days)
  if (diffDays <= 1 || diffDays > 3) {
    return { success: false, streak: gam.streak };
  }

  // Restore streak (minus 1 as penalty)
  const restoredStreak = Math.max(gam.streak - 1, 1);

  await prisma.userGamification.update({
    where: { id: gam.id },
    data: {
      streak: restoredStreak,
      lastActivityDate: now,
    },
  });

  return { success: true, streak: restoredStreak };
}

// ─── Get XP and level info ───

export async function getXpInfo(userId: string, domainId: string) {
  const gam = await getOrCreateGamification(userId, domainId);
  const levels = await getLevelThresholds(domainId);

  const currentLevelIdx = levels.findIndex((l) => l.name === gam.level);
  const nextLevel = levels[currentLevelIdx + 1];

  const currentLevelMinXp = levels[currentLevelIdx]?.minXp ?? 0;
  const nextLevelMinXp = nextLevel?.minXp ?? null;

  let progressToNext = 100;
  if (nextLevelMinXp !== null) {
    const range = nextLevelMinXp - currentLevelMinXp;
    const progress = gam.xp - currentLevelMinXp;
    progressToNext = Math.min(Math.round((progress / range) * 100), 100);
  }

  return {
    xp: gam.xp,
    level: gam.level,
    progressToNext,
    nextLevel: nextLevel?.name ?? null,
    xpToNextLevel: nextLevelMinXp !== null ? nextLevelMinXp - gam.xp : 0,
  };
}

// ─── Get streak info ───

export async function getStreakInfo(userId: string, domainId: string) {
  const gam = await getOrCreateGamification(userId, domainId);

  let isDecayed = false;
  if (gam.lastActivityDate) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDate = new Date(gam.lastActivityDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
    isDecayed = diffDays > 1;
  }

  return {
    streak: gam.streak,
    longestStreak: gam.longestStreak,
    lastUpdate: gam.lastActivityDate?.toISOString() ?? null,
    isDecayed,
    canRecover: isDecayed && gam.lastActivityDate !== null &&
      Math.floor((Date.now() - new Date(gam.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)) <= 3,
  };
}

// ─── Get achievements ───

export async function getAchievements(userId: string, domainId: string) {
  const gam = await getOrCreateGamification(userId, domainId);
  const stored = gam.achievements as unknown as StoredAchievement[];

  return stored.map((a) => {
    const def = ACHIEVEMENTS.find((d) => d.slug === a.slug);
    return {
      slug: a.slug,
      name: def?.name ?? a.slug,
      description: def?.description ?? "",
      unlockedAt: a.unlockedAt,
    };
  });
}

// ─── Leaderboard ───

export async function getLeaderboard(userId: string, domainId: string) {
  const now = new Date();
  const week = getISOWeek(now);
  const year = now.getFullYear();

  // Find user's group (first enrollment group or domain-wide)
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_domainId: { userId, domainId } },
  });
  const groupId = enrollment?.id ?? domainId;

  const entries = await prisma.leaderboardEntry.findMany({
    where: { domainId, groupId, week, year },
    orderBy: { xp: "desc" },
    take: 20,
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  const userRank = entries.findIndex((e) => e.userId === userId) + 1;
  const userEntry = entries.find((e) => e.userId === userId);

  return {
    rank: userRank || null,
    userXp: userEntry?.xp ?? 0,
    top10: entries.slice(0, 10).map((e, idx) => ({
      rank: idx + 1,
      userId: e.userId,
      name: e.user.name,
      image: e.user.image,
      xp: e.xp,
    })),
    week,
    year,
  };
}

async function updateLeaderboard(userId: string, domainId: string, xpToAdd: number) {
  const now = new Date();
  const week = getISOWeek(now);
  const year = now.getFullYear();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_domainId: { userId, domainId } },
  });
  const groupId = enrollment?.id ?? domainId;

  await prisma.leaderboardEntry.upsert({
    where: {
      userId_domainId_groupId_week_year: { userId, domainId, groupId, week, year },
    },
    update: { xp: { increment: xpToAdd } },
    create: { userId, domainId, groupId, xp: xpToAdd, week, year },
  });
}

// ─── Daily Challenge ───

export async function getDailyChallenge(domainId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let challenge = await prisma.dailyChallenge.findUnique({
    where: { domainId_date: { domainId, date: today } },
    include: { question: true },
  });

  if (!challenge) {
    // Pick a hard question (difficulty >= 4)
    const question = await prisma.question.findFirst({
      where: { domainId, status: "PUBLISHED", difficulty: { gte: 4 } },
      orderBy: { createdAt: "desc" },
    });

    if (!question) return null;

    challenge = await prisma.dailyChallenge.create({
      data: { domainId, questionId: question.id, date: today },
      include: { question: true },
    });
  }

  return challenge;
}

export async function submitDailyChallenge(
  userId: string,
  domainId: string,
  answer: string
): Promise<{ correct: boolean; xpAwarded: number; alreadyAttempted: boolean }> {
  const challenge = await getDailyChallenge(domainId);
  if (!challenge) return { correct: false, xpAwarded: 0, alreadyAttempted: false };

  // Check if already attempted
  const existing = await prisma.dailyChallengeAttempt.findUnique({
    where: { dailyChallengeId_userId: { dailyChallengeId: challenge.id, userId } },
  });
  if (existing) {
    return { correct: existing.isCorrect, xpAwarded: 0, alreadyAttempted: true };
  }

  const question = challenge.question;
  const isCorrect = checkDailyChallengeAnswer(question, answer);
  const xpAwarded = isCorrect ? XP_REWARDS.CORRECT_ANSWER * XP_REWARDS.DAILY_CHALLENGE_MULTIPLIER : 0;

  await prisma.dailyChallengeAttempt.create({
    data: {
      dailyChallengeId: challenge.id,
      userId,
      answer,
      isCorrect,
      xpAwarded,
    },
  });

  if (xpAwarded > 0) {
    const gam = await getOrCreateGamification(userId, domainId);
    await prisma.userGamification.update({
      where: { id: gam.id },
      data: { xp: { increment: xpAwarded } },
    });
    await updateLeaderboard(userId, domainId, xpAwarded);
  }

  return { correct: isCorrect, xpAwarded, alreadyAttempted: false };
}

function checkDailyChallengeAnswer(
  question: { type: string; correctAnswer: string },
  answer: string
): boolean {
  if (question.type === "MULTIPLE_CHOICE") {
    return answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
  }
  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
  return normalize(answer) === normalize(question.correctAnswer);
}

// ─── Achievement helpers ───

async function tryUnlockAchievement(
  userId: string,
  domainId: string,
  slug: string
): Promise<boolean> {
  const gam = await prisma.userGamification.findUnique({
    where: { userId_domainId: { userId, domainId } },
  });
  if (!gam) return false;

  const achievements = gam.achievements as unknown as StoredAchievement[];
  if (achievements.some((a) => a.slug === slug)) return false;

  achievements.push({ slug, unlockedAt: new Date().toISOString() });

  await prisma.userGamification.update({
    where: { id: gam.id },
    data: { achievements: achievements as unknown as Prisma.InputJsonValue },
  });

  return true;
}

async function checkExamReady(userId: string, domainId: string, newAchievements: string[]) {
  const progressRecords = await prisma.progress.findMany({
    where: { userId, domainId },
  });

  if (progressRecords.length === 0) return;

  const allAbove90 = progressRecords.every(
    (p) => p.totalAttempts >= 5 && (p.correctAttempts / p.totalAttempts) >= 0.9
  );

  if (allAbove90) {
    if (await tryUnlockAchievement(userId, domainId, "exam_ready")) {
      newAchievements.push("exam_ready");
    }
  }
}

// ─── Utility ───

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
