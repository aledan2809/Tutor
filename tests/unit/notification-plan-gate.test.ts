import { describe, it, expect, vi } from "vitest";
import type { EscalationChannel } from "@prisma/client";

// service.ts imports @/lib/prisma at module load; stub it so the PrismaClient
// isn't instantiated in the test env (meteredChannelBlocked itself is pure).
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { meteredChannelBlocked } from "@/lib/notifications/service";

const paidActive = { subscriptionStatus: "active", subscriptionEndsAt: null };
const paidTrial = { subscriptionStatus: "trialing", subscriptionEndsAt: null };
const free = { subscriptionStatus: null, subscriptionEndsAt: null };
const canceled = { subscriptionStatus: "canceled", subscriptionEndsAt: null };
const expired = {
  subscriptionStatus: "active",
  subscriptionEndsAt: new Date(Date.now() - 86_400_000), // yesterday
};
const ch = (c: string) => c as EscalationChannel;

describe("meteredChannelBlocked — send-path plan gate", () => {
  it("blocks WhatsApp for a free (non-paid) user", () => {
    expect(meteredChannelBlocked(ch("WHATSAPP"), {}, free)).toBe(true);
  });

  it("blocks SMS for a free (non-paid) user", () => {
    expect(meteredChannelBlocked(ch("SMS"), {}, free)).toBe(true);
  });

  it("blocks WhatsApp for a canceled subscription", () => {
    expect(meteredChannelBlocked(ch("WHATSAPP"), {}, canceled)).toBe(true);
  });

  it("blocks WhatsApp when the paid subscription has expired", () => {
    expect(meteredChannelBlocked(ch("WHATSAPP"), {}, expired)).toBe(true);
  });

  it("blocks a metered send when the user can't be found (null)", () => {
    expect(meteredChannelBlocked(ch("WHATSAPP"), {}, null)).toBe(true);
  });

  it("allows WhatsApp for an active subscriber", () => {
    expect(meteredChannelBlocked(ch("WHATSAPP"), {}, paidActive)).toBe(false);
  });

  it("allows SMS for a trialing subscriber", () => {
    expect(meteredChannelBlocked(ch("SMS"), {}, paidTrial)).toBe(false);
  });

  it("exempts a test-account send from the gate (journey-audit)", () => {
    expect(meteredChannelBlocked(ch("WHATSAPP"), { isTest: true }, free)).toBe(false);
  });

  it("exempts a parent-authorized send from the gate", () => {
    expect(meteredChannelBlocked(ch("SMS"), { parentAuthorized: true }, free)).toBe(false);
  });

  it("never gates free channels (PUSH/EMAIL/TELEGRAM/CALL) regardless of plan", () => {
    for (const c of ["PUSH", "EMAIL", "TELEGRAM", "CALL"]) {
      expect(meteredChannelBlocked(ch(c), {}, free)).toBe(false);
    }
  });
});
