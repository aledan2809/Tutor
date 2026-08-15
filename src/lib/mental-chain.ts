/**
 * Chained mental-arithmetic generator ("Sprint de calcul") for the private
 * Aptitudini Aviație domain.
 *
 * Produces expressions like `27 − 12 + 45 − 33` or `25 × 5 − 40 ÷ 8 − 95`:
 * several operations in one line, evaluated with STANDARD PRECEDENCE (× ÷ bind
 * before + −), where the FINAL result always lands in [1, 30] even though the
 * intermediate values may be much larger (125 in the example above). That is
 * the point of the exercise — the arithmetic has to be carried in the head, but
 * the answer stays small enough to be checked instantly.
 *
 * Pure: no DB, no IO, no global state. The RNG is injectable so tests are
 * deterministic and so a session can be reproduced from a seed.
 */

// ─── Shape ───

/** A chain is a signed sum of terms; each term is a number, a product, or an exact quotient. */
export type TermKind = "num" | "mul" | "div";

export interface ChainTerm {
  kind: TermKind;
  /** Evaluated value of the term itself (always ≥ 0, sign lives on `sign`). */
  value: number;
  /** +1 or −1 — how the term enters the sum. The first term is always +1. */
  sign: 1 | -1;
  /** Operands, for rendering. `num` uses only a. */
  a: number;
  b?: number;
}

export interface GeneratedChain {
  /** Rendered expression without the trailing "= ?" (e.g. "25 × 5 − 40 ÷ 8 − 95"). */
  expression: string;
  /** The correct final value — always within RESULT_MIN..RESULT_MAX. */
  result: number;
  terms: ChainTerm[];
  tier: Tier;
}

export type Tier = 1 | 2 | 3 | 4 | 5;

export type Rng = () => number;

// ─── Tunables ───

/** The answer never leaves this window — the user's "rezultate să nu treacă de 30". */
export const RESULT_MIN = 1;
export const RESULT_MAX = 30;

/** A repaired plain term must stay a sane, readable operand. */
const PLAIN_MIN = 2;
const PLAIN_MAX = 99;

/** How many independent construction attempts before giving up on a tier. */
const MAX_ATTEMPTS = 200;

const MINUS = "−"; // U+2212, not a hyphen — matches the existing aptitudini bank
const TIMES = "×";
const DIVIDE = "÷";

// ─── RNG helpers ───

const defaultRng: Rng = Math.random;

function randInt(rng: Rng, lo: number, hi: number): number {
  return Math.floor(rng() * (hi - lo + 1)) + lo;
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[randInt(rng, 0, arr.length - 1)];
}

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Tier specs ───

/**
 * Per tier: which term kinds the chain is built from, and how big the plain
 * operands may be. Tier 4 is deliberately the shape of the user's own example
 * (`25 × 5 − 40 ÷ 8 − 95`).
 */
interface TierSpec {
  kinds: TermKind[];
  plainMin: number;
  plainMax: number;
  /** Multiplication operand ranges. */
  mul: [[number, number], [number, number]];
  /** Division: quotient range and divisor range (dividend = quotient × divisor). */
  div: [[number, number], [number, number]];
  /**
   * Whether the running total is allowed to dip below zero part-way through.
   * Dropping under zero mid-chain is a real jump in difficulty (`14 − 46 + 35`),
   * so the two warm-up tiers stay non-negative all the way across; from tier 3
   * on it is part of the challenge.
   */
  allowNegativeRun: boolean;
  /** At least one operand this large — stops the repair step producing `8 + 2 − 2`. */
  minLargestOperand: number;
}

const TIER_SPECS: Record<Tier, TierSpec> = {
  1: { kinds: ["num", "num", "num"], plainMin: 4, plainMax: 40, mul: [[2, 9], [2, 9]], div: [[2, 9], [2, 5]], allowNegativeRun: false, minLargestOperand: 12 },
  2: { kinds: ["num", "num", "num", "num"], plainMin: 4, plainMax: 50, mul: [[2, 9], [2, 9]], div: [[2, 9], [2, 5]], allowNegativeRun: false, minLargestOperand: 15 },
  3: { kinds: ["mul", "num", "num"], plainMin: 3, plainMax: 60, mul: [[2, 12], [2, 9]], div: [[2, 9], [2, 6]], allowNegativeRun: true, minLargestOperand: 12 },
  4: { kinds: ["mul", "div", "num"], plainMin: 2, plainMax: 99, mul: [[5, 25], [3, 9]], div: [[2, 12], [2, 9]], allowNegativeRun: true, minLargestOperand: 12 },
  5: { kinds: ["mul", "div", "num", "num"], plainMin: 2, plainMax: 99, mul: [[5, 25], [4, 9]], div: [[3, 15], [3, 9]], allowNegativeRun: true, minLargestOperand: 12 },
};

