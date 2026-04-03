import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  selectQuestions,
  recommendSessionType,
  SESSION_TYPES,
} from "@/lib/session-engine";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";

const quickSessionSchema = z.object({
  domainId: z.string().min(1),
  topicId: z.string().min(1).optional(),
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

  const parsed = quickSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { domainId, topicId } = parsed.data;

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

  // Get recommended session type
  const recommendation = await recommendSessionType(session.user.id, domainId);
  const sessionType = recommendation.type;
  const config = SESSION_TYPES[sessionType];

  const questions = await selectQuestions(
    session.user.id,
    domainId,
    sessionType,
    config.questionCount
  );

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No published questions available" },
      { status: 404 }
    );
  }

  // Filter by topic if specified
  let filteredQuestions = questions;
  if (topicId) {
    const topicQuestions = questions.filter((q) => q.topic === topicId);
    if (topicQuestions.length > 0) {
      filteredQuestions = topicQuestions;
    }
  }

  const newSession = await prisma.session.create({
    data: {
      userId: session.user.id,
      domainId,
      type: sessionType,
      metadata: {
        duration: config.duration,
        totalQuestions: filteredQuestions.length,
        questionIds: filteredQuestions.map((q) => q.id),
        reason: recommendation.reason,
      },
    },
  });

  return NextResponse.json({
    sessionId: newSession.id,
    type: sessionType,
    reason: recommendation.reason,
    duration: config.duration,
    questions: filteredQuestions.map((q) => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      content: q.content,
      options: q.options,
    })),
    totalQuestions: filteredQuestions.length,
  });
}

export const POST = withErrorHandler(_POST);
