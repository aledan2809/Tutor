import { describe, it, expect } from "vitest";
import {
  SINGLE_FAMILIES,
  baseSecondsFor,
  buildSingleDistractors,
  countBorrows,
  countCarries,
  explainSingle,
  generateSingle,
  generateSingleQuestion,
  optionBand,
  singlePressure,
  SINGLE_PRESSURE_END,
  SINGLE_PRESSURE_START,
  type SingleFamily,
} from "@/lib/mental-single";
import { TIERS, type Tier } from "@/lib/mental-chain";

/** Deterministic RNG so a failure can be reproduced exactly. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Independent evaluator — deliberately does not reuse the generator's maths. */
function evalExpression(expr: string): number {
  const norm = expr.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/");
  const [a, op, b] = norm.trim().split(/\s+/);
  const x = Number(a);
  const y = Number(b);
  if (op === "+") return x + y;
  if (op === "-") return x - y;
  if (op === "*") return x * y;
  return x / y;
}

describe("carry / borrow counting", () => {
  it("counts carries in an addition", () => {
    expect(countCarries(41, 32)).toBe(0);
    expect(countCarries(47, 38)).toBe(1);
    expect(countCarries(99, 99)).toBe(2);
    expect(countCarries(555, 555)).toBe(3);
  });

  it("counts borrows in a subtraction", () => {
    expect(countBorrows(68, 25)).toBe(0);
    expect(countBorrows(62, 29)).toBe(1);
    expect(countBorrows(300, 111)).toBe(2);
  });

  it("counts the borrow that cascades through a zero", () => {
    // 100 − 1: the units column borrows, and the tens column has nothing to
    // give, so the borrow propagates. A counter that stops at the first column
    // reports 1 and would let a tier-2 question through as tier-1 material.
    expect(countBorrows(100, 1)).toBe(2);
  });
});

describe("generateSingle", () => {
  it.each(SINGLE_FAMILIES)("produces arithmetically true %s questions at every tier", (family) => {
    const rng = seeded(7);
    for (const tier of TIERS) {
      for (let i = 0; i < 400; i++) {
        const g = generateSingle(family, tier, rng);
        expect(evalExpression(g.expression)).toBe(g.result);
        expect(Number.isInteger(g.result)).toBe(true);
      }
    }
  });

  it("never asks a division that does not come out whole", () => {
    const rng = seeded(11);
    for (const tier of TIERS) {
      for (let i = 0; i < 500; i++) {
        const g = generateSingle("div", tier, rng);
        expect(g.a % g.b).toBe(0);
        expect(g.result).toBe(g.a / g.b);
      }
    }
  });

  it("never asks a subtraction with a negative result", () => {
    const rng = seeded(13);
    for (const tier of TIERS) {
      for (let i = 0; i < 500; i++) {
        expect(generateSingle("sub", tier, rng).result).toBeGreaterThan(0);
      }
    }
  });

  it("honours the carry/borrow floor that defines + and − difficulty", () => {
    const rng = seeded(17);
    for (let i = 0; i < 300; i++) {
      const add = generateSingle("add", 5, rng);
      expect(countCarries(add.a, add.b)).toBeGreaterThanOrEqual(2);
      const sub = generateSingle("sub", 5, rng);
      expect(countBorrows(sub.a, sub.b)).toBeGreaterThanOrEqual(2);
    }
  });

  it("does not ask a squared single digit — that is recall, not calculation", () => {
    const rng = seeded(19);
    for (let i = 0; i < 800; i++) {
      const g = generateSingle("mul", 1, rng);
      expect(g.a === g.b && g.a <= 9).toBe(false);
    }
  });

  it("reaches the shapes the drill was asked for", () => {
    // 22 × 34 is a tier-4 multiplication; 84 ÷ 12 and 96 ÷ 8 are divisions.
    const rng = seeded(23);
    const t4 = Array.from({ length: 300 }, () => generateSingle("mul", 4, rng));
    expect(t4.some((g) => g.a >= 20 && g.b >= 20)).toBe(true);
    const divs = Array.from({ length: 300 }, () => generateSingle("div", 3, rng));
    expect(divs.some((g) => g.b >= 10)).toBe(true);
  });
});

