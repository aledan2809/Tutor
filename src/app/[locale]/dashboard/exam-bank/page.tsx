import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

// Simulări (elev) — lista examenelor oficiale disponibile. Doar utilizator logat (gard în layout).
export default async function ExamBankStudentPage() {
  const papers = await prisma.examPaper.findMany({
    where: { isActive: true },
    orderBy: [{ subjectName: "asc" }, { year: "desc" }],
    select: {
      id: true,
      subjectName: true,
      examType: true,
      year: true,
      maxScore: true,
      timeLimit: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Simulări — examene oficiale</h1>
        <p className="mt-1 text-sm text-gray-400">
          Subiecte reale (Evaluarea Națională), corectate după baremul oficial. Răspunzi, trimiți și
          vezi nota estimată pe 10. Itemii cu rezolvare îi notezi tu, după barem.
        </p>
      </div>

      {papers.length === 0 ? (
        <p className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-6 text-center text-gray-400">
          Nicio simulare disponibilă încă.
        </p>
      ) : (
        <div className="space-y-3">
          {papers.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/exam-bank/${p.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-blue-500 hover:bg-gray-700"
            >
              <div>
                <h2 className="text-lg font-semibold text-white">{p.subjectName}</h2>
                <p className="text-xs text-gray-500">
                  {p.examType.replace("_", " ")} {p.year} · {p._count.items} întrebări · {p.maxScore}p
                  {p.timeLimit ? ` · ${p.timeLimit} min` : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                Începe simularea
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
