import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { classifyPaperPoints, type ExamItemForScoring } from "@/lib/exam-bank/score";

type Opt = { key: string; text: string };
type RubricRow = { label?: string; points?: number; answer?: string };

const TYPE_LABEL: Record<string, string> = {
  MCQ: "grilă",
  TF_GRID: "adevărat/fals",
  SHORT: "răspuns scurt",
  FILL: "completare",
  OPEN: "deschis",
};

// Banca de examene — detaliu unui subiect (doar citire).
export default async function ExamPaperDetailPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;
  const paper = await prisma.examPaper.findUnique({
    where: { id: paperId },
    include: {
      passages: { orderBy: { orderIndex: "asc" } },
      items: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!paper) notFound();

  const b = classifyPaperPoints(paper.items as ExamItemForScoring[]);

  // group items by section, preserving order
  const sections: { name: string; items: typeof paper.items }[] = [];
  for (const it of paper.items) {
    let s = sections.find((x) => x.name === it.section);
    if (!s) {
      s = { name: it.section, items: [] };
      sections.push(s);
    }
    s.items.push(it);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/admin/exam-bank" className="text-sm text-blue-400 hover:underline">
          ← Bancă examene
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">
          {paper.subjectName} — {paper.examType} {paper.year}
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          {paper.source}
          {paper.license ? ` · ${paper.license}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-300">
            {paper.maxScore}p ({paper.officeBonus} oficiu)
          </span>
          {paper.timeLimit ? (
            <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-300">{paper.timeLimit} min</span>
          ) : null}
          <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-300">{paper.items.length} întrebări</span>
          <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-300">{paper.passages.length} texte</span>
        </div>
        {/* defalcarea punctelor (din motorul de scoring) */}
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
      </div>

      {/* texte de lectură */}
      {paper.passages.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Texte de lectură</h2>
          {paper.passages.map((p) => (
            <details key={p.id} className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-200">
                {p.ref}
                {p.title ? ` — ${p.title}` : ""}
                {p.author ? ` (${p.author})` : ""}
              </summary>
              {p.sourceNote ? <p className="mt-1 text-xs text-gray-500">{p.sourceNote}</p> : null}
              <p className="mt-2 whitespace-pre-line text-sm text-gray-400">{p.body}</p>
            </details>
          ))}
        </section>
      )}

      {/* întrebări pe subiecte */}
      {sections.map((sec) => (
        <section key={sec.name} className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{sec.name}</h2>
          {sec.items.map((it) => {
            const options = Array.isArray(it.options) ? (it.options as Opt[]) : null;
            const rubric = Array.isArray(it.rubric) ? (it.rubric as RubricRow[]) : null;
            return (
              <div key={it.id} className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-blue-600/30 px-2 py-0.5 font-semibold text-blue-300">{it.label}</span>
                  <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-300">{it.points}p</span>
                  <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-400">{TYPE_LABEL[it.type] ?? it.type}</span>
                  {it.autoGradable ? (
                    <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-emerald-300">se corectează singur</span>
                  ) : null}
                  {it.hasFigure ? (
                    <span className="rounded bg-rose-900/40 px-2 py-0.5 text-rose-300">are figură</span>
                  ) : null}
                  {it.topic ? <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-400">{it.topic}</span> : null}
                  {it.passageRef ? <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-400">↪ {it.passageRef}</span> : null}
                </div>

                <p className="mt-2 whitespace-pre-line text-sm text-gray-200">{it.content}</p>

                {options && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {options.map((o) => {
                      const correct = it.correctAnswer && o.key === it.correctAnswer;
                      return (
                        <li
                          key={o.key}
                          className={correct ? "font-medium text-emerald-400" : "text-gray-400"}
                        >
                          <span className="mr-1 font-semibold">{o.key})</span>
                          {o.text}
                          {correct ? " ✓" : ""}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {!options && it.correctAnswer ? (
                  <p className="mt-2 text-sm text-emerald-400">
                    <span className="text-gray-500">Răspuns corect: </span>
                    {it.correctAnswer}
                  </p>
                ) : null}

                {it.hasFigure && it.figureNote ? (
                  <p className="mt-2 text-xs text-rose-300/80">
                    <span className="text-gray-500">Figură: </span>
                    {it.figureNote}
                  </p>
                ) : null}

                {rubric && rubric.length > 0 && (
                  <div className="mt-2 rounded border border-gray-700 bg-gray-900 p-2 text-xs text-gray-400">
                    <p className="mb-1 font-medium text-gray-500">Barem</p>
                    <ul className="space-y-1">
                      {rubric.map((r, i) => (
                        <li key={i}>
                          <span className="font-semibold text-gray-300">
                            {r.label ? `${r.label} ` : ""}
                            {typeof r.points === "number" ? `(${r.points}p) ` : ""}
                          </span>
                          {r.answer}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
