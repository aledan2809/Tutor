// The model does not place the correct answer uniformly: measured over 62 generated
// questions it sat first 44% of the time and last 8% (chance is 25% each), so a
// student who always taps the first option scores well above guessing. Asking the
// model for a uniform position in the prompt cannot guarantee one; permuting the
// options ourselves can. Every answer comparison for `Question` is by option TEXT
// (`answer-checker.ts`, `session/answer`, `exam/verify`, `gamification`), and the
// two places that need an index derive it from the text — so the order is purely
// presentational and safe to permute.

// An option that refers to the others by position ("toate cele de mai sus") is bound
// to its place in the list. Rather than reorder it into nonsense, leave that whole
// question alone — the mild position bias is the far smaller defect.
const POSITIONAL =
  /(cele de mai sus|variantele de mai sus|toate variantele|niciuna dintre|niciun[ăa] dintre|all of the above|none of the above)/i;

/**
 * Returns the options in a random order, keeping `correctAnswer` valid (it is
 * matched by text, never by index). Returns the input untouched when permuting
 * would be unsafe or pointless.
 */
export function shuffleOptions(
  options: string[],
  correctAnswer: string,
  rand: () => number = Math.random,
): string[] {
  if (options.length < 3) return options;
  if (!options.includes(correctAnswer)) return options;
  if (options.some((o) => POSITIONAL.test(o))) return options;

  const out = [...options];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