describe("distractors", () => {
  it("always offers four distinct, positive, plausible options containing the answer", () => {
    const rng = seeded(29);
    for (const family of SINGLE_FAMILIES) {
      for (const tier of TIERS) {
        for (let i = 0; i < 200; i++) {
          const q = generateSingleQuestion(family, tier as Tier, rng);
          expect(q.options).toHaveLength(4);
          expect(new Set(q.options).size).toBe(4);
          expect(q.options).toContain(q.correctAnswer);
          for (const o of q.options) expect(Number(o)).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps every option inside the band, so none can be struck on sight", () => {
    const rng = seeded(31);
    for (const family of SINGLE_FAMILIES) {
      for (let i = 0; i < 300; i++) {
        const g = generateSingle(family, 4, rng);
        const band = optionBand(g.result);
        for (const d of buildSingleDistractors(g, rng)) {
          expect(Math.abs(d - g.result)).toBeLessThanOrEqual(band);
        }
      }
    }
  });

  it("still produces a full option set for an implausibly small answer", () => {
    // Guards the fallback: if a future tier spec allowed an answer of 1, the
    // banded candidates alone would not fill four options.
    const tiny = { family: "sub" as SingleFamily, tier: 1 as Tier, a: 3, b: 2, expression: "3 − 2", result: 1 };
    const opts = buildSingleDistractors(tiny, seeded(2), 3);
    expect(opts).toHaveLength(3);
    expect(new Set(opts).size).toBe(3);
    for (const o of opts) { expect(o).toBeGreaterThan(0); expect(o).not.toBe(1); }
  });

  it("models the dropped partial product, which is the real 2×2 mistake", () => {
    const g = { family: "mul" as SingleFamily, tier: 4 as Tier, a: 22, b: 34, expression: "22 × 34", result: 748 };
    const opts = buildSingleDistractors(g, seeded(3), 3);
    // 22 × 30 = 660 — the answer of someone who forgot the units partial.
    expect(opts).toContain(660);
  });
});

/**
 * Every `A op B = C` written inside an explanation, checked for being true.
 *
 * This exists because of a real failure in the shipped question bank: questions
 * whose stated answer AGREED with their explanation while the explanation's own
 * arithmetic disagreed with both ("(10 × 5²) / 1 = 50 N", which is 250). An
 * explanation nobody ever evaluated is where that hides, so it is evaluated here.
 */
function selfContradictions(text: string): string[] {
  const norm = text.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/");
  // Compare WHOLE segments of the equality chain. Matching "<expr> = <number>"
  // instead reads "29 * 21 = 29 * 20 + 29 * 1" as "29 * 21 = 29" and invents a
  // contradiction — the same mistake that made a first pass over the shipped
  // bank report 21% failures that were the checker's, not the questions'.
  const segments = norm.split("=").map((p) => p.trim().replace(/[.,;]+$/, "").trim());
  const values = segments.map((seg) =>
    /^[\d\s()+\-*/]+$/.test(seg) && /\d/.test(seg)
      ? (Function(`"use strict";return (${seg});`)() as number)
      : null
  );
  const out: string[] = [];
  for (let i = 0; i < values.length - 1; i++) {
    const a = values[i];
    const b = values[i + 1];
    if (a === null || b === null) continue;
    if (a !== b) out.push(`"${segments[i]}" = ${a} but written as "${segments[i + 1]}" = ${b}`);
  }
  return out;
}

describe("explanations", () => {
  it("states working that reaches the answer", () => {
    const rng = seeded(37);
    for (const family of SINGLE_FAMILIES) {
      for (const tier of TIERS) {
        for (let i = 0; i < 100; i++) {
          const g = generateSingle(family, tier, rng);
          const text = explainSingle(g);
          // "= <result>", not followed by another digit — so "= 2" does not
          // match inside "= 24".
          expect(text).toMatch(new RegExp(`= ${g.result}(?![0-9])`));
        }
      }
    }
  });

  it("never writes arithmetic that contradicts itself", () => {
    const rng = seeded(41);
    for (const family of SINGLE_FAMILIES) {
      for (const tier of TIERS) {
        for (let i = 0; i < 200; i++) {
          const g = generateSingle(family, tier, rng);
          expect(selfContradictions(explainSingle(g))).toEqual([]);
        }
      }
    }
  });

  it("the division explanation proves itself by multiplying back", () => {
    const g = generateSingle("div", 3, seeded(43));
    expect(explainSingle(g)).toContain(`${g.result} × ${g.b} = ${g.a}`);
  });
});

describe("timing", () => {
  it("gives a harder operation more time than an easier one in the same family", () => {
    for (const family of SINGLE_FAMILIES) {
      for (let t = 1; t < 5; t++) {
        expect(baseSecondsFor(family, (t + 1) as Tier)).toBeGreaterThan(
          baseSecondsFor(family, t as Tier)
        );
      }
    }
  });

  it("tightens across the session without ever inverting", () => {
    expect(singlePressure(0, 10)).toBe(SINGLE_PRESSURE_START);
    expect(singlePressure(9, 10)).toBeCloseTo(SINGLE_PRESSURE_END, 10);
    for (let i = 1; i < 10; i++) {
      expect(singlePressure(i, 10)).toBeLessThan(singlePressure(i - 1, 10));
    }
  });

  it("does not divide by zero on a one-question session", () => {
    expect(singlePressure(0, 1)).toBe(SINGLE_PRESSURE_START);
    expect(Number.isFinite(singlePressure(0, 0))).toBe(true);
  });
});
