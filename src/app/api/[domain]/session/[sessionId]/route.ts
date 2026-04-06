import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string; sessionId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug, sessionId } = await params;

  // Resolve domain
  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  // Fetch session and verify ownership
  const learningSession = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  if (!learningSession || learningSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Validate domain matches session
  if (learningSession.domainId && learningSession.domainId !== domain.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Session already completed
  if (learningSession.endedAt) {
    return NextResponse.json(
      { error: "Session already completed" },
      { status: 400 }
    );
  }

  // Get questions from session metadata
  const metadata = learningSession.metadata as {
    duration?: number;
    totalQuestions?: number;
    questionIds?: string[];
  } | null;

  const questionIds = metadata?.questionIds || [];
  const questions = questionIds.length > 0
    ? await prisma.question.findMany({
        where: { id: { in: questionIds } },
        select: {
          id: true,
          subject: true,
          topic: true,
          difficulty: true,
          type: true,
          content: true,
          options: true,
        },
      })
    : [];

  // Preserve original question order
  const orderedQuestions = questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter(Boolean);

  return NextResponse.json({
    sessionId: learningSession.id,
    type: learningSession.type,
    duration: metadata?.duration || 0,
    questions: orderedQuestions,
    totalQuestions: orderedQuestions.length,
    domainSlug,
    domainId: domain.id,
    serverTimestamp: Date.now(),
  });
}

export const GET = withErrorHandler(_GET);