export const TIERS: Tier[] = [1, 2, 3, 4, 5];

/** Human label for a tier — shown to the student as the session's difficulty. */
export const TIER_LABELS: Record<Tier, string> = {
  1: "Încălzire",
  2: "Ușor",
  3: "Mediu",
  4: "Greu",
  5: "Foarte greu",
};

// ─── Construction ───

function makeTerm(rng: Rng, kind: TermKind, spec: TierSpec): ChainTerm {
  if (kind === "mul") {
    const a = randInt(rng, spec.mul[0][0], spec.mul[0][1]);
    const b = randInt(rng, spec.mul[1][0], spec.mul[1][1]);
    return { kind, value: a * b, sign: 1, a, b };
  }
  if (kind === "div") {
    // Built from the quotient so the division is always exact.
    const q = randInt(rng, spec.div[0][0], spec.div[0][1]);
    const d = randInt(rng, spec.div[1][0], spec.div[1][1]);
    return { kind, value: q, sign: 1, a: q * d, b: d };
  }
  const a = randInt(rng, spec.plainMin, spec.plainMax);
  return { kind, value: a, sign: 1, a };
}

function evaluate(terms: readonly ChainTerm[]): number {
  return terms.reduce((sum, t) => sum + t.sign * t.value, 0);
}

/** Every partial sum, in the order the student reads them. */
export function runningTotals(terms: readonly ChainTerm[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const t of terms) {
    acc += t.sign * t.value;
    out.push(acc);
  }
  return out;
}

export function renderTerm(t: ChainTerm): string {
  if (t.kind === "mul") return `${t.a} ${TIMES} ${t.b}`;
  if (t.kind === "div") return `${t.a} ${DIVIDE} ${t.b}`;
  return String(t.a);
}

export function renderChain(terms: readonly ChainTerm[]): string {
  return terms
    .map((t, i) => {
      const body = renderTerm(t);
      if (i === 0) return body;
      return `${t.sign === 1 ? "+" : MINUS} ${body}`;
    })
    .join(" ");
}

/**
 * Build one chain at the given tier whose final value is `target`.
 *
 * Strategy: lay the terms down at random, then REPAIR one plain term so the sum
 * lands exactly on the target. Because a plain term enters the sum as `sign ×
 * value`, moving it by `sign × (target − total)` closes the gap in one step.
 * If that would push the operand out of a readable range the attempt is thrown
 * away and we try again — cheaper and less biased than searching.
 */
function tryBuild(rng: Rng, tier: Tier, target: number): GeneratedChain | null {
  const spec = TIER_SPECS[tier];
  const kinds = shuffle(rng, spec.kinds);

  const terms: ChainTerm[] = kinds.map((k) => makeTerm(rng, k, spec));

  // Signs: the first term stays positive so the expression never opens with a
  // minus. Every other term is an independent coin flip.
  terms.forEach((t, i) => {
    t.sign = i === 0 ? 1 : rng() < 0.5 ? 1 : -1;
  });

  // Repair through a plain term (products/quotients can't absorb an arbitrary
  // delta without breaking their operands). Prefer one that is NOT first, so
  // the leading term keeps its randomly generated size.
  const plainIdx = terms.map((t, i) => (t.kind === "num" ? i : -1)).filter((i) => i >= 0);
  if (plainIdx.length === 0) return null;
  const repairIdx = plainIdx.length > 1 ? pick(rng, plainIdx.slice(1)) : plainIdx[0];

  const repaired = terms[repairIdx];
  const delta = target - evaluate(terms);
  const newValue = repaired.value + repaired.sign * delta;
  if (newValue < PLAIN_MIN || newValue > PLAIN_MAX) return null;

  repaired.value = newValue;
  repaired.a = newValue;

  // The repair can leave a chain that is technically valid but not worth asking:
  // every operand tiny (`8 + 2 − 2`), or — on the warm-up tiers — a partial sum
  // that dives below zero. Reject and let the caller draw again.
  if (Math.max(...terms.map((t) => t.value)) < spec.minLargestOperand) return null;
  if (!spec.allowNegativeRun && runningTotals(terms).some((v) => v < 0)) return null;

  // Belt and braces: the arithmetic must still land exactly on the target.
  if (evaluate(terms) !== target) return null;

  return { expression: renderChain(terms), result: target, terms, tier };
}

