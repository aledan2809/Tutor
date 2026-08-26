/**
 * Per-family adaptation for the direct-operation half of the calculation sprint.
 *
 * `sprint-live.ts` answers "is this session going well overall?". This answers
 * the question the student's father actually asked: *which operation is he fast
 * at, and which one is he stumbling on* — and then spends the session's
 * questions accordingly, tightening the clock where he is quick and handing
 * more of the drill to whatever he is getting wrong.
 *
 * The four families are never averaged together. A student who is instant on
 * additions and lost on two-digit products has ONE global accuracy that
 * describes neither, and a shared clock that is slack for half the questions
 * and impossible for the other half. Everything here — level, clock, and how
 * often a family comes up — is held per family for that reason.
 *
 * Pure, and a fold over the whole history rather than a mutated counter, for
 * the same reason `sprint-live.ts` is: recomputing from scratch on every
 * request makes a retry, a refresh, or a second tab impossible to double-apply.
 */

import {
  FAMILY_BASE_WEIGHT,
  SINGLE_FAMILIES,
  type SingleFamily,
} from "@/lib/mental-single";
import type { Rng, Tier } from "@/lib/mental-chain";

// ─── Shape ───

/** One answered direct-operation question, as the per-family adaptation sees it. */
export interface FamilyEvent {
  family: SingleFamily;
  correct: boolean;
  /** The clock ran out (counts as a miss, and as maximum slowness). */
  timedOut: boolean;
  timeSpentMs: number;
  budgetSeconds: number;
}

export interface FamilyStat {
  seen: number;
  correct: number;
  /** Correct AND under FAST_FRACTION of the budget. */
  fast: number;
  /** Wrong or timed out. */
  missed: number;
  fastStreak: number;
  missStreak: number;
  /** 1..5 — the tier this family is currently asked at. */
  level: number;
  /** Multiplier on this family's own per-operation clock. */
  timeScale: number;
}

export type FamilyState = Record<SingleFamily, FamilyStat>;

/** What a previous session left behind, per family — the starting point. */
export interface FamilyBaseline {
  level: number;
  timeFactor: number;
}

export type FamilyBaselines = Partial<Record<SingleFamily, FamilyBaseline>>;

// ─── Tunables ───

export const FAMILY_LEVEL_MIN = 1;
export const FAMILY_LEVEL_MAX = 5;
export const FAMILY_TIME_MIN = 0.6;
export const FAMILY_TIME_MAX = 2.5;

/** Correct in under half the allotted time — "this is too easy for him". */
export const FAST_FRACTION = 0.5;
/** Correct, but right up against the clock. */
const SLOW_FRACTION = 0.9;

export const FAMILY_FAST_STREAK_TO_PROMOTE = 3;
export const FAMILY_MISS_STREAK_TO_DEMOTE = 2;

const TIME_STEP_FAST = 0.9;
const TIME_STEP_SLOW = 1.08;
const TIME_STEP_MISS = 1.18;

/**
 * A family's weight never reaches zero, however well it is going.
 *
 * A family that stops being asked also stops being measured, and the profile
 * carries across sessions — so a family silenced by one good run would still be
 * silent next week, and we would have no way of noticing it had gone stale.
 * The floor keeps a trickle of questions coming through as a check.
 */
export const MIN_FAMILY_WEIGHT = 0.35;

/** Struggle pushes a family's weight up to this multiple of its baseline. */
const MAX_STRUGGLE_BOOST = 2.5;
/** Mastery pulls it down to this fraction. */
const MASTERY_DAMP = 0.45;
/** A family not yet seen this session is worth asking sooner. */
const NOVELTY_BOOST = 1.6;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

// ─── Initial state ───

export function initialFamilyState(baselines: FamilyBaselines = {}): FamilyState {
  const out = {} as FamilyState;
  for (const f of SINGLE_FAMILIES) {
    const base = baselines[f];
    out[f] = {
      seen: 0,
      correct: 0,
      fast: 0,
      missed: 0,
      fastStreak: 0,
      missStreak: 0,
      level: clamp(Math.round(base?.level ?? FAMILY_LEVEL_MIN), FAMILY_LEVEL_MIN, FAMILY_LEVEL_MAX),
      timeScale: clamp(base?.timeFactor ?? 1, FAMILY_TIME_MIN, FAMILY_TIME_MAX),
    };
  }
  return out;
}

