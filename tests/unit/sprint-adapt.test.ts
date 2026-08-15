import { describe, it, expect } from "vitest";
import {
  adaptSprintProfile,
  isDifficultyAnswer,
  isTimeAnswer,
  LEVEL_MIN,
  LEVEL_MAX,
  TIME_FACTOR_MIN,
  TIME_FACTOR_MAX,
  type SprintOutcome,
} from "@/lib/sprint-adapt";

const base = { level: 3, timeFactor: 1 };
const perfect: SprintOutcome = { total: 20, correct: 20, timedOut: 0 };
const solid: SprintOutcome = { total: 20, correct: 15, timedOut: 0 };
const poor: SprintOutcome = { total: 20, correct: 8, timedOut: 0 };

describe("difficulty adaptation", () => {
  it('"prea ușor" with decent accuracy raises the level', () => {
    expect(adaptSprintProfile(base, { difficulty: "easy", time: "ok" }, solid).level).toBe(4);
  });

  it('"prea ușor" while getting half wrong does NOT raise the level', () => {
    const r = adaptSprintProfile(base, { difficulty: "easy", time: "ok" }, poor);
    expect(r.level).toBe(3);
    expect(r.notes.join(" ")).toContain("greșeli");
  });

  it('"prea greu" always lowers the level, even after a good score', () => {
    expect(adaptSprintProfile(base, { difficulty: "hard", time: "ok" }, perfect).level).toBe(2);
  });

  it('"cam bine" + near-perfect promotes anyway', () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, perfect).level).toBe(4);
  });

  it('"cam bine" + weak score demotes', () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, poor).level).toBe(2);
  });

  it('"cam bine" + middling score holds steady', () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, solid).level).toBe(3);
  });

  it("clamps to 1..5 in both directions", () => {
    expect(adaptSprintProfile({ level: 5, timeFactor: 1 }, { difficulty: "easy", time: "ok" }, perfect).level).toBe(LEVEL_MAX);
    expect(adaptSprintProfile({ level: 1, timeFactor: 1 }, { difficulty: "hard", time: "ok" }, poor).level).toBe(LEVEL_MIN);
  });
});

describe("time adaptation", () => {
  it('"prea puțin timp" stretches the clock', () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "tight" }, solid).timeFactor).toBe(1.25);
  });

  it('"prea mult timp" tightens the clock', () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "loose" }, solid).timeFactor).toBe(0.85);
  });

  it('"cam bine" but frequent timeouts still adds time', () => {
    const r = adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, { total: 20, correct: 15, timedOut: 6 });
    expect(r.timeFactor).toBe(1.15);
    expect(r.notes.join(" ")).toContain("expirat");
  });

  it('"cam bine", zero timeouts and a near-perfect score tightens gently', () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, perfect).timeFactor).toBe(0.92);
  });

  it("a middling session with no timeouts leaves the clock alone", () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, solid).timeFactor).toBe(1);
  });

  it("clamps the time factor to 0.5..2.5", () => {
    let s = { level: 3, timeFactor: TIME_FACTOR_MAX };
    expect(adaptSprintProfile(s, { difficulty: "ok", time: "tight" }, solid).timeFactor).toBe(TIME_FACTOR_MAX);
    s = { level: 3, timeFactor: TIME_FACTOR_MIN };
    expect(adaptSprintProfile(s, { difficulty: "ok", time: "loose" }, solid).timeFactor).toBe(TIME_FACTOR_MIN);
  });

  it("difficulty and time move independently in the same session", () => {
    // "too hard AND too rushed" — the common real case: ease off on both.
    const r = adaptSprintProfile(base, { difficulty: "hard", time: "tight" }, poor);
    expect(r.level).toBe(2);
    expect(r.timeFactor).toBe(1.25);
  });
});

