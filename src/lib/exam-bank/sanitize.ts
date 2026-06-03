/**
 * Sanitize exam-bank items for the student "take" phase — strip the answer key.
 *
 * The take screen must NOT receive `correctAnswer` / barem answers (they'd be visible
 * in devtools). For TF_GRID we still need the statements (the student marks A/F), so we
 * surface them as `cells` WITHOUT their answers. Keys are revealed only by the scoring
 * route after submit (official content is public anyway, but we don't show it during the exam).
 */
import type { ExamItemForScoring } from "./score";

export interface TakeItem {
  id: string;
  section: string;
  label: string;
  orderIndex: number;
  type: string;
  points: number;
  content: string;
  options: { key: string; text: string }[] | null;
  cells: string[] | null; // TF_GRID statements (answers stripped)
  passageRef: string | null;
  hasFigure: boolean;
  figureUrl: string | null;
  hasFinalAnswer: boolean; // whether to show a "rezultat final" input (value NEVER sent)
}

interface RawItem extends ExamItemForScoring {
  id: string;
  orderIndex: number;
  content: string;
  options?: unknown;
  passageRef?: string | null;
  figureUrl?: string | null;
  finalAnswer?: string | null;
}

export function sanitizeForTake(items: RawItem[]): TakeItem[] {
  return items.map((it) => {
    const options = Array.isArray(it.options) ? (it.options as { key: string; text: string }[]) : null;
    let cells: string[] | null = null;
    if (it.type === "TF_GRID" && Array.isArray(it.rubric)) {
      // keep ALL rows in rubric order — the take UI index must align with the engine's rubric[i]
      cells = it.rubric.map((r) => r?.label ?? "");
    }
    return {
      id: it.id,
      section: it.section,
      label: it.label,
      orderIndex: it.orderIndex,
      type: it.type,
      points: it.points,
      content: it.content,
      options,
      cells,
      passageRef: it.passageRef ?? null,
      hasFigure: !!it.hasFigure,
      figureUrl: it.figureUrl ?? null,
      hasFinalAnswer: !!it.finalAnswer,
    };
  });
}
