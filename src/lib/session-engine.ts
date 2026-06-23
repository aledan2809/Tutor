import { prisma } from "@/lib/prisma";
import { Prisma, type Question } from "@prisma/client";

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

// ─── Per-question time norm (official EN VIII reference: 120 min / 18 items) ───
// For the Grile (Capacitate) bank the session timer is the SUM of per-question
// estimates rather than a flat session duration. Calibration (section-independent
// signals so it survives the move of Question.topic from exam section → capitol):
//   • Limba română (language grile)            → 3 min   (by subject)
//   • Geometry items (figure OR geo capitol)   → 6 min   (≈ Subiectul al II-lea)
//   • Other Matematică / default               → 4 min   (≈ Subiectul I)
export function estimateQuestionSeconds(q: {
  topic?: string | null;
  subject?: string | null;
  imageUrl?: string | null;
}): number {
  const topic = (q.topic || "").toLowerCase();
  const subject = (q.subject || "").toLowerCase();
  if (/român|romana/.test(subject)) return 3 * 60;
  if (q.imageUrl || /geometrie/.test(topic)) return 6 * 60;
  return 4 * 60;
}

// True when the selected questions are official exam-bank grile — only then do we
// use the official per-question norm; other domains (e.g. aviation) keep their flat
// session-type duration. Detected via the exam-bank source tag (robust) or a figure.
export function isExamGrileSet(
  questions: Array<{ sourceReference?: string | null; imageUrl?: string | null }>
): boolean {
  return questions.some(
    (q) => q.imageUrl || (q.sourceReference || "").startsWith("exam-bank:")
  );
}

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

// Don't re-serve questions the student answered in the last N days — the main
// cause of "same questions every session". Relaxed automatically when the pool
// is too small to fill a session (top-up below), so a session is never short.
const RECENT_DAYS = 10;

async function recentlyAttemptedIds(
  userId: string,
  domainId: string,
  days: number
): Promise<Set<string>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.attempt.findMany({
    where: { userId, createdAt: { gte: since }, question: { domainId } },
    select: { questionId: true },
    distinct: ["questionId"],
  });
  return new Set(rows.map((r) => r.questionId));
}

/**
 * Pick up to `count` PUBLISHED questions in the domain, excluding `exclude`,
 * chosen at RANDOM (not by createdAt — that returned the same newest questions
 * every time). Fetches candidate ids only, shuffles, then loads the chosen rows.
 */
async function pickRandom(
  domainId: string,
  count: number,
  exclude: Set<string>,
  extra: Prisma.QuestionWhereInput = {}
): Promise<Question[]> {
  if (count <= 0) return [];
  const ids = await prisma.question.findMany({
    where: { domainId, status: "PUBLISHED", ...extra, id: { notIn: [...exclude] } },
    select: { id: true },
  });
  const chosen = shuffle(ids.map((x) => x.id)).slice(0, count);
  if (chosen.length === 0) return [];
  const rows = await prisma.question.findMany({ where: { id: { in: chosen } } });
  return shuffle(rows);
}

export async function selectQuestions(
  userId: string,
  domainId: string,
  sessionType: SessionType,
  count: number
): Promise<Question[]> {
  const recent = await recentlyAttemptedIds(userId, domainId, RECENT_DAYS);

  let questions: Question[];
  if (sessionType === "repair") {
    questions = await selectRepairQuestions(userId, domainId, count, recent);
  } else if (sessionType === "recovery") {
    questions = await selectRecoveryQuestions(userId, domainId, count, recent);
  } else {
    questions = await selectAdaptiveQuestions(userId, domainId, count, recent);
  }

  // Top-up: if excluding recents left the session short (small question bank),
  // backfill ignoring the recency filter so the session is never under-filled.
  if (questions.length < count) {
    const have = new Set(questions.map((q) => q.id));
    const topUp = await pickRandom(domainId, count - questions.length, have);
    questions = [...questions, ...topUp];
  }

  return questions.slice(0, count);
}

async function selectAdaptiveQuestions(
  userId: string,
  domainId: string,
  count: number,
  exclude: Set<string>
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

  // Fetch due review questions first (60% of session), skipping recents.
  const reviewQuestions: Question[] = [];
  for (const dt of dueTopics) {
    if (reviewQuestions.length >= Math.ceil(count * 0.6)) break;
    const q = await prisma.question.findFirst({
      where: {
        domainId,
        subject: dt.subject,
        topic: dt.topic,
        status: "PUBLISHED",
        id: { notIn: [...reviewQuestions.map((rq) => rq.id), ...exclude] },
      },
    });
    if (q) reviewQuestions.push(q);
  }

  // Fill remaining with random fresh questions (not recently seen).
  const remaining = count - reviewQuestions.length;
  const existing = new Set([...reviewQuestions.map((q) => q.id), ...exclude]);
  const newQuestions = await pickRandom(domainId, remaining, existing);

  return shuffle([...reviewQuestions, ...newQuestions]);
}

async function selectRepairQuestions(
  userId: string,
  domainId: string,
  count: number,
  exclude: Set<string>
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
        id: { notIn: [...questions.map((q) => q.id), ...exclude] },
      },
      take: Math.ceil(count / Math.max(weakAreas.length, 1)),
    });
    questions.push(...topicQuestions);
  }

  // If not enough weak-area questions, fill with random fresh ones.
  if (questions.length < count) {
    const fill = await pickRandom(
      domainId,
      count - questions.length,
      new Set([...questions.map((q) => q.id), ...exclude])
    );
    questions.push(...fill);
  }

  return shuffle(questions.slice(0, count));
}

async function selectRecoveryQuestions(
  userId: string,
  domainId: string,
  count: number,
  exclude: Set<string>
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

  // Add overdue review questions (skipping recents).
  for (const p of overdueProgress) {
    if (questions.length >= Math.ceil(count * 0.5)) break;
    const q = await prisma.question.findFirst({
      where: {
        domainId,
        subject: p.subject,
        topic: p.topic,
        status: "PUBLISHED",
        difficulty: { lte: 3 },
        id: { notIn: [...questions.map((rq) => rq.id), ...exclude] },
      },
    });
    if (q) questions.push(q);
  }

  // Fill with random easy questions (not recently seen).
  const easy = await pickRandom(
    domainId,
    count - questions.length,
    new Set([...questions.map((q) => q.id), ...exclude]),
    { difficulty: { lte: 2 } }
  );
  questions.push(...easy);

  // Still not enough? Any fresh published questions.
  if (questions.length < count) {
    const fill = await pickRandom(
      domainId,
      count - questions.length,
      new Set([...questions.map((q) => q.id), ...exclude])
    );
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
