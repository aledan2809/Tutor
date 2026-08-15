import { describe, it, expect } from "vitest";
import {
  generateChain,
  generateChainQuestion,
  generateSprint,
  buildDistractors,
  leftToRightValue,
  explainChain,
  renderChain,
  runningTotals,
  tierForIndex,
  secondsForIndex,
  RESULT_MIN,
  RESULT_MAX,
  SPRINT_MIN_SECONDS,
  SPRINT_QUESTION_COUNT,
  TIERS,
  type Rng,
  type Tier,
} from "@/lib/mental-chain";

/** Deterministic RNG (mulberry32) so failures are reproducible. */
function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Independent evaluator: parses the RENDERED string with standard precedence.
 * Deliberately does NOT reuse the generator's own term model — if the renderer
 * and the model ever disagree, this catches it.
 */
function evalExpression(expr: string): number {
  const tokens = expr.replace(/−/g, "-").split(/\s+/);
  // First pass: collapse × and ÷.
  const flat: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk === "×" || tk === "÷") {
      const left = Number(flat.pop());
      const right = Number(tokens[++i]);
      flat.push(String(tk === "×" ? left * right : left / right));
    } else {
      flat.push(tk);
    }
  }
  // Second pass: left-to-right + and −.
  let acc = Number(flat[0]);
  for (let i = 1; i < flat.length; i += 2) {
    const op = flat[i];
    const v = Number(flat[i + 1]);
    acc = op === "+" ? acc + v : acc - v;
  }
  return acc;
}

describe("mental-chain generator", () => {
  it("every tier produces a chain whose rendered text evaluates to the stated result", () => {
    for (const tier of TIERS) {
      for (let i = 0; i < 300; i++) {
        const c = generateChain(tier, seeded(tier * 1000 + i));
        expect(evalExpression(c.expression), `${c.expression} (tier ${tier})`).toBe(c.result);
      }
    }
  });

  it("the final result always stays within 1..30 (the user's ceiling)", () => {
    for (const tier of TIERS) {
      for (let i = 0; i < 300; i++) {
        const c = generateChain(tier, seeded(tier * 7919 + i));
        expect(c.result).toBeGreaterThanOrEqual(RESULT_MIN);
        expect(c.result).toBeLessThanOrEqual(RESULT_MAX);
      }
    }
  });

  it("divisions are always exact (no fractions to carry in the head)", () => {
    for (const tier of TIERS) {
      for (let i = 0; i < 300; i++) {
        const c = generateChain(tier, seeded(tier * 31 + i));
        for (const t of c.terms) {
          if (t.kind === "div") {
            expect(t.a % (t.b as number)).toBe(0);
            expect(t.a / (t.b as number)).toBe(t.value);
          }
        }
      }
    }
  });

  it("never opens with a minus sign", () => {
    for (const tier of TIERS) {
      for (let i = 0; i < 200; i++) {
        const c = generateChain(tier, seeded(tier * 13 + i));
        expect(c.expression.startsWith("−")).toBe(false);
        expect(c.expression.startsWith("-")).toBe(false);
        expect(c.expression.startsWith("+")).toBe(false);
      }
    }
  });

  it("intermediate values ARE allowed above 30 (the point of 25 × 5 − 40 ÷ 8 − 95)", () => {
    let sawBigIntermediate = false;
    for (let i = 0; i < 400 && !sawBigIntermediate; i++) {
      const c = generateChain(4, seeded(i));
      if (c.terms.some((t) => t.value > RESULT_MAX)) sawBigIntermediate = true;
    }
    expect(sawBigIntermediate).toBe(true);
  });

  it("warm-up tiers never dip below zero part-way through", () => {
    for (const tier of [1, 2] as Tier[]) {
      for (let i = 0; i < 400; i++) {
        const c = generateChain(tier, seeded(tier * 5501 + i));
        expect(runningTotals(c.terms).every((v) => v >= 0), c.expression).toBe(true);
      }
    }
  });

  it("hard tiers DO produce negative running totals (part of the challenge)", () => {
    let sawNegative = false;
    for (let i = 0; i < 400 && !sawNegative; i++) {
      if (runningTotals(generateChain(5, seeded(i)).terms).some((v) => v < 0)) sawNegative = true;
    }
    expect(sawNegative).toBe(true);
  });

  it("never produces an all-tiny chain like 8 + 2 − 2", () => {
    for (const tier of TIERS) {
      for (let i = 0; i < 300; i++) {
        const c = generateChain(tier, seeded(tier * 641 + i));
        expect(Math.max(...c.terms.map((t) => t.value)), c.expression).toBeGreaterThanOrEqual(12);
      }
    }
  });

  it("higher tiers actually use multiplication and division", () => {
    const kindsAt = (tier: Tier) => {
      const seen = new Set<string>();
      for (let i = 0; i < 60; i++) {
        generateChain(tier, seeded(tier * 17 + i)).terms.forEach((t) => seen.add(t.kind));
      }
      return seen;
    };
    expect(kindsAt(1)).toEqual(new Set(["num"]));
    expect(kindsAt(2)).toEqual(new Set(["num"]));
    expect(kindsAt(3).has("mul")).toBe(true);
    expect(kindsAt(4).has("mul")).toBe(true);
    expect(kindsAt(4).has("div")).toBe(true);
    expect(kindsAt(5).has("div")).toBe(true);
  });
});

