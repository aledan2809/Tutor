import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
  // Find last incomplete session
  const lastSession = await prisma.session.findFirst({
    where: {
      userId: session.user.id,
      endedAt: null,
    },
    orderBy: { startedAt: "desc" },
    include: {
      attempts: {
        select: { questionId: true },
      },
    },
  });

  if (!lastSession) {
    return NextResponse.json({ error: "No active session found" }, { status: 404 });
  }

  const metadata = lastSession.metadata as Record<string, unknown> | null;
  const questionIds = (metadata?.questionIds as string[]) || [];
  const answeredIds = new Set(lastSession.attempts.map((a) => a.questionId));

  // Get remaining questions
  const remainingQuestionIds = questionIds.filter((id) => !answeredIds.has(id));

  if (remainingQuestionIds.length === 0) {
    return NextResponse.json({ error: "Session has no remaining questions" }, { status: 400 });
  }

  const questions = await prisma.question.findMany({
    where: { id: { in: remainingQuestionIds } },
  });

  // Look up domain slug if domainId exists
  let domainSlug: string | null = null;
  if (lastSession.domainId) {
    const domain = await prisma.domain.findUnique({
      where: { id: lastSession.domainId },
      select: { slug: true },
    });
    domainSlug = domain?.slug ?? null;
  }

  return NextResponse.json({
    sessionId: lastSession.id,
    type: lastSession.type,
    domainId: lastSession.domainId,
    domainSlug,
    duration: (metadata?.duration as number) || 0,
    startedAt: lastSession.startedAt,
    questions: questions.map((q) => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      content: q.content,
      options: q.options,
    })),
    totalQuestions: questionIds.length,
    answeredQuestions: answeredIds.size,
    remainingQuestions: remainingQuestionIds.length,
  });
  } catch (error) {
    console.error("Continue session API error:", error);
    return NextResponse.json(
      { error: "Failed to continue session" },
      { status: 500 }
    );
  }
}
