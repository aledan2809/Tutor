import { NextRequest, NextResponse } from "next/server";
import { getSession, hasAnyRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { selectExamQuestions, sanitizeQuestions } from "@/lib/exam-engine";

export async function POST(
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

  const body = await req.json();
  const { formatId, mode = "PRACTICE" } = body;

  if (!formatId) {
    return NextResponse.json(
      { error: "Missing required field: formatId" },
      { status: 400 }
    );
  }

  if (!["PRACTICE", "REAL"].includes(mode)) {
    return NextResponse.json(
      { error: "Invalid mode. Must be PRACTICE or REAL" },
      { status: 400 }
    );
  }

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const format = await prisma.examSimulation.findFirst({
    where: { id: formatId, domainId: domain.id, isActive: true },
  });
  if (!format) {
    return NextResponse.json(
      { error: "Exam format not found or inactive" },
      { status: 404 }
    );
  }

  // Check for existing in-progress exam
  const existing = await prisma.examSession.findFirst({
    where: {
      userId: session.user.id,
      domainId: domain.id,
      status: "IN_PROGRESS",
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have an exam in progress", sessionId: existing.id },
      { status: 409 }
    );
  }

  const formatConfig = format.format as Record<string, unknown>;
  const questions = await selectExamQuestions(
    domain.id,
    format.questionCount,
    {
      questionTypes: formatConfig.questionTypes as Record<string, number> | undefined,
      sections: formatConfig.sections as { name: string; weight: number; subject?: string; topic?: string }[] | undefined,
    }
  );

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No published questions available for this exam" },
      { status: 404 }
    );
  }

  const examSession = await prisma.examSession.create({
    data: {
      userId: session.user.id,
      domainId: domain.id,
      formatId: format.id,
      mode,
      timeLimit: format.timeLimit,
      questionIds: questions.map((q) => q.id),
      status: "IN_PROGRESS",
    },
  });

  return NextResponse.json({
    sessionId: examSession.id,
    mode,
    questions: sanitizeQuestions(questions, mode),
    timeLimit: format.timeLimit,
    startedAt: examSession.startedAt.toISOString(),
    totalQuestions: questions.length,
    formatName: format.name,
    passingScore: format.passingScore,
  });
}