/** Generate one chain at `tier`. Throws only if the tier spec is unsatisfiable. */
export function generateChain(tier: Tier, rng: Rng = defaultRng): GeneratedChain {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const target = randInt(rng, RESULT_MIN, RESULT_MAX);
    const chain = tryBuild(rng, tier, target);
    if (chain) return chain;
  }
  throw new Error(`mental-chain: could not build a tier-${tier} chain in ${MAX_ATTEMPTS} attempts`);
}

// ─── Distractors ───

/**
 * Wrong options that correspond to REAL mistakes, not noise:
 *  • left-to-right evaluation — the classic precedence slip (`25 × 5 − 40 ÷ 8`
 *    read strictly left to right)
 *  • one sign flipped — dropped or doubled a minus
 *  • small offsets — a carry/borrow error
 *
 * All options are kept inside a band around the correct answer, so no option can
 * be eliminated on sight ("that one is 130, it can't be right").
 */
export function leftToRightValue(terms: readonly ChainTerm[]): number {
  // Must walk the RENDERED tokens, not the evaluated terms. Reducing over
  // `t.value` applies precedence before the reduction even starts, so it can
  // only ever reproduce the correct answer — measured over 20k chains, the
  // earlier version never once differed, i.e. this distractor never existed.
  //
  // Here the product/quotient is deliberately NOT pre-evaluated: `10 − 2 × 3`
  // becomes ((10 − 2) × 3) = 24, which is the mistake being modelled.
  let acc = 0;
  for (let i = 0; i < terms.length; i++) {
    const t = terms[i];
    const lead = i === 0 ? t.a : t.sign === 1 ? acc + t.a : acc - t.a;
    if (t.kind === "mul") acc = lead * (t.b as number);
    else if (t.kind === "div") acc = lead / (t.b as number);
    else acc = lead;
  }
  return acc;
}

/**
 * Distractors stay inside the same window as the answer. The student knows every
 * result is ≤ 30, so an option above that can be struck on sight — measured, 31%
 * of questions leaked at least one such freebie before this bound.
 */
const BAND = 25;
const OPTION_MIN = 0;
const OPTION_MAX = RESULT_MAX;

export function buildDistractors(
  chain: GeneratedChain,
  rng: Rng = defaultRng,
  count = 3
): number[] {
  const R = chain.result;
  const inBand = (n: number) =>
    Number.isInteger(n) && n !== R && n >= OPTION_MIN && n <= OPTION_MAX && Math.abs(n - R) <= BAND;

  const candidates: number[] = [];

  // 1. Precedence slip (only meaningful when it actually differs).
  const ltr = leftToRightValue(chain.terms);
  if (inBand(ltr)) candidates.push(ltr);

  // 2. Sign flips — one per non-leading term.
  for (let i = 1; i < chain.terms.length; i++) {
    const flipped = R - 2 * chain.terms[i].sign * chain.terms[i].value;
    if (inBand(flipped)) candidates.push(flipped);
  }

  // 3. Carry/borrow style offsets.
  for (const d of shuffle(rng, [1, 2, 3, 4, 5, 9, 10, 11])) {
    for (const s of shuffle(rng, [1, -1])) {
      const n = R + s * d;
      if (inBand(n)) candidates.push(n);
    }
  }

  const out: number[] = [];
  for (const c of candidates) {
    if (out.length >= count) break;
    if (!out.includes(c)) out.push(c);
  }

  // Last resort (tiny R with a crowded band): walk outward until filled.
  for (let d = 1; out.length < count && d <= OPTION_MAX; d++) {
    for (const n of [R + d, R - d]) {
      if (out.length >= count) break;
      if (n >= OPTION_MIN && n <= OPTION_MAX && n !== R && !out.includes(n)) out.push(n);
    }
  }

  return out.slice(0, count);
}

// ─── Explanation ───