describe("with live in-session adaptation, drift replaces accuracy as the signal", () => {
  // Once the live engine steers toward a constant success rate, "he got 78%"
  // says the adaptation worked — not that the difficulty was right. Where the
  // session had to MOVE to hold him there is the informative signal.
  const drifted = (endedTierOffset: number, endedTimeScale = 1): SprintOutcome => ({
    total: 20, correct: 15, timedOut: 1, endedTierOffset, endedTimeScale,
  });

  it('"cam bine" + the session climbed → next one starts higher', () => {
    const r = adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, drifted(2));
    expect(r.level).toBe(4);
    expect(r.notes.join(" ")).toContain("a urcat");
  });

  it('"cam bine" + the session had to back off → next one starts lower', () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, drifted(-1)).level).toBe(2);
  });

  it('"cam bine" + no drift → holds, even on a near-perfect score', () => {
    const r = adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, {
      total: 20, correct: 20, timedOut: 0, endedTierOffset: 0, endedTimeScale: 1,
    });
    // Under the old accuracy rule this promoted. With live data it must not:
    // a perfect score at zero drift means the level was already right.
    expect(r.level).toBe(3);
  });

  it('"prea ușor" is disbelieved when the session had to be made easier', () => {
    const r = adaptSprintProfile(base, { difficulty: "easy", time: "ok" }, drifted(-2));
    expect(r.level).toBe(3);
    expect(r.notes.join(" ")).toContain("a trebuit să coboare");
  });

  it('"prea greu" still wins outright, whatever the drift says', () => {
    expect(adaptSprintProfile(base, { difficulty: "hard", time: "ok" }, drifted(2)).level).toBe(2);
  });

  it("a session that kept needing more time starts more generously", () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, drifted(0, 1.4)).timeFactor).toBe(1.1);
  });

  it("a session answered consistently under time starts tighter", () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, drifted(0, 0.7)).timeFactor).toBe(0.93);
  });

  it("falls back to accuracy when there is no live data (older sessions)", () => {
    expect(adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, perfect).level).toBe(4);
  });

  it("ignores drift on a session too short for it to mean anything", () => {
    // A 2-question session always reports offset 0. Read as live data that says
    // "the level was exactly right" — and a "prea ușor" would promote off it.
    const tiny = { total: 2, correct: 1, timedOut: 0, endedTierOffset: 0, endedTimeScale: 1 };
    const r = adaptSprintProfile(base, { difficulty: "easy", time: "ok" }, tiny);
    // Falls back to accuracy (1/2 = 0.5 < 0.6) → not believed.
    expect(r.level).toBe(3);
    expect(r.notes.join(" ")).toContain("greșeli");
  });
});

describe("edge cases", () => {
  it("survives an empty session without dividing by zero", () => {
    const r = adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, { total: 0, correct: 0, timedOut: 0 });
    expect(r.level).toBe(3);
    expect(Number.isFinite(r.timeFactor)).toBe(true);
  });

  it("ignores counts that exceed the total instead of trusting them", () => {
    const r = adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, { total: 10, correct: 999, timedOut: 999 });
    // correct is clamped to total → accuracy 1.0 → promote; timeouts clamped → pressure branch.
    expect(r.level).toBe(4);
    expect(r.timeFactor).toBeGreaterThan(1);
  });

  it("always returns at least one note for the results screen", () => {
    const r = adaptSprintProfile(base, { difficulty: "ok", time: "ok" }, solid);
    expect(r.notes.length).toBeGreaterThan(0);
  });
});

describe("input guards", () => {
  it("accepts only the three known answers per question", () => {
    expect(isDifficultyAnswer("easy")).toBe(true);
    expect(isDifficultyAnswer("ok")).toBe(true);
    expect(isDifficultyAnswer("hard")).toBe(true);
    expect(isDifficultyAnswer("HARD")).toBe(false);
    expect(isDifficultyAnswer("")).toBe(false);
    expect(isDifficultyAnswer(null)).toBe(false);
    expect(isDifficultyAnswer("tight")).toBe(false);

    expect(isTimeAnswer("loose")).toBe(true);
    expect(isTimeAnswer("tight")).toBe(true);
    expect(isTimeAnswer("easy")).toBe(false);
    expect(isTimeAnswer(3)).toBe(false);
  });
});
