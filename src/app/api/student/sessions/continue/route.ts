import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { SPRINT_SESSION_TYPE } from "@/lib/sprint-session";
import { withErrorHandler } from "@/lib/api-handler";

async function _POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find last incomplete session
  const lastSession = await prisma.session.findFirst({
    where: {
      userId: session.user.id,
      endedAt: null,
    },
    orderBy: { startedAt: "desc" },
    include: {
      attempts: {
        select: { questionId: true },
      },
    },
  });

  if (!lastSession) {
    return NextResponse.json({ error: "No active session found" }, { status: 404 });
  }

  const metadata = lastSession.metadata as Record<string, unknown> | null;
  const questionIds = (metadata?.questionIds as string[]) || [];
  const answeredIds = new Set(lastSession.attempts.map((a) => a.questionId));

  // Get remaining questions
  const remainingQuestionIds = questionIds.filter((id) => !answeredIds.has(id));

  // Resolved before the early return below — the sprint branch needs it too.
  let domainSlug: string | null = null;
  if (lastSession.domainId) {
    const domain = await prisma.domain.findUnique({
      where: { id: lastSession.domainId },
      select: { slug: true },
    });
    domainSlug = domain?.slug ?? null;
  }

  if (remainingQuestionIds.length === 0) {
    // A sprint generates its questions one at a time, so "nothing left in the
    // list" is its NORMAL state between answering one and being handed the next
    // — not an error. Left as a 400 this was terminal: the route always picks
    // the newest un-ended session, so one sprint abandoned after its last answer
    // would 400 every future resume, on every subject, permanently.
    if (lastSession.type === SPRINT_SESSION_TYPE) {
      const total = (metadata?.totalQuestions as number) ?? answeredIds.size;
      return NextResponse.json({
        sessionId: lastSession.id,
        type: lastSession.type,
        domainId: lastSession.domainId,
        domainSlug,
        duration: (metadata?.duration as number) || 0,
        startedAt: lastSession.startedAt,
        questions: [],
        totalQuestions: total,
        answeredQuestions: answeredIds.size,
        remainingQuestions: 0,
        // Tells the client to ask the server what comes next — or, once every
        // planned question is answered, to finish the session off.
        needsNext: answeredIds.size < total,
        finished: answeredIds.size >= total,
      });
    }
    return NextResponse.json({ error: "Session has no remaining questions" }, { status: 400 });
  }

  const found = await prisma.question.findMany({
    where: { id: { in: remainingQuestionIds } },
  });
  // `findMany ... in` returns rows in no guaranteed order. Restore the order the
  // session was built with — a sprint's questions are laid out as a difficulty
  // crescendo and its per-question clocks are index-aligned with them, so a
  // reshuffle here would both scramble the ramp and hand each question the wrong
  // time budget.
  const byId = new Map(found.map((q) => [q.id, q]));
  const questions = remainingQuestionIds
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  // Sprint only: carry the per-question time budget across the resume, sliced to
  // the questions that are actually left. Without this a resumed sprint silently
  // falls back to a single whole-session timer.
  const allSeconds = Array.isArray(metadata?.questionSeconds)
    ? (metadata.questionSeconds as number[])
    : null;
  const questionSeconds = allSeconds
    ? questions.map((q) => allSeconds[questionIds.indexOf(q.id)]).filter((n) => typeof n === "number")
    : undefined;

  return NextResponse.json({
    sessionId: lastSession.id,
    type: lastSession.type,
    domainId: lastSession.domainId,
    domainSlug,
    duration: (metadata?.duration as number) || 0,
    ...(questionSeconds && questionSeconds.length === questions.length
      ? { questionSeconds }
      : {}),
    startedAt: lastSession.startedAt,
    questions: questions.map((q) => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      content: q.content,
      options: q.options,
      imageUrl: q.imageUrl ?? null,
      passage: q.passage ?? null,
    })),
    // For a sprint this must be the PLANNED total. `questionIds.length` is only
    // "generated so far", which made a resumed sprint read "Întrebarea 8 din 8"
    // with 12 still to come, then run past its own total.
    totalQuestions:
      lastSession.type === SPRINT_SESSION_TYPE
        ? ((metadata?.totalQuestions as number) ?? questionIds.length)
        : questionIds.length,
    answeredQuestions: answeredIds.size,
    remainingQuestions: remainingQuestionIds.length,
  });
}

export const POST = withErrorHandler(_POST);
