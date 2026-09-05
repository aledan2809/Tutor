import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { updateWeakAreas } from "@/lib/session-engine";
import { awardSessionCompleteXp } from "@/lib/gamification";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";
import { cancelEscalation } from "@/lib/escalation/engine";
import {
  SPRINT_SESSION_TYPE,
  SPRINT_TIMEOUT_ANSWER,
  hasSprintFeedback,
} from "@/lib/sprint-session";

async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const body = await req.json();
  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId" },
      { status: 400 }
    );
  }

  // Resolve domain
  const gate = await resolveDomainOrForbid(domainSlug, session.user);
  if (!gate.ok) return gate.response;
  const domain = gate.domain;

  const learningSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      attempts: true,
    },
  });

  if (!learningSession || learningSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (learningSession.endedAt) {
    return NextResponse.json(
      { error: "Session already completed" },
      { status: 400 }
    );
  }

  const totalAttempts = learningSession.attempts.length;
  const correctAttempts = learningSession.attempts.filter(
    (a) => a.isCorrect
  ).length;
  const score = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

  // Update session
  const completedSession = await prisma.session.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      score,
    },
  });

  // Finishing a session — even a late/resumed one — means the student engaged.
  // Stop any active escalation chain immediately (the cron's passive gate also
  // catches this, but this makes it instant so no further nudges go out).
  await cancelEscalation(session.user.id);

  // Update weak areas (domain-scoped). Skipped for sprints — see the note in the
  // answer route: the drill writes no Progress rows, so there is nothing to
  // re-derive, and running the sweep would only re-evaluate other topics on the
  // back of a session that says nothing about them.
  if (learningSession.type !== SPRINT_SESSION_TYPE) {
    await updateWeakAreas(session.user.id, domain.id);
  }

  // Award gamification XP for session completion
  let gamification = null;
  if (learningSession.domainId) {
    gamification = await awardSessionCompleteXp(
      session.user.id,
      learningSession.domainId,
      score,
      totalAttempts
    );
  }

  // A sprint isn't finished until the student says how it felt — that answer is
  // what sets the next session's difficulty and clock. The results screen holds
  // the debrief in front of the score when this flag comes back true.
  const sprintFeedbackRequired =
    learningSession.type === SPRINT_SESSION_TYPE && !hasSprintFeedback(learningSession.metadata);

  return NextResponse.json({
    sessionId: completedSession.id,
    score: Math.round(score * 10) / 10,
    totalQuestions: totalAttempts,
    correctAnswers: correctAttempts,
    sprintFeedbackRequired,
    timedOut: learningSession.attempts.filter((a) => a.answer === SPRINT_TIMEOUT_ANSWER).length,
    duration: completedSession.endedAt
      ? Math.round(
          (completedSession.endedAt.getTime() -
            completedSession.startedAt.getTime()) /
            1000
        )
      : 0,
    ...(gamification
      ? {
          gamification: {
            xpAwarded: gamification.xpAwarded,
            totalXp: gamification.newXp,
            level: gamification.level,
            levelUp: gamification.levelUp,
            newAchievements: gamification.newAchievements,
          },
        }
      : {}),
  });
}

export const POST = withErrorHandler(_POST);
