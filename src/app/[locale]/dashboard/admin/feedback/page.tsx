"use client";

import { useState, useEffect, useCallback } from "react";

interface Row {
  id: string;
  status: string;
  reviewAction: string | null;
  overridden: boolean;
  comment: string | null;
  createdAt: string;
  domainName: string | null;
  questionStatus: string | null;
  questionPreview: string;
  studentName: string;
}

interface Detail {
  id: string;
  status: string;
  comment: string | null;
  resolution: string | null;
  reviewAction: string | null;
  reviewIssue: string | null;
  correctedAnswer: string | null;
  overrideNote: string | null;
  overriddenAt: string | null;
  needsAdmin: boolean;
  isAuto: boolean;
  student: { name: string | null; email: string | null };
  question: {
    id: string;
    content: string;
    options: string[];
    correctAnswer: string;
    explanation: string | null;
    status: string;
    domainSlug: string | null;
    domainName: string | null;
  };
  provenance: {
    sectionTopic: string | null;
    chapterIndex: number | null;
    pdfPage: number | null;
    bookPage: number | null;
    qNumberInBook: number | null;
    sourceReference: string | null;
    quote: string | null;
    docUrl: string | null;
  };
}

const ACTION_LABEL: Record<string, { label: string; cls: string }> = {
  corrected: { label: "Corectat automat", cls: "bg-green-500/15 text-green-400" },
  hidden: { label: "Ascuns automat", cls: "bg-amber-500/15 text-amber-400" },
  flagged: { label: "Necesită admin", cls: "bg-red-500/15 text-red-400" },
  dismissed: { label: "Respins", cls: "bg-gray-500/15 text-gray-400" },
  overridden: { label: "Revizuit de admin", cls: "bg-blue-500/15 text-blue-400" },
};

