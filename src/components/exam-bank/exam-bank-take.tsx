"use client";

import { useMemo, useState } from "react";
import {
  scoreExamPaper,
  answerKey,
  type ExamItemForScoring,
  type AnswerInput,
  type ScoreResult,
} from "@/lib/exam-bank/score";
import type { TakeItem } from "@/lib/exam-bank/sanitize";

type Passage = {
  ref: string;
  title: string | null;
  author: string | null;
  sourceNote: string | null;
  body: string;
};

// itemii completi întorși de rută după trimitere (cu chei + barem)
type FullItem = {
  id: string;
  section: string;
  label: string;
  type: string;
  points: number;
  content: string;
  options: { key: string; text: string }[] | null;
  correctAnswer: string | null;
  rubric: { label?: string; points?: number; answer?: string }[] | null;
  hasFigure: boolean;
  figureUrl: string | null;
  finalAnswer: string | null;
};

type ScoreResponse = {
  score: ScoreResult;
  items: FullItem[];
  officeBonus: number;
  maxScore: number;
  attemptId: string;
  finalCheck: Record<string, boolean>;
};

const TF = ["Adevărat", "Fals"];
const TYPE_LABEL: Record<string, string> = {
  MCQ: "grilă",
  TF_GRID: "adevărat/fals",
  SHORT: "răspuns scurt",
  FILL: "completare",
  OPEN: "rezolvare / compunere",
};
const isAuto = (type: string) => type === "MCQ" || type === "TF_GRID";

