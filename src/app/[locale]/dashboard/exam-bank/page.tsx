import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

// Simulări (elev) — lista examenelor oficiale disponibile. Doar utilizator logat (gard în layout).
// Papers are grouped by exam level (Evaluarea Națională cl. VIII vs Bacalaureat IX–XII) so the
// two audiences don't see each other's papers mixed in one flat list.
const GROUPS: { examType: string; title: string; blurb: string }[] = [
  {
    examType: "EN_VIII",
    title: "Evaluarea Națională — clasa a VIII-a",
    blurb: "Subiecte reale (Evaluarea Națională), corectate după baremul oficial.",
  },
  {
    examType: "BAC",
    title: "Bacalaureat — clasele IX–XII",
    blurb: "Subiecte reale de Bacalaureat (proba scrisă), corectate după baremul oficial.",
  },
];

export default async function ExamBankStudentPage() {
  const papers = await prisma.examPaper.findMany({
    where: { isActive: true },
    orderBy: [{ subjectName: "asc" }, { year: "desc" }],
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

  // Known groups first (in GROUPS order), then any other examType as a fallback section.
  const byType = new Map<string, typeof papers>();
  for (const p of papers) {
    const list = byType.get(p.examType) ?? [];
    list.push(p);
    byType.set(p.examType, list);
  }
  const sections = [
    ...GROUPS.filter((g) => (byType.get(g.examType)?.length ?? 0) > 0).map((g) => ({
      ...g,
      papers: byType.get(g.examType)!,
    })),
    ...Array.from(byType.keys())
      .filter((t) => !GROUPS.some((g) => g.examType === t))
      .map((t) => ({ examType: t, title: t.replace("_", " "), blurb: "", papers: byType.get(t)! })),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4">
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
        sections.map((s) => (
          <section key={s.examType} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{s.title}</h2>
              {s.blurb ? <p className="text-xs text-gray-500">{s.blurb}</p> : null}
            </div>
            {s.papers.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/exam-bank/${p.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-blue-500 hover:bg-gray-700"
              >
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {p.subjectName} <span className="font-normal text-gray-400">· {p.year}</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    {p.variant} · {p._count.items} întrebări · {p.maxScore}p
                    {p.timeLimit ? ` · ${p.timeLimit} min` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                  Începe simularea
                </span>
              </Link>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
