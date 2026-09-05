import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";
import {
  SPRINT_DOMAIN_SLUG,
  SPRINT_SESSION_TYPE,
  SPRINT_TIMEOUT_ANSWER,
  buildChainEvents,
  buildFamilyEvents,
  hasSprintFeedback,
  loadSprintProfile,
  readSprintMetadata,
  saveSprintProfile,
} from "@/lib/sprint-session";
import { computeLiveState } from "@/lib/sprint-live";
import { computeFamilyState, foldFamilyBaselines } from "@/lib/sprint-families";
import { FAMILY_LABELS, SINGLE_FAMILIES } from "@/lib/mental-single";
import {
  adaptSprintProfile,
  isDifficultyAnswer,
  isTimeAnswer,
} from "@/lib/sprint-adapt";
import { TIER_LABELS, tierForIndex, type Tier } from "@/lib/mental-chain";

/**
 * The mandatory two-question debrief at the end of a sprint: was it too easy /
 * about right / too hard, and was the clock too generous / about right / too
 * tight. That answer — not the score alone — is what moves the difficulty and
 * the time budget for the next session.
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
  const { sessionId, difficulty, time } = body as Record<string, unknown>;

  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  if (!isDifficultyAnswer(difficulty) || !isTimeAnswer(time)) {
    return NextResponse.json(
      { error: "Invalid feedback: difficulty must be easy|ok|hard and time loose|ok|tight" },
      { status: 400 }
    );
  }

  const gate = await resolveDomainOrForbid(domainSlug, session.user);
  if (!gate.ok) return gate.response;
  const domain = gate.domain;

  const learningSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      attempts: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { questionId: true, isCorrect: true, answer: true, timeSpent: true },
      },
    },
  });

  if (!learningSession || learningSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (learningSession.domainId !== domain.id) {
    return NextResponse.json({ error: "Domain mismatch" }, { status: 403 });
  }
  if (learningSession.type !== SPRINT_SESSION_TYPE) {
    return NextResponse.json({ error: "Not a sprint session" }, { status: 400 });
  }
  if (!learningSession.endedAt) {
    return NextResponse.json({ error: "Session not finished yet" }, { status: 400 });
  }

  // Idempotent: a double submit (double tap, retried request) must not apply the
  // adaptation twice. Report the stored answer instead of moving the profile again.
  if (hasSprintFeedback(learningSession.metadata)) {
    const profile = await loadSprintProfile(session.user.id, domain.id);
    return NextResponse.json({
      alreadySubmitted: true,
      level: profile.level,
      timeFactor: profile.timeFactor,
      notes: ["Feedback-ul pentru sesiunea asta era deja trimis."],
    });
  }

  const meta = readSprintMetadata(learningSession.metadata);
  // Where the in-session adaptation ended up — the signal that actually carries
  // information once the engine is steering toward a constant success rate.
  const live = meta ? computeLiveState(buildChainEvents(meta, learningSession.attempts)) : null;
  // How each operation went, held apart from the overall numbers: one accuracy
  // for the whole session describes a student who is instant on additions and
  // stuck on two-digit products no better than it describes either half.
  const families = meta
    ? computeFamilyState(buildFamilyEvents(meta, learningSession.attempts), meta.familyBaselines ?? {})
    : null;
  const outcome = {
    total: meta?.totalQuestions ?? learningSession.attempts.length,
    correct: learningSession.attempts.filter((a) => a.isCorrect).length,
    timedOut: learningSession.attempts.filter((a) => a.answer === SPRINT_TIMEOUT_ANSWER).length,
    ...(live ? { endedTierOffset: live.tierOffset, endedTimeScale: live.timeScale } : {}),
  };

  // Claim FIRST, adapt second. The read above and the write below are separate
  // statements, so two in-flight POSTs (client timeout → student taps "try
  // again" while the first one actually succeeded) would both pass the check and
  // move the profile twice. `updateMany` with the not-yet-answered condition in
  // its WHERE is a single atomic statement: exactly one caller gets count 1.
  const claim = await prisma.session.updateMany({
    where: {
      id: sessionId,
      userId: session.user.id,
      metadata: { path: ["sprintFeedback"], equals: Prisma.DbNull },
    },
    data: {
      metadata: {
        ...(meta ?? {}),
        sprintFeedback: { difficulty, time, at: new Date().toISOString() },
      } as unknown as object,
    },
  });

  if (claim.count === 0) {
    const profile = await loadSprintProfile(session.user.id, domain.id);
    return NextResponse.json({
      alreadySubmitted: true,
      level: profile.level,
      timeFactor: profile.timeFactor,
      notes: ["Feedback-ul pentru sesiunea asta era deja trimis."],
    });
  }

  const current = await loadSprintProfile(session.user.id, domain.id);
  const next = adaptSprintProfile(
    { level: current.level, timeFactor: current.timeFactor },
    { difficulty, time },
    outcome
  );

  await saveSprintProfile(session.user.id, domain.id, {
    ...next,
    // Carry the per-family progress forward. Without this the drill would
    // rediscover which operation he is slow at from scratch every session,
    // which is exactly the thing it is supposed to remember.
    ...(families ? { families: foldFamilyBaselines(current.families, families) } : {}),
  });

  return NextResponse.json({
    level: next.level,
    timeFactor: next.timeFactor,
    notes: next.notes,
    nextStartLabel: TIER_LABELS[tierForIndex(0, outcome.total || 20, next.level) as Tier],
    // Per-operation breakdown for the results screen — only the operations that
    // actually came up, so nothing is reported on that was never measured.
    familyBreakdown: families
      ? SINGLE_FAMILIES.filter((f) => families[f].seen > 0).map((f) => ({
          family: f,
          label: FAMILY_LABELS[f],
          seen: families[f].seen,
          correct: families[f].correct,
          fast: families[f].fast,
          level: families[f].level,
        }))
      : [],
    outcome,
  });
}

export const POST = withErrorHandler(_POST);
