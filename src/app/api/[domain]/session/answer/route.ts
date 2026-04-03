import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { sm2, gradeResponse } from "@/lib/sm2";
import { awardAnswerXp } from "@/lib/gamification";
import { withErrorHandler } from "@/lib/api-handler";

async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const body = await req.json();
  const { sessionId, questionId, answer, responseTime } = body;

  if (!sessionId || !questionId || answer === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: sessionId, questionId, answer" },
      { status: 400 }
    );
  }

  // Verify session belongs to user
  const learningSession = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  if (!learningSession || learningSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (learningSession.endedAt) {
    return NextResponse.json(
      { error: "Session already completed" },
      { status: 400 }
    );
  }

  // Resolve domain
  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  // Get question with correct answer
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });
  if (!question) {
    return NextResponse.json(
      { error: "Question not found" },
      { status: 404 }
    );
  }

  // Check answer
  const isCorrect = checkAnswer(question, answer);
  const timeSpent = responseTime ? Math.round(responseTime) : null;

  // Save attempt
  const attempt = await prisma.attempt.create({
    data: {
      sessionId,
      questionId,
      userId: session.user.id,
      answer: String(answer),
      isCorrect,
      timeSpent,
    },
  });

  // Update progress with SM-2 (domain-scoped)
  const quality = gradeResponse(isCorrect, timeSpent || 30000);

  const existingProgress = await prisma.progress.findUnique({
    where: {
      userId_domainId_subject_topic: {
        userId: session.user.id,
        domainId: domain.id,
        subject: question.subject,
        topic: question.topic,
      },
    },
  });

  const sm2Result = sm2({
    quality,
    easeFactor: existingProgress?.easeFactor ?? 2.5,
    interval: existingProgress?.interval ?? 1,
    repetitions: existingProgress?.repetitions ?? 0,
  });

  await prisma.progress.upsert({
    where: {
      userId_domainId_subject_topic: {
        userId: session.user.id,
        domainId: domain.id,
        subject: question.subject,
        topic: question.topic,
      },
    },
    update: {
      totalAttempts: { increment: 1 },
      correctAttempts: isCorrect ? { increment: 1 } : undefined,
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      nextReview: sm2Result.nextReview,
      lastPracticed: new Date(),
      masteryLevel: existingProgress
        ? ((existingProgress.correctAttempts + (isCorrect ? 1 : 0)) /
            (existingProgress.totalAttempts + 1)) *
          100
        : isCorrect
          ? 100
          : 0,
    },
    create: {
      userId: session.user.id,
      domainId: domain.id,
      subject: question.subject,
      topic: question.topic,
      totalAttempts: 1,
      correctAttempts: isCorrect ? 1 : 0,
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      nextReview: sm2Result.nextReview,
      lastPracticed: new Date(),
      masteryLevel: isCorrect ? 100 : 0,
    },
  });

  // Award gamification XP
  let xpAwarded = 0;
  if (learningSession.domainId) {
    const xpResult = await awardAnswerXp(
      session.user.id,
      learningSession.domainId,
      isCorrect,
      timeSpent
    );
    xpAwarded = xpResult.xpAwarded;
  }

  return NextResponse.json({
    attemptId: attempt.id,
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    quality,
    nextReview: sm2Result.nextReview,
    xpAwarded,
  });
}

function checkAnswer(
  question: { type: string; correctAnswer: string; options: unknown },
  answer: string
): boolean {
  if (question.type === "MULTIPLE_CHOICE") {
    return (
      answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    );
  }

  // OPEN type: normalize and compare
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ");
  return normalize(answer) === normalize(question.correctAnswer);
}

export const POST = withErrorHandler(_POST);
