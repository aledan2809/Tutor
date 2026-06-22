import { describe, it, expect } from "vitest";
import {
  ESCALATION_LEVELS,
  CASCADE_GRACE_MINUTES,
  QUIET_HOURS_DEFAULT,
  DEFAULT_TIMEZONE,
} from "@/lib/escalation/config";

describe("Escalation Configuration", () => {
  describe("ESCALATION_LEVELS (cascade: App → Telegram → email → WhatsApp)", () => {
    it("has 4 levels ordered 1-4", () => {
      expect(ESCALATION_LEVELS.map((l) => l.level)).toEqual([1, 2, 3, 4]);
    });

    it("L1 is PUSH with no delay", () => {
      expect(ESCALATION_LEVELS[0].channel).toBe("PUSH");
      expect(ESCALATION_LEVELS[0].delayMinutes).toBe(0);
    });

    it("follows the App → Telegram → email → WhatsApp order", () => {
      expect(ESCALATION_LEVELS.map((l) => l.channel)).toEqual([
        "PUSH",
        "TELEGRAM",
        "EMAIL",
        "WHATSAPP",
      ]);
    });

    it("WhatsApp is the last (Premium-only) rung", () => {
      expect(ESCALATION_LEVELS[ESCALATION_LEVELS.length - 1].channel).toBe("WHATSAPP");
    });

    it("each level has a templateId", () => {
      for (const level of ESCALATION_LEVELS) {
        expect(level.templateId).toBeTruthy();
      }
    });
  });

  describe("CASCADE_GRACE_MINUTES", () => {
    it("is fast in the morning and relaxed in the evening", () => {
      expect(CASCADE_GRACE_MINUTES.morning).toBeLessThan(CASCADE_GRACE_MINUTES.default);
      expect(CASCADE_GRACE_MINUTES.evening).toBeGreaterThan(CASCADE_GRACE_MINUTES.default);
    });
  });

  describe("Quiet Hours / Timezone", () => {
    it("defaults 22:00 - 07:00, Europe/Bucharest", () => {
      expect(QUIET_HOURS_DEFAULT.start).toBe("22:00");
      expect(QUIET_HOURS_DEFAULT.end).toBe("07:00");
      expect(DEFAULT_TIMEZONE).toBe("Europe/Bucharest");
    });
  });
});
