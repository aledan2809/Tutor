import { describe, it, expect } from "vitest";
import type { EscalationChannel } from "@prisma/client";
import { isChannelEnabled, ORDERABLE_CHANNELS, ESCALATION_PRESETS } from "@/lib/escalation/config";

// The whole enum, written out. If someone adds a channel to schema.prisma and not here,
// the "every ladder channel has a switch" test below fails loudly.
const ALL_CHANNELS: EscalationChannel[] = [
  "PUSH",
  "TELEGRAM",
  "WHATSAPP",
  "SMS",
  "EMAIL",
  "CALL",
];

describe("isChannelEnabled", () => {
  // THE regression. Before the fix the engine looked the preference up by lowercased
  // channel name against a map with no `telegram` key; `undefined` read as "disabled",
  // so this rung was skipped for every user, forever, while the event closed COMPLETED.
  it("enables TELEGRAM when there is no preference row", () => {
    expect(isChannelEnabled("TELEGRAM", null)).toBe(true);
    expect(isChannelEnabled("TELEGRAM", undefined)).toBe(true);
    expect(isChannelEnabled("TELEGRAM", {})).toBe(true);
  });

  it("enables TELEGRAM when a preference row exists but says nothing about it", () => {
    // A real row loaded before the column existed, or a partial select.
    expect(isChannelEnabled("TELEGRAM", { push: true, email: true })).toBe(true);
  });

  it("honours an explicit TELEGRAM opt-out", () => {
    expect(isChannelEnabled("TELEGRAM", { telegram: false })).toBe(false);
  });

  it("defaults every channel to enabled when preferences are absent", () => {
    for (const c of ALL_CHANNELS) {
      expect(isChannelEnabled(c, null), `${c} should default to enabled`).toBe(true);
    }
  });

  it("honours an explicit opt-out on every channel", () => {
    const off = {
      push: false,
      telegram: false,
      whatsapp: false,
      sms: false,
      email: false,
      call: false,
    };
    for (const c of ALL_CHANNELS) {
      expect(isChannelEnabled(c, off), `${c} should be disabled`).toBe(false);
    }
  });

  // Turning one channel off must not disturb its neighbours — the original bug was
  // precisely a lookup that mis-read one channel while the rest behaved.
  it("isolates the opt-out to the channel it names", () => {
    expect(isChannelEnabled("TELEGRAM", { email: false })).toBe(true);
    expect(isChannelEnabled("EMAIL", { email: false })).toBe(false);
    expect(isChannelEnabled("EMAIL", { telegram: false })).toBe(true);
  });

  // Coverage guard: every channel that can appear as a cascade rung must have a switch.
  // A channel with no switch would read as `undefined` → disabled → skipped in silence,
  // which is the exact failure mode this file exists to prevent.
  it("gives every orderable ladder channel a working switch", () => {
    for (const c of ORDERABLE_CHANNELS) {
      expect(isChannelEnabled(c, null), `${c} default`).toBe(true);
      expect(
        isChannelEnabled(c, { [c.toLowerCase()]: false }),
        `${c} opt-out must be honoured`
      ).toBe(false);
    }
  });

  it("gives every channel used by a named preset a working switch", () => {
    for (const steps of Object.values(ESCALATION_PRESETS)) {
      for (const { channel } of steps) {
        expect(isChannelEnabled(channel, null), `${channel} default`).toBe(true);
        expect(
          isChannelEnabled(channel, { [channel.toLowerCase()]: false }),
          `${channel} opt-out must be honoured`
        ).toBe(false);
      }
    }
  });
});
