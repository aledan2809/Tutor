/**
 * Single-operation mental-arithmetic generator ("operații directe") for the
 * private Aptitudini Aviație domain.
 *
 * The sibling of `mental-chain.ts`, and deliberately its opposite. A chain
 * (`25 × 5 − 40 ÷ 8 − 95`) trains precedence and holding an intermediate value
 * in the head. This module trains the other half of the same exam skill: one
 * operation, done fast and exactly — `22 × 34`, `84 ÷ 12`, `96 ÷ 8`.
 *
 * Four families (× ÷ + −) are tracked SEPARATELY all the way through the
 * system, because they are different skills that fail differently: a carry
 * dropped in a product is not the same mistake as a borrow dropped in a
 * subtraction, and a student can be quick at one while stalling on the other.
 * Keeping them apart is what lets the drill spend its questions where they are
 * actually needed (see `sprint-families.ts`).
 *
 * Pure: no DB, no IO, no global state. The RNG is injectable so tests are
 * deterministic and a session can be reproduced from a seed.
 */

import { shuffle, type Rng, type Tier } from "@/lib/mental-chain";

// ─── Shape ───

export const SINGLE_FAMILIES = ["mul", "div", "add", "sub"] as const;
export type SingleFamily = (typeof SINGLE_FAMILIES)[number];

export interface GeneratedSingle {
  family: SingleFamily;
  tier: Tier;
  /** Left operand as rendered (for `div`, the dividend). */
  a: number;
  /** Right operand as rendered (for `div`, the divisor). */
  b: number;
  /** Rendered expression without the trailing "= ?" (e.g. "22 × 34"). */
  expression: string;
  result: number;
}

const MINUS = "−"; // U+2212, not a hyphen — matches the aptitudini bank
const TIMES = "×";
const DIVIDE = "÷";

const SYMBOL: Record<SingleFamily, string> = {
  mul: TIMES,
  div: DIVIDE,
  add: "+",
  sub: MINUS,
};

/** Human labels — used on the results screen and in the per-family debrief. */
export const FAMILY_LABELS: Record<SingleFamily, string> = {
  mul: "Înmulțiri",
  div: "Împărțiri",
  add: "Adunări",
  sub: "Scăderi",
};

/**
 * Baseline selection weight per family.
 *
 * Multiplication and division start at double weight because those are the two
 * the drill was asked for by name. This is only the STARTING point — the live
 * per-family weighting moves it from question to question, so a family he is
 * quick at fades on its own and one he stumbles on gets more of the session.
 */
export const FAMILY_BASE_WEIGHT: Record<SingleFamily, number> = {
  mul: 2,
  div: 2,
  add: 1,
  sub: 1,
};

export type Rng2 = Rng;

// ─── RNG helpers (local copies — `mental-chain` keeps its own private) ───

const defaultRng: Rng = Math.random;

function randInt(rng: Rng, lo: number, hi: number): number {
  return Math.floor(rng() * (hi - lo + 1)) + lo;
}

// ─── Tier specs ───

/**
 * Operand ranges per family and tier.
 *
 * Calibrated against the examples that prompted this module: `22 × 34` is a
 * tier-4 multiplication, `84 ÷ 12` a tier-3 division, `96 ÷ 8` a tier-2 one.
 * The tiers are per family on purpose — the same student is routinely at tier 4
 * on divisions and tier 2 on two-digit products, and a single shared number
 * would average those into a level that is wrong for both.
 */
interface SingleSpec {
  a: [number, number];
  b: [number, number];
  /**
   * Additions/subtractions only: how many column carries (or borrows) the
   * question must involve. Difficulty in + and − lives almost entirely here —
   * `41 + 32` and `47 + 38` are the same size and nothing like the same task.
   */
  minCarries?: number;
}