export type FamilyEventKind = "fast" | "ok" | "slow" | "miss";

export function classifyFamilyEvent(e: FamilyEvent): FamilyEventKind {
  if (e.timedOut || !e.correct) return "miss";
  const budgetMs = Math.max(1, e.budgetSeconds * 1000);
  const used = e.timeSpentMs / budgetMs;
  if (used < FAST_FRACTION) return "fast";
  if (used > SLOW_FRACTION) return "slow";
  return "ok";
}

/**
 * Fold the answered direct operations into per-family state.
 * Deterministic — same events in, same state out, however often it is called.
 */
export function computeFamilyState(
  events: readonly FamilyEvent[],
  baselines: FamilyBaselines = {}
): FamilyState {
  const state = initialFamilyState(baselines);

  for (const e of events) {
    const s = state[e.family];
    if (!s) continue; // an unknown family in stored data must not throw
    const kind = classifyFamilyEvent(e);

    s.seen += 1;
    if (kind === "miss") s.missed += 1;
    else s.correct += 1;
    if (kind === "fast") s.fast += 1;

    // ── Clock: every answer nudges this family's own multiplier ──
    if (kind === "fast") s.timeScale *= TIME_STEP_FAST;
    else if (kind === "miss") s.timeScale *= TIME_STEP_MISS;
    else if (kind === "slow") s.timeScale *= TIME_STEP_SLOW;
    s.timeScale = clamp(s.timeScale, FAMILY_TIME_MIN, FAMILY_TIME_MAX);

    // ── Streaks ──
    if (kind === "fast") {
      s.fastStreak += 1;
      s.missStreak = 0;
    } else if (kind === "miss") {
      s.missStreak += 1;
      s.fastStreak = 0;
    } else {
      // Correct but not fast: working at about the right level. Breaks the
      // promotion streak without counting against him.
      s.fastStreak = 0;
      s.missStreak = 0;
    }

    // ── Level: only on a streak, and the streak resets once it fires ──
    if (s.fastStreak >= FAMILY_FAST_STREAK_TO_PROMOTE) {
      s.level = clamp(s.level + 1, FAMILY_LEVEL_MIN, FAMILY_LEVEL_MAX);
      s.fastStreak = 0;
    } else if (s.missStreak >= FAMILY_MISS_STREAK_TO_DEMOTE) {
      s.level = clamp(s.level - 1, FAMILY_LEVEL_MIN, FAMILY_LEVEL_MAX);
      s.missStreak = 0;
      // Falling behind on a family is also a time problem — give a bit extra on
      // top of the per-answer nudges so the next one is actually survivable.
      s.timeScale = clamp(s.timeScale * 1.1, FAMILY_TIME_MIN, FAMILY_TIME_MAX);
    }
  }

  for (const f of SINGLE_FAMILIES) state[f].timeScale = round2(state[f].timeScale);
  return state;
}

// ─── Selection ───

/**
 * How much of the remaining drill each family deserves.
 *
 * Struggling raises a family's weight; being quick at it lowers it. Both are
 * bounded, and nothing ever reaches zero (see MIN_FAMILY_WEIGHT).
 */
export function familyWeights(state: FamilyState): Record<SingleFamily, number> {
  const out = {} as Record<SingleFamily, number>;
  for (const f of SINGLE_FAMILIES) {
    const s = state[f];
    const base = FAMILY_BASE_WEIGHT[f];

    if (s.seen === 0) {
      out[f] = round2(base * NOVELTY_BOOST);
      continue;
    }

    const missRate = s.missed / s.seen;
    const fastRate = s.fast / s.seen;

    // Struggle first: a family he is getting wrong should take questions from
    // the others, which is the whole point of "focus pe cele la care se încurcă".
    const struggle = 1 + (MAX_STRUGGLE_BOOST - 1) * missRate;
    // Mastery only damps what struggle did not already claim — a family that is
    // both fast AND missed is not mastered, it is rushed.
    const mastery = 1 - (1 - MASTERY_DAMP) * fastRate * (1 - missRate);

    out[f] = round2(Math.max(MIN_FAMILY_WEIGHT, base * struggle * mastery));
  }
  return out;
}

