/**
 * The longest-answer leak.
 *
 * Measured on the first generated batch: in 71% of 56 questions the correct option
 * was the longest one, where chance is 25%. A student who always picks the longest
 * answer scores 71% without reading the question — the test stops measuring what it
 * claims to.
 *
 * The AI judge has a rule for this ("length-cue") and did not catch these, which is
 * the argument for a deterministic check: a ratio does not depend on a judge's mood,
 * costs nothing, and cannot be talked around.
 *
 * Deliberately NOT "reject whenever the correct option is longest": on four options
 * that would throw away a quarter of legitimate questions. It fires when the correct
 * option is BOTH the longest AND meaningfully above the others — the shape that
 * actually leaks.
 */

/** Above this multiple of the distractors' mean length, the answer is being signposted. */
export const LENGTH_CUE_RATIO = 1.5;

/**
 * ...and at least this many characters above it, in absolute terms.
 *
 * The ratio alone is not enough, and the counter-example is instructive: among four
 * short options — "Extras CF", "Certificat fiscal", "Procură" — the correct
 * "Extras de carte funciară" is 2.2× the mean while being only thirteen characters
 * longer. That is the full proper term, not a signpost. Calibrated against a real
 * batch of 56: the two conditions together flag 19 (the genuine leaks) and spare the
 * questions where the correct option is longest by a word or two.
 */
export const LENGTH_CUE_MIN_DIFF = 25;

export function hasLengthCue(options: readonly string[], correctAnswer: string): boolean {
  if (options.length < 3) return false;
  const correct = options.find((o) => o === correctAnswer);
  if (correct === undefined) return false;

  const others = options.filter((o) => o !== correctAnswer).map((o) => o.length);
  if (others.length === 0) return false;

  const longest = Math.max(...options.map((o) => o.length));
  if (correct.length < longest) return false; // not the longest — no cue to give

  const mean = others.reduce((a, b) => a + b, 0) / others.length;
  if (mean === 0) return false;
  return correct.length / mean > LENGTH_CUE_RATIO && correct.length - mean >= LENGTH_CUE_MIN_DIFF;
}
