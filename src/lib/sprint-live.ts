/**
 * In-session ("live") adaptation for the calculation sprint.
 *
 * The between-session debrief sets where a sprint STARTS. This decides where it
 * goes while it is running: answering correctly in well under the allotted time
 * tightens the clock and, after a few in a row, steps the difficulty up;
 * missing or running out gives time back and steps it down.
 *
 * The two move at different speeds on purpose. Time reacts to every single
 * answer in small multiplicative steps, so pressure builds smoothly. Difficulty
 * only moves on a streak, so a session never lurches from warm-up to hardest on
 * the back of one lucky answer.
 *
 * IMPORTANT — this is a pure fold over the whole answer history, not a running
 * counter that gets mutated. Recomputing from scratch on every request makes the
 * result idempotent: a retried request, a refresh mid-session, or two tabs can
 * never double-apply a step. Nothing adaptive is stored; it is always derived.
 */

/** One answered question, as the adaptation sees it. */
export interface SprintEvent {
  correct: boolean;
  /** The per-question clock ran out (counts as a miss, and as maximum slowness). */
  timedOut: boolean;
  /** Milliseconds the student actually took. */
  timeSpentMs: number;
  /** Seconds that question was given. */
  budgetSeconds: number;
  /**
   * The tier the session's PLAN called for at this position (the baseline
   * crescendo), before the live offset.
   */
  plannedTier: number;
  /**
   * The plan's tier for the question this answer will INFLUENCE — the next one.
   * Bounds the offset from ABOVE: past `5 - nextPlannedTier` it buys nothing.
   */
  nextPlannedTier: number;
  /** The highest tier the plan reaches in this session. Bounds the offset from BELOW. */
  maxPlannedTier: number;
}

export interface LiveState {
  /**
   * Tiers above (+) or below (−) the session's planned ramp. Bounded by
   * TIER_OFFSET_MIN/MAX, and additionally held to the range that changes the
   * question at the current point in the plan (see clampUseful).
   */
  tierOffset: number;
  /** Multiplier on the planned per-question clock. Clamped 0.6..1.6. */
  timeScale: number;
  /** Consecutive correct-and-fast answers (resets on anything else). */
  fastStreak: number;
  /** Consecutive misses — wrong or out of time. */
  missStreak: number;
  /** What the last answer triggered, for the on-screen nudge. */
  lastSignal: "up" | "down" | "steady" | null;
}

// ─── Tunables (chosen with the user) ───

/** "Too easy for him": correct in under half the time he was given. */
export const FAST_FRACTION = 0.5;
/** Correct, but right up against the clock — ease off slightly. */
const SLOW_FRACTION = 0.9;

/** Correct-and-fast answers in a row before the difficulty steps up. */
export const FAST_STREAK_TO_PROMOTE = 3;
/** Misses in a row before it steps down. */
export const MISS_STREAK_TO_DEMOTE = 2;

/**
 * How far the live offset may run from the plan.
 *
 * Wide enough to CANCEL the plan, not merely dent it: the baseline crescendo
 * climbs on its own as the session goes, so a ±2 bound let a student who was
 * missing everything get dragged back up to a harder tier at question 16 purely
 * because the plan said so. The offset is separately held to the range that
 * changes anything (see `clampUseful`), so widening it cannot make it "bank"
 * credit that later takes a dozen answers to work off.
 */
export const TIER_OFFSET_MIN = -4;
export const TIER_OFFSET_MAX = 4;
export const TIME_SCALE_MIN = 0.6;
/**
 * Wide enough to CANCEL the planned ramp, not merely dent it — the same
 * reasoning as TIER_OFFSET_MAX, which the time axis was missing.
 *
 * The plan contracts 45s → 12s, i.e. 3.75×. At a 1.6 ceiling a struggling
 * student pinned the multiplier by question 4 and then rode the plan down
 * unopposed: measured at 64s on q4 but 19s on q20, for someone who could not do
 * a tier-1 chain in 45s. It also flattened the debrief signal, since
 * `endedTimeScale` read 1.6 whether they needed 1.15 or 3.
 */
export const TIME_SCALE_MAX = 4;

