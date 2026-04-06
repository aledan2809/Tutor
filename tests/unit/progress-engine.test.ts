import { describe, it, expect } from "vitest";
import { calculateMastery, initialMastery } from "@/lib/progress-engine";

describe("Progress Engine", () => {
  describe("initialMastery()", () => {
    it("should return 100 when correct", () => {
      expect(initialMastery(true)).toBe(100);
    });

    it("should return 0 when incorrect", () => {
      expect(initialMastery(false)).toBe(0);
    });
  });

  describe("calculateMastery()", () => {
    it("should blend 70% accuracy with 30% prior mastery", () => {
      // 1 correct out of 1 total, prior mastery 50, correct answer
      // newCorrect = 1+1=2, newTotal=1+1=2, accuracy = 100%
      // mastery = 0.7*100 + 0.3*50 = 70+15 = 85
      expect(calculateMastery(50, 1, 1, true)).toBe(85);
    });

    it("should not exceed 100", () => {
      expect(calculateMastery(100, 10, 10, true)).toBeLessThanOrEqual(100);
    });

    it("should handle first incorrect answer with zero history", () => {
      // newCorrect=0, newTotal=1, accuracy=0%
      // mastery = 0.7*0 + 0.3*0 = 0
      expect(calculateMastery(0, 0, 0, false)).toBe(0);
    });

    it("should handle first correct answer with zero history", () => {
      // newCorrect=1, newTotal=1, accuracy=100%
      // mastery = 0.7*100 + 0.3*0 = 70
      expect(calculateMastery(0, 0, 0, true)).toBe(70);
    });

    it("should decrease mastery on wrong answer", () => {
      // 5 correct out of 10, prior mastery 80, wrong answer
      // newCorrect=5, newTotal=11, accuracy=45.45%
      // mastery = 0.7*45.45 + 0.3*80 = 31.82 + 24 = 55.82
      const result = calculateMastery(80, 5, 10, false);
      expect(result).toBeLessThan(80);
    });
  });
});
