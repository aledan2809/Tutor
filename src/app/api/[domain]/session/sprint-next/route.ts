import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";
import {
  SPRINT_DOMAIN_SLUG,
  SPRINT_SESSION_TYPE,
  getOrCreateNextSprintQuestion,
} from "@/lib/sprint-session";
import { liveSignalMessage } from "@/lib/sprint-live";

/**
 * The next question of a running sprint, chosen from how the previous answers
 * went — correct-and-fast tightens the clock and, on a streak, steps the
 * difficulty up; missing gives time back and steps it down.
 *
 * Safe to call more than once: it returns the already-issued question until that
 * one is answered, so a refresh or a retried request can never skip ahead or
 * burn an extra question.
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
  if (domainSlug !== SPRINT_DOMAIN_SLUG) {
    return NextResponse.json({ error: "Not available for this domain" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { sessionId } = body as Record<string, unknown>;
  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const gate = await resolveDomainOrForbid(domainSlug, session.user);
  if (!gate.ok) return gate.response;
  const domain = gate.domain;

  const learningSession = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!learningSession || learningSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (learningSession.domainId !== domain.id) {
    return NextResponse.json({ error: "Domain mismatch" }, { status: 403 });
  }
  if (learningSession.type !== SPRINT_SESSION_TYPE) {
    return NextResponse.json({ error: "Not a sprint session" }, { status: 400 });
  }
  if (learningSession.endedAt) {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  const next = await getOrCreateNextSprintQuestion(learningSession);

  if (next.done || !next.question || next.seconds === undefined) {
    return NextResponse.json({
      done: true,
      answered: next.answered,
      total: next.total,
    });
  }

  return NextResponse.json({
    done: false,
    answered: next.answered,
    total: next.total,
    index: next.index,
    seconds: next.seconds,
    // Only shown when the session actually changed gear — see liveSignalMessage.
    signal: liveSignalMessage(next.live),
    tierOffset: next.live.tierOffset,
    question: {
      id: next.question.id,
      subject: next.question.subject,
      topic: next.question.topic,
      difficulty: next.question.difficulty,
      type: next.question.type,
      content: next.question.content,
      options: next.question.options,
      imageUrl: null,
      passage: null,
    },
  });
}

export const POST = withErrorHandler(_POST);
