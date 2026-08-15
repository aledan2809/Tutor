import { describe, it, expect } from "vitest";
import { SESSION_TYPES, type SessionType } from "@/lib/session-engine";

describe("Session Types", () => {
  it("should have 7 session types", () => {
    expect(Object.keys(SESSION_TYPES)).toHaveLength(7);
  });

  it("should have all expected types", () => {
    // "sprint" is the timed chained-arithmetic drill — offered only in the
    // aptitude domain, but it lives in the same registry as the rest.
    const types: SessionType[] = ["micro", "quick", "deep", "repair", "recovery", "intensive", "sprint"];
    for (const t of types) {
      expect(SESSION_TYPES).toHaveProperty(t);
    }
  });

  describe("micro session", () => {
    it("should be 2 minutes with 5 questions", () => {
      expect(SESSION_TYPES.micro.duration).toBe(120);
      expect(SESSION_TYPES.micro.questionCount).toBe(5);
    });
  });

  describe("quick session", () => {
    it("should be 10 minutes with 15 questions", () => {
      expect(SESSION_TYPES.quick.duration).toBe(600);
      expect(SESSION_TYPES.quick.questionCount).toBe(15);
    });
  });

  describe("deep session", () => {
    it("should be 20 minutes with 30 questions", () => {
      expect(SESSION_TYPES.deep.duration).toBe(1200);
      expect(SESSION_TYPES.deep.questionCount).toBe(30);
    });
  });

  describe("repair session", () => {
    it("should be 15 minutes with 20 questions", () => {
      expect(SESSION_TYPES.repair.duration).toBe(900);
      expect(SESSION_TYPES.repair.questionCount).toBe(20);
    });
  });

  describe("recovery session", () => {
    it("should be 10 minutes with 15 questions", () => {
      expect(SESSION_TYPES.recovery.duration).toBe(600);
      expect(SESSION_TYPES.recovery.questionCount).toBe(15);
    });
  });

  describe("intensive session", () => {
    it("should be 20 minutes with 30 questions", () => {
      expect(SESSION_TYPES.intensive.duration).toBe(1200);
      expect(SESSION_TYPES.intensive.questionCount).toBe(30);
    });
  });

  describe("all sessions should have labels", () => {
    it("should have non-empty labels", () => {
      for (const key of Object.keys(SESSION_TYPES) as SessionType[]) {
        expect(SESSION_TYPES[key].label).toBeTruthy();
      }
    });
  });
});
