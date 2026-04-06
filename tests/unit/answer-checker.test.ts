import { describe, it, expect } from "vitest";
import { checkAnswer } from "@/lib/answer-checker";

describe("Answer Checker", () => {
  describe("MULTIPLE_CHOICE", () => {
    const mcQuestion = { type: "MULTIPLE_CHOICE", correctAnswer: "B" };

    it("should accept exact match", () => {
      expect(checkAnswer(mcQuestion, "B")).toBe(true);
    });

    it("should be case-insensitive", () => {
      expect(checkAnswer(mcQuestion, "b")).toBe(true);
    });

    it("should trim whitespace", () => {
      expect(checkAnswer(mcQuestion, "  B  ")).toBe(true);
    });

    it("should reject wrong answer", () => {
      expect(checkAnswer(mcQuestion, "A")).toBe(false);
    });
  });

  describe("OPEN type", () => {
    it("should match normalized text", () => {
      const q = { type: "OPEN", correctAnswer: "Hello World" };
      expect(checkAnswer(q, "hello world")).toBe(true);
    });

    it("should normalize multiple spaces", () => {
      const q = { type: "OPEN", correctAnswer: "foo bar" };
      expect(checkAnswer(q, "foo   bar")).toBe(true);
    });

    it("should preserve special characters like C++", () => {
      const q = { type: "OPEN", correctAnswer: "C++" };
      expect(checkAnswer(q, "c++")).toBe(true);
    });

    it("should trim input", () => {
      const q = { type: "OPEN", correctAnswer: "answer" };
      expect(checkAnswer(q, "  answer  ")).toBe(true);
    });

    it("should reject wrong answer", () => {
      const q = { type: "OPEN", correctAnswer: "correct" };
      expect(checkAnswer(q, "wrong")).toBe(false);
    });
  });
});
