import { describe, it, expect } from "vitest";
import { XP_REWARDS, ACHIEVEMENTS } from "@/lib/gamification";

// Test pure constants and calculation logic that doesn't require DB
describe("Gamification Constants", () => {
  describe("XP_REWARDS", () => {
    it("should have correct answer XP", () => {
      expect(XP_REWARDS.CORRECT_ANSWER).toBe(10);
    });

    it("should have fast answer bonus", () => {
      expect(XP_REWARDS.FAST_ANSWER_BONUS).toBe(5);
    });

    it("should have session complete XP", () => {
      expect(XP_REWARDS.SESSION_COMPLETE).toBe(50);
    });

    it("should have perfect score bonus", () => {
      expect(XP_REWARDS.PERFECT_SCORE).toBe(100);
    });

    it("should have daily challenge 2x multiplier", () => {
      expect(XP_REWARDS.DAILY_CHALLENGE_MULTIPLIER).toBe(2);
    });

    it("should have exam XP rewards in correct order", () => {
      expect(XP_REWARDS.EXAM_COMPLETE).toBe(75);
      expect(XP_REWARDS.EXAM_PASS_BONUS).toBe(150);
      expect(XP_REWARDS.EXAM_ACE_BONUS).toBe(250);
    });

    it("should reward exam ace more than pass", () => {
      expect(XP_REWARDS.EXAM_ACE_BONUS).toBeGreaterThan(XP_REWARDS.EXAM_PASS_BONUS);
    });
  });

  describe("ACHIEVEMENTS", () => {
    it("should have 11 achievement definitions", () => {
      expect(ACHIEVEMENTS).toHaveLength(11);
    });

    it("should have unique slugs", () => {
      const slugs = ACHIEVEMENTS.map((a) => a.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("should have required fields for each achievement", () => {
      for (const a of ACHIEVEMENTS) {
        expect(a.slug).toBeTruthy();
        expect(a.name).toBeTruthy();
        expect(a.description).toBeTruthy();
      }
    });

    it("should include milestone achievements", () => {
      const milestones = ACHIEVEMENTS.filter((a) => a.slug.startsWith("milestone_"));
      expect(milestones).toHaveLength(3);
    });

    it("should include exam-related achievements", () => {
      const examAchievements = ACHIEVEMENTS.filter((a) => a.slug.startsWith("exam_"));
      expect(examAchievements.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Level calculation logic", () => {
    const DEFAULT_LEVELS = [
      { name: "Cadet", minXp: 0 },
      { name: "Co-pilot", minXp: 500 },
      { name: "Captain", minXp: 2000 },
      { name: "Instructor", minXp: 5000 },
    ];

    function calculateLevel(xp: number, levels: { name: string; minXp: number }[]): string {
      let current = levels[0]?.name ?? "Cadet";
      for (const lvl of levels) {
        if (xp >= lvl.minXp) current = lvl.name;
      }
      return current;
    }

    it("should return Cadet for 0 XP", () => {
      expect(calculateLevel(0, DEFAULT_LEVELS)).toBe("Cadet");
    });

    it("should return Co-pilot at 500 XP", () => {
      expect(calculateLevel(500, DEFAULT_LEVELS)).toBe("Co-pilot");
    });

    it("should return Captain at 2000 XP", () => {
      expect(calculateLevel(2000, DEFAULT_LEVELS)).toBe("Captain");
    });

    it("should return Instructor at 5000 XP", () => {
      expect(calculateLevel(5000, DEFAULT_LEVELS)).toBe("Instructor");
    });

    it("should return highest level for very high XP", () => {
      expect(calculateLevel(99999, DEFAULT_LEVELS)).toBe("Instructor");
    });

    it("should handle intermediate XP values", () => {
      expect(calculateLevel(499, DEFAULT_LEVELS)).toBe("Cadet");
      expect(calculateLevel(1999, DEFAULT_LEVELS)).toBe("Co-pilot");
      expect(calculateLevel(4999, DEFAULT_LEVELS)).toBe("Captain");
    });
  });

  describe("Streak logic", () => {
    function calculateStreak(
      currentStreak: number,
      lastActivityDate: Date | null,
      now: Date
    ): number {
      if (!lastActivityDate) return 1;
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastDay = new Date(lastActivityDate.getFullYear(), lastActivityDate.getMonth(), lastActivityDate.getDate());
      const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) return currentStreak + 1;
      if (diffDays === 0) return currentStreak;
      return 1; // streak broken
    }

    it("should start streak at 1 for first activity", () => {
      expect(calculateStreak(0, null, new Date())).toBe(1);
    });

    it("should increment streak for consecutive days", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(calculateStreak(5, yesterday, new Date())).toBe(6);
    });

    it("should keep streak on same-day activity", () => {
      expect(calculateStreak(5, new Date(), new Date())).toBe(5);
    });

    it("should reset streak on missed days", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(calculateStreak(10, threeDaysAgo, new Date())).toBe(1);
    });
  });

  describe("XP calculations", () => {
    it("should calculate correct answer XP with fast bonus", () => {
      const baseXp = XP_REWARDS.CORRECT_ANSWER;
      const fastBonus = XP_REWARDS.FAST_ANSWER_BONUS;
      expect(baseXp + fastBonus).toBe(15);
    });

    it("should calculate session complete XP with perfect score", () => {
      const xp = XP_REWARDS.SESSION_COMPLETE + XP_REWARDS.PERFECT_SCORE;
      expect(xp).toBe(150);
    });

    it("should calculate max exam XP (pass + ace + perfect)", () => {
      const maxExamXp =
        XP_REWARDS.EXAM_COMPLETE +
        XP_REWARDS.EXAM_PASS_BONUS +
        XP_REWARDS.EXAM_ACE_BONUS +
        XP_REWARDS.PERFECT_SCORE;
      expect(maxExamXp).toBe(575);
    });

    it("should calculate daily challenge XP", () => {
      const dailyXp = XP_REWARDS.CORRECT_ANSWER * XP_REWARDS.DAILY_CHALLENGE_MULTIPLIER;
      expect(dailyXp).toBe(20);
    });
  });
});
