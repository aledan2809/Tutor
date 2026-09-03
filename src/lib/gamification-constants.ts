/**
 * The numbers behind points, levels and streaks — with no prisma import.
 *
 * `gamification.ts` opens with `import { prisma }`, so nothing rendered in the
 * browser can read its constants. That is why the rules were never explained to
 * anyone: the only way to state "10 points per correct answer" in the UI was to
 * retype it, and a retyped number drifts away from the code that awards it. Here
 * the copy can import the same values the engine uses.
 *
 * Several of these were inline literals inside the award functions; they are named
 * here and consumed there, so there is exactly one place to change each.
 */

export const XP_REWARDS = {
  CORRECT_ANSWER: 10,
  FAST_ANSWER_BONUS: 5, // < 5 seconds
  SESSION_COMPLETE: 50,
  PERFECT_SCORE: 100,
  DAILY_CHALLENGE_MULTIPLIER: 2,
  EXAM_COMPLETE: 75,
  EXAM_PASS_BONUS: 150,
  EXAM_ACE_BONUS: 250, // 95%+
} as const;

export const FAST_ANSWER_THRESHOLD_MS = 5000;

/** Finishing a SCHEDULED session within the on-time window (see ON_TIME_WINDOW_MIN). */
export const ON_TIME_BONUS = 15;

/**
 * Default ladder. A domain can override it via `LevelConfig`, so anything shown
 * to a student has to say "implicite" and point at their own subject.
 */
export const DEFAULT_LEVELS = [
  { name: "Cadet", minXp: 0, rank: 1 },
  { name: "Co-pilot", minXp: 500, rank: 2 },
  { name: "Captain", minXp: 2000, rank: 3 },
  { name: "Instructor", minXp: 5000, rank: 4 },
] as const;

/** The rules a student only ever saw in the message telling them they had failed. */
export const STREAK_RECOVERY = {
  maxMissedDays: 3,
  questions: 5,
  requiredCorrect: 3,
  timeLimitMs: 120_000,
} as const;

/** `getLeaderboard` queries 20 rows but returns `entries.slice(0, 10)`. */
export const LEADERBOARD_TOP = 10;
