import { prisma } from "@/lib/prisma";
import type { Question } from "@prisma/client";

// ─── Types ───

interface ExamFormatConfig {
  questionTypes?: Record<string, number>; // e.g. { "MULTIPLE_CHOICE": 70, "OPEN": 30 }
  sections?: { name: string; weight: number; subject?: string; topic?: string }[];
}

interface ExamAnswer {
  questionId: string;
  answer: string;
}

interface TopicResult {
  correct: number;
  total: number;
}

export interface ExamResults {
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  score: number; // 0-100
  timeTaken: number; // minutes
  topics: Record<string, TopicResult>;
  passed: boolean;
}

// ─── Select questions for exam ───

export async function selectExamQuestions(
  domainId: string,
  questionCount: number,
  format: ExamFormatConfig
): Promise<Question[]> {
  const questions: Question[] = [];
  const usedIds: string[] = [];

  // If sections defined, pick proportionally
  if (format.sections && format.sections.length > 0) {
    for (const section of format.sections) {
      const sectionCount = Math.round(questionCount * (section.weight || 1 / format.sections.length));
      const where: Record<string, unknown> = {
        domainId,
        status: "PUBLISHED",
        id: { notIn: usedIds },
      };
      if (section.subject) where.subject = section.subject;
      if (section.topic) where.topic = section.topic;

      const sectionQuestions = await prisma.question.findMany({
        where,
        take: sectionCount,
        orderBy: { createdAt: "desc" },
      });

      for (const q of sectionQuestions) {
        questions.push(q);
        usedIds.push(q.id);
      }
    }
  }

  // If question types defined, pick proportionally by type
  if (format.questionTypes && Object.keys(format.questionTypes).length > 0) {
    const remaining = questionCount - questions.length;
    if (remaining > 0) {
      const typeEntries = Object.entries(format.questionTypes);
      const totalWeight = typeEntries.reduce((sum, [, w]) => sum + w, 0);

      for (const [typeName, weight] of typeEntries) {
        const typeCount = Math.round((weight / totalWeight) * remaining);
        const dbType = typeName === "MCQ" ? "MULTIPLE_CHOICE" : typeName;

        const typeQuestions = await prisma.question.findMany({
          where: {
            domainId,
            status: "PUBLISHED",
            type: dbType as "MULTIPLE_CHOICE" | "OPEN",
            id: { notIn: usedIds },
          },
          take: typeCount,
          orderBy: { createdAt: "desc" },
        });

        for (const q of typeQuestions) {
          questions.push(q);
          usedIds.push(q.id);
        }
      }
    }
  }

  // Fill remaining if needed
  const stillNeeded = questionCount - questions.length;
  if (stillNeeded > 0) {
    const fill = await prisma.question.findMany({
      where: {
        domainId,
        status: "PUBLISHED",
        id: { notIn: usedIds },
      },
      take: stillNeeded,
      orderBy: { createdAt: "desc" },
    });
    questions.push(...fill);
  }

  return shuffle(questions).slice(0, questionCount);
}

// ─── Score exam ───

export async function scoreExam(
  questionIds: string[],
  answers: ExamAnswer[],
  startedAt: Date,
  passingScore: number
): Promise<ExamResults> {
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const topics: Record<string, TopicResult> = {};

  for (const qId of questionIds) {
    const question = questionMap.get(qId);
    if (!question) continue;

    const topicKey = `${question.subject} > ${question.topic}`;
    if (!topics[topicKey]) {
      topics[topicKey] = { correct: 0, total: 0 };
    }
    topics[topicKey].total++;

    const userAnswer = answerMap.get(qId);
    if (!userAnswer) {
      unanswered++;
      continue;
    }

    const isCorrect = checkAnswer(question, userAnswer);
    if (isCorrect) {
      correct++;
      topics[topicKey].correct++;
    } else {
      incorrect++;
    }
  }

  const total = questionIds.length;
  const score = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;
  const timeTaken = Math.round(
    (Date.now() - startedAt.getTime()) / (1000 * 60) * 100
  ) / 100;

  return {
    correct,
    incorrect,
    unanswered,
    total,
    score,
    timeTaken,
    topics,
    passed: score >= passingScore,
  };
}

// ─── Answer checking (reused from session) ───

function checkAnswer(
  question: { type: string; correctAnswer: string },
  answer: string
): boolean {
  if (question.type === "MULTIPLE_CHOICE") {
    return (
      answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    );
  }
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ");
  return normalize(answer) === normalize(question.correctAnswer);
}

// ─── Sanitize questions for client (no correct answers) ───

export function sanitizeQuestions(
  questions: Question[],
  mode: string
) {
  return questions.map((q) => ({
    id: q.id,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    type: q.type,
    content: q.content,
    options: q.options,
    // In PRACTICE mode, include explanation hint
    ...(mode === "PRACTICE" ? { explanation: q.explanation } : {}),
  }));
}

// ─── Shuffle ───

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
