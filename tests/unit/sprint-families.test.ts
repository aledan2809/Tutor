import { describe, it, expect } from "vitest";
import {
  FAMILY_FAST_STREAK_TO_PROMOTE,
  FAMILY_LEVEL_MAX,
  FAMILY_LEVEL_MIN,
  FAMILY_MISS_STREAK_TO_DEMOTE,
  FAMILY_TIME_MAX,
  FAMILY_TIME_MIN,
  MIN_FAMILY_WEIGHT,
  classifyFamilyEvent,
  computeFamilyState,
  familyTier,
  familyWeights,
  foldFamilyBaselines,
  initialFamilyState,
  pickFamily,
  readFamilyBaselines,
  type FamilyEvent,
} from "@/lib/sprint-families";
import { SINGLE_FAMILIES, type SingleFamily } from "@/lib/mental-single";

const ev = (
  family: SingleFamily,
  over: Partial<FamilyEvent> = {}
): FamilyEvent => ({
  family,
  correct: true,
  timedOut: false,
  timeSpentMs: 5000,
  budgetSeconds: 20,
  ...over,
});

const fast = (f: SingleFamily) => ev(f, { timeSpentMs: 4000, budgetSeconds: 20 });
/** Correct, comfortably inside the clock but not fast — 70% of the budget. */
const steady = (f: SingleFamily) => ev(f, { timeSpentMs: 14000, budgetSeconds: 20 });
const slow = (f: SingleFamily) => ev(f, { timeSpentMs: 19000, budgetSeconds: 20 });
const wrong = (f: SingleFamily) => ev(f, { correct: false });
const expired = (f: SingleFamily) => ev(f, { correct: false, timedOut: true, timeSpentMs: 20000 });

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe("classification", () => {
  it("reads speed relative to the budget that question was given", () => {
    expect(classifyFamilyEvent(ev("mul", { timeSpentMs: 4000, budgetSeconds: 20 }))).toBe("fast");
    expect(classifyFamilyEvent(ev("mul", { timeSpentMs: 14000, budgetSeconds: 20 }))).toBe("ok");
    expect(classifyFamilyEvent(ev("mul", { timeSpentMs: 19000, budgetSeconds: 20 }))).toBe("slow");
    expect(classifyFamilyEvent(wrong("mul"))).toBe("miss");
    expect(classifyFamilyEvent(expired("mul"))).toBe("miss");
  });

  it("does not divide by a zero budget", () => {
    expect(classifyFamilyEvent(ev("mul", { budgetSeconds: 0, timeSpentMs: 1 }))).toBe("slow");
  });
});

describe("families are adapted independently", () => {
  it("a run of fast multiplications does not touch divisions", () => {
    const events = Array.from({ length: FAMILY_FAST_STREAK_TO_PROMOTE }, () => fast("mul"));
    const s = computeFamilyState(events);
    expect(s.mul.level).toBe(FAMILY_LEVEL_MIN + 1);
    expect(s.div.level).toBe(FAMILY_LEVEL_MIN);
    expect(s.div.timeScale).toBe(1);
  });

  it("misses on one family loosen only that family's clock", () => {
    const s = computeFamilyState([wrong("sub"), wrong("sub")]);
    expect(s.sub.timeScale).toBeGreaterThan(1);
    expect(s.add.timeScale).toBe(1);
  });

  it("promotes only on a streak, and the streak resets after it fires", () => {
    const almost = computeFamilyState(
      Array.from({ length: FAMILY_FAST_STREAK_TO_PROMOTE - 1 }, () => fast("div"))
    );
    expect(almost.div.level).toBe(FAMILY_LEVEL_MIN);
    const twice = computeFamilyState(
      Array.from({ length: FAMILY_FAST_STREAK_TO_PROMOTE * 2 }, () => fast("div"))
    );
    expect(twice.div.level).toBe(FAMILY_LEVEL_MIN + 2);
  });

  it("demotes on consecutive misses", () => {
    const base = { mul: { level: 4, timeFactor: 1 } };
    const s = computeFamilyState(
      Array.from({ length: FAMILY_MISS_STREAK_TO_DEMOTE }, () => wrong("mul")),
      base
    );
    expect(s.mul.level).toBe(3);
  });

  it("a correct-but-not-fast answer breaks the streak without counting against him", () => {
    const s = computeFamilyState([fast("add"), fast("add"), steady("add"), fast("add")]);
    expect(s.add.level).toBe(FAMILY_LEVEL_MIN);
    expect(s.add.missStreak).toBe(0);
  });

  it("stays inside its bounds however long the run", () => {
    const up = computeFamilyState(Array.from({ length: 200 }, () => fast("mul")));
    expect(up.mul.level).toBe(FAMILY_LEVEL_MAX);
    expect(up.mul.timeScale).toBeGreaterThanOrEqual(FAMILY_TIME_MIN);
    const down = computeFamilyState(Array.from({ length: 200 }, () => expired("mul")));
    expect(down.mul.level).toBe(FAMILY_LEVEL_MIN);
    expect(down.mul.timeScale).toBeLessThanOrEqual(FAMILY_TIME_MAX);
  });

  it("is a pure fold — recomputing gives the same state", () => {
    const history = [fast("mul"), wrong("div"), slow("add"), fast("mul"), expired("sub"), fast("mul")];
    expect(computeFamilyState(history)).toEqual(computeFamilyState([...history]));
  });

  it("ignores an unknown family in stored data rather than throwing", () => {
    const rogue = [{ ...ev("mul"), family: "pow" as SingleFamily }];
    expect(() => computeFamilyState(rogue)).not.toThrow();
  });
});

