/**
 * Adaptive encouragement remarks — pure selection core (no IO, no React).
 *
 * Shows a short, personality-bearing line after a correct answer, on top of the
 * plain "Corect!" header. Three tones, ALL age-appropriate for every age:
 *   - neutral     : factual, calm
 *   - encouraging : warm, motivating (default)
 *   - playful     : slangy, upbeat ("cool") — still safe for minors
 *
 * SAFETY GUARDRAIL (per approved plan, minors are the primary users + parents are
 * watchers): no romantic, gendered-flattery, or otherwise age-inappropriate content
 * is shipped in ANY tone. A future "adult" tier (the romantic/gendered remarks from
 * the spec) is intentionally NOT implemented here — it requires verified 18+ age-gating
 * plus a Legal Hub review before any such content can exist. `resolveTone` also lets a
 * parent restrict a child to the calmer tones.
 *
 * The like/dislike loop ("keep the tone they like, drop what they reject") is realised
 * by excluding disliked keys and, on ties, biasing toward the student's chosen tone.
 */

export type RemarkTone = "neutral" | "encouraging" | "playful";
export type RemarkTrigger = "correct" | "streak" | "comeback";

export const REMARK_TONES: RemarkTone[] = ["neutral", "encouraging", "playful"];
export const DEFAULT_TONE: RemarkTone = "encouraging";

/** Keys per tone × trigger. The actual text lives in the i18n `remarks` catalog. */
export const REMARK_KEYS: Record<RemarkTone, Record<RemarkTrigger, string[]>> = {
  neutral: {
    correct: ["n_c1", "n_c2", "n_c3"],
    streak: ["n_s1", "n_s2"],
    comeback: ["n_b1", "n_b2"],
  },
  encouraging: {
    correct: ["e_c1", "e_c2", "e_c3", "e_c4"],
    streak: ["e_s1", "e_s2", "e_s3"],
    comeback: ["e_b1", "e_b2"],
  },
  playful: {
    correct: ["p_c1", "p_c2", "p_c3", "p_c4"],
    streak: ["p_s1", "p_s2", "p_s3"],
    comeback: ["p_b1", "p_b2"],
  },
};

/** Full i18n key for a remark, e.g. `remarks.lines.e_c1`. */
export function remarkI18nKey(key: string): string {
  return `remarks.lines.${key}`;
}

/**
 * Resolve the effective tone from the student's preference and the parent restriction.
 * A parent who restricts the playful tone downgrades it to `encouraging`.
 */
export function resolveTone(
  studentPref: string | null | undefined,
  parentRestrictsPlayful: boolean,
): RemarkTone {
  let tone: RemarkTone = REMARK_TONES.includes(studentPref as RemarkTone)
    ? (studentPref as RemarkTone)
    : DEFAULT_TONE;
  if (tone === "playful" && parentRestrictsPlayful) tone = "encouraging";
  return tone;
}

/** Pick the trigger from session signals (streak milestone > comeback > plain correct). */
export function pickTrigger(opts: { streak: number; cameBackFromWrong: boolean }): RemarkTrigger {
  if (opts.streak >= 4) return "streak";
  if (opts.cameBackFromWrong) return "comeback";
  return "correct";
}

/**
 * Choose a remark key for the given tone + trigger, excluding disliked and the most
 * recently shown key. Deterministic given `seed` (so SSR/CSR agree and tests are stable).
 * Falls back across triggers, then to the neutral pool, so it never returns null on
 * a correct answer.
 */
export function pickRemarkKey(opts: {
  tone: RemarkTone;
  trigger: RemarkTrigger;
  disliked?: string[];
  recentKey?: string | null;
  seed: number;
}): string | null {
  const disliked = new Set(opts.disliked ?? []);
  const order: Array<[RemarkTone, RemarkTrigger]> = [
    [opts.tone, opts.trigger],
    [opts.tone, "correct"],
    ["encouraging", opts.trigger],
    ["neutral", "correct"],
  ];
  for (const [tone, trigger] of order) {
    let pool = (REMARK_KEYS[tone][trigger] ?? []).filter((k) => !disliked.has(k));
    if (pool.length > 1 && opts.recentKey) {
      const without = pool.filter((k) => k !== opts.recentKey);
      if (without.length) pool = without;
    }
    if (pool.length) {
      const idx = Math.abs(Math.floor(opts.seed)) % pool.length;
      return pool[idx];
    }
  }
  return null;
}

/** Apply a like/dislike signal to the stored feedback record (pure, returns a new value). */
export function applyRemarkVote(
  current: { liked?: string[]; disliked?: string[] } | null | undefined,
  key: string,
  signal: "like" | "dislike",
): { liked: string[]; disliked: string[] } {
  const liked = new Set(current?.liked ?? []);
  const disliked = new Set(current?.disliked ?? []);
  if (signal === "dislike") {
    disliked.add(key);
    liked.delete(key);
  } else {
    liked.add(key);
    disliked.delete(key);
  }
  return { liked: [...liked], disliked: [...disliked] };
}
