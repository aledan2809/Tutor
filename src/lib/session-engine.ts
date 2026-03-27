import { prisma } from "@/lib/prisma";
import type { Question } from "@prisma/client";

// ─── Session Type Definitions ───

export const SESSION_TYPES = {
  micro: { label: "Micro Session", duration: 2 * 60, questionCount: 5 },
  quick: { label: "Quick Session", duration: 10 * 60, questionCount: 15 },
  deep: { label: "Deep Session", duration: 20 * 60, questionCount: 30 },
  repair: { label: "Repair Session", duration: 15 * 60, questionCount: 20 },
  recovery: { label: "Recovery Session", duration: 10 * 60, questionCount: 15 },
  intensive: { label: "Intensive Session", duration: 20 * 60, questionCount: 30 },
} as const;

export type SessionType = keyof typeof SESSION_TYPES;

// ─── Recommend session type ───

export async function recommendSessionType(
  userId: string,
  domainId: string
): Promise<{ type: SessionType; reason: string }> {
  // Check for weak areas in this domain
  const weakAreas = await prisma.weakArea.findMany({
    where: { userId, domainId },
  });

  // Check last session date
  const lastSession = await prisma.session.findFirst({
    where: { userId, domainId },
    orderBy: { startedAt: "desc" },
  });

  const now = new Date();

  // Check if there's an exam within 14 days (from examSimulations)
  const upcomingExam = await prisma.examSimulation.findFirst({
    where: { domainId, isActive: true },
  });

  // Recovery: missed 2+ days
  if (lastSession) {
    const daysSince = Math.floor(
      (now.getTime() - lastSession.startedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 2) {
      return { type: "recovery", reason: `${daysSince} days since last session` };
    }
  }

  // Intensive: exam proximity (check format JSON for exam date)
  if (upcomingExam?.format) {
    const fmt = upcomingExam.format as Record<string, unknown>;
    if (fmt.examDate) {
      const examDate = new Date(fmt.examDate as string);
      const daysUntilExam = Math.floor(
        (examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExam <= 14 && daysUntilExam > 0) {
        return { type: "intensive", reason: `Exam in ${daysUntilExam} days` };
      }
    }
  }

  // Repair: has weak areas
  if (weakAreas.length > 0) {
    return { type: "repair", reason: `${weakAreas.length} weak area(s) detected` };
  }

  // Default: quick session
  return { type: "quick", reason: "Regular practice" };
}

// ─── Select questions for a session ───

export async function selectQuestions(
  userId: string,
  domainId: string,
  sessionType: SessionType,
  count: number
): Promise<Question[]> {
  if (sessionType === "repair") {
    return selectRepairQuestions(userId, domainId, count);
  }

  if (sessionType === "recovery") {
    return selectRecoveryQuestions(userId, domainId, count);
  }

  return selectAdaptiveQuestions(userId, domainId, count);
}

async function selectAdaptiveQuestions(
  userId: string,
  domainId: string,
  count: number
): Promise<Question[]> {
  // Get user progress to find due reviews for this domain
  const dueProgress = await prisma.progress.findMany({
    where: {
      userId,
      domainId,
      nextReview: { lte: new Date() },
    },
    orderBy: { nextReview: "asc" },
  });

  const dueTopics = dueProgress.map((p) => ({
    subject: p.subject,
    topic: p.topic,
    difficulty: Math.round(p.easeFactor),
  }));

  // Fetch due review questions first (60% of session)
  const reviewQuestions: Question[] = [];
  for (const dt of dueTopics) {
    if (reviewQuestions.length >= Math.ceil(count * 0.6)) break;
    const q = await prisma.question.findFirst({
      where: {
        domainId,
        subject: dt.subject,
        topic: dt.topic,
        status: "PUBLISHED",
        id: { notIn: reviewQuestions.map((rq) => rq.id) },
      },
    });
    if (q) reviewQuestions.push(q);
  }

  // Fill remaining with new/random questions
  const remaining = count - reviewQuestions.length;
  const existingIds = reviewQuestions.map((q) => q.id);

  const newQuestions = await prisma.question.findMany({
    where: {
      domainId,
      status: "PUBLISHED",
      id: { notIn: existingIds },
    },
    take: remaining,
    orderBy: { createdAt: "desc" },
  });

  const allQuestions = [...reviewQuestions, ...newQuestions];
  return shuffle(allQuestions);
}

async function selectRepairQuestions(
  userId: string,
  domainId: string,
  count: number
): Promise<Question[]> {
  const weakAreas = await prisma.weakArea.findMany({
    where: { userId, domainId },
    orderBy: { errorRate: "desc" },
  });

  const questions: Question[] = [];
  for (const wa of weakAreas) {
    if (questions.length >= count) break;
    const topicQuestions = await prisma.question.findMany({
      where: {
        domainId,
        subject: wa.subject,
        topic: wa.topic,
        status: "PUBLISHED",
        id: { notIn: questions.map((q) => q.id) },
      },
      take: Math.ceil(count / Math.max(weakAreas.length, 1)),
    });
    questions.push(...topicQuestions);
  }

  // If not enough weak area questions, fill with general
  if (questions.length < count) {
    const fill = await prisma.question.findMany({
      where: {
        domainId,
        status: "PUBLISHED",
        id: { notIn: questions.map((q) => q.id) },
      },
      take: count - questions.length,
    });
    questions.push(...fill);
  }

  return shuffle(questions.slice(0, count));
}

async function selectRecoveryQuestions(
  userId: string,
  domainId: string,
  count: number
): Promise<Question[]> {
  // For recovery: mix of easy questions + overdue reviews
  const overdueProgress = await prisma.progress.findMany({
    where: {
      userId,
      domainId,
      nextReview: { lte: new Date() },
    },
    orderBy: { nextReview: "asc" },
    take: Math.ceil(count * 0.5),
  });

  const questions: Question[] = [];

  // Add overdue review questions
  for (const p of overdueProgress) {
    if (questions.length >= Math.ceil(count * 0.5)) break;
    const q = await prisma.question.findFirst({
      where: {
        domainId,
        subject: p.subject,
        topic: p.topic,
        status: "PUBLISHED",
        difficulty: { lte: 3 },
        id: { notIn: questions.map((rq) => rq.id) },
      },
    });
    if (q) questions.push(q);
  }

  // Fill with easy questions
  const remaining = count - questions.length;
  const easyQuestions = await prisma.question.findMany({
    where: {
      domainId,
      status: "PUBLISHED",
      difficulty: { lte: 2 },
      id: { notIn: questions.map((q) => q.id) },
    },
    take: remaining,
  });
  questions.push(...easyQuestions);

  // Still not enough? Get any published questions
  if (questions.length < count) {
    const fill = await prisma.question.findMany({
      where: {
        domainId,
        status: "PUBLISHED",
        id: { notIn: questions.map((q) => q.id) },
      },
      take: count - questions.length,
    });
    questions.push(...fill);
  }

  return shuffle(questions.slice(0, count));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Weak areas detection ───

export async function updateWeakAreas(userId: string, domainId: string): Promise<void> {
  const progressRecords = await prisma.progress.findMany({
    where: { userId, domainId },
  });

  for (const p of progressRecords) {
    const accuracy =
      p.totalAttempts > 0 ? p.correctAttempts / p.totalAttempts : 0;

    if (p.totalAttempts >= 5 && accuracy < 0.6) {
      // Upsert weak area
      await prisma.weakArea.upsert({
        where: {
          userId_domainId_subject_topic: {
            userId,
            domainId,
            subject: p.subject,
            topic: p.topic,
          },
        },
        update: {
          errorRate: 1 - accuracy,
          updatedAt: new Date(),
        },
        create: {
          userId,
          domainId,
          subject: p.subject,
          topic: p.topic,
          errorRate: 1 - accuracy,
        },
      });
    } else {
      // Remove from weak areas if improved
      await prisma.weakArea.deleteMany({
        where: {
          userId,
          domainId,
          subject: p.subject,
          topic: p.topic,
        },
      });
    }
  }
}