describe("weighting — where the session spends its questions", () => {
  it("starts with multiplication and division favoured, as asked", () => {
    const w = familyWeights(initialFamilyState());
    expect(w.mul).toBeGreaterThan(w.add);
    expect(w.div).toBeGreaterThan(w.sub);
  });

  it("gives more of the drill to the family he is getting wrong", () => {
    const struggling = computeFamilyState([wrong("add"), wrong("add"), wrong("add"), fast("sub"), fast("sub"), fast("sub")]);
    const w = familyWeights(struggling);
    expect(w.add).toBeGreaterThan(w.sub);
  });

  it("fades a family he is fast and right at", () => {
    const mastered = computeFamilyState(Array.from({ length: 6 }, () => fast("mul")));
    expect(familyWeights(mastered).mul).toBeLessThan(familyWeights(initialFamilyState()).mul);
  });

  it("does not treat fast-but-wrong as mastery", () => {
    // Rushing and missing is not the same as being quick and right; the damping
    // must not reward it.
    const rushed = computeFamilyState([
      ev("mul", { correct: false, timeSpentMs: 1000 }),
      ev("mul", { correct: false, timeSpentMs: 1000 }),
      fast("mul"),
    ]);
    expect(familyWeights(rushed).mul).toBeGreaterThanOrEqual(
      familyWeights(computeFamilyState([fast("mul"), fast("mul"), fast("mul")])).mul
    );
  });

  it("never silences a family completely", () => {
    const perfect = computeFamilyState(Array.from({ length: 50 }, () => fast("add")));
    expect(familyWeights(perfect).add).toBeGreaterThanOrEqual(MIN_FAMILY_WEIGHT);
  });
});

describe("selection", () => {
  it("only ever returns a real family", () => {
    const rng = seeded(5);
    const state = computeFamilyState([fast("mul"), wrong("div")]);
    for (let i = 0; i < 500; i++) {
      expect(SINGLE_FAMILIES).toContain(pickFamily(state, rng));
    }
  });

  it("forces the families still unmeasured when the slots run out", () => {
    const state = computeFamilyState([fast("mul"), fast("div")]);
    // Two families never seen, two slots left — both must be spent on them.
    const rng = seeded(9);
    for (let i = 0; i < 100; i++) {
      expect(["add", "sub"]).toContain(pickFamily(state, rng, 2));
    }
  });

  it("leaves the choice open while there is room to spare", () => {
    const state = computeFamilyState([fast("mul"), fast("div")]);
    const rng = seeded(9);
    const picks = new Set(Array.from({ length: 200 }, () => pickFamily(state, rng, 8)));
    expect(picks.size).toBeGreaterThan(2);
  });

  it("survives a degenerate weighting without throwing", () => {
    expect(SINGLE_FAMILIES).toContain(pickFamily(initialFamilyState(), () => 0));
    expect(SINGLE_FAMILIES).toContain(pickFamily(initialFamilyState(), () => 0.999999));
  });
});

describe("carry-over between sessions", () => {
  it("moves the level at most one step per session", () => {
    const session = computeFamilyState(Array.from({ length: 30 }, () => fast("mul")));
    expect(session.mul.level).toBe(FAMILY_LEVEL_MAX);
    const next = foldFamilyBaselines({ mul: { level: 1, timeFactor: 1 } }, session);
    expect(next.mul.level).toBe(2);
  });

  it("leaves a family that was never asked exactly where it was", () => {
    const session = computeFamilyState([fast("mul")]);
    const next = foldFamilyBaselines({ div: { level: 4, timeFactor: 1.8 } }, session);
    expect(next.div).toEqual({ level: 4, timeFactor: 1.8 });
  });

  it("damps the clock rather than adopting the session's ending value", () => {
    const session = computeFamilyState(Array.from({ length: 10 }, () => expired("sub")));
    const next = foldFamilyBaselines({ sub: { level: 3, timeFactor: 1 } }, session);
    expect(next.sub.timeFactor).toBeGreaterThan(1);
    expect(next.sub.timeFactor).toBeLessThan(session.sub.timeScale);
  });
});

describe("reading stored data", () => {
  it("accepts a well-formed record", () => {
    expect(readFamilyBaselines({ mul: { level: 3, timeFactor: 1.2 } }).mul).toEqual({ level: 3, timeFactor: 1.2 });
  });

  it("clamps values that a bad write could have left behind", () => {
    const out = readFamilyBaselines({ mul: { level: 99, timeFactor: 99 } });
    expect(out.mul).toEqual({ level: FAMILY_LEVEL_MAX, timeFactor: FAMILY_TIME_MAX });
  });

  it("returns an empty map for anything that is not a record", () => {
    for (const junk of [null, undefined, 42, "x", [], [1, 2]]) {
      expect(readFamilyBaselines(junk)).toEqual({});
    }
  });

  it("ignores unknown keys and malformed entries", () => {
    expect(readFamilyBaselines({ pow: { level: 3 }, mul: "nope", div: null })).toEqual({});
  });
});

describe("familyTier", () => {
  it("stays a legal tier whatever the stored level", () => {
    const s = initialFamilyState({ mul: { level: 99, timeFactor: 1 } });
    expect(familyTier(s, "mul")).toBe(FAMILY_LEVEL_MAX);
  });
});
