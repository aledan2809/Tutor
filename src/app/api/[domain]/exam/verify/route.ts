import { NextRequest, NextResponse } from "next/server";
import { getSession, hasAnyRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * POST /api/[domain]/exam/verify
 * H11: Server-side answer verification for PRACTICE mode exams.
 * Returns isCorrect and explanation without exposing correct answer client-side.
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  if (!hasAnyRole(session, domainSlug, ["STUDENT", "ADMIN", "INSTRUCTOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const body = await req.json();
  const { sessionId, questionId, answer } = body as {
    sessionId: string;
    questionId: string;
    answer: string;
  };

  if (!sessionId || !questionId || !answer) {
    return NextResponse.json(
      { error: "sessionId, questionId, and answer are required" },
      { status: 400 }
    );
  }

  // Verify exam session ownership and mode
  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
  });

  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
  }

  if (examSession.domainId !== domain.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (examSession.mode !== "PRACTICE") {
    return NextResponse.json(
      { error: "Verification only available in practice mode" },
      { status: 400 }
    );
  }

  if (examSession.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Exam session is not in progress" },
      { status: 400 }
    );
  }

  // Verify the question belongs to this exam
  const questionIds = examSession.questionIds as string[];
  if (!questionIds.includes(questionId)) {
    return NextResponse.json(
      { error: "Question not found in this exam" },
      { status: 400 }
    );
  }

  // Fetch the question and check the answer
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Check answer using same logic as exam-engine
  let isCorrect = false;
  if (question.type === "MULTIPLE_CHOICE") {
    isCorrect =
      answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
  } else {
    const normalize = (s: string) =>
      s.trim().toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
    isCorrect = normalize(answer) === normalize(question.correctAnswer);
  }

  return NextResponse.json({
    isCorrect,
    explanation: question.explanation || null,
  });
}

export const POST = withErrorHandler(_POST);
