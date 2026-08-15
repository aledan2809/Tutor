import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recommendSessionType, SESSION_TYPES } from "@/lib/session-engine";
import { withErrorHandler } from "@/lib/api-handler";
import { canAccessDomain } from "@/lib/domain-access";
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

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  // Restricted (non-curriculum) domains are gated to admins/superadmins,
  // allowlisted users, or users enrolled in that domain.
  if (!canAccessDomain(session.user, domainSlug, domain.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
  const availableTypes = Object.entries(SESSION_TYPES)
    .filter(([key]) => key !== SPRINT_SESSION_TYPE || isSprintDomain)
    .map(([key, val]) => ({ type: key, ...val }));

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
      ...SESSION_TYPES[recommendation.type],
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
