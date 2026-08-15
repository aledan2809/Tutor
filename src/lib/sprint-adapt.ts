/**
 * How a sprint session's mandatory end-of-session feedback moves the student's
 * difficulty level and time budget for the NEXT session.
 *
 * The student's own answer is authoritative — that is the whole design ("funcție
 * de feedback-ul lui … mărești/micșorezi atât gradul de dificultate cât și
 * timpul"). Measured performance only breaks the tie when they say it felt
 * about right, and stops one obvious failure mode: calling a session easy while
 * getting half of it wrong.
 *
 * Pure: no DB, no IO. The caller loads the profile, applies this, and saves.
 */

export const DIFFICULTY_ANSWERS = ["easy", "ok", "hard"] as const;
export const TIME_ANSWERS = ["loose", "ok", "tight"] as const;

export type DifficultyAnswer = (typeof DIFFICULTY_ANSWERS)[number];
export type TimeAnswer = (typeof TIME_ANSWERS)[number];

export interface SprintFeedback {
  /** "prea ușor" | "cam bine" | "prea greu" */
  difficulty: DifficultyAnswer;
  /** "prea mult timp" | "cam bine" | "prea puțin timp" */
  time: TimeAnswer;
}

export interface SprintOutcome {
  total: number;
  correct: number;
  /** Questions where the per-question clock ran out. */
  timedOut: number;
  /**
   * Where the session ENDED relative to its plan, from the in-session
   * adaptation: tiers above/below, and the clock multiplier it settled on.
   *
   * These are the honest signals once live adaptation is running. Accuracy is
   * not: the live engine actively steers toward a roughly constant success rate,
   * so "he got 78%" says the adaptation worked, not that the difficulty was
   * right. Where it had to move the session to KEEP him at 78% is the thing that
   * carries information. Accuracy is the fallback when these are absent, or
   * when too few questions were answered for drift to mean anything.
   */
  endedTierOffset?: number;
  endedTimeScale?: number;
}

export interface SprintProfileState {
  level: number;
  timeFactor: number;
}

export const LEVEL_MIN = 1;
export const LEVEL_MAX = 5;
export const TIME_FACTOR_MIN = 0.5;
export const TIME_FACTOR_MAX = 2.5;

/** Below this, "it felt easy" is not believable enough to raise the difficulty. */
const EASY_CLAIM_MIN_ACCURACY = 0.6;
/** Doing this well on an "about right" session earns a step up anyway. */
const AUTO_PROMOTE_ACCURACY = 0.9;
/** Doing this badly on an "about right" session steps back down. */
const AUTO_DEMOTE_ACCURACY = 0.5;
/** Running out of the clock this often means the pace is too tight regardless. */
const TIMEOUT_PRESSURE_RATE = 0.2;
/**
 * Below this many answers the in-session drift means nothing — a 2-question
 * session always reports offset 0, which would read as "the level was exactly
 * right" and let a "prea ușor" promote off no evidence at all.
 */
const MIN_ANSWERS_FOR_DRIFT = 5;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface AdaptResult extends SprintProfileState {
  /** Short Romanian sentences explaining what changed — shown on the results screen. */
  notes: string[];
}

