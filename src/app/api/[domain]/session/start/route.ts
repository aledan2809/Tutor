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
import { canAccessDomain } from "@/lib/domain-access";
import { bandForDomainSlug } from "@/lib/curriculum";
import { visibleTopicsFor } from "@/lib/curriculum-service";
import { LICENTA_DOMAIN_SLUG } from "@/lib/licenta-constants";
import {
  SPRINT_DOMAIN_SLUG,
  SPRINT_SESSION_TYPE,
  findSprintAwaitingFeedback,
  getOrCreateNextSprintQuestion,
  loadSprintProfile,
  pruneOrphanSprintQuestions,
} from "@/lib/sprint-session";
import {
  SPRINT_QUESTION_COUNT,
  TIER_LABELS,
  secondsForIndex,
  tierForIndex,
  type Tier,
} from "@/lib/mental-chain";

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

  // Restricted (non-curriculum) domains — e.g. aviation — are practiceable only
  // by admins/superadmins, allowlisted users, or users enrolled in that domain.
  if (!canAccessDomain(session.user, domainSlug, domain.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Sprint de calcul: generated fresh, clocked per question ──
  if (sessionType === SPRINT_SESSION_TYPE) {
    if (domainSlug !== SPRINT_DOMAIN_SLUG) {
      return NextResponse.json(
        { error: "Sprint sessions are only available in the aptitude domain" },
        { status: 400 }
      );
    }

    // The feedback at the end of a sprint is what tunes the next one, so a
    // finished sprint that never got it blocks the next start (recent ones only
    // — see FEEDBACK_BLOCK_DAYS, so a stale session can't lock the drill).
    const pending = await findSprintAwaitingFeedback(session.user.id, domain.id);
    if (pending) {
      return NextResponse.json(
        {
          error: "Feedback required",
          pendingFeedbackSessionId: pending.id,
          message:
            "Spune-ne întâi cum a fost sesiunea anterioară — de asta depinde cât de grea o facem pe următoarea.",
        },
        { status: 409 }
      );
    }

    // Best-effort housekeeping: rows left behind by abandoned sprints.
    await pruneOrphanSprintQuestions(domain.id).catch(() => 0);

    const profile = await loadSprintProfile(session.user.id, domain.id);
    const total = SPRINT_QUESTION_COUNT;

    // Only the PLAN is fixed up front. The questions themselves are generated
    // one at a time as the sprint runs, because each one's difficulty and clock
    // depend on how the previous answers went — see getOrCreateNextSprintQuestion.
    const plannedDuration = Array.from({ length: total }, (_, i) =>
      secondsForIndex(i, total, profile.timeFactor)
    ).reduce((a, b) => a + b, 0);

    const newSprint = await prisma.session.create({
      data: {
        userId: session.user.id,
        domainId: domain.id,
        type: SPRINT_SESSION_TYPE,
        metadata: {
          duration: plannedDuration,
          totalQuestions: total,
          questionIds: [],
          questionSeconds: [],
          level: profile.level,
          timeFactor: profile.timeFactor,
        },
      },
    });

    const first = await getOrCreateNextSprintQuestion({
      id: newSprint.id,
      userId: session.user.id,
      domainId: domain.id,
      metadata: {
        duration: plannedDuration,
        totalQuestions: total,
        questionIds: [],
        questionSeconds: [],
        level: profile.level,
        timeFactor: profile.timeFactor,
      } as unknown as object,
    });

    if (!first.question || first.seconds === undefined) {
      return NextResponse.json({ error: "Could not generate the first question" }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: newSprint.id,
      type: SPRINT_SESSION_TYPE,
      // Planned total, for display only — the real limit is per question, and
      // the live adaptation moves it as the session goes.
      duration: plannedDuration,
      level: profile.level,
      levelLabel: TIER_LABELS[tierForIndex(0, total, profile.level) as Tier],
      totalQuestions: total,
      // One question at a time: the client asks for the next after each answer.
      adaptive: true,
      questionSeconds: [first.seconds],
      questions: [
        {
          id: first.question.id,
          subject: first.question.subject,
          topic: first.question.topic,
          difficulty: first.question.difficulty,
          type: first.question.type,
          content: first.question.content,
          options: first.question.options,
          imageUrl: null,
          passage: null,
        },
      ],
    });
  }

  // ── Poarta programei parcurse (doar domeniile cu bandă de curriculum) ──
  // Cerință user (2026-08-24): checklistul celor două rânduri trebuie completat
  // în UI ÎNAINTE de orice test pe anul curent. Fără inițiere → 409 cu semnal
  // explicit; UI-ul deschide flow-ul, nu pornește sesiunea.
  let topicIn: string[] | null = null;
  if (bandForDomainSlug(domainSlug)) {
    topicIn = await visibleTopicsFor(session.user.id, domainSlug);
    if (topicIn === null) {
      return NextResponse.json(
        {
          error: "Curriculum setup required",
          needsCurriculumSetup: true,
        },
        { status: 409 }
      );
    }
  }

  const config = SESSION_TYPES[sessionType];
  const questions = await selectQuestions(
    session.user.id,
    domain.id,
    sessionType,
    config.questionCount,
    // Licență is a short-window cram with a small bank → allow repeats so the
    // whole material can be drilled every session.
    { excludeRecent: domainSlug !== LICENTA_DOMAIN_SLUG, topicIn }
  );

  if (questions.length === 0) {
    // Cu poartă activă, sesiunea goală înseamnă "nimic bifat încă" — mesajul
    // trimite la checklist, nu pretinde că banca e goală.
    if (topicIn !== null) {
      return NextResponse.json(
        {
          error: "No questions in covered chapters",
          needsCurriculumSetup: false,
          emptyBecauseCurriculum: true,
        },
        { status: 409 }
      );
    }
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
