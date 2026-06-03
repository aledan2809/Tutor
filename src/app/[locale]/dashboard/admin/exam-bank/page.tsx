import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { classifyPaperPoints, type ExamItemForScoring } from "@/lib/exam-bank/score";

// Banca de examene — listă (doar citire). Subiecte + bareme oficiale importate (ground-truth).
export default async function ExamBankPage() {
  const papers = await prisma.examPaper.findMany({
    orderBy: [{ subjectName: "asc" }, { year: "desc" }, { variant: "asc" }],
    include: {
      _count: { select: { items: true, passages: true } },
      items: { select: { type: true, points: true, hasFigure: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bancă examene</h1>
        <p className="mt-1 text-sm text-gray-400">
          Subiecte + bareme oficiale importate (răspunsuri 100% corecte, fără mesh). Doar citire —
          banca aceasta e separată de grilele generate și nu apare în demo-ul public.
        </p>
      </div>

      {papers.length === 0 ? (
        <p className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-6 text-center text-gray-400">
          Nicio simulare importată încă.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {papers.map((p) => {
            const b = classifyPaperPoints(p.items as ExamItemForScoring[]);
            return (
              <Link
                key={p.id}
                href={`/dashboard/admin/exam-bank/${p.id}`}
                className="block rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-blue-500 hover:bg-gray-700"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-white">{p.subjectName}</h2>
                  <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                    {p.examType} {p.year} · {p.variant}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{p.source}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-300">{p._count.items} întrebări</span>
                  <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-300">{p._count.passages} texte</span>
                  <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-300">
                    {p.maxScore}p ({p.officeBonus} oficiu)
                  </span>
                  {p.timeLimit ? (
                    <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-300">{p.timeLimit} min</span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-emerald-300">
                    {b.autoPoints}p se corectează singur
                  </span>
                  <span className="rounded bg-amber-900/40 px-2 py-0.5 text-amber-300">
                    {b.manualPoints}p notare manuală
                  </span>
                  <span className="rounded bg-rose-900/40 px-2 py-0.5 text-rose-300">
                    {b.figurePoints}p depind de figură
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
