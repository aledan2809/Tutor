import { describe, it, expect } from "vitest";
import { sanitizeQuestions } from "@/lib/exam-engine";
import type { Question } from "@prisma/client";

const mockQuestion: Question = {
  id: "q1",
  domainId: "d1",
  subject: "Aviation",
  topic: "Navigation",
  difficulty: 3,
  type: "MULTIPLE_CHOICE",
  content: "What is VOR?",
  options: ["A", "B", "C", "D"],
  correctAnswer: "A",
  explanation: "VOR stands for VHF Omnidirectional Range",
  source: "MANUAL",
  status: "PUBLISHED",
  createdById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Exam Engine", () => {
  describe("sanitizeQuestions()", () => {
    it("should strip correctAnswer from questions", () => {
      const sanitized = sanitizeQuestions([mockQuestion], "REAL");
      expect(sanitized[0]).not.toHaveProperty("correctAnswer");
    });

    it("should include explanation in PRACTICE mode", () => {
      const sanitized = sanitizeQuestions([mockQuestion], "PRACTICE");
      expect(sanitized[0]).toHaveProperty("explanation");
    });

    it("should not include explanation in REAL mode", () => {
      const sanitized = sanitizeQuestions([mockQuestion], "REAL");
      expect(sanitized[0]).not.toHaveProperty("explanation");
    });

    it("should preserve question id, content, type, options", () => {
      const sanitized = sanitizeQuestions([mockQuestion], "REAL");
      expect(sanitized[0].id).toBe("q1");
      expect(sanitized[0].content).toBe("What is VOR?");
      expect(sanitized[0].type).toBe("MULTIPLE_CHOICE");
      expect(sanitized[0].options).toEqual(["A", "B", "C", "D"]);
    });

    it("should handle multiple questions", () => {
      const questions = [mockQuestion, { ...mockQuestion, id: "q2" }];
      const sanitized = sanitizeQuestions(questions, "REAL");
      expect(sanitized).toHaveLength(2);
    });
  });
});