describe("distractors", () => {
  it("gives exactly 3 distinct wrong options, none equal to the answer", () => {
    for (const tier of TIERS) {
      for (let i = 0; i < 200; i++) {
        const rng = seeded(tier * 101 + i);
        const c = generateChain(tier, rng);
        const d = buildDistractors(c, rng);
        expect(d).toHaveLength(3);
        expect(new Set(d).size).toBe(3);
        expect(d).not.toContain(c.result);
        d.forEach((n) => {
          expect(Number.isInteger(n)).toBe(true);
          expect(n).toBeGreaterThanOrEqual(0);
        });
      }
    }
  });

  it("left-to-right models the real precedence slip: 10 − 2 × 3 read as (10−2)×3", () => {
    const terms = [
      { kind: "num" as const, value: 10, sign: 1 as const, a: 10 },
      { kind: "mul" as const, value: 6, sign: -1 as const, a: 2, b: 3 },
    ];
    expect(leftToRightValue(terms)).toBe(24); // the slip, NOT the correct 4
  });

  it("the precedence slip is actually produced as an option, not just defined", () => {
    // Regression guard: the first version of leftToRightValue reduced over
    // already-evaluated terms, so it always returned the correct answer and the
    // distractor silently never existed. Measure it rather than trust it.
    let differs = 0;
    let used = 0;
    for (let i = 0; i < 600; i++) {
      const rng = seeded(i * 977 + 5);
      const c = generateChain(i % 2 === 0 ? 3 : 4, rng);
      const ltr = leftToRightValue(c.terms);
      if (ltr !== c.result) differs++;
      if (buildDistractors(c, seeded(i * 977 + 5)).includes(ltr)) used++;
    }
    expect(differs).toBeGreaterThan(0);
    expect(used).toBeGreaterThan(0);
  });

  it("no option is above the 1..30 result ceiling (nothing eliminable on sight)", () => {
    for (const tier of TIERS) {
      for (let i = 0; i < 200; i++) {
        const q = generateChainQuestion(tier, seeded(tier * 71 + i));
        q.options.forEach((o) => {
          expect(Number(o)).toBeGreaterThanOrEqual(0);
          expect(Number(o)).toBeLessThanOrEqual(RESULT_MAX);
        });
      }
    }
  });
});

