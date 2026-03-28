import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isQuietHours, getUserLocalHour } from "@/lib/escalation/timing";

describe("Escalation Timing", () => {
  describe("isQuietHours()", () => {
    it("should detect quiet hours for overnight range (22:00-07:00)", () => {
      // Mock current time to 23:00 Bucharest
      vi.useFakeTimers();
      const midnight = new Date("2026-03-28T23:00:00+02:00"); // EET
      vi.setSystemTime(midnight);

      const result = isQuietHours("Europe/Bucharest", "22:00", "07:00");
      expect(result).toBe(true);

      vi.useRealTimers();
    });

    it("should return false during day hours (10:00)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-28T10:00:00+02:00"));

      const result = isQuietHours("Europe/Bucharest", "22:00", "07:00");
      expect(result).toBe(false);

      vi.useRealTimers();
    });

    it("should handle same-day quiet hours (e.g., 13:00-14:00)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-28T13:30:00+02:00"));

      const result = isQuietHours("Europe/Bucharest", "13:00", "14:00");
      expect(result).toBe(true);

      vi.useRealTimers();
    });

    it("should return false just before quiet hours start", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-28T21:59:00+02:00"));

      const result = isQuietHours("Europe/Bucharest", "22:00", "07:00");
      expect(result).toBe(false);

      vi.useRealTimers();
    });
  });

  describe("getUserLocalHour()", () => {
    it("should return hour in given timezone", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-28T14:00:00Z")); // 14:00 UTC = 16:00 Bucharest (EEST)

      const hour = getUserLocalHour("Europe/Bucharest");
      // EEST is UTC+3 in summer
      expect(hour).toBeGreaterThanOrEqual(16);
      expect(hour).toBeLessThanOrEqual(17);

      vi.useRealTimers();
    });
  });
});