/** Step-by-step working, so a wrong answer teaches instead of just scoring. */
export function explainChain(chain: GeneratedChain): string {
  const steps: string[] = [];

  for (const t of chain.terms) {
    if (t.kind === "mul") steps.push(`${t.a} ${TIMES} ${t.b} = ${t.value}`);
    if (t.kind === "div") steps.push(`${t.a} ${DIVIDE} ${t.b} = ${t.value}`);
  }

  const flat = chain.terms
    .map((t, i) => (i === 0 ? String(t.value) : `${t.sign === 1 ? "+" : MINUS} ${t.value}`))
    .join(" ");

  if (steps.length > 0) {
    steps.push(`apoi ${flat} = ${chain.result}`);
    return `Întâi înmulțirile și împărțirile: ${steps.join("; ")}.`;
  }
  return `${flat} = ${chain.result}.`;
}

// ─── Question assembly ───

export interface ChainQuestion {
  content: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Tier;
  subject: string;
  topic: string;
}

export const SPRINT_SUBJECT = "Aritmetică mentală";
export const SPRINT_TOPIC = "Calcul rapid în lanț";

/**
 * Answer recorded when the per-question clock runs out. Lives here (a pure
 * module) rather than beside the DB helpers so the browser can import it without
 * dragging Prisma in. It can never collide with a real option — those are plain
 * integers — so it grades as wrong and stays countable afterwards.
 */
export const SPRINT_TIMEOUT_ANSWER = "__timeout__";

/**
 * Slug of the domain that owns this drill. Kept in the pure module so the client
 * can import it without pulling Prisma in — the debrief-only view needs it before
 * any session payload has been loaded.
 */
export const SPRINT_DOMAIN_SLUG = "aptitudini-aviatie";

export function generateChainQuestion(tier: Tier, rng: Rng = defaultRng): ChainQuestion {
  const chain = generateChain(tier, rng);
  const distractors = buildDistractors(chain, rng);
  const options = shuffle(rng, [chain.result, ...distractors].map(String));

  return {
    content: `${chain.expression} = ?`,
    options,
    correctAnswer: String(chain.result),
    explanation: explainChain(chain),
    difficulty: tier,
    subject: SPRINT_SUBJECT,
    topic: SPRINT_TOPIC,
  };
}

// ─── Session shape: the crescendo ───

/** Defaults for a sprint — 20 questions, 45s down to 12s (chosen with the user). */
export const SPRINT_QUESTION_COUNT = 20;
export const SPRINT_START_SECONDS = 45;
export const SPRINT_END_SECONDS = 12;
/** Never go below this, whatever the adaptation says — it stops being solvable. */
export const SPRINT_MIN_SECONDS = 5;

/**
 * Difficulty ramp across one session: centred on the student's current level,
 * climbing from L−1 to L+1. At level 1 the session runs 1→2; at level 5, 4→5.
 *
 * The clamp is applied to the ENDPOINTS, then the ramp is spread evenly between
 * them — clamping the ramp itself would squash the low end (at level 1 the first
 * three quarters of the session all collapsed onto tier 1).
 */
export function tierForIndex(index: number, total: number, level: number): Tier {
  const lo = Math.min(5, Math.max(1, Math.round(level) - 1));
  const hi = Math.min(5, Math.max(1, Math.round(level) + 1));
  const t = total > 1 ? index / (total - 1) : 0;
  return (lo + Math.round((hi - lo) * t)) as Tier;
}

/**
 * Time allowed for question `index`: a linear ramp from start to end seconds,
 * scaled by the student's personal `timeFactor` (raised when they say the pace
 * was too tight, lowered when they say it was too generous).
 */
export function secondsForIndex(
  index: number,
  total: number,
  timeFactor = 1,
  startSeconds = SPRINT_START_SECONDS,
  endSeconds = SPRINT_END_SECONDS
): number {
  const t = total > 1 ? index / (total - 1) : 0;
  const base = startSeconds + (endSeconds - startSeconds) * t;
  return Math.max(SPRINT_MIN_SECONDS, Math.round(base * timeFactor));
}

/** The full question set for one sprint, already in crescendo order. */
export function generateSprint(
  level: number,
  timeFactor = 1,
  count = SPRINT_QUESTION_COUNT,
  rng: Rng = defaultRng
): { question: ChainQuestion; seconds: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    question: generateChainQuestion(tierForIndex(i, count, level), rng),
    seconds: secondsForIndex(i, count, timeFactor),
  }));
}
