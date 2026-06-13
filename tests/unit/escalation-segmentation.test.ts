import { describe, it, expect } from "vitest";
import {
  WHATSAPP_FREE_CAP,
  WHATSAPP_UPGRADE_TEMPLATE,
  UPGRADE_PATH,
  ESCALATION_LADDER,
  isPaidSubscriber,
  decideWhatsAppForFreeUser,
  isPaidChannelDeliverable,
} from "@/lib/escalation/segmentation";
import { ESCALATION_LEVELS } from "@/lib/escalation/config";

describe("Escalation segmentation", () => {
  describe("isPaidSubscriber", () => {
    it("treats active (no end date) as paid", () => {
      expect(
        isPaidSubscriber({ subscriptionStatus: "active", subscriptionEndsAt: null })
      ).toBe(true);
    });

    it("treats trialing as paid", () => {
      expect(
        isPaidSubscriber({ subscriptionStatus: "trialing", subscriptionEndsAt: null })
      ).toBe(true);
    });

    it("treats active but expired as free", () => {
      const past = new Date(Date.now() - 60_000);
      expect(
        isPaidSubscriber({ subscriptionStatus: "active", subscriptionEndsAt: past })
      ).toBe(false);
    });

    it("treats active with future end date as paid", () => {
      const future = new Date(Date.now() + 60_000);
      expect(
        isPaidSubscriber({ subscriptionStatus: "active", subscriptionEndsAt: future })
      ).toBe(true);
    });

    it("treats canceled / past_due / null as free", () => {
      for (const status of ["canceled", "past_due", null]) {
        expect(
          isPaidSubscriber({ subscriptionStatus: status, subscriptionEndsAt: null })
        ).toBe(false);
      }
    });
  });

  describe("decideWhatsAppForFreeUser", () => {
    it("sends normal template for the first cap-1 touches", () => {
      for (let prior = 0; prior < WHATSAPP_FREE_CAP - 1; prior++) {
        expect(decideWhatsAppForFreeUser(prior, "whatsapp_friendly_reminder")).toEqual({
          action: "send",
          templateId: "whatsapp_friendly_reminder",
        });
      }
    });

    it("returns upgrade CTA on the final (cap-th) touch", () => {
      expect(
        decideWhatsAppForFreeUser(WHATSAPP_FREE_CAP - 1, "whatsapp_pressure_stats")
      ).toEqual({ action: "upgrade", templateId: WHATSAPP_UPGRADE_TEMPLATE });
    });

    it("suppresses once at/over the cap", () => {
      expect(decideWhatsAppForFreeUser(WHATSAPP_FREE_CAP, "x")).toEqual({
        action: "suppress",
      });
      expect(decideWhatsAppForFreeUser(WHATSAPP_FREE_CAP + 5, "x")).toEqual({
        action: "suppress",
      });
    });

    it("exposes exactly 4 paid touches before the wall (3 normal + 1 upgrade)", () => {
      const actions = Array.from({ length: 6 }, (_, prior) =>
        decideWhatsAppForFreeUser(prior, "tmpl").action
      );
      // prior 0,1,2 → send; prior 3 → upgrade; prior 4,5 → suppress
      expect(actions).toEqual([
        "send",
        "send",
        "send",
        "upgrade",
        "suppress",
        "suppress",
      ]);
    });
  });

  describe("ESCALATION_LADDER (notify-ladder wiring)", () => {
    it("has one step per escalation level", () => {
      expect(ESCALATION_LADDER.steps).toHaveLength(ESCALATION_LEVELS.length);
    });

    it("maps channels into the notify-ladder union (CALL→email)", () => {
      const channels = ESCALATION_LADDER.steps.map((s) => s.channel);
      expect(channels).toEqual(["push", "whatsapp", "whatsapp", "sms", "email", "email"]);
    });

    it("encodes grace as the NEXT level's delay (wait after this step)", () => {
      // step[i].graceMs === ESCALATION_LEVELS[i+1].delayMinutes * 60_000
      for (let i = 0; i < ESCALATION_LEVELS.length - 1; i++) {
        expect(ESCALATION_LADDER.steps[i].graceMs).toBe(
          ESCALATION_LEVELS[i + 1].delayMinutes * 60_000
        );
      }
    });

    it("gives the terminal step zero grace", () => {
      const last = ESCALATION_LADDER.steps[ESCALATION_LADDER.steps.length - 1];
      expect(last.graceMs).toBe(0);
    });
  });

  describe("isPaidChannelDeliverable", () => {
    const base = {
      telegramLinked: false,
      telegramEnabled: false,
      whatsappConfigured: false,
      smsConfigured: false,
    };

    it("PUSH/EMAIL/CALL are always deliverable", () => {
      expect(isPaidChannelDeliverable("PUSH", base)).toBe(true);
      expect(isPaidChannelDeliverable("EMAIL", base)).toBe(true);
      expect(isPaidChannelDeliverable("CALL", base)).toBe(true);
    });

    it("WhatsApp undeliverable when neither WhatsApp nor Telegram is usable", () => {
      expect(isPaidChannelDeliverable("WHATSAPP", base)).toBe(false);
      // Telegram enabled but user not linked → still no
      expect(isPaidChannelDeliverable("WHATSAPP", { ...base, telegramEnabled: true })).toBe(false);
      // Linked but feature disabled → still no
      expect(isPaidChannelDeliverable("WHATSAPP", { ...base, telegramLinked: true })).toBe(false);
    });

    it("WhatsApp deliverable via configured WhatsApp OR linked+enabled Telegram", () => {
      expect(isPaidChannelDeliverable("WHATSAPP", { ...base, whatsappConfigured: true })).toBe(true);
      expect(
        isPaidChannelDeliverable("WHATSAPP", { ...base, telegramLinked: true, telegramEnabled: true })
      ).toBe(true);
    });

    it("SMS deliverable only when the gateway is configured", () => {
      expect(isPaidChannelDeliverable("SMS", base)).toBe(false);
      expect(isPaidChannelDeliverable("SMS", { ...base, smsConfigured: true })).toBe(true);
    });
  });

  describe("constants", () => {
    it("caps free WhatsApp at 4 with a pricing upgrade path", () => {
      expect(WHATSAPP_FREE_CAP).toBe(4);
      expect(UPGRADE_PATH).toBe("/preturi");
    });
  });
});
