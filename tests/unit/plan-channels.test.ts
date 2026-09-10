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
  it("free account: a paid channel is forced off and an enable attempt is reported", () => {
    const r = clampChannelWrite({ whatsapp: true, sms: true, push: true }, null);
    expect(r.blocked.sort()).toEqual(["sms", "whatsapp"]);
    expect(r.applied).toEqual({ push: true, whatsapp: false, sms: false });
    // disabling a paid channel is fine and not reported as blocked
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

describe("B2B — firma plătește prin factură separată", () => {
  it("o firmă cu canale incluse deschide WhatsApp și SMS fără abonament individual", () => {
    // Cazul real: cursanții Poștei au `subscriptionStatus` gol — sunt înscriși de
    // angajator, care primește factură separată. Fără ramura asta, un client care
    // PLĂTEȘTE n-ar fi primit canalele plătite.
    expect(allowedChannels(null, true)).toEqual(["push", "email", "whatsapp", "sms"]);
    expect(allowedChannels(undefined, true)).toContain("whatsapp");
  });

  it("fără firmă, poarta rămâne exact ca înainte", () => {
    expect(allowedChannels(null, false)).toEqual(["push", "email"]);
    expect(allowedChannels(null)).toEqual(["push", "email"]);
    expect(allowedChannels("active")).toEqual(["push", "email", "whatsapp", "sms"]);
  });

  it("doar `true` deschide — nu orice valoare adevărată", () => {
    expect(allowedChannels(null, null)).toEqual(["push", "email"]);
  });
});

describe("clampChannelWrite — firma cu canale incluse", () => {
  // Bug prins la /review: deschisesem doar poarta de TRIMITERE. Scrierea preferinței
  // forța în continuare whatsapp/sms pe `false`, deci cursantul Poștei nu putea nici
  // măcar să bifeze canalul — poarta ar fi rămas deschisă spre o preferință stinsă.
  it("nu mai stinge whatsapp/sms pentru un om fără abonament, dar cu firmă plătitoare", () => {
    const { applied, blocked } = clampChannelWrite(
      { push: true, email: true, whatsapp: true, sms: true },
      null,
      true,
    );
    expect(applied).toEqual({ push: true, email: true, whatsapp: true, sms: true });
    expect(blocked).toEqual([]);
  });

  it("fără firmă plătitoare, clamp-ul rămâne exact ca înainte", () => {
    const { applied, blocked } = clampChannelWrite(
      { push: true, email: true, whatsapp: true, sms: true },
      null,
    );
    expect(applied).toEqual({ push: true, email: true, whatsapp: false, sms: false });
    expect(blocked).toEqual(["whatsapp", "sms"]);
  });
});
