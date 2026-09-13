/**
 * Decides whether a `/session/complete` HTTP response is safe to show as
 * results, or must be dropped.
 *
 * Pulled out as a pure function (no fetch, no React state) because the rule
 * it encodes is easy to get backwards in the component: `POST /session/complete`
 * can legitimately be called TWICE for the same session — the overall session
 * clock and "this was the last question" can both decide to end it within
 * moments of each other (the clock can run out while the last answer is still
 * in flight). The server's response to the second call is
 * `{ error: "Session already completed" }`, status 400 — no score, no
 * duration. Handing that straight to the results screen (`SessionResults`)
 * renders `Math.round(undefined)` as `NaN%`, `undefined - undefined` as `NaN`,
 * and `Math.floor(undefined / 60)` as `NaN:NaN` — exactly what a student saw
 * after two sessions in a row.
 *
 * The client-side call site (`ActiveSessionPage`) is expected to prevent the
 * SECOND request from ever being sent in the first place (a ref-based latch,
 * since this is a client concern, not something a pure function can hold
 * state for) — this function is the second line of defence: even if a
 * response with no usable numbers reaches here for any reason, it is refused
 * rather than passed through.
 */
export interface SessionCompletion {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  duration: number;
  gamification?: {
    xpAwarded: number;
    totalXp: number;
    level: string;
    levelUp: boolean;
    newAchievements: string[];
  } | null;
  sprintFeedbackRequired?: boolean;
  timedOut?: number;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * `ok` is the response's HTTP status; `body` is its already-parsed JSON.
 * Returns the completion data to show, or `null` when it must be dropped
 * (an error envelope, or — belt and suspenders — a 200 that is somehow
 * missing a numeric field a future bug could produce).
 */
export function resolveSessionCompletion(ok: boolean, body: unknown): SessionCompletion | null {
  if (!ok || typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (!isFiniteNumber(b.score) || !isFiniteNumber(b.totalQuestions)) return null;
  if (!isFiniteNumber(b.correctAnswers) || !isFiniteNumber(b.duration)) return null;
  return b as unknown as SessionCompletion;
}

/** True only for the specific, expected shape of the "already ended" reply. */
export function isAlreadyCompletedError(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as Record<string, unknown>).error === "Session already completed"
  );
}
