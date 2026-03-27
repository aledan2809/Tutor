import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { updateWeakAreas } from "@/lib/session-engine";
import { awardSessionCompleteXp } from "@/lib/gamification";

export async function POST(
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
  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

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

  // Update weak areas (domain-scoped)
  await updateWeakAreas(session.user.id, domain.id);

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

  return NextResponse.json({
    sessionId: completedSession.id,
    score: Math.round(score * 10) / 10,
    totalQuestions: totalAttempts,
    correctAnswers: correctAttempts,
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
