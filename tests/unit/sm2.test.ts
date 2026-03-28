import { describe, it, expect, beforeEach, vi } from "vitest";
import { sm2, gradeResponse } from "@/lib/sm2";

describe("SM-2 Algorithm", () => {
  describe("sm2()", () => {
    it("should set interval to 1 on first correct answer", () => {
      const result = sm2({ quality: 4, easeFactor: 2.5, interval: 0, repetitions: 0 });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it("should set interval to 6 on second correct answer", () => {
      const result = sm2({ quality: 4, easeFactor: 2.5, interval: 1, repetitions: 1 });
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it("should multiply interval by ease factor on subsequent correct answers", () => {
      const result = sm2({ quality: 4, easeFactor: 2.5, interval: 6, repetitions: 2 });
      expect(result.interval).toBe(15); // round(6 * 2.5)
      expect(result.repetitions).toBe(3);
    });

    it("should reset on incorrect answer (quality < 3)", () => {
      const result = sm2({ quality: 2, easeFactor: 2.5, interval: 15, repetitions: 5 });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it("should increase ease factor for quality 5", () => {
      const result = sm2({ quality: 5, easeFactor: 2.5, interval: 1, repetitions: 0 });
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it("should decrease ease factor for quality 3", () => {
      const result = sm2({ quality: 3, easeFactor: 2.5, interval: 1, repetitions: 0 });
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it("should never let ease factor go below 1.3", () => {
      const result = sm2({ quality: 0, easeFactor: 1.3, interval: 1, repetitions: 0 });
      expect(result.easeFactor).toBe(1.3);
    });

    it("should set nextReview to future date", () => {
      const now = new Date();
      const result = sm2({ quality: 4, easeFactor: 2.5, interval: 0, repetitions: 0 });
      expect(result.nextReview.getTime()).toBeGreaterThan(now.getTime());
    });

    it("should handle quality 0 (complete blackout)", () => {
      const result = sm2({ quality: 0, easeFactor: 2.5, interval: 10, repetitions: 5 });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
      expect(result.easeFactor).toBeCloseTo(1.7, 10); // 2.5 + (0.1 - 5*(0.08 + 5*0.02)) = 2.5 - 0.8
    });

    it("should handle quality 5 (perfect)", () => {
      const result = sm2({ quality: 5, easeFactor: 2.5, interval: 0, repetitions: 0 });
      expect(result.easeFactor).toBe(2.6); // 2.5 + 0.1
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it("should handle long streaks correctly", () => {
      let ef = 2.5;
      let interval = 0;
      let reps = 0;
      for (let i = 0; i < 10; i++) {
        const result = sm2({ quality: 4, easeFactor: ef, interval, repetitions: reps });
        ef = result.easeFactor;
        interval = result.interval;
        reps = result.repetitions;
      }
      expect(reps).toBe(10);
      expect(interval).toBeGreaterThan(30);
    });
  });

  describe("gradeResponse()", () => {
    it("should return 5 for very fast correct answer", () => {
      expect(gradeResponse(true, 10000, 30000)).toBe(5); // < 0.5 ratio
    });

    it("should return 4 for normal speed correct answer", () => {
      expect(gradeResponse(true, 20000, 30000)).toBe(4); // 0.5 <= ratio < 1.0
    });

    it("should return 3 for slow correct answer", () => {
      expect(gradeResponse(true, 40000, 30000)).toBe(3); // ratio >= 1.0
    });

    it("should return 2 for quick wrong answer (guessing)", () => {
      expect(gradeResponse(false, 15000, 30000)).toBe(2); // < 1.0 ratio
    });

    it("should return 1 for slow wrong answer", () => {
      expect(gradeResponse(false, 35000, 30000)).toBe(1); // 1.0 <= ratio < 2.0
    });

    it("should return 0 for very slow wrong answer", () => {
      expect(gradeResponse(false, 70000, 30000)).toBe(0); // ratio >= 2.0
    });

    it("should use default expectedTime of 30000ms", () => {
      expect(gradeResponse(true, 10000)).toBe(5);
    });
  });
});