function ActionBadge({ action }: { action: string | null }) {
  if (!action) return <span className="text-xs text-gray-500">nou</span>;
  const a = ACTION_LABEL[action] ?? { label: action, cls: "bg-gray-700 text-gray-300" };
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${a.cls}`}>{a.label}</span>;
}

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "flagged" | "new">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/feedback")
      .then((r) => r.json())
      .then((d) => setRows(d.feedbacks ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((r) =>
    filter === "all"
      ? true
      : filter === "flagged"
      ? r.reviewAction === "flagged"
      : r.status === "new"
  );

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-white">Feedback elevi (👎)</h2>
      <p className="mb-4 text-sm text-gray-400">
        Fiecare reclamație: ce a văzut elevul, ce a semnalat, ce decizie s-a luat
        și de ce. Poți confirma sau suprascrie decizia.
      </p>

      <div className="mb-4 flex gap-2 text-sm">
        {([
          ["all", "Toate"],
          ["flagged", "Necesită admin"],
          ["new", "Neprocesate"],
        ] as const).map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded px-3 py-1 ${
              filter === k ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Se încarcă…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">Niciun feedback.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setOpenId(r.id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-left hover:bg-gray-800/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{r.questionPreview}</p>
                <p className="truncate text-xs text-gray-400">
                  {r.studentName} · {r.domainName ?? "—"}
                  {r.comment ? ` · „${r.comment.slice(0, 50)}"` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.overridden && (
                  <span className="rounded bg-blue-500/15 px-2 py-0.5 text-xs text-blue-400">
                    revizuit
                  </span>
                )}
                <ActionBadge action={r.reviewAction} />
              </div>
            </button>
          ))}
        </div>
      )}

      {openId && (
        <FeedbackDetailModal
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => {
            setOpenId(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function FeedbackDetailModal({
  id,
  onClose,
  onChanged,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/feedback/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setD(data);
        setAnswer(data?.question?.correctAnswer ?? "");
      });
  }, [id]);

  async function override(action: string, correctAnswer?: string) {
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/admin/feedback/${id}/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, correctAnswer, note: note || undefined }),
    });
    setBusy(false);
    if (r.ok) onChanged();
    else {
      const j = await r.json().catch(() => ({}));
      setErr(j.error === "answer_not_an_option" ? "Răspunsul trebuie să fie una dintre opțiuni." : "Nu am putut aplica.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <div className="mt-8 w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-900 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Detaliu feedback</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">Închide</button>
        </div>

        {!d ? (
          <p className="text-gray-500">Se încarcă…</p>
        ) : (
          <div className="space-y-4 text-sm">
            {/* Question + correct answer as presented */}
            <section>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Întrebarea (cum a văzut-o elevul)</p>
              <p className="text-white">{d.question.content}</p>
              <ul className="mt-2 space-y-1">
                {d.question.options.map((o, i) => (
                  <li
                    key={i}
                    className={`rounded px-2 py-1 ${
                      o === d.question.correctAnswer
                        ? "bg-green-500/15 text-green-300"
                        : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    {o === d.question.correctAnswer ? "✓ " : ""}
                    {o}
                  </li>
                ))}
              </ul>
              {d.question.explanation && (
                <p className="mt-2 text-xs text-gray-400">Explicație: {d.question.explanation}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Stare întrebare: <strong className="text-gray-300">{d.question.status}</strong> ·{" "}
                {d.question.domainName}
              </p>
            </section>

            {/* Student complaint */}
            <section>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Problema semnalată de elev</p>
              <p className="rounded border-l-2 border-red-500/50 bg-gray-800 px-3 py-2 text-gray-200">
                {d.comment ? `„${d.comment}"` : "(fără comentariu)"}
              </p>
              <p className="mt-1 text-xs text-gray-500">— {d.student.name ?? d.student.email ?? "elev"}</p>
            </section>

            {/* Decision + justification */}
            <section>
              <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                Decizia <ActionBadge action={d.reviewAction} />
                {d.needsAdmin && <span className="text-red-400">(necesită supervizare admin)</span>}
                {d.isAuto && <span className="text-gray-500">(rezolvat automat)</span>}
              </p>
              {d.reviewIssue && <p className="text-gray-300">Problemă identificată: {d.reviewIssue}</p>}
              {d.resolution && <p className="mt-1 text-gray-400">{d.resolution}</p>}
              {d.overrideNote && (
                <p className="mt-1 text-blue-300">Notă admin: {d.overrideNote}</p>
              )}
            </section>

            {/* Source provenance */}
            <section>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Sursă / trimitere la text</p>
              {d.provenance.quote && (
                <p className="border-l-2 border-gray-600 pl-3 text-sm italic text-gray-300">
                  {`„${d.provenance.quote}"`}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {d.provenance.sectionTopic && <>Secțiune: {d.provenance.sectionTopic} · </>}
                {d.provenance.chapterIndex != null && <>Cap. {d.provenance.chapterIndex} · </>}
                {d.provenance.pdfPage != null && <>pagina {d.provenance.pdfPage} · </>}
                {d.provenance.qNumberInBook != null && <>întrebarea {d.provenance.qNumberInBook} · </>}
                {d.provenance.sourceReference && !d.provenance.quote && <>{d.provenance.sourceReference}</>}
              </p>
              {d.provenance.docUrl && (
                <a
                  href={d.provenance.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-blue-400 underline"
                >
                  Deschide documentul la pagina {d.provenance.pdfPage ?? ""}
                </a>
              )}
              {!d.provenance.quote && !d.provenance.sourceReference && (
                <p className="text-xs text-gray-500">(fără referință de sursă)</p>
              )}
            </section>

            {/* Override controls */}
            <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Suprascrie decizia</p>
              <div className="mb-2 flex items-center gap-2">
                <select
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-white"
                >
                  {d.question.options.map((o, i) => (
                    <option key={i} value={o}>{o}</option>
                  ))}
                </select>
                <button
                  onClick={() => override("set_answer", answer)}
                  disabled={busy}
                  className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  Setează răspuns corect
                </button>
              </div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Notă (opțional)"
                className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-white placeholder-gray-500"
              />
              <div className="flex flex-wrap gap-2">
                {d.question.status !== "PUBLISHED" && (
                  <button onClick={() => override("publish")} disabled={busy} className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-500 disabled:opacity-50">
                    Repune în practică
                  </button>
                )}
                {d.question.status === "PUBLISHED" && (
                  <button onClick={() => override("hide")} disabled={busy} className="rounded bg-amber-600 px-3 py-1 text-white hover:bg-amber-500 disabled:opacity-50">
                    Ascunde din practică
                  </button>
                )}
                <button onClick={() => override("dismiss")} disabled={busy} className="rounded border border-gray-600 px-3 py-1 text-gray-300 hover:bg-gray-800 disabled:opacity-50">
                  Confirmă decizia (fără schimbare)
                </button>
              </div>
              {err && <p className="mt-2 text-amber-400">{err}</p>}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
