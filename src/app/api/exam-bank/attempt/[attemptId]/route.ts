import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { scoreExamPaper, answerKey, type ExamItemForScoring, type AnswerInput } from "@/lib/exam-bank/score";

// PATCH /api/exam-bank/attempt/[attemptId]
// Body: { selfScores: { [itemId]: number } } — auto-notarea itemilor deschiși.
// Recalculează nota finală (obiective stocate + self) și marchează încercarea „finalized".
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { attemptId } = await params;

  let body: { selfScores?: Record<string, number> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const selfScores = body?.selfScores ?? {};

  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== session.user.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  const paper = await prisma.examPaper.findUnique({
    where: { id: attempt.paperId },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });
  if (!paper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  const itemsForScoring: ExamItemForScoring[] = paper.items.map((it) => ({
    id: it.id,
    label: it.label,
    section: it.section,
    type: it.type,
    points: it.points,
    correctAnswer: it.correctAnswer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rubric: (it.rubric as any) ?? null,
    hasFigure: it.hasFigure,
  }));

  // obiectivele stocate (cheiate deja prin answerKey) + auto-notarea deschiselor
  const answers: Record<string, AnswerInput> = {
    ...((attempt.objectiveAnswers as Record<string, AnswerInput>) ?? {}),
  };
  for (const it of paper.items) {
    if (it.id in selfScores) {
      answers[answerKey(it)] = { kind: "self", awardedPoints: selfScores[it.id] };
    }
  }

  const score = scoreExamPaper(itemsForScoring, answers, {
    officeBonus: paper.officeBonus,
    maxScore: paper.maxScore,
  });

  const updated = await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: {
      selfScores: selfScores as object,
      rawPoints: Math.round(score.rawPoints),
      note10: score.note10,
      isEstimate: score.isEstimate,
      status: "finalized",
    },
  });

  return NextResponse.json({ ok: true, note10: updated.note10, isEstimate: updated.isEstimate, status: updated.status });
}
