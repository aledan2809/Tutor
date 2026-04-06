import { describe, it, expect, vi, afterEach } from "vitest";
import { calculateClockOffset, checkTimerSync, getCorrectedRemainingTime } from "@/lib/timer-sync";

describe("Timer Sync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("calculateClockOffset()", () => {
    it("should return ~0 for current timestamp", () => {
      const offset = calculateClockOffset(Date.now());
      expect(Math.abs(offset)).toBeLessThan(50); // within 50ms tolerance
    });

    it("should return positive offset when client is ahead", () => {
      const offset = calculateClockOffset(Date.now() - 5000);
      expect(offset).toBeGreaterThan(4900);
    });

    it("should return negative offset when server is ahead", () => {
      const offset = calculateClockOffset(Date.now() + 5000);
      expect(offset).toBeLessThan(-4900);
    });
  });

  describe("checkTimerSync()", () => {
    it("should not flag drift within threshold", () => {
      const result = checkTimerSync(Date.now());
      expect(result.driftExceeded).toBe(false);
    });

    it("should flag drift exceeding 2 seconds", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = checkTimerSync(Date.now() - 5000);
      expect(result.driftExceeded).toBe(true);
      expect(warnSpy).toHaveBeenCalledOnce();
    });
  });

  describe("getCorrectedRemainingTime()", () => {
    it("should return full duration when just started", () => {
      const now = Date.now();
      const remaining = getCorrectedRemainingTime(60, now, now);
      expect(remaining).toBe(60);
    });

    it("should return 0 when time is fully elapsed", () => {
      const now = Date.now();
      const startedAt = now - 120_000; // 2 min ago
      const remaining = getCorrectedRemainingTime(60, startedAt, now);
      expect(remaining).toBe(0);
    });

    it("should return positive value mid-session", () => {
      const now = Date.now();
      const startedAt = now - 30_000; // 30s ago
      const remaining = getCorrectedRemainingTime(60, startedAt, now);
      expect(remaining).toBe(30);
    });
  });
});