const SPECS: Record<SingleFamily, Record<Tier, SingleSpec>> = {
  // `a × b`. Built directly; the product is whatever it is.
  mul: {
    1: { a: [2, 9], b: [2, 9] },
    2: { a: [11, 25], b: [2, 9] },
    3: { a: [12, 99], b: [3, 9] },
    4: { a: [11, 49], b: [11, 49] },
    5: { a: [12, 99], b: [12, 99] },
  },
  // `div` ranges are the QUOTIENT and the DIVISOR — the dividend is their
  // product, so the division is always exact and never asks for a remainder.
  div: {
    1: { a: [2, 9], b: [2, 9] },
    2: { a: [2, 12], b: [2, 9] },
    3: { a: [3, 15], b: [3, 12] },
    4: { a: [4, 25], b: [4, 15] },
    5: { a: [6, 40], b: [6, 25] },
  },
  add: {
    1: { a: [10, 50], b: [10, 49], minCarries: 0 },
    2: { a: [20, 99], b: [20, 99], minCarries: 1 },
    3: { a: [100, 499], b: [15, 99], minCarries: 1 },
    4: { a: [100, 999], b: [100, 999], minCarries: 1 },
    5: { a: [200, 999], b: [200, 999], minCarries: 2 },
  },
  sub: {
    1: { a: [20, 60], b: [10, 40], minCarries: 0 },
    2: { a: [30, 99], b: [11, 60], minCarries: 1 },
    3: { a: [100, 300], b: [15, 99], minCarries: 1 },
    4: { a: [200, 999], b: [110, 890], minCarries: 1 },
    5: { a: [300, 999], b: [110, 890], minCarries: 2 },
  },
};

/** How many independent draws before giving up on a family/tier. */
const MAX_ATTEMPTS = 200;

/** A subtraction never goes below this — the drill is not about signed results. */
const SUB_MIN_RESULT = 2;

// ─── Carry / borrow counting ───

