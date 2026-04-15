import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const assessmentSchema = z.object({
  domainId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.string().min(1),
    })
  ).min(1).max(10),
});

async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = assessmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { domainId, answers } = parsed.data;

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_domainId: {
        userId: session.user.id,
        domainId,
      },
    },
  });

  if (!enrollment?.isActive) {
    return NextResponse.json({ error: "Not enrolled in this domain" }, { status: 403 });
  }

  // Get questions and check answers
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  let correctCount = 0;
  const results = answers.map((a) => {
    const question = questionMap.get(a.questionId);
    if (!question) return { questionId: a.questionId, isCorrect: false, error: "not_found" };

    const isCorrect = a.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    if (isCorrect) correctCount++;

    return {
      questionId: a.questionId,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  });

  const score = Math.round((correctCount / answers.length) * 100);

  // Determine level
  let level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  if (score >= 80) {
    level = "ADVANCED";
  } else if (score >= 50) {
    level = "INTERMEDIATE";
  } else {
    level = "BEGINNER";
  }

  // Create assessment session
  const assessmentSession = await prisma.session.create({
    data: {
      userId: session.user.id,
      domainId,
      type: "assessment",
      score,
      endedAt: new Date(),
      metadata: { level, answers: answers.length },
    },
  });

  // Create attempts for tracking
  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const isCorrect = answer.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    await prisma.attempt.create({
      data: {
        sessionId: assessmentSession.id,
        questionId: answer.questionId,
        userId: session.user.id,
        answer: answer.answer,
        isCorrect,
      },
    });
  }

  // Identify weak areas from assessment
  const topicResults = new Map<string, { correct: number; total: number; subject: string }>();
  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const key = `${question.subject}:${question.topic}`;
    const existing = topicResults.get(key) || { correct: 0, total: 0, subject: question.subject };
    existing.total++;
    const isCorrect = answer.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    if (isCorrect) existing.correct++;
    topicResults.set(key, existing);
  }

  const weakAreas: { subject: string; topic: string; accuracy: number }[] = [];
  for (const [key, data] of topicResults) {
    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    if (accuracy < 0.6) {
      const topic = key.split(":")[1];
      weakAreas.push({
        subject: data.subject,
        topic,
        accuracy: Math.round(accuracy * 100),
      });
    }
  }

  return NextResponse.json({
    sessionId: assessmentSession.id,
    score,
    level,
    correctCount,
    totalQuestions: answers.length,
    results,
    weakAreas,
  });
}

// GET: Fetch 10 assessment questions for a domain
async function _GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  if (!domainId) {
    return NextResponse.json({ error: "domainId is required" }, { status: 400 });
  }

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_domainId: {
        userId: session.user.id,
        domainId,
      },
    },
  });

  if (!enrollment?.isActive) {
    return NextResponse.json({ error: "Not enrolled in this domain" }, { status: 403 });
  }

  // Select 10 MULTIPLE_CHOICE questions with valid options across difficulties
  const baseWhere = { domainId, status: "PUBLISHED" as const, type: "MULTIPLE_CHOICE" as const, options: { not: null as unknown as undefined } };

  const easyQuestions = await prisma.question.findMany({
    where: { ...baseWhere, difficulty: { lte: 2 } },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  const mediumQuestions = await prisma.question.findMany({
    where: {
      ...baseWhere,
      difficulty: 3,
      id: { notIn: easyQuestions.map((q) => q.id) },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const hardQuestions = await prisma.question.findMany({
    where: {
      ...baseWhere,
      difficulty: { gte: 4 },
      id: {
        notIn: [
          ...easyQuestions.map((q) => q.id),
          ...mediumQuestions.map((q) => q.id),
        ],
      },
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  let questions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

  // If we don't have enough, fill with any published MC questions
  if (questions.length < 10) {
    const fill = await prisma.question.findMany({
      where: {
        ...baseWhere,
        id: { notIn: questions.map((q) => q.id) },
      },
      take: 10 - questions.length,
      orderBy: { createdAt: "desc" },
    });
    questions = [...questions, ...fill];
  }

  // Filter out any questions with null/empty options (extra safety)
  questions = questions.filter((q) => {
    const opts = q.options as unknown[];
    return Array.isArray(opts) && opts.length >= 2;
  });

  // Shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return NextResponse.json({
    questions: questions.map((q) => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      content: q.content,
      options: q.options,
    })),
    totalQuestions: questions.length,
  });
}

export const POST = withErrorHandler(_POST);
export const GET = withErrorHandler(_GET);