describe("question assembly", () => {
  it("options always contain the correct answer, 4 total, all distinct", () => {
    for (const tier of TIERS) {
      for (let i = 0; i < 200; i++) {
        const q = generateChainQuestion(tier, seeded(tier * 991 + i));
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.correctAnswer);
        expect(q.content.endsWith(" = ?")).toBe(true);
        expect(q.difficulty).toBe(tier);
      }
    }
  });

  it("explanation states the true result and shows the ×/÷ steps first", () => {
    const rng = seeded(4242);
    const c = generateChain(4, rng);
    const text = explainChain(c);
    expect(text).toContain(String(c.result));
    expect(text).toContain("Întâi înmulțirile");
  });

  it("renderChain round-trips through the independent parser", () => {
    for (let i = 0; i < 200; i++) {
      const c = generateChain(5, seeded(i * 3 + 1));
      expect(evalExpression(renderChain(c.terms))).toBe(c.result);
    }
  });
});

describe("session shape (crescendo)", () => {
  it("difficulty climbs across the session and never leaves 1..5", () => {
    for (const level of [1, 2, 3, 4, 5]) {
      const tiers = Array.from({ length: 20 }, (_, i) => tierForIndex(i, 20, level));
      expect(tiers[0]).toBeLessThanOrEqual(tiers[19]);
      tiers.forEach((t) => {
        expect(t).toBeGreaterThanOrEqual(1);
        expect(t).toBeLessThanOrEqual(5);
      });
      // Monotonic non-decreasing — a crescendo, never a dip.
      for (let i = 1; i < tiers.length; i++) expect(tiers[i]).toBeGreaterThanOrEqual(tiers[i - 1]);
    }
  });

  it("level 1 starts at the easiest tier and level 5 ends at the hardest", () => {
    expect(tierForIndex(0, 20, 1)).toBe(1);
    expect(tierForIndex(19, 20, 5)).toBe(5);
  });

  it("splits the session evenly between the clamped endpoints (no squashed low end)", () => {
    // Level 1 clamps to the 1..2 band — it must be a 50/50 split, not 15/5.
    const tiers = Array.from({ length: 20 }, (_, i) => tierForIndex(i, 20, 1));
    expect(tiers.filter((t) => t === 1)).toHaveLength(10);
    expect(tiers.filter((t) => t === 2)).toHaveLength(10);
    // Level 3 spans 2..4 — every tier in the band must actually appear.
    const mid = Array.from({ length: 20 }, (_, i) => tierForIndex(i, 20, 3));
    expect(new Set(mid)).toEqual(new Set([2, 3, 4]));
  });

  it("time shrinks monotonically from 45s to 12s", () => {
    const secs = Array.from({ length: 20 }, (_, i) => secondsForIndex(i, 20));
    expect(secs[0]).toBe(45);
    expect(secs[19]).toBe(12);
    for (let i = 1; i < secs.length; i++) expect(secs[i]).toBeLessThanOrEqual(secs[i - 1]);
  });

  it("timeFactor stretches or squeezes the whole ramp but never below the floor", () => {
    expect(secondsForIndex(0, 20, 1.5)).toBe(68);
    expect(secondsForIndex(19, 20, 1.5)).toBe(18);
    expect(secondsForIndex(19, 20, 0.1)).toBe(SPRINT_MIN_SECONDS);
  });

  it("a full sprint is 20 questions, crescendo in difficulty, decrescendo in time", () => {
    const sprint = generateSprint(2, 1, SPRINT_QUESTION_COUNT, seeded(777));
    expect(sprint).toHaveLength(20);
    for (let i = 1; i < sprint.length; i++) {
      expect(sprint[i].question.difficulty).toBeGreaterThanOrEqual(sprint[i - 1].question.difficulty);
      expect(sprint[i].seconds).toBeLessThanOrEqual(sprint[i - 1].seconds);
    }
    // Every question is independently valid.
    sprint.forEach(({ question }) => {
      expect(question.options).toContain(question.correctAnswer);
      expect(Number(question.correctAnswer)).toBeLessThanOrEqual(RESULT_MAX);
    });
  });
});