export function adaptSprintProfile(
  current: SprintProfileState,
  feedback: SprintFeedback,
  outcome: SprintOutcome
): AdaptResult {
  const total = Math.max(0, outcome.total);
  const accuracy = total > 0 ? clamp(outcome.correct, 0, total) / total : 0;
  const timeoutRate = total > 0 ? clamp(outcome.timedOut, 0, total) / total : 0;

  const notes: string[] = [];
  const hasLive =
    typeof outcome.endedTierOffset === "number" && total >= MIN_ANSWERS_FOR_DRIFT;
  const endedOffset = outcome.endedTierOffset ?? 0;

  // ── Difficulty ──
  let level = current.level;
  if (feedback.difficulty === "easy") {
    // "It was easy" is believed unless the session had to be made EASIER to keep
    // him going — that contradiction means the ease came from the adaptation,
    // not from the material.
    const contradicted = hasLive ? endedOffset < 0 : accuracy < EASY_CLAIM_MIN_ACCURACY;
    if (!contradicted) {
      level += 1;
      notes.push("Data viitoare urcăm dificultatea.");
    } else {
      // Say which evidence contradicted him — "the session had to back off" and
      // "you got a lot wrong" are different observations and he should be able
      // to recognise the one that actually happened.
      notes.push(
        hasLive
          ? "Ai zis că a fost ușor, dar sesiunea a trebuit să coboare pe parcurs — păstrăm dificultatea și lucrăm la viteză."
          : "Ai zis că a fost ușor, dar au fost destule greșeli — păstrăm dificultatea și lucrăm la viteză."
      );
    }
  } else if (feedback.difficulty === "hard") {
    level -= 1;
    notes.push("Data viitoare coborâm dificultatea.");
  } else if (hasLive) {
    // "About right" — so let the session's own drift decide. If it had to climb
    // to keep him challenged, next time starts higher; if it had to back off,
    // lower. One step at a time, whatever the drift was.
    if (endedOffset >= 1) {
      level += 1;
      notes.push("Sesiunea a urcat pe parcurs — pornim mai sus data viitoare.");
    } else if (endedOffset <= -1) {
      level -= 1;
      notes.push("Sesiunea a trebuit să coboare — pornim mai jos data viitoare.");
    }
  } else if (accuracy >= AUTO_PROMOTE_ACCURACY) {
    level += 1;
    notes.push("Ai mers foarte bine — urcăm o treaptă.");
  } else if (total > 0 && accuracy <= AUTO_DEMOTE_ACCURACY) {
    level -= 1;
    notes.push("Au fost multe greșeli — coborâm o treaptă ca să prinzi ritmul.");
  }
  level = clamp(level, LEVEL_MIN, LEVEL_MAX);

  // ── Time ──
  let timeFactor = current.timeFactor;
  if (feedback.time === "tight") {
    timeFactor *= 1.25;
    notes.push("Îți dăm mai mult timp la fiecare exercițiu.");
  } else if (feedback.time === "loose") {
    timeFactor *= 0.85;
    notes.push("Strângem puțin timpul.");
  } else if (hasLive) {
    // Same idea for the clock: carry over where the session settled, damped so a
    // single run can't swing the baseline hard.
    const scale = outcome.endedTimeScale ?? 1;
    if (scale > 1.1) {
      timeFactor *= 1.1;
      notes.push("Ai avut nevoie de mai mult timp pe parcurs — pornim cu ceva mai mult.");
    } else if (scale < 0.9) {
      timeFactor *= 0.93;
      notes.push("Ai răspuns constant sub timp — pornim ceva mai strâns.");
    }
  } else if (timeoutRate > TIMEOUT_PRESSURE_RATE) {
    timeFactor *= 1.15;
    notes.push("Ți-a expirat timpul de câteva ori — mai adăugăm câteva secunde.");
  } else if (timeoutRate === 0 && accuracy >= AUTO_PROMOTE_ACCURACY) {
    timeFactor *= 0.92;
    notes.push("N-ai rămas fără timp deloc — strângem puțin ritmul.");
  }
  timeFactor = round2(clamp(timeFactor, TIME_FACTOR_MIN, TIME_FACTOR_MAX));

  if (notes.length === 0) notes.push("Ținem aceeași dificultate și același ritm.");

  return { level, timeFactor, notes };
}

/** Guard for values arriving from the client. */
export function isDifficultyAnswer(v: unknown): v is DifficultyAnswer {
  return typeof v === "string" && (DIFFICULTY_ANSWERS as readonly string[]).includes(v);
}

export function isTimeAnswer(v: unknown): v is TimeAnswer {
  return typeof v === "string" && (TIME_ANSWERS as readonly string[]).includes(v);
}
