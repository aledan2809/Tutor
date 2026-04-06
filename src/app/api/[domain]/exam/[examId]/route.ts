import { NextRequest, NextResponse } from "next/server";
import { getSession, hasAnyRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { sanitizeQuestions } from "@/lib/exam-engine";
import { withErrorHandler } from "@/lib/api-handler";

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string; examId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug, examId } = await params;

  if (!hasAnyRole(session, domainSlug, ["STUDENT", "ADMIN", "INSTRUCTOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve domain
  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  // Fetch exam session with format
  const examSession = await prisma.examSession.findUnique({
    where: { id: examId },
    include: { format: true },
  });
  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Exam session not found" },
      { status: 404 }
    );
  }

  // Validate domain matches exam
  if (examSession.domainId !== domain.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Exam already submitted
  if (examSession.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Exam already submitted" },
      { status: 400 }
    );
  }

  // Fetch questions
  const questionIds = examSession.questionIds as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });

  // Preserve original question order
  const orderedQuestions = questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => q !== undefined);

  return NextResponse.json({
    sessionId: examSession.id,
    mode: examSession.mode,
    questions: sanitizeQuestions(orderedQuestions, examSession.mode),
    timeLimit: examSession.timeLimit,
    startedAt: examSession.startedAt.toISOString(),
    totalQuestions: orderedQuestions.length,
    formatName: examSession.format.name,
    passingScore: examSession.format.passingScore,
    domainSlug,
  });
}

export const GET = withErrorHandler(_GET);
