import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { scoreExamPaper, type ExamItemForScoring, type AnswerInput } from "@/lib/exam-bank/score";

// POST /api/exam-bank/[paperId]/score
// Body: { answers: { [label]: AnswerInput } }  (objective answers from the take screen)
// Returns: server-computed objective score + the FULL items (keys + barem) for review/self-score.
// Stateless — does NOT persist the attempt (MVP; persistence = next slice).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { paperId } = await params;

  let body: { answers?: Record<string, AnswerInput>; finalAnswers?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const answers = body?.answers ?? {};
  const finalAnswers = body?.finalAnswers ?? {};

  const paper = await prisma.examPaper.findUnique({
    where: { id: paperId },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });
  if (!paper || !paper.isActive) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  const itemsForScoring: ExamItemForScoring[] = paper.items.map((it) => ({
    id: it.id, // answers are keyed by id (labels repeat across sections)
    label: it.label,
    section: it.section,
    type: it.type,
    points: it.points,
    correctAnswer: it.correctAnswer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rubric: (it.rubric as any) ?? null,
    hasFigure: it.hasFigure,
  }));

  const score = scoreExamPaper(itemsForScoring, answers, {
    officeBonus: paper.officeBonus,
    maxScore: paper.maxScore,
  });

  // „rezultat final" — auto-check ieftin pe itemii deschiși de Mate care au finalAnswer
  const norm = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, "").replace(/,/g, ".").replace(/−/g, "-").replace(/°/g, "");
  const finalCheck: Record<string, boolean> = {};
  for (const it of paper.items) {
    if (it.finalAnswer && finalAnswers[it.id]) {
      finalCheck[it.id] = norm(finalAnswers[it.id]) === norm(it.finalAnswer);
    }
  }

  // reveal keys + barem for client-side review + open-item self-scoring
  const items = paper.items.map((it) => ({
    id: it.id,
    section: it.section,
    label: it.label,
    type: it.type,
    points: it.points,
    content: it.content,
    options: it.options,
    correctAnswer: it.correctAnswer,
    rubric: it.rubric,
    hasFigure: it.hasFigure,
    figureUrl: it.figureUrl,
    finalAnswer: it.finalAnswer,
  }));

  // persistă încercarea (progres pentru părinte/profesor/meditator)
  const attempt = await prisma.examAttempt.create({
    data: {
      userId: session.user.id,
      paperId: paper.id,
      objectiveAnswers: answers as object,
      rawPoints: Math.round(score.rawPoints),
      note10: score.note10,
      isEstimate: score.isEstimate,
      status: "submitted",
    },
  });

  return NextResponse.json({
    score,
    items,
    officeBonus: paper.officeBonus,
    maxScore: paper.maxScore,
    attemptId: attempt.id,
    finalCheck,
  });
}