/** Column-by-column carries in `a + b`. */
export function countCarries(a: number, b: number): number {
  let carry = 0;
  let carries = 0;
  let x = a;
  let y = b;
  while (x > 0 || y > 0) {
    const sum = (x % 10) + (y % 10) + carry;
    carry = sum >= 10 ? 1 : 0;
    if (carry) carries += 1;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return carries;
}

/** Column-by-column borrows in `a − b` (assumes a ≥ b). */
export function countBorrows(a: number, b: number): number {
  let borrow = 0;
  let borrows = 0;
  let x = a;
  let y = b;
  while (y > 0 || borrow) {
    const top = (x % 10) - borrow;
    const bottom = y % 10;
    if (top < bottom) {
      borrow = 1;
      borrows += 1;
    } else {
      borrow = 0;
    }
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return borrows;
}

// ─── Construction ───

function tryBuild(rng: Rng, family: SingleFamily, tier: Tier): GeneratedSingle | null {
  const spec = SPECS[family][tier];
  const p = randInt(rng, spec.a[0], spec.a[1]);
  const q = randInt(rng, spec.b[0], spec.b[1]);

  if (family === "mul") {
    // `7 × 7` and friends are memory, not calculation — they carry no signal
    // about whether he can multiply, so they are not worth a question.
    if (p === q && p <= 9) return null;
    return { family, tier, a: p, b: q, expression: `${p} ${TIMES} ${q}`, result: p * q };
  }

  if (family === "div") {
    // Built from the quotient so the answer is always a whole number.
    const dividend = p * q;
    if (q === 1 || p === 1) return null;
    return { family, tier, a: dividend, b: q, expression: `${dividend} ${DIVIDE} ${q}`, result: p };
  }

  if (family === "add") {
    if (countCarries(p, q) < (spec.minCarries ?? 0)) return null;
    return { family, tier, a: p, b: q, expression: `${p} + ${q}`, result: p + q };
  }

  // sub — order the operands so the result stays positive.
  const hi = Math.max(p, q);
  const lo = Math.min(p, q);
  const result = hi - lo;
  if (result < SUB_MIN_RESULT) return null;
  if (countBorrows(hi, lo) < (spec.minCarries ?? 0)) return null;
  return { family, tier, a: hi, b: lo, expression: `${hi} ${MINUS} ${lo}`, result };
}

/** Generate one direct operation. Throws only if the spec is unsatisfiable. */
export function generateSingle(
  family: SingleFamily,
  tier: Tier,
  rng: Rng = defaultRng
): GeneratedSingle {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const built = tryBuild(rng, family, tier);
    if (built) return built;
  }
  throw new Error(`mental-single: could not build a ${family} tier-${tier} question`);
}

// ─── Distractors ───

/**
 * Wrong options that correspond to REAL mistakes for THAT operation, not noise.
 *
 * This is why the families are modelled separately rather than through one
 * generic "answer ± something": the mistake a student actually makes on
 * `22 × 34` is dropping a partial product (660, not 748), and on `503 − 178`
 * it is forgetting a borrow (435, not 325). A distractor set built from generic
 * offsets never puts the student's own wrong answer on the screen, so choosing
 * correctly stops telling us anything about whether they can do the operation.
 */
export function mistakeCandidates(g: GeneratedSingle): number[] {
  const R = g.result;
  const out: number[] = [];

  if (g.family === "mul") {
    const units = g.b % 10;
    const tens = g.b - units;
    // Dropped one of the two partial products — the classic 2×2 slip.
    if (tens > 0) out.push(g.a * tens);
    if (units > 0 && tens > 0) out.push(g.a * units);
    // Off-by-one on an operand.
    out.push((g.a + 1) * g.b, (g.a - 1) * g.b, g.a * (g.b + 1), g.a * (g.b - 1));
    // A carry lost in the middle of the addition of partials.
    out.push(R - 10, R + 10, R - 100, R + 100);
  } else if (g.family === "div") {
    // Quotient off by one, and place-value slips.
    out.push(R + 1, R - 1, R + 2, R - 2, R * 10, Math.round(R / 10));
    // Divided by a neighbouring divisor — reading the wrong number.
    if (g.b > 2) out.push(Math.round(g.a / (g.b - 1)));
    out.push(Math.round(g.a / (g.b + 1)));
  } else if (g.family === "add") {
    // Forgotten carries, at each place value.
    out.push(R - 10, R - 100, R - 1000, R + 10, R + 1);
    out.push(R - 1, R + 9, R - 9, R + 11, R - 11);
  } else {
    // sub — forgotten borrows go the other way (the column result is 10 too big).
    out.push(R + 10, R + 100, R + 1000, R - 10, R + 1);
    out.push(R - 1, R + 9, R - 9, R + 11, R - 11);
  }

  return out;
}

/**
 * Options must be plausible at the scale of the answer.
 *
 * A fixed window cannot do this across four families whose answers span
 * `96 ÷ 8 = 12` and `847 × 63 = 53361`: ±25 is generous around 12 and invisible
 * around 53361. The band is therefore relative, with a floor so small answers
 * still get separable options.
 */
export function optionBand(result: number): number {
  return Math.max(4, Math.round(Math.abs(result) * 0.25));
}

export function buildSingleDistractors(
  g: GeneratedSingle,
  rng: Rng = defaultRng,
  count = 3
): number[] {
  const R = g.result;
  const band = optionBand(R);
  const usable = (n: number) =>
    Number.isInteger(n) && n > 0 && n !== R && Math.abs(n - R) <= band;

  const out: number[] = [];
  for (const c of mistakeCandidates(g)) {
    if (out.length >= count) break;
    if (usable(c) && !out.includes(c)) out.push(c);
  }

  // Not enough mistake-shaped candidates landed inside the band (happens on the
  // smallest answers, where the models collide). Fill outward from the answer,
  // in a shuffled order so the leftovers are not always "R+1, R−1".
  if (out.length < count) {
    const filler: number[] = [];
    for (let d = 1; d <= band; d++) filler.push(R + d, R - d);
    for (const n of shuffle(rng, filler)) {
      if (out.length >= count) break;
      if (n > 0 && n !== R && !out.includes(n)) out.push(n);
    }
  }

  // Last resort: widen past the plausibility band rather than hand back a
  // question with three options. Unreachable with today's tier specs (the
  // smallest answer any family can produce is 2, and the band is at least 4),
  // but a question missing an option is a broken question, and that should not
  // depend on a range in a table further up the file staying where it is.
  for (let d = band + 1; out.length < count; d++) {
    for (const n of [R + d, R - d]) {
      if (out.length >= count) break;
      if (n > 0 && n !== R && !out.includes(n)) out.push(n);
    }
    if (d > band + R + count + 10) break; // cannot loop forever
  }

  return out.slice(0, count);
}

// ─── Explanation ───

/** Step-by-step working, in the way it would actually be done in the head. */
export function explainSingle(g: GeneratedSingle): string {
  if (g.family === "mul") {
    const units = g.b % 10;
    const tens = g.b - units;
    if (tens > 0 && units > 0) {
      return `${g.a} ${TIMES} ${g.b} = ${g.a} ${TIMES} ${tens} + ${g.a} ${TIMES} ${units} = ${g.a * tens} + ${g.a * units} = ${g.result}.`;
    }
    return `${g.a} ${TIMES} ${g.b} = ${g.result}.`;
  }
  if (g.family === "div") {
    return `${g.a} ${DIVIDE} ${g.b} = ${g.result}, pentru că ${g.result} ${TIMES} ${g.b} = ${g.a}.`;
  }
  if (g.family === "add") {
    // Round the second operand to the nearest ten and correct — how it is done
    // mentally, and it shows the carry instead of hiding it.
    const rounded = Math.round(g.b / 10) * 10;
    const diff = g.b - rounded;
    if (rounded !== g.b && rounded > 0) {
      const sign = diff > 0 ? "+" : MINUS;
      return `${g.a} + ${g.b} = ${g.a} + ${rounded} ${sign} ${Math.abs(diff)} = ${g.a + rounded} ${sign} ${Math.abs(diff)} = ${g.result}.`;
    }
    return `${g.a} + ${g.b} = ${g.result}.`;
  }
  const rounded = Math.round(g.b / 10) * 10;
  const diff = g.b - rounded;
  if (rounded !== g.b && rounded > 0) {
    // Subtracting a round number and correcting back the other way — and the
    // correction goes OPPOSITE to the addition case. Taking away 20 instead of
    // 21 has removed one too few, so the extra one is subtracted, not added.
    // (Copying the addition branch here produced "59 − 21 = 59 − 20 + 1 = 40".)
    const sign = diff > 0 ? MINUS : "+";
    return `${g.a} ${MINUS} ${g.b} = ${g.a} ${MINUS} ${rounded} ${sign} ${Math.abs(diff)} = ${g.a - rounded} ${sign} ${Math.abs(diff)} = ${g.result}.`;
  }
  return `${g.a} ${MINUS} ${g.b} = ${g.result}.`;
}

// ─── Timing ───

/**
 * Seconds a direct operation is worth, before any personal adjustment.
 *
 * Direct operations get their clock from the OPERATION, not from where they sit
 * in the session. That is the difference from the chained questions, whose
 * budget comes off a single 45s→12s ramp: a chain is roughly one shape all the
 * way through, whereas `7 × 8` and `73 × 46` are the same "one multiplication"
 * and nothing like the same amount of work. Handing both the ramp's current
 * value would make the easy one a formality and the hard one impossible, and
 * neither would measure anything.
 */
const BASE_SECONDS: Record<SingleFamily, Record<Tier, number>> = {
  mul: { 1: 6, 2: 9, 3: 12, 4: 20, 5: 28 },
  div: { 1: 6, 2: 8, 3: 11, 4: 16, 5: 22 },
  add: { 1: 5, 2: 7, 3: 9, 4: 12, 5: 16 },
  sub: { 1: 6, 2: 8, 3: 10, 4: 14, 5: 18 },
};

/**
 * Mild pressure across the session, on top of the per-operation budget: the
 * same question is worth ~15% more time at the start of a sprint than at the
 * end. It keeps the "it gets tighter" feel of the drill without divorcing the
 * clock from the difficulty of what is actually on screen.
 */
export const SINGLE_PRESSURE_START = 1.15;
export const SINGLE_PRESSURE_END = 0.85;

export function singlePressure(index: number, total: number): number {
  const t = total > 1 ? Math.min(1, Math.max(0, index / (total - 1))) : 0;
  return SINGLE_PRESSURE_START + (SINGLE_PRESSURE_END - SINGLE_PRESSURE_START) * t;
}

export function baseSecondsFor(family: SingleFamily, tier: Tier): number {
  return BASE_SECONDS[family][tier];
}

// ─── Question assembly ───

export const SINGLE_TOPIC = "Operații directe";

export interface SingleQuestion {
  content: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Tier;
  subject: string;
  topic: string;
  family: SingleFamily;
}

export function generateSingleQuestion(
  family: SingleFamily,
  tier: Tier,
  rng: Rng = defaultRng
): SingleQuestion {
  const g = generateSingle(family, tier, rng);
  const distractors = buildSingleDistractors(g, rng);
  const options = shuffle(rng, [g.result, ...distractors].map(String));

  return {
    content: `${g.expression} = ?`,
    options,
    correctAnswer: String(g.result),
    explanation: explainSingle(g),
    difficulty: tier,
    subject: "Aritmetică mentală",
    topic: SINGLE_TOPIC,
    family,
  };
}
