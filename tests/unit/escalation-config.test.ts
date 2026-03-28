import { describe, it, expect } from "vitest";
import { ESCALATION_LEVELS, QUIET_HOURS_DEFAULT, DEFAULT_TIMEZONE } from "@/lib/escalation/config";

describe("Escalation Configuration", () => {
  describe("ESCALATION_LEVELS", () => {
    it("should have 6 levels", () => {
      expect(ESCALATION_LEVELS).toHaveLength(6);
    });

    it("should have levels ordered 1-6", () => {
      const levels = ESCALATION_LEVELS.map((l) => l.level);
      expect(levels).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("should have increasing delays", () => {
      for (let i = 1; i < ESCALATION_LEVELS.length; i++) {
        expect(ESCALATION_LEVELS[i].delayMinutes).toBeGreaterThanOrEqual(
          ESCALATION_LEVELS[i - 1].delayMinutes
        );
      }
    });

    it("L1 should be PUSH with no delay", () => {
      const l1 = ESCALATION_LEVELS[0];
      expect(l1.channel).toBe("PUSH");
      expect(l1.delayMinutes).toBe(0);
    });

    it("L2-L3 should be WHATSAPP", () => {
      expect(ESCALATION_LEVELS[1].channel).toBe("WHATSAPP");
      expect(ESCALATION_LEVELS[2].channel).toBe("WHATSAPP");
    });

    it("L4 should be SMS with daily limit", () => {
      const l4 = ESCALATION_LEVELS[3];
      expect(l4.channel).toBe("SMS");
      expect(l4.maxPerDay).toBe(3);
    });

    it("L5 should be EMAIL", () => {
      expect(ESCALATION_LEVELS[4].channel).toBe("EMAIL");
    });

    it("L6 should be CALL", () => {
      expect(ESCALATION_LEVELS[5].channel).toBe("CALL");
    });

    it("each level should have a templateId", () => {
      for (const level of ESCALATION_LEVELS) {
        expect(level.templateId).toBeTruthy();
      }
    });
  });

  describe("Quiet Hours", () => {
    it("should have default quiet hours 22:00 - 07:00", () => {
      expect(QUIET_HOURS_DEFAULT.start).toBe("22:00");
      expect(QUIET_HOURS_DEFAULT.end).toBe("07:00");
    });
  });

  describe("Default Timezone", () => {
    it("should be Europe/Bucharest", () => {
      expect(DEFAULT_TIMEZONE).toBe("Europe/Bucharest");
    });
  });
});
