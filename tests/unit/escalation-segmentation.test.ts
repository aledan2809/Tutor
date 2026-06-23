import { describe, it, expect } from "vitest";
import {
  ESCALATION_LADDER,
  isPaidSubscriber,
  isPaidChannelDeliverable,
  resolveCascadeWindow,
} from "@/lib/escalation/segmentation";
import { ESCALATION_LEVELS, CASCADE_GRACE_MINUTES } from "@/lib/escalation/config";

describe("Escalation segmentation", () => {
  describe("isPaidSubscriber", () => {
    it("active / trialing (unexpired) are paid", () => {
      expect(isPaidSubscriber({ subscriptionStatus: "active", subscriptionEndsAt: null })).toBe(true);
      expect(isPaidSubscriber({ subscriptionStatus: "trialing", subscriptionEndsAt: null })).toBe(true);
      const future = new Date(Date.now() + 60_000);
      expect(isPaidSubscriber({ subscriptionStatus: "active", subscriptionEndsAt: future })).toBe(true);
    });
    it("expired / canceled / past_due / null are free", () => {
      const past = new Date(Date.now() - 60_000);
      expect(isPaidSubscriber({ subscriptionStatus: "active", subscriptionEndsAt: past })).toBe(false);
      for (const s of ["canceled", "past_due", null]) {
        expect(isPaidSubscriber({ subscriptionStatus: s, subscriptionEndsAt: null })).toBe(false);
      }
    });
  });

  describe("isPaidChannelDeliverable", () => {
    const base = {
      telegramLinked: false,
      telegramEnabled: false,
      whatsappConfigured: false,
      smsConfigured: false,
      emailConfigured: false,
    };
    it("PUSH is always deliverable", () => {
      expect(isPaidChannelDeliverable("PUSH", base)).toBe(true);
    });
    it("Email needs SMTP configured (else skip, not retry-forever)", () => {
      expect(isPaidChannelDeliverable("EMAIL", base)).toBe(false);
      expect(isPaidChannelDeliverable("EMAIL", { ...base, emailConfigured: true })).toBe(true);
    });
    it("Telegram needs linked AND enabled", () => {
      expect(isPaidChannelDeliverable("TELEGRAM", base)).toBe(false);
      expect(isPaidChannelDeliverable("TELEGRAM", { ...base, telegramLinked: true })).toBe(false);
      expect(isPaidChannelDeliverable("TELEGRAM", { ...base, telegramEnabled: true })).toBe(false);
      expect(isPaidChannelDeliverable("TELEGRAM", { ...base, telegramLinked: true, telegramEnabled: true })).toBe(true);
    });
    it("WhatsApp needs config; SMS needs its gateway", () => {
      expect(isPaidChannelDeliverable("WHATSAPP", base)).toBe(false);
      expect(isPaidChannelDeliverable("WHATSAPP", { ...base, whatsappConfigured: true })).toBe(true);
      expect(isPaidChannelDeliverable("SMS", base)).toBe(false);
      expect(isPaidChannelDeliverable("SMS", { ...base, smsConfigured: true })).toBe(true);
    });
  });

  describe("resolveCascadeWindow", () => {
    it("maps reminder messageType to a time window", () => {
      expect(resolveCascadeWindow("morning_quiz")).toBe("morning");
      expect(resolveCascadeWindow("evening_complex")).toBe("evening");
      expect(resolveCascadeWindow("missed_session")).toBe("default");
      expect(resolveCascadeWindow(undefined)).toBe("default");
    });
  });

  describe("ESCALATION_LADDER (notify-ladder wiring)", () => {
    it("has one step per escalation level", () => {
      expect(ESCALATION_LADDER.steps).toHaveLength(ESCALATION_LEVELS.length);
    });
    it("maps channels into the notify-ladder union (Telegram→push)", () => {
      expect(ESCALATION_LADDER.steps.map((s) => s.channel)).toEqual([
        "push",
        "push",
        "email",
        "whatsapp",
      ]);
    });
    it("graceMsFor resolves fast morning, slow evening", () => {
      const g = (mt: string) => ESCALATION_LADDER.graceMsFor!(ESCALATION_LADDER.steps[0], mt);
      expect(g("morning_quiz")).toBe(CASCADE_GRACE_MINUTES.morning * 60_000);
      expect(g("evening_complex")).toBe(CASCADE_GRACE_MINUTES.evening * 60_000);
      expect(g("missed_session")).toBe(CASCADE_GRACE_MINUTES.default * 60_000);
      expect(g("morning_quiz")).toBeLessThan(g("evening_complex"));
    });
  });
});
