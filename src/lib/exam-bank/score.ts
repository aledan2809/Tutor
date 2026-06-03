/**
 * Exam-bank barem scoring engine (slice 2).
 *
 * Pure functions — no DB, no network, no API cost. Grades an official exam paper
 * the way a teacher would, following the official barem:
 *   - objective items (MCQ / true-false grid) are auto-graded from the answer key;
 *   - open items (essays, full-solution problems) are self-scored (human supplies points);
 *   - raw points (out of 90) + 10 office points → note on a 1–10 scale.
 * For a partial selection of items it EXTRAPOLATES the note and flags it `isEstimate`.
 *
 * Note: gradability ≠ renderability. A Math "Subiectul II" item has a figure
 * (can't be shown in the player yet) but still has a letter key, so once an answer
 * is supplied it IS auto-gradable here.
 */

export interface ExamItemForScoring {
  id?: string; // unique id; answers are keyed by answerKey(item) = id ?? "section::label"
  label: string;
  section: string;
  type: string; // "MCQ" | "TF_GRID" | "SHORT" | "FILL" | "OPEN"
  points: number;
  correctAnswer?: string | null;
  rubric?: Array<{ label?: string; points?: number; answer?: string }> | null;
  hasFigure?: boolean | null;
}

/** The key under which an item's answer is stored. Unique per item even when `label`
 *  repeats across sections (Math numbers 1..6 in each of Subiectul I/II/III). */
export function answerKey(it: { id?: string | null; section: string; label: string }): string {
  return it.id ?? `${it.section}::${it.label}`;
}

export type AnswerInput =
  | { kind: "objective"; value: string } // MCQ letter ("c") or short exact text
  | { kind: "grid"; cells: string[] } // TF_GRID, aligned to rubric order
  | { kind: "self"; awardedPoints: number }; // open / free-text: human-assigned

export type GradedHow = "auto" | "self" | "ungraded";

export interface ScoredItem {
  id?: string;
  label: string;
  section: string;
  awarded: number;
  max: number;
  graded: GradedHow;
}

export interface SectionScore {
  section: string;
  awarded: number;
  max: number;
}

export interface ScoreResult {
  items: ScoredItem[];
  sections: SectionScore[];
  rawPoints: number; // sum of awarded item points (0..maxPoints)
  maxPoints: number; // sum of all item points considered (90 for a full paper)
  attemptedMax: number; // sum of max over items actually graded (auto or self)
  officeBonus: number;
  totalPoints: number; // rawPoints + officeBonus (full paper)
  note10: number; // 1.00 .. 10.00, rounded 2 decimals
  isEstimate: boolean; // true when not all items were graded (extrapolated)
}

const AUTO_TYPES = new Set(["MCQ", "TF_GRID"]);

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Award points for a single item given its answer. */
function gradeItem(item: ExamItemForScoring, answer: AnswerInput | undefined): { awarded: number; graded: GradedHow } {
  if (!answer) return { awarded: 0, graded: "ungraded" };

  if (item.type === "MCQ") {
    if (answer.kind !== "objective" || !item.correctAnswer) return { awarded: 0, graded: "ungraded" };
    return { awarded: norm(answer.value) === norm(item.correctAnswer) ? item.points : 0, graded: "auto" };
  }

  if (item.type === "TF_GRID") {
    if (answer.kind !== "grid" || !Array.isArray(item.rubric)) return { awarded: 0, graded: "ungraded" };
    let got = 0;
    item.rubric.forEach((cell, i) => {
      const expected = cell.answer ?? "";
      const given = answer.cells[i] ?? "";
      if (expected && norm(given) === norm(expected)) got += cell.points ?? 0;
    });
    return { awarded: Math.min(got, item.points), graded: "auto" };
  }

  // open / free-text (OPEN, FILL, SHORT): human self-score
  if (answer.kind === "self") {
    const clamped = Math.max(0, Math.min(item.points, answer.awardedPoints));
    return { awarded: clamped, graded: "self" };
  }
  return { awarded: 0, graded: "ungraded" };
}

/**
 * Score a paper. `answers` is keyed by item.label.
 * opts.officeBonus default 10, opts.maxScore default 100 (→ item points cap = maxScore - officeBonus).
 */
export function scoreExamPaper(
  items: ExamItemForScoring[],
  answers: Record<string, AnswerInput>,
  opts: { officeBonus?: number; maxScore?: number } = {}
): ScoreResult {
  const officeBonus = opts.officeBonus ?? 10;
  const maxScore = opts.maxScore ?? 100;
  const itemPointCap = maxScore - officeBonus;

  const scored: ScoredItem[] = items.map((it) => {
    const { awarded, graded } = gradeItem(it, answers[answerKey(it)]);
    return { id: it.id, label: it.label, section: it.section, awarded, max: it.points, graded };
  });

  const rawPoints = scored.reduce((a, s) => a + s.awarded, 0);
  const maxPoints = items.reduce((a, it) => a + it.points, 0);
  const attemptedMax = scored.reduce((a, s) => (s.graded === "ungraded" ? a : a + s.max), 0);

  // sections in first-seen order
  const sectionOrder: string[] = [];
  const secMap = new Map<string, SectionScore>();
  for (const s of scored) {
    if (!secMap.has(s.section)) {
      secMap.set(s.section, { section: s.section, awarded: 0, max: 0 });
      sectionOrder.push(s.section);
    }
    const sec = secMap.get(s.section)!;
    sec.awarded += s.awarded;
    sec.max += s.max;
  }
  const sections = sectionOrder.map((name) => secMap.get(name)!);

  const scaleDiv = maxScore > 0 ? maxScore / 10 : 1; // 100-point paper → /10; guard div-by-zero on a misconfigured maxScore
  const everythingGraded = attemptedMax >= maxPoints && maxPoints > 0;
  let note10: number;
  let isEstimate: boolean;
  if (everythingGraded) {
    note10 = (rawPoints + officeBonus) / scaleDiv;
    isEstimate = false;
  } else if (attemptedMax > 0) {
    // extrapolate the attempted ratio onto the full paper, then add office bonus
    note10 = ((rawPoints / attemptedMax) * itemPointCap + officeBonus) / scaleDiv;
    isEstimate = true;
  } else {
    note10 = officeBonus / scaleDiv; // nothing attempted → office bonus only
    isEstimate = true;
  }
  note10 = Math.max(1, Math.min(10, round2(note10)));

  return {
    items: scored,
    sections,
    rawPoints: round2(rawPoints),
    maxPoints,
    attemptedMax,
    officeBonus,
    totalPoints: round2(rawPoints + officeBonus),
    note10,
    isEstimate,
  };
}

export interface PaperPointsBreakdown {
  autoPoints: number; // objective, no figure — graded automatically
  figurePoints: number; // depend on a figure (not renderable yet)
  manualPoints: number; // open / free-text — manual (self/teacher) scoring
  total: number;
}

/** For the admin view: how the 90 paper points split by how they get graded. */
export function classifyPaperPoints(items: ExamItemForScoring[]): PaperPointsBreakdown {
  let autoPoints = 0;
  let figurePoints = 0;
  let manualPoints = 0;
  for (const it of items) {
    if (it.hasFigure) figurePoints += it.points;
    else if (AUTO_TYPES.has(it.type)) autoPoints += it.points;
    else manualPoints += it.points;
  }
  return { autoPoints, figurePoints, manualPoints, total: autoPoints + figurePoints + manualPoints };
}
