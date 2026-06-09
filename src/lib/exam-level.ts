// Single source of truth for grouping school content by exam level — used by the homepage
// demo dropdown, the logged-in Grile picker, and the Simulări list. Non-curriculum verticals
// (Aviation, Drept, demo Istorie) do not classify → callers hide them.

export type ExamLevel = "EN_VIII" | "BAC";

export const EXAM_LEVELS: { key: ExamLevel; label: string }[] = [
  { key: "EN_VIII", label: "Evaluarea Națională — clasa a VIII-a" },
  { key: "BAC", label: "Bacalaureat" },
];

export const EXAM_LEVEL_LABEL: Record<ExamLevel, string> = {
  EN_VIII: "Evaluarea Națională — clasa a VIII-a",
  BAC: "Bacalaureat",
};

// Domain slug → level. Convention: *-v-viii / *cl-viii = Evaluarea Națională; *-ix-xii = Bacalaureat.
// New curriculum domains classify automatically by following the naming convention.
export function classifyDomainSlug(slug: string): ExamLevel | null {
  if (/(?:-v-viii|cl-viii)$/.test(slug)) return "EN_VIII";
  if (/-ix-xii$/.test(slug)) return "BAC";
  return null;
}

// ExamPaper.examType → level (for the Simulări list).
export function examTypeToLevel(examType: string): ExamLevel | null {
  if (examType === "EN_VIII") return "EN_VIII";
  if (examType === "BAC") return "BAC";
  return null;
}

// Leaf label shown UNDER a level group — strip the level suffix the group header already conveys
// ("Română — Bacalaureat" → "Română", "Matematica cl. VIII" → "Matematica").
export function stripLevelSuffix(name: string): string {
  const d = name
    .replace(/\s*[—–-]\s*Bacalaureat$/i, "")
    .replace(/\s+cl\.?\s*VIII$/i, "")
    .replace(/\s+(?:V-VIII|IX-XII)$/i, "")
    .trim();
  return d || name;
}
