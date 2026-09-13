import { describe, it, expect } from "vitest";
import { resolveSessionCompletion, isAlreadyCompletedError } from "@/lib/session-complete-result";

/**
 * `resolveSessionCompletion` is the last line of defence against the exact bug
 * a student hit: `/session/complete` can legitimately be called twice for the
 * same session (the overall clock and "last question answered" can both end
 * it within moments of each other), and the server's reply to the SECOND call
 * is `{ error: "Session already completed" }` — no score, no duration. Handed
 * straight to the results screen, that renders as `NaN%` / `NaN` / `NaN:NaN`.
 */
describe("resolveSessionCompletion", () => {
  const valid = { score: 80, totalQuestions: 10, correctAnswers: 8, duration: 245 };

  it("accepts a normal, complete result", () => {
    expect(resolveSessionCompletion(true, valid)).toEqual(valid);
  });

  it("refuses the exact 'already completed' envelope — the bug that shipped as NaN", () => {
    expect(resolveSessionCompletion(false, { error: "Session already completed" })).toBeNull();
  });

  it("refuses ANY non-ok response, regardless of body shape", () => {
    expect(resolveSessionCompletion(false, valid)).toBeNull();
    expect(resolveSessionCompletion(false, { error: "Session not found" })).toBeNull();
  });

  it("refuses a 200 that is missing a numeric field — belt and suspenders for a future bug", () => {
    for (const key of ["score", "totalQuestions", "correctAnswers", "duration"] as const) {
      const { [key]: _drop, ...rest } = valid;
      expect(resolveSessionCompletion(true, rest)).toBeNull();
    }
  });

  it("refuses NaN/Infinity fields, not just missing ones", () => {
    expect(resolveSessionCompletion(true, { ...valid, score: NaN })).toBeNull();
    expect(resolveSessionCompletion(true, { ...valid, duration: Infinity })).toBeNull();
  });

  it("refuses a body that isn't an object at all", () => {
    expect(resolveSessionCompletion(true, null)).toBeNull();
    expect(resolveSessionCompletion(true, undefined)).toBeNull();
    expect(resolveSessionCompletion(true, "ok")).toBeNull();
  });

  it("passes through the optional fields untouched (gamification, sprint debrief gate)", () => {
    const withExtras = {
      ...valid,
      sprintFeedbackRequired: true,
      timedOut: 2,
      gamification: { xpAwarded: 10, totalXp: 500, level: "Bronze", levelUp: false, newAchievements: [] },
    };
    expect(resolveSessionCompletion(true, withExtras)).toEqual(withExtras);
  });

  it("a score of exactly 0 is a real result, not treated as absent", () => {
    // 0/N correct is a legitimate, common case — must not be confused with a
    // missing/undefined score.
    expect(resolveSessionCompletion(true, { score: 0, totalQuestions: 5, correctAnswers: 0, duration: 60 })).toEqual({
      score: 0,
      totalQuestions: 5,
      correctAnswers: 0,
      duration: 60,
    });
  });
});

describe("isAlreadyCompletedError", () => {
  it("matches only the exact server string", () => {
    expect(isAlreadyCompletedError({ error: "Session already completed" })).toBe(true);
  });

  it("does not match a different error, or a non-error body", () => {
    expect(isAlreadyCompletedError({ error: "Session not found" })).toBe(false);
    expect(isAlreadyCompletedError({ score: 80 })).toBe(false);
    expect(isAlreadyCompletedError(null)).toBe(false);
    expect(isAlreadyCompletedError("Session already completed")).toBe(false);
  });
});
