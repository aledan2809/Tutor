import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  selectQuestions,
  recommendSessionType,
  SESSION_TYPES,
  FIRST_TEST_QUESTION_COUNT,
  isFirstQuickTest,
} from "@/lib/session-engine";
import { withErrorHandler } from "@/lib/api-handler";
import { testTopicGate, emptyGatedTestResponse } from "@/lib/test-topic-gate";
import { resolveDomainByIdOrForbid } from "@/lib/domain-gate";
import { z } from "zod";
import { refuseIfPaused } from "@/lib/access-gate";

const quickSessionSchema = z.object({
  domainId: z.string().min(1),
  topicId: z.string().min(1).optional(),
});

async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Proba gratuită s-a încheiat fără plată: contul e în pauză (access.ts).
  const paused = await refuseIfPaused(session.user.id);
  if (paused) return paused;

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

  // Poarta comună (înscriere + ocolire pentru superadmin + 404 în loc de 403).
  const gate = await resolveDomainByIdOrForbid(domainId, session.user);
  if (!gate.ok) return gate.response;

  // Poarta programei parcurse / a cursului — ACEEAȘI ca în [domain]/session/start
  // (test-topic-gate.ts). Ruta asta era al doilea apelant al lui selectQuestions și,
  // negardată, oferea bazinul întreg exact elevului blocat dincolo (review 2026-08-24);
  // poarta cursului lipsea până la 14.10.2026.
  const topics = await testTopicGate(session.user.id, gate.domain);
  if (!topics.ok) return topics.response;
  const topicIn = topics.topicIn;

  // Get recommended session type
  const recommendation = await recommendSessionType(session.user.id, domainId);
  const sessionType = recommendation.type;
  const config = SESSION_TYPES[sessionType];
  // Same first-test rule as /[domain]/session/start (session-engine.ts): 5 questions, no clock.
  const firstTest = await isFirstQuickTest(session.user.id, sessionType);
  const duration = firstTest ? 0 : config.duration;

  const questions = await selectQuestions(
    session.user.id,
    domainId,
    sessionType,
    firstTest ? FIRST_TEST_QUESTION_COUNT : config.questionCount,
    { topicIn }
  );

  if (questions.length === 0) {
    if (topics.kind !== null) {
      return emptyGatedTestResponse(session.user.id, gate.domain, topics.kind);
    }
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
        duration,
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
    duration,
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