/**
 * Which family the next direct operation should come from.
 *
 * Weighted at random rather than strictly "the worst one", so the session does
 * not collapse into ten of the same operation the moment one goes badly — he
 * still has to switch mental gears, which is itself part of the exam.
 *
 * `remainingSingles` closes the one hole random selection leaves: with four
 * families and ten slots, chance alone can finish a session having never asked
 * a division, and a family that was never asked cannot be reported on. When the
 * slots left are down to the families not yet seen, the unseen ones are forced.
 */
export function pickFamily(
  state: FamilyState,
  rng: Rng = Math.random,
  remainingSingles?: number
): SingleFamily {
  const unseen = SINGLE_FAMILIES.filter((f) => state[f].seen === 0);
  const pool =
    typeof remainingSingles === "number" && unseen.length > 0 && remainingSingles <= unseen.length
      ? unseen
      : [...SINGLE_FAMILIES];

  const weights = familyWeights(state);
  const total = pool.reduce((sum, f) => sum + weights[f], 0);
  if (total <= 0) return pool[0];

  let roll = rng() * total;
  for (const f of pool) {
    roll -= weights[f];
    if (roll <= 0) return f;
  }
  return pool[pool.length - 1];
}

/** The tier this family should be asked at right now. */
export function familyTier(state: FamilyState, family: SingleFamily): Tier {
  return clamp(Math.round(state[family].level), FAMILY_LEVEL_MIN, FAMILY_LEVEL_MAX) as Tier;
}

// ─── Carry-over between sessions ───

/**
 * Fold a finished session's per-family state back into the stored profile.
 *
 * Damped on purpose: one session is a small sample, and a single bad patch on
 * divisions should nudge next week's starting point, not reset it. The level
 * moves at most one step per session; the clock moves a third of the way toward
 * where the session settled.
 */
export function foldFamilyBaselines(
  stored: FamilyBaselines,
  session: FamilyState
): Record<SingleFamily, FamilyBaseline> {
  const out = {} as Record<SingleFamily, FamilyBaseline>;
  for (const f of SINGLE_FAMILIES) {
    const prev = stored[f] ?? { level: FAMILY_LEVEL_MIN, timeFactor: 1 };
    const s = session[f];

    if (s.seen === 0) {
      // Never asked this session — carry the old value through untouched rather
      // than letting an empty fold drag it toward the defaults.
      out[f] = {
        level: clamp(Math.round(prev.level), FAMILY_LEVEL_MIN, FAMILY_LEVEL_MAX),
        timeFactor: round2(clamp(prev.timeFactor, FAMILY_TIME_MIN, FAMILY_TIME_MAX)),
      };
      continue;
    }

    const step = clamp(s.level - prev.level, -1, 1);
    out[f] = {
      level: clamp(Math.round(prev.level + step), FAMILY_LEVEL_MIN, FAMILY_LEVEL_MAX),
      timeFactor: round2(
        clamp(prev.timeFactor + (s.timeScale - prev.timeFactor) / 3, FAMILY_TIME_MIN, FAMILY_TIME_MAX)
      ),
    };
  }
  return out;
}

/** Guard for per-family data arriving from a JSON column. */
export function readFamilyBaselines(value: unknown): FamilyBaselines {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const out: FamilyBaselines = {};
  for (const f of SINGLE_FAMILIES) {
    const entry = raw[f];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const e = entry as Record<string, unknown>;
    const level = typeof e.level === "number" && Number.isFinite(e.level) ? e.level : undefined;
    const timeFactor =
      typeof e.timeFactor === "number" && Number.isFinite(e.timeFactor) ? e.timeFactor : undefined;
    if (level === undefined && timeFactor === undefined) continue;
    out[f] = {
      level: clamp(Math.round(level ?? FAMILY_LEVEL_MIN), FAMILY_LEVEL_MIN, FAMILY_LEVEL_MAX),
      timeFactor: clamp(timeFactor ?? 1, FAMILY_TIME_MIN, FAMILY_TIME_MAX),
    };
  }
  return out;
}
