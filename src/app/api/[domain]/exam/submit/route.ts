import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { scoreExam } from "@/lib/exam-engine";
import { generateCertificate } from "@/lib/certificate";
import { awardExamCompleteXp } from "@/lib/gamification";
import type { Prisma } from "@prisma/client";
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
  const { sessionId, answers } = body;

  if (!sessionId || !Array.isArray(answers)) {
    return NextResponse.json(
      { error: "Missing required fields: sessionId, answers" },
      { status: 400 }
    );
  }

  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: { format: true },
  });

  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Exam session not found" },
      { status: 404 }
    );
  }

  if (examSession.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Exam already submitted" },
      { status: 400 }
    );
  }

  // C04: Validate exam session belongs to this domain
  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }
  if (examSession.domainId !== domain.id) {
    return NextResponse.json({ error: "Domain mismatch" }, { status: 403 });
  }

  // Check time limit
  let timedOut = false;
  if (examSession.timeLimit) {
    const elapsed = (Date.now() - examSession.startedAt.getTime()) / (1000 * 60);
    if (elapsed > examSession.timeLimit + 1) {
      timedOut = true;
    }
  }

  const questionIds = examSession.questionIds as string[];
  const results = await scoreExam(
    questionIds,
    answers,
    examSession.startedAt,
    examSession.format.passingScore
  );

  const status = timedOut ? "TIMED_OUT" : "COMPLETED";

  await prisma.examSession.update({
    where: { id: sessionId },
    data: {
      submittedAt: new Date(),
      score: results.score,
      passed: timedOut ? false : results.passed,
      status,
      answers: answers as Prisma.InputJsonValue,
      results: results as unknown as Prisma.InputJsonValue,
    },
  });

  // Generate certificate if passed
  let certificateUrl: string | null = null;
  if (results.passed && !timedOut) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    const domain = await prisma.domain.findUnique({
      where: { id: examSession.domainId },
    });

    if (user && domain) {
      certificateUrl = await generateCertificate({
        sessionId,
        userId: session.user.id,
        domainId: examSession.domainId,
        userName: user.name || user.email || "Student",
        domainName: domain.name,
        score: results.score,
        passingScore: examSession.format.passingScore,
        totalQuestions: results.total,
        correctAnswers: results.correct,
        completedAt: new Date(),
        formatName: examSession.format.name,
      });
    }
  }

  // Award XP for exam completion
  const xpResult = await awardExamCompleteXp(
    session.user.id,
    examSession.domainId,
    results.score,
    results.total,
    timedOut ? false : results.passed,
    examSession.mode
  );

  return NextResponse.json({
    score: results.score,
    passed: timedOut ? false : results.passed,
    timedOut,
    results: {
      correct: results.correct,
      incorrect: results.incorrect,
      unanswered: results.unanswered,
      total: results.total,
      timeTaken: results.timeTaken,
      topics: results.topics,
    },
    passingScore: examSession.format.passingScore,
    certificateUrl,
    gamification: {
      xpAwarded: xpResult.xpAwarded,
      totalXp: xpResult.newXp,
      level: xpResult.level,
      levelUp: xpResult.levelUp,
      newAchievements: xpResult.newAchievements,
    },
  });
}

export const POST = withErrorHandler(_POST);