/** Per-answer multiplicative steps on the clock. */
const TIME_STEP_FAST = 0.9;
const TIME_STEP_SLOW = 1.08;
const TIME_STEP_MISS = 1.15;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Bound the offset — ASYMMETRICALLY, because the two directions fail differently.
 *
 * DOWN, the enemy is the plan's own crescendo. It climbs whatever the student
 * does, so an offset sized for the next question alone falls one short every
 * time the plan steps, and a student missing everything gets bounced back to a
 * harder tier for a question at a time (seen live at questions 6 and 16 of 20).
 * The floor is therefore `1 - maxPlannedTier`: enough to hold tier 1 to the end
 * of the session, whatever the plan does later.
 *
 * UP, the enemy is banking. Measured: a student who ran to tier 5 then hit a
 * wall ground through FOUR consecutive misses at tier 5 before anything eased,
 * because the offset had run to +4 while +3 already produced tier 5. The ceiling
 * is therefore `5 - nextPlannedTier`: exactly what the next question can use.
 *
 * The asymmetry is the point. Being held back one question below the plan costs
 * a student one question; being stuck at the ceiling cost them four.
 */
function clampUseful(offset: number, nextPlannedTier: number, maxPlannedTier: number): number {
  return clamp(offset, 1 - maxPlannedTier, 5 - nextPlannedTier);
}
const round2 = (n: number) => Math.round(n * 100) / 100;

export const INITIAL_LIVE_STATE: LiveState = {
  tierOffset: 0,
  timeScale: 1,
  fastStreak: 0,
  missStreak: 0,
  lastSignal: null,
};

/** How one answer is read. `miss` covers both a wrong answer and a timeout. */
export type EventKind = "fast" | "ok" | "slow" | "miss";

export function classifyEvent(e: SprintEvent): EventKind {
  if (e.timedOut || !e.correct) return "miss";
  const budgetMs = Math.max(1, e.budgetSeconds * 1000);
  const used = e.timeSpentMs / budgetMs;
  if (used < FAST_FRACTION) return "fast";
  if (used > SLOW_FRACTION) return "slow";
  return "ok";
}

/**
 * Fold the whole history into the current live state. Deterministic — same
 * events in, same state out, however many times it is called.
 */
export function computeLiveState(events: readonly SprintEvent[]): LiveState {
  let { tierOffset, timeScale, fastStreak, missStreak } = INITIAL_LIVE_STATE;
  let lastSignal: LiveState["lastSignal"] = null;

  for (const e of events) {
    const kind = classifyEvent(e);
    lastSignal = "steady";

    // ── Clock: every answer nudges it ──
    if (kind === "fast") timeScale *= TIME_STEP_FAST;
    else if (kind === "miss") timeScale *= TIME_STEP_MISS;
    else if (kind === "slow") timeScale *= TIME_STEP_SLOW;
    timeScale = clamp(timeScale, TIME_SCALE_MIN, TIME_SCALE_MAX);

    // ── Streaks ──
    if (kind === "fast") {
      fastStreak += 1;
      missStreak = 0;
    } else if (kind === "miss") {
      missStreak += 1;
      fastStreak = 0;
    } else {
      // A correct-but-not-fast answer breaks the promotion streak without
      // counting against him — he is working at about the right level.
      fastStreak = 0;
      missStreak = 0;
    }

    // ── Difficulty: only on a streak, and the streak resets after it fires ──
    const nextPlanned = e.nextPlannedTier || e.plannedTier || 1;
    const maxPlanned = Math.max(e.maxPlannedTier || 0, nextPlanned);
    const tierOf = (off: number) => clamp(nextPlanned + off, 1, 5);
    if (fastStreak >= FAST_STREAK_TO_PROMOTE) {
      const before = tierOffset;
      tierOffset = clampUseful(
        clamp(before + 1, TIER_OFFSET_MIN, TIER_OFFSET_MAX),
        nextPlanned,
        maxPlanned
      );
      // Announce only when the tier the student will SEE actually moved.
      if (tierOf(tierOffset) !== tierOf(before)) lastSignal = "up";
      fastStreak = 0;
    } else if (missStreak >= MISS_STREAK_TO_DEMOTE) {
      const before = tierOffset;
      tierOffset = clampUseful(
        clamp(before - 1, TIER_OFFSET_MIN, TIER_OFFSET_MAX),
        nextPlanned,
        maxPlanned
      );
      if (tierOf(tierOffset) !== tierOf(before)) lastSignal = "down";
      missStreak = 0;
      // Falling behind is also a time problem — give a bit extra on top of the
      // per-answer nudges, so a bad patch actually becomes survivable.
      timeScale = clamp(timeScale * 1.1, TIME_SCALE_MIN, TIME_SCALE_MAX);
    }
  }

  return {
    tierOffset,
    timeScale: round2(timeScale),
    fastStreak,
    missStreak,
    lastSignal,
  };
}

/** Short Romanian line for the student when the session just shifted gear. */
export function liveSignalMessage(state: LiveState): string | null {
  if (state.lastSignal === "up") return "Merge bine — urcăm o treaptă.";
  if (state.lastSignal === "down") return "Încetinim puțin — exerciții mai ușoare și ceva timp în plus.";
  return null;
}
