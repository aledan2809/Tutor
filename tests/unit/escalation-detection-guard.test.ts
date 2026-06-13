import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  escalationDetectionEnabled,
  escalationMaxNewPerRun,
  escalationDetectionWindow,
  escalationCooldownStart,
} from "@/lib/escalation/engine";

describe("Escalation detection storm-guard", () => {
  const ENV = process.env;
  beforeEach(() => {
    process.env = { ...ENV };
  });
  afterEach(() => {
    process.env = ENV;
  });

  describe("escalationDetectionEnabled", () => {
    it("is opt-in: false unless ESCALATION_DETECT_ENABLED='true'", () => {
      delete process.env.ESCALATION_DETECT_ENABLED;
      expect(escalationDetectionEnabled()).toBe(false);
      process.env.ESCALATION_DETECT_ENABLED = "1";
      expect(escalationDetectionEnabled()).toBe(false);
      process.env.ESCALATION_DETECT_ENABLED = "TRUE";
      expect(escalationDetectionEnabled()).toBe(false);
      process.env.ESCALATION_DETECT_ENABLED = "true";
      expect(escalationDetectionEnabled()).toBe(true);
    });
  });

  describe("escalationMaxNewPerRun", () => {
    it("defaults to 50", () => {
      delete process.env.ESCALATION_MAX_NEW_PER_RUN;
      expect(escalationMaxNewPerRun()).toBe(50);
    });
    it("honors a positive override (floored)", () => {
      process.env.ESCALATION_MAX_NEW_PER_RUN = "10";
      expect(escalationMaxNewPerRun()).toBe(10);
      process.env.ESCALATION_MAX_NEW_PER_RUN = "7.9";
      expect(escalationMaxNewPerRun()).toBe(7);
    });
    it("falls back to 50 on garbage / non-positive", () => {
      for (const v of ["0", "-5", "abc", ""]) {
        process.env.ESCALATION_MAX_NEW_PER_RUN = v;
        expect(escalationMaxNewPerRun()).toBe(50);
      }
    });
  });

  describe("escalationDetectionWindow", () => {
    const now = new Date("2026-06-13T12:00:00.000Z");

    it("inactiveBefore is exactly 24h before now", () => {
      const { inactiveBefore } = escalationDetectionWindow(now, 14);
      expect(now.getTime() - inactiveBefore.getTime()).toBe(24 * 60 * 60 * 1000);
    });

    it("lapsedAfter is recencyDays before now", () => {
      const { lapsedAfter } = escalationDetectionWindow(now, 14);
      expect(now.getTime() - lapsedAfter.getTime()).toBe(14 * 24 * 60 * 60 * 1000);
    });

    it("window is non-empty (lapsedAfter < inactiveBefore) for recency > 1 day", () => {
      const { inactiveBefore, lapsedAfter } = escalationDetectionWindow(now, 14);
      expect(lapsedAfter.getTime()).toBeLessThan(inactiveBefore.getTime());
    });

    it("clamps invalid recencyDays to 14", () => {
      for (const bad of [0, -3, NaN]) {
        const { lapsedAfter } = escalationDetectionWindow(now, bad);
        expect(now.getTime() - lapsedAfter.getTime()).toBe(14 * 24 * 60 * 60 * 1000);
      }
    });
  });

  describe("escalationCooldownStart", () => {
    const now = new Date("2026-06-13T12:00:00.000Z");

    it("defaults to 7 days before now", () => {
      expect(now.getTime() - escalationCooldownStart(now, 7).getTime()).toBe(
        7 * 24 * 60 * 60 * 1000
      );
    });

    it("honors a positive override", () => {
      expect(now.getTime() - escalationCooldownStart(now, 3).getTime()).toBe(
        3 * 24 * 60 * 60 * 1000
      );
    });

    it("clamps invalid cooldownDays to 7", () => {
      for (const bad of [0, -1, NaN]) {
        expect(now.getTime() - escalationCooldownStart(now, bad).getTime()).toBe(
          7 * 24 * 60 * 60 * 1000
        );
      }
    });

    it("exceeds the full ladder duration (≈48h) so a finished chain isn't re-started", () => {
      const ladderMs = 2880 * 60 * 1000; // L6 delay
      const cooldownMs = now.getTime() - escalationCooldownStart(now, 7).getTime();
      expect(cooldownMs).toBeGreaterThan(ladderMs);
    });
  });
});
