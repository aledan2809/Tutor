"use client";

export interface SprintInfo {
  level: number;
  sessions: number;
  questionCount: number;
  firstSeconds: number;
  lastSeconds: number;
  difficultyLabel: string;
  pendingFeedbackSessionId: string | null;
}

interface SprintCardProps {
  sprint: SprintInfo;
  onStart: () => void;
  /** Sends the student to the debrief they still owe before a new run. */
  onResolveFeedback: (sessionId: string) => void;
  loading?: boolean;
}

/**
 * Entry point for "Sprint de calcul" — the timed chained-arithmetic drill.
 * It gets its own card rather than a tile in the generic grid because the run's
 * shape (which difficulty band, how the clock tightens) changes every session
 * and is the thing worth seeing before pressing start.
 */
export function SprintCard({ sprint, onStart, onResolveFeedback, loading = false }: SprintCardProps) {
  const pending = sprint.pendingFeedbackSessionId;

  return (
    <div className="mb-6 rounded-xl border-2 border-emerald-600 bg-emerald-600/5 p-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
          Gândire rapidă
        </span>
        {sprint.sessions > 0 && (
          <span className="text-xs text-gray-500">
            {sprint.sessions} {sprint.sessions === 1 ? "sesiune" : "sesiuni"} până acum
          </span>
        )}
      </div>

      <h3 className="mb-1 text-lg font-semibold text-white">🧮 Sprint de calcul</h3>
      <p className="mb-4 text-sm text-gray-400">
        Jumătate operații directe (22 × 34, 84 ÷ 12), jumătate lanțuri de operații,
        cu timp la fiecare. Timpul se strânge unde mergi repede și se lărgește unde
        te încurci — separat pentru înmulțiri, împărțiri, adunări și scăderi.
      </p>

      <dl className="mb-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-2">
          <dd className="text-lg font-bold text-white">{sprint.questionCount}</dd>
          <dt className="text-[11px] text-gray-500">exerciții</dt>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-2">
          <dd className="text-lg font-bold text-white">
            {sprint.firstSeconds}s → {sprint.lastSeconds}s
          </dd>
          <dt className="text-[11px] text-gray-500">timp pe exercițiu</dt>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-2">
          <dd className="truncate text-lg font-bold text-white" title={sprint.difficultyLabel}>
            {sprint.difficultyLabel}
          </dd>
          <dt className="text-[11px] text-gray-500">dificultate</dt>
        </div>
      </dl>

      {pending ? (
        <>
          <p className="mb-3 rounded-lg border border-amber-700/60 bg-amber-900/20 p-3 text-sm text-amber-200">
            Mai întâi spune-ne cum a fost sesiunea trecută — de asta depinde cât de
            grea o facem pe următoarea.
          </p>
          <button
            onClick={() => onResolveFeedback(pending)}
            className="min-h-[48px] w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            Răspunde la 2 întrebări
          </button>
        </>
      ) : (
        <button
          onClick={onStart}
          disabled={loading}
          className="min-h-[48px] w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Se pregătește…" : "Începe sprintul"}
        </button>
      )}
    </div>
  );
}
