import { describe, it, expect } from "vitest";
import {
  ALL_CHANNELS,
  FREE_CHANNELS,
  isPaidStatus,
  allowedChannels,
  isChannelAllowed,
  clampChannelWrite,
} from "@/lib/plan-channels";

describe("isPaidStatus", () => {
  it("active and trialing are paid", () => {
    expect(isPaidStatus("active")).toBe(true);
    expect(isPaidStatus("trialing")).toBe(true);
  });
  it("everything else is free", () => {
    for (const s of [null, undefined, "", "canceled", "past_due", "bogus"]) {
      expect(isPaidStatus(s)).toBe(false);
    }
  });
});

describe("allowedChannels", () => {
  it("free → push + email only", () => {
    expect(allowedChannels(null).sort()).toEqual([...FREE_CHANNELS].sort());
    expect(allowedChannels("canceled")).not.toContain("whatsapp");
    expect(allowedChannels("canceled")).not.toContain("sms");
  });
  it("paid → all channels", () => {
    expect(allowedChannels("active").sort()).toEqual([...ALL_CHANNELS].sort());
  });
});

describe("isChannelAllowed", () => {
  it("free can use push/email, not whatsapp/sms", () => {
    expect(isChannelAllowed("push", null)).toBe(true);
    expect(isChannelAllowed("email", null)).toBe(true);
    expect(isChannelAllowed("whatsapp", null)).toBe(false);
    expect(isChannelAllowed("sms", "past_due")).toBe(false);
  });
  it("paid can use all", () => {
    for (const ch of ALL_CHANNELS) expect(isChannelAllowed(ch, "active")).toBe(true);
  });
});

describe("clampChannelWrite", () => {
  it("free account cannot ENABLE a paid channel (blocked), but can disable it", () => {
    const r = clampChannelWrite({ whatsapp: true, sms: true, push: true }, null);
    expect(r.blocked.sort()).toEqual(["sms", "whatsapp"]);
    expect(r.applied).toEqual({ push: true });
    // disabling a paid channel is always fine
    const off = clampChannelWrite({ whatsapp: false }, null);
    expect(off.blocked).toEqual([]);
    expect(off.applied).toEqual({ whatsapp: false });
  });
  it("paid account passes everything through", () => {
    const r = clampChannelWrite({ whatsapp: true, sms: true, push: false }, "active");
    expect(r.blocked).toEqual([]);
    expect(r.applied).toEqual({ whatsapp: true, sms: true, push: false });
  });
  it("ignores channels not present in the request", () => {
    const r = clampChannelWrite({ email: true }, null);
    expect(r.applied).toEqual({ email: true });
    expect(r.blocked).toEqual([]);
  });
});
