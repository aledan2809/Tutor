import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { sm2, gradeResponse } from "@/lib/sm2";
import { awardAnswerXp } from "@/lib/gamification";
import { withErrorHandler } from "@/lib/api-handler";
import { LICENTA_DOMAIN_SLUG } from "@/lib/licenta-constants";
import { SPRINT_TOPIC } from "@/lib/mental-chain";
import { SPRINT_SESSION_TYPE, getOrCreateNextSprintQuestion } from "@/lib/sprint-session";
import { liveSignalMessage } from "@/lib/sprint-live";

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
  const { sessionId, questionId, answer, responseTime } = body;

  if (!sessionId || !questionId || answer === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: sessionId, questionId, answer" },
      { status: 400 }
    );
  }

  // Verify session belongs to user
  const learningSession = await prisma.session.findUnique({
    where: { id: sessionId },
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

  // Resolve domain
  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  // C03: Validate session belongs to this domain
  if (learningSession.domainId && learningSession.domainId !== domain.id) {
    return NextResponse.json({ error: "Domain mismatch" }, { status: 403 });
  }

  // Get question with correct answer
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });
  if (!question) {
    return NextResponse.json(
      { error: "Question not found" },
      { status: 404 }
    );
  }

  // Check answer
  const isCorrect = checkAnswer(question, answer);
  const timeSpent = responseTime ? Math.round(responseTime) : null;

  // Save attempt
  const attempt = await prisma.attempt.create({
    data: {
      sessionId,
      questionId,
      userId: session.user.id,
      answer: String(answer),
      isCorrect,
      timeSpent,
    },
  });

  // The timed sprint is a speed drill, not spaced-repetition material: its
  // questions are generated fresh every run, so there is nothing to schedule a
  // review of, and a clock that runs out grades wrong. Feeding that into
  // Progress/WeakArea made the whole domain look like a weakness — which in turn
  // put the topic on the parent's report, dragged the escalation monitor's
  // 7-day score down, and made the "exam ready" achievement (every Progress row
  // ≥ 90%) permanently unreachable. Attempts are still recorded and still earn
  // XP; only the mastery bookkeeping is skipped.
  const isSprintQuestion = question.topic === SPRINT_TOPIC;

  // Update progress with SM-2 (domain-scoped)
  const quality = gradeResponse(isCorrect, timeSpent || 30000);

  const existingProgress = isSprintQuestion ? null : await prisma.progress.findUnique({
    where: {
      userId_domainId_subject_topic: {
        userId: session.user.id,
        domainId: domain.id,
        subject: question.subject,
        topic: question.topic,
      },
    },
  });

  const sm2Result = sm2({
    quality,
    easeFactor: existingProgress?.easeFactor ?? 2.5,
    interval: existingProgress?.interval ?? 1,
    repetitions: existingProgress?.repetitions ?? 0,
  });

  if (!isSprintQuestion) await prisma.progress.upsert({
    where: {
      userId_domainId_subject_topic: {
        userId: session.user.id,
        domainId: domain.id,
        subject: question.subject,
        topic: question.topic,
      },
    },
    update: {
      totalAttempts: { increment: 1 },
      correctAttempts: isCorrect ? { increment: 1 } : undefined,
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      nextReview: sm2Result.nextReview,
      lastPracticed: new Date(),
      masteryLevel: existingProgress
        ? ((existingProgress.correctAttempts + (isCorrect ? 1 : 0)) /
            (existingProgress.totalAttempts + 1)) *
          100
        : isCorrect
          ? 100
          : 0,
    },
    create: {
      userId: session.user.id,
      domainId: domain.id,
      subject: question.subject,
      topic: question.topic,
      totalAttempts: 1,
      correctAttempts: isCorrect ? 1 : 0,
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      nextReview: sm2Result.nextReview,
      lastPracticed: new Date(),
      masteryLevel: isCorrect ? 100 : 0,
    },
  });

  // Award gamification XP
  let xpAwarded = 0;
  if (learningSession.domainId) {
    const xpResult = await awardAnswerXp(
      session.user.id,
      learningSession.domainId,
      isCorrect,
      timeSpent
    );
    xpAwarded = xpResult.xpAwarded;
  }

  // Provenance shown at correction (official grile carry the source paper in
  // sourceReference as "exam-bank:<id> | <paper source>"; topic holds the section).
  const paperSource = question.sourceReference?.startsWith("exam-bank:")
    ? (question.sourceReference.split(" | ")[1] ?? null)
    : null;
  let source = paperSource
    ? `${paperSource}${question.topic ? ` · ${question.topic}` : ""}`
    : question.topic || null;

  // Licență grile come from the student's OWN thesis: surface the real page +
  // section + the verbatim quote so they can open the PDF and verify. The quote
  // is exposed ONLY for this own-material domain — other domains' sourceReference
  // may cite copyrighted books (schema marks it Instructor/Admin-only).
  let explanationText = question.explanation;
  let sourceQuote: string | null = null;
  if (domain.slug === LICENTA_DOMAIN_SLUG) {
    const sec =
      question.topic && !question.topic.startsWith("Lucrare de licență")
        ? ` · ${question.topic}`
        : "";
    source = question.pdfPage
      ? `Lucrare de licență — pagina ${question.pdfPage}${sec}`
      : `Lucrare de licență${sec}`;
    const m = /^licenta-gen:\s*"([\s\S]*)"$/.exec(question.sourceReference ?? "");
    if (m) sourceQuote = m[1];
    // Weave the page + section reference into the explanation text itself, so the
    // provenance travels with the answer wherever the explanation is read.
    if (question.pdfPage) {
      const ref = `📄 Sursă: pagina ${question.pdfPage}${sec}`;
      explanationText = explanationText ? `${explanationText} — ${ref}` : ref;
    }
  }

  // Sprint only: hand back the NEXT question with this answer's result.
  //
  // A sprint's questions are generated one at a time from how the run is going,
  // so the client would otherwise have to make a second round trip after every
  // answer. In a drill whose whole point is speed — and where the student often
  // taps "next" the instant the tick appears — that shows up as a visible stall.
  // Folding it in also halves the request rate against the 60/min API limit.
  //
  // Strictly additive and fail-soft: if this throws, the answer result is
  // returned as before and the client falls back to POST /session/sprint-next
  // (which is idempotent and returns this same question).
  let sprintNext: unknown = undefined;
  if (learningSession.type === SPRINT_SESSION_TYPE) {
    try {
      const next = await getOrCreateNextSprintQuestion(learningSession);
      sprintNext = next.done
        ? { done: true, answered: next.answered, total: next.total }
        : {
            done: false,
            answered: next.answered,
            total: next.total,
            index: next.index,
            seconds: next.seconds,
            signal: liveSignalMessage(next.live),
            question: next.question && {
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
          };
    } catch (err) {
      // Client falls back to POST /session/sprint-next. Logged because this is
      // otherwise invisible from both ends: the response looks normal and the
      // student just sees the next-question load fail.
      console.error("[sprint] failed to prepare the next question", err);
      sprintNext = undefined;
    }
  }

  return NextResponse.json({
    attemptId: attempt.id,
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: explanationText,
    source,
    sourceQuote,
    quality,
    nextReview: sm2Result.nextReview,
    xpAwarded,
    ...(sprintNext ? { sprintNext } : {}),
  });
}

function checkAnswer(
  question: { type: string; correctAnswer: string; options: unknown },
  answer: string
): boolean {
  // Strip letter prefix (e.g., "a) ", "b. ", "c-") from both sides for comparison
  const stripPrefix = (s: string) =>
    s.trim().replace(/^[abcd][\.\)\-\s]+\s*/i, "").trim().toLowerCase();

  if (question.type === "MULTIPLE_CHOICE") {
    const cleanAnswer = stripPrefix(answer);
    const cleanCorrect = stripPrefix(question.correctAnswer);
    if (cleanAnswer === cleanCorrect) return true;

    // Also accept if user sent just the letter ("a", "b", etc.)
    const answerLetter = answer.trim().toLowerCase().match(/^([abcd])[\.\)\-\s]*$/)?.[1];
    const correctLetter = question.correctAnswer.trim().toLowerCase().match(/^([abcd])[\.\)\-]/)?.[1];
    if (answerLetter && correctLetter && answerLetter === correctLetter) return true;

    return false;
  }

  // OPEN type: normalize and compare
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ");
  return normalize(answer) === normalize(question.correctAnswer);
}

export const POST = withErrorHandler(_POST);
