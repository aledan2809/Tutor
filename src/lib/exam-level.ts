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

const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** The words that identify a subject: folded, whole words of 5+ letters („romana”, „matematica”, „limba”). */
const keyWords = (s: string) => fold(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 5);

/**
 * The Simulări group of a subject (ExamPaper has no domain, only a level and a subject name): the
 * same exam level, and the subject's name without its level suffix equals the paper's subject, or all
 * the identifying words of one appear among the other's („Română” ⊂ „Limba și literatura română”),
 * diacritics ignored. Null when the subject has no official papers — the „Simulări” step is then not
 * offered for it. A general subject over several papers („Matematica IX-XII” vs M1/M2/M3) gets the
 * first of them in the given order: only a preselection, the list stays open.
 */
export function simulationGroupKeyFor(
  domain: { slug: string; name: string },
  groups: readonly { key: string; level: string; subjectDisplay: string }[],
): string | null {
  const level = classifyDomainSlug(domain.slug);
  if (!level) return null;
  const name = fold(stripLevelSuffix(domain.name));
  if (!name) return null;
  const sameLevel = groups.filter((g) => examTypeToLevel(g.level) === level && fold(g.subjectDisplay) !== "");
  const exact = sameLevel.find((g) => fold(g.subjectDisplay) === name);
  if (exact) return exact.key;
  const words = keyWords(name);
  if (words.length === 0) return null;
  const loose = sameLevel.find((g) => {
    const paper = keyWords(g.subjectDisplay);
    return paper.length > 0 && (words.every((w) => paper.includes(w)) || paper.every((w) => words.includes(w)));
  });
  return loose?.key ?? null;
}
