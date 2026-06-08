import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  selectQuestions,
  SESSION_TYPES,
  estimateQuestionSeconds,
  isExamGrileSet,
  type SessionType,
} from "@/lib/session-engine";
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
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // empty body defaults to quick session
  }
  const sessionType = (body.type || "quick") as SessionType;

  if (!SESSION_TYPES[sessionType]) {
    return NextResponse.json(
      { error: "Invalid session type" },
      { status: 400 }
    );
  }

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const config = SESSION_TYPES[sessionType];
  const questions = await selectQuestions(
    session.user.id,
    domain.id,
    sessionType,
    config.questionCount
  );

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No published questions available" },
      { status: 404 }
    );
  }

  // Official EN VIII norm for exam-bank grile: timer = sum of per-question time
  // estimates (RO language 3 min, geometry/figure 6 min, other Mate 4 min).
  // Other domains keep their flat session-type duration.
  const duration = isExamGrileSet(questions)
    ? questions.reduce((sum, q) => sum + estimateQuestionSeconds(q), 0)
    : config.duration;

  const newSession = await prisma.session.create({
    data: {
      userId: session.user.id,
      domainId: domain.id,
      type: sessionType,
      metadata: {
        duration,
        totalQuestions: questions.length,
        questionIds: questions.map((q) => q.id),
      },
    },
  });

  // Return questions without correct answers, ensure options exist for MC
  const sanitizedQuestions = questions.map((q) => ({
    id: q.id,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    type: q.type,
    content: q.content,
    options: q.type === "MULTIPLE_CHOICE" && !q.options ? ["a)", "b)", "c)", "d)"] : q.options,
    imageUrl: q.imageUrl ?? null,
    passage: q.passage ?? null,
  }));

  return NextResponse.json({
    sessionId: newSession.id,
    type: sessionType,
    duration,
    questions: sanitizedQuestions,
    totalQuestions: questions.length,
  });
}

export const POST = withErrorHandler(_POST);
