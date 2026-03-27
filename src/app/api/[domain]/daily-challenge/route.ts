import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { getDailyChallenge, submitDailyChallenge } from "@/lib/gamification";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const challenge = await getDailyChallenge(domain.id);
  if (!challenge) {
    return NextResponse.json({ available: false });
  }

  // Check if user already attempted
  const attempt = await prisma.dailyChallengeAttempt.findUnique({
    where: {
      dailyChallengeId_userId: {
        dailyChallengeId: challenge.id,
        userId: session.user.id,
      },
    },
  });

  return NextResponse.json({
    available: true,
    attempted: !!attempt,
    doubleXp: true,
    question: {
      id: challenge.question.id,
      content: challenge.question.content,
      type: challenge.question.type,
      options: challenge.question.options,
      difficulty: challenge.question.difficulty,
      subject: challenge.question.subject,
      topic: challenge.question.topic,
    },
    ...(attempt
      ? {
          result: {
            isCorrect: attempt.isCorrect,
            xpAwarded: attempt.xpAwarded,
            correctAnswer: challenge.question.correctAnswer,
            explanation: challenge.question.explanation,
          },
        }
      : {}),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const body = await req.json();
  const { answer } = body;

  if (answer === undefined) {
    return NextResponse.json(
      { error: "Missing required field: answer" },
      { status: 400 }
    );
  }

  const result = await submitDailyChallenge(session.user.id, domain.id, String(answer));

  if (result.alreadyAttempted) {
    return NextResponse.json(
      { error: "Already attempted today's challenge", correct: result.correct },
      { status: 409 }
    );
  }

  return NextResponse.json({
    correct: result.correct,
    xpAwarded: result.xpAwarded,
  });
}