export function ExamBankTake({
  paperId,
  subjectName,
  examLabel,
  maxScore,
  officeBonus,
  timeLimit,
  items,
  passages,
}: {
  paperId: string;
  subjectName: string;
  examLabel: string;
  maxScore: number;
  officeBonus: number;
  timeLimit: number | null;
  items: TakeItem[];
  passages: Passage[];
}) {
  // toate stările sunt cheiate pe it.id (label-urile se repetă între subiecte)
  const [mcq, setMcq] = useState<Record<string, string>>({});
  const [grid, setGrid] = useState<Record<string, string[]>>({});
  const [open, setOpen] = useState<Record<string, string>>({});
  const [finalInput, setFinalInput] = useState<Record<string, string>>({}); // "rezultat final" tastat (Mate)
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [selfPts, setSelfPts] = useState<Record<string, number>>({}); // keyed by item id
  const [saved, setSaved] = useState(false);

  const sections = useMemo(() => groupBySection(items), [items]);

  // răspunsurile obiective trimise la server (cheiate prin answerKey, ca în motor)
  function buildObjectiveAnswers(): Record<string, AnswerInput> {
    const a: Record<string, AnswerInput> = {};
    for (const it of items) {
      const k = answerKey(it);
      if (it.type === "MCQ" && mcq[it.id]) a[k] = { kind: "objective", value: mcq[it.id] };
      else if (it.type === "TF_GRID" && grid[it.id]?.some(Boolean)) a[k] = { kind: "grid", cells: grid[it.id] };
    }
    return a;
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/exam-bank/${paperId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: buildObjectiveAnswers(), finalAnswers: finalInput }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = (await res.json()) as ScoreResponse;
      setResult(data);
      // pre-sugerează self-score plin pentru itemii cu rezultat final corect (editabil)
      const pre: Record<string, number> = {};
      for (const it of data.items) if (data.finalCheck?.[it.id]) pre[it.id] = it.points;
      setSelfPts(pre);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare la trimitere");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveFinal() {
    if (!result) return;
    try {
      const res = await fetch(`/api/exam-bank/attempt/${result.attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfScores: selfPts }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare la salvare");
    }
  }

  // recalcul live al notei (obiective auto + deschise auto-notate de elev), cheiat pe id via answerKey
  const liveScore: ScoreResult | null = useMemo(() => {
    if (!result) return null;
    const forScoring: ExamItemForScoring[] = result.items.map((it) => ({
      id: it.id,
      label: it.label,
      section: it.section,
      type: it.type,
      points: it.points,
      correctAnswer: it.correctAnswer,
      rubric: it.rubric,
      hasFigure: it.hasFigure,
    }));
    const answers: Record<string, AnswerInput> = {};
    for (const it of result.items) {
      const k = answerKey(it);
      if (it.type === "MCQ" && mcq[it.id]) answers[k] = { kind: "objective", value: mcq[it.id] };
      else if (it.type === "TF_GRID" && grid[it.id]?.some(Boolean)) answers[k] = { kind: "grid", cells: grid[it.id] };
      else if (it.id in selfPts) answers[k] = { kind: "self", awardedPoints: selfPts[it.id] };
    }
    return scoreExamPaper(forScoring, answers, { officeBonus: result.officeBonus, maxScore: result.maxScore });
  }, [result, mcq, grid, selfPts]);

  // ───────── REZULTATE ─────────
  if (result && liveScore) {
    const byId = new Map(result.items.map((i) => [i.id, i]));
    const scoredById = new Map(liveScore.items.map((s) => [s.id, s]));
    const ungraded = liveScore.items.filter((i) => i.graded === "ungraded").length;
    const autoPts = liveScore.items.filter((i) => i.graded === "auto").reduce((a, s) => a + s.awarded, 0);
    const selfP = liveScore.items.filter((i) => i.graded === "self").reduce((a, s) => a + s.awarded, 0);
    return (
      <div className="mx-auto max-w-3xl space-y-5 p-4">
        <div className="rounded-2xl border border-blue-500/40 bg-blue-500/5 p-6 text-center">
          <p className="text-sm text-gray-400">
            {subjectName} · {examLabel}
          </p>
          <p className="mt-2 text-5xl font-bold text-white">
            {liveScore.note10.toFixed(2)}
            <span className="text-2xl text-gray-500"> / 10</span>
          </p>
          {liveScore.isEstimate && (
            <p className="mt-1 text-sm text-amber-300">
              estimare — {ungraded} {ungraded === 1 ? "item nenotat" : "itemi nenotați"} (răspuns lipsă sau de auto-notat mai jos)
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            {liveScore.rawPoints} puncte + {liveScore.officeBonus} din oficiu
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Grile (corectate automat): <span className="text-emerald-300">{autoPts}p</span> · Rezolvări /
            compuneri (notate de tine): <span className="text-amber-300">{selfP}p</span>
          </p>
          <button
            onClick={saveFinal}
            disabled={saved}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saved ? "Salvat ✓" : "Salvează nota finală"}
          </button>
        </div>

        {/* pe subiecte */}
        <div className="flex flex-wrap gap-2 text-xs">
          {liveScore.sections.map((s) => (
            <span key={s.section} className="rounded bg-gray-800 px-2 py-1 text-gray-300">
              {s.section}: {s.awarded}/{s.max}p
            </span>
          ))}
        </div>

        {sections.map((sec) => (
          <section key={sec.name} className="space-y-3">
            <h2 className="text-lg font-semibold text-white">{sec.name}</h2>
            {sec.items.map((it) => {
              const full = byId.get(it.id);
              const isObjective = it.type === "MCQ" || it.type === "TF_GRID";
              const scored = scoredById.get(it.id);
              return (
                <div key={it.id} className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded bg-blue-600/30 px-2 py-0.5 font-semibold text-blue-300">{it.label}</span>
                    <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-400">{it.points}p</span>
                    {scored && (
                      <span
                        className={`rounded px-2 py-0.5 font-medium ${
                          scored.graded === "ungraded"
                            ? "bg-gray-700 text-gray-400"
                            : scored.awarded === it.points
                              ? "bg-emerald-900/50 text-emerald-300"
                              : scored.awarded > 0
                                ? "bg-amber-900/50 text-amber-300"
                                : "bg-rose-900/50 text-rose-300"
                        }`}
                      >
                        {scored.graded === "ungraded" ? "nenotat" : `${scored.awarded}/${it.points}p`}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-gray-200">{it.content}</p>
                  {it.figureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.figureUrl} alt={`Figură ${it.label}`} className="mt-2 max-h-72 rounded border border-gray-700 bg-white p-1" />
                  ) : null}

                  {/* MCQ review */}
                  {it.type === "MCQ" && it.options && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {it.options.map((o) => {
                        const correct = full?.correctAnswer === o.key;
                        const chosen = mcq[it.id] === o.key;
                        return (
                          <li
                            key={o.key}
                            className={
                              correct ? "text-emerald-400" : chosen ? "text-rose-400 line-through" : "text-gray-400"
                            }
                          >
                            <span className="mr-1 font-semibold">{o.key})</span>
                            {o.text}
                            {correct ? " ✓ (corect)" : chosen ? " ✗ (răspunsul tău)" : ""}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* TF_GRID review */}
                  {it.type === "TF_GRID" && full?.rubric && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {full.rubric.map((r, i) => {
                        const chosen = grid[it.id]?.[i];
                        const ok = chosen && r.answer && chosen.toLowerCase() === r.answer.toLowerCase();
                        return (
                          <li key={i} className={ok ? "text-emerald-400" : chosen ? "text-rose-400" : "text-gray-400"}>
                            {r.label} — corect: <strong>{r.answer}</strong>
                            {chosen ? ` · tu: ${chosen}${ok ? " ✓" : " ✗"}` : " · (necompletat)"}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* open: barem + auto-notare */}
                  {!isObjective && (
                    <div className="mt-2 space-y-2">
                      {open[it.id] ? (
                        <p className="rounded bg-gray-900 p-2 text-xs text-gray-400">
                          <span className="text-gray-500">Răspunsul tău: </span>
                          {open[it.id]}
                        </p>
                      ) : null}
                      {full?.correctAnswer ? (
                        <p className="text-sm text-emerald-400">
                          <span className="text-gray-500">Răspuns corect: </span>
                          {full.correctAnswer}
                        </p>
                      ) : null}
                      {full?.rubric && full.rubric.length > 0 && (
                        <div className="rounded border border-gray-700 bg-gray-900 p-2 text-xs text-gray-400">
                          <p className="mb-1 font-medium text-gray-500">Barem</p>
                          <ul className="space-y-1">
                            {full.rubric.map((r, i) => (
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
                      {it.id in result.finalCheck ? (
                        <p className={result.finalCheck[it.id] ? "text-sm text-emerald-400" : "text-sm text-rose-400"}>
                          Rezultat final: {result.finalCheck[it.id] ? "✓ corect" : "✗ greșit"}
                          {full?.finalAnswer ? ` (corect: ${full.finalAnswer})` : ""}
                          {result.finalCheck[it.id] ? (
                            <span className="block text-xs text-gray-500">
                              punctaj sugerat: maxim — scade dacă rezolvarea n-a fost completă
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      <label className="flex items-center gap-2 text-xs text-gray-400">
                        Notează-te după barem:
                        <select
                          value={it.id in selfPts ? String(selfPts[it.id]) : ""}
                          onChange={(e) => {
                            setSaved(false); // re-permite salvarea după ajustare
                            setSelfPts((s) => {
                              const next = { ...s };
                              if (e.target.value === "") delete next[it.id];
                              else next[it.id] = Number(e.target.value);
                              return next;
                            });
                          }}
                          className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-gray-200"
                        >
                          <option value="">— alege —</option>
                          {Array.from({ length: it.points + 1 }, (_, n) => (
                            <option key={n} value={n}>
                              {n} / {it.points} p
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ))}

        <p className="text-center text-xs text-gray-600">
          Notă estimată — itemii cu rezolvare îi notezi tu, după barem. (Încercarea nu se salvează încă.)
        </p>
      </div>
    );
  }

  // ───────── DE RĂSPUNS ─────────
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {subjectName} <span className="text-base font-normal text-gray-500">· {examLabel}</span>
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          {maxScore}p ({officeBonus} din oficiu){timeLimit ? ` · ${timeLimit} min` : ""} · răspunzi, apoi
          „Trimite” îți dă nota + baremul. Itemii cu rezolvare îi notezi tu, după barem.
        </p>
      </div>

      {passages.length > 0 && (
        <section className="space-y-2">
          {passages.map((p) => (
            <details key={p.ref} className="rounded-lg border border-gray-700 bg-gray-800 p-4">
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

      {sections.map((sec) => (
        <section key={sec.name} className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{sec.name}</h2>
          {sec.items.map((it) => (
            <div key={it.id} className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-blue-600/30 px-2 py-0.5 font-semibold text-blue-300">{it.label}</span>
                <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-400">{it.points}p</span>
                <span className="rounded bg-gray-700 px-2 py-0.5 text-gray-500">{TYPE_LABEL[it.type] ?? it.type}</span>
                {isAuto(it.type) ? (
                  <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-emerald-300">se corectează automat</span>
                ) : (
                  <span className="rounded bg-amber-900/40 px-2 py-0.5 text-amber-300">notare manuală</span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-200">{it.content}</p>
              {it.figureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.figureUrl} alt={`Figură ${it.label}`} className="mt-2 max-h-72 rounded border border-gray-700 bg-white p-1" />
              ) : null}

              {it.type === "MCQ" && it.options && (
                <div className="mt-2 space-y-1.5">
                  {it.options.map((o) => (
                    <label key={o.key} className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                      <input
                        type="radio"
                        name={`q-${it.id}`}
                        checked={mcq[it.id] === o.key}
                        onChange={() => setMcq((m) => ({ ...m, [it.id]: o.key }))}
                      />
                      <span className="font-semibold">{o.key})</span> {o.text}
                    </label>
                  ))}
                </div>
              )}

              {it.type === "TF_GRID" && it.cells && (
                <div className="mt-2 space-y-2">
                  {it.cells.map((cell, i) => (
                    <div key={i} className="text-sm text-gray-300">
                      <p>{cell}</p>
                      <div className="mt-1 flex gap-4">
                        {TF.map((v) => (
                          <label key={v} className="flex cursor-pointer items-center gap-1 text-xs">
                            <input
                              type="radio"
                              name={`q-${it.id}-${i}`}
                              checked={grid[it.id]?.[i] === v}
                              onChange={() =>
                                setGrid((g) => {
                                  const cells = [...(g[it.id] ?? [])];
                                  cells[i] = v;
                                  return { ...g, [it.id]: cells };
                                })
                              }
                            />
                            {v}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!["MCQ", "TF_GRID"].includes(it.type) && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={open[it.id] ?? ""}
                    onChange={(e) => setOpen((o) => ({ ...o, [it.id]: e.target.value }))}
                    placeholder="Scrie rezolvarea / răspunsul tău..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600"
                  />
                  {it.hasFinalAnswer ? (
                    <input
                      type="text"
                      value={finalInput[it.id] ?? ""}
                      onChange={(e) => setFinalInput((f) => ({ ...f, [it.id]: e.target.value }))}
                      placeholder="Rezultat final — doar numărul (ex: 14)"
                      className="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600"
                    />
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </section>
      ))}

      {error && <p className="text-center text-sm text-rose-400">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {submitting ? "Se corectează..." : "Trimite și vezi nota"}
      </button>
    </div>
  );
}

function groupBySection(items: TakeItem[]): { name: string; items: TakeItem[] }[] {
  const out: { name: string; items: TakeItem[] }[] = [];
  for (const it of items) {
    let s = out.find((x) => x.name === it.section);
    if (!s) {
      s = { name: it.section, items: [] };
      out.push(s);
    }
    s.items.push(it);
  }
  return out;
}
