import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { EXAM_LEVELS } from "@/lib/exam-level";

// Simulări (elev) — examene oficiale, grupate pe NIVEL → MATERIE → an, ca să fie ușor de găsit
// (ex. Evaluarea Națională / Matematică / 2024, Bacalaureat / Limba și literatura română / 2025).
const LEVEL_BLURB: Record<string, string> = {
  EN_VIII: "Subiecte reale (Evaluarea Națională), corectate după baremul oficial.",
  BAC: "Subiecte reale de Bacalaureat (proba scrisă), corectate după baremul oficial.",
};

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

  // Nest: examType (level) → subjectName → papers[] (already ordered subject asc, year desc).
  const byLevel = new Map<string, Map<string, typeof papers>>();
  for (const p of papers) {
    const subjects = byLevel.get(p.examType) ?? new Map<string, typeof papers>();
    const list = subjects.get(p.subjectName) ?? [];
    list.push(p);
    subjects.set(p.subjectName, list);
    byLevel.set(p.examType, subjects);
  }

  // Known levels first (EXAM_LEVELS order), then any other examType as a fallback section.
  const levelOrder = [
    ...EXAM_LEVELS.filter((l) => byLevel.has(l.key)).map((l) => ({ key: l.key, label: l.label })),
    ...Array.from(byLevel.keys())
      .filter((t) => !EXAM_LEVELS.some((l) => l.key === t))
      .map((t) => ({ key: t, label: t.replace("_", " ") })),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Simulări — examene oficiale</h1>
        <p className="mt-1 text-sm text-gray-400">
          Subiecte reale, corectate după baremul oficial. Răspunzi, trimiți și vezi nota estimată pe
          10. Itemii cu rezolvare îi notezi tu, după barem.
        </p>
      </div>

      {papers.length === 0 ? (
        <p className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-6 text-center text-gray-400">
          Nicio simulare disponibilă încă.
        </p>
      ) : (
        levelOrder.map((lvl) => {
          const subjects = Array.from(byLevel.get(lvl.key)!.entries()); // [subjectName, papers[]]
          return (
            <section key={lvl.key} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{lvl.label}</h2>
                {LEVEL_BLURB[lvl.key] ? (
                  <p className="text-xs text-gray-500">{LEVEL_BLURB[lvl.key]}</p>
                ) : null}
              </div>
              {subjects.map(([subjectName, subjectPapers]) => (
                <div key={subjectName} className="space-y-2">
                  <h3 className="text-sm font-semibold text-blue-300">{subjectName}</h3>
                  <div className="space-y-2 pl-1">
                    {subjectPapers.map((p) => (
                      <Link
                        key={p.id}
                        href={`/dashboard/exam-bank/${p.id}`}
                        className="flex items-center justify-between gap-4 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-blue-500 hover:bg-gray-700"
                      >
                        <div>
                          <h4 className="text-base font-semibold text-white">
                            {p.year} <span className="font-normal capitalize text-gray-400">· {p.variant}</span>
                          </h4>
                          <p className="text-xs text-gray-500">
                            {p._count.items} întrebări · {p.maxScore}p
                            {p.timeLimit ? ` · ${p.timeLimit} min` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                          Începe simularea
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          );
        })
      )}
    </div>
  );
}
