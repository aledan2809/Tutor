import { prisma } from "@/lib/prisma";
import { EXAM_LEVELS, EXAM_LEVEL_LABEL, stripLevelSuffix } from "@/lib/exam-level";
import { ExamBankBrowser, type SubjectGroup } from "@/components/exam-bank/exam-bank-browser";

// Simulări (elev) — examene oficiale. Categorie (nivel) → Subcategorie (materie) prin dropdown,
// ca la Grile, ca să nu se scroleze o listă lungă. O singură materie afișată o dată.
export default async function ExamBankStudentPage() {
  const papers = await prisma.examPaper.findMany({
    where: { isActive: true },
    orderBy: [{ subjectName: "asc" }, { year: "desc" }, { variant: "asc" }],
    select: {
      id: true,
      subjectName: true,
      examType: true,
      year: true,
      variant: true,
      maxScore: true,
      timeLimit: true,
      _count: { select: { items: true } },
    },
  });

  // Group by (examType, subjectName) → SubjectGroup, ordered by EXAM_LEVELS then subject asc.
  const map = new Map<string, SubjectGroup>();
  for (const p of papers) {
    const key = `${p.examType}::${p.subjectName}`;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        level: p.examType,
        levelLabel: EXAM_LEVEL_LABEL[p.examType as keyof typeof EXAM_LEVEL_LABEL] ?? p.examType.replace("_", " "),
        subjectDisplay: stripLevelSuffix(p.subjectName),
        papers: [],
      };
      map.set(key, g);
    }
    g.papers.push({
      id: p.id,
      year: p.year,
      variant: p.variant,
      items: p._count.items,
      maxScore: p.maxScore,
      timeLimit: p.timeLimit,
    });
  }

  // Known levels first (EXAM_LEVELS order), then any other examType as a fallback.
  const levelRank = (lvl: string) => {
    const i = EXAM_LEVELS.findIndex((l) => l.key === lvl);
    return i === -1 ? EXAM_LEVELS.length : i;
  };
  const groups = Array.from(map.values()).sort(
    (a, b) => levelRank(a.level) - levelRank(b.level) || a.subjectDisplay.localeCompare(b.subjectDisplay, "ro")
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Simulări — examene oficiale</h1>
        <p className="mt-1 text-sm text-gray-400">
          Subiecte reale, corectate după baremul oficial. Răspunzi, trimiți și vezi nota estimată pe
          10. Itemii cu rezolvare îi notezi tu, după barem.
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-6 text-center text-gray-400">
          Nicio simulare disponibilă încă.
        </p>
      ) : (
        <ExamBankBrowser groups={groups} />
      )}
    </div>
  );
}
