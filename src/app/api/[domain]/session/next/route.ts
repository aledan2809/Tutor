import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recommendSessionType, SESSION_TYPES, FIRST_TEST_QUESTION_COUNT, isFirstQuickTest } from "@/lib/session-engine";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";
import {
  SPRINT_DOMAIN_SLUG,
  SPRINT_SESSION_TYPE,
  findSprintAwaitingFeedback,
  loadSprintProfile,
} from "@/lib/sprint-session";
import {
  SPRINT_QUESTION_COUNT,
  TIER_LABELS,
  secondsForIndex,
  tierForIndex,
  type Tier,
} from "@/lib/mental-chain";
import { refuseIfPaused } from "@/lib/access-gate";

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Proba gratuită s-a încheiat fără plată: contul e în pauză (access.ts).
  const paused = await refuseIfPaused(session.user.id);
  if (paused) return paused;

  const { domain: domainSlug } = await params;

  const gate = await resolveDomainOrForbid(domainSlug, session.user);
  if (!gate.ok) return gate.response;
  const domain = gate.domain;

  const recommendation = await recommendSessionType(
    session.user.id,
    domain.id
  );

  // Get progress summary for this domain
  const progressRecords = await prisma.progress.findMany({
    where: { userId: session.user.id, domainId: domain.id },
  });

  const weakAreas = await prisma.weakArea.findMany({
    where: { userId: session.user.id, domainId: domain.id },
  });

  // Generated sprint rows are stored as APPROVED, so "PUBLISHED" already keeps
  // them out of this number — it reports the real bank, not a total that grows
  // by 20 after every sprint.
  const questionCount = await prisma.question.count({
    where: { domainId: domain.id, status: "PUBLISHED" },
  });

  const isSprintDomain = domainSlug === SPRINT_DOMAIN_SLUG;

  // "Sprint de calcul" generates its own questions, so it exists only in the
  // aptitude domain — everywhere else it would offer a session with nothing
  // behind it. Filtered out rather than hidden client-side so the API can't
  // hand another domain a session type its start route will reject.
  // A new learner's first quick test is 5 questions with no clock (session/start): describe it so.
  const firstQuick = await isFirstQuickTest(session.user.id, "quick");
  const described = (key: string) => {
    const val = SESSION_TYPES[key as keyof typeof SESSION_TYPES];
    return key === "quick" && firstQuick ? { ...val, questionCount: FIRST_TEST_QUESTION_COUNT, duration: 0 } : val;
  };
  const availableTypes = Object.keys(SESSION_TYPES)
    .filter((key) => key !== SPRINT_SESSION_TYPE || isSprintDomain)
    .map((key) => ({ type: key, ...described(key) }));

  // Everything the sprint card needs to describe the run before it starts:
  // which difficulty band it will span and how the clock will tighten.
  let sprint = null;
  if (isSprintDomain) {
    const profile = await loadSprintProfile(session.user.id, domain.id);
    const n = SPRINT_QUESTION_COUNT;
    const firstTier = tierForIndex(0, n, profile.level) as Tier;
    const lastTier = tierForIndex(n - 1, n, profile.level) as Tier;
    const pending = await findSprintAwaitingFeedback(session.user.id, domain.id);
    sprint = {
      level: profile.level,
      sessions: profile.sessions,
      questionCount: n,
      firstSeconds: secondsForIndex(0, n, profile.timeFactor),
      lastSeconds: secondsForIndex(n - 1, n, profile.timeFactor),
      difficultyLabel:
        firstTier === lastTier
          ? TIER_LABELS[firstTier]
          : `${TIER_LABELS[firstTier]} → ${TIER_LABELS[lastTier]}`,
      pendingFeedbackSessionId: pending?.id ?? null,
    };
  }

  return NextResponse.json({
    recommended: {
      type: recommendation.type,
      reason: recommendation.reason,
      ...described(recommendation.type),
    },
    availableTypes,
    sprint,
    stats: {
      totalQuestions: questionCount,
      topicsStudied: progressRecords.length,
      weakAreas: weakAreas.length,
    },
  });
}

export const GET = withErrorHandler(_GET);
