import { describe, it, expect } from "vitest";
import { resolveLadder, ESCALATION_LEVELS, ORDERABLE_CHANNELS } from "@/lib/escalation/config";

/**
 * resolveLadder() — turns a user's saved channel priority into their escalation
 * ladder. Pure logic, no DB. Guarantees: never drops a rung, re-indexes levels
 * 1..n, falls back to the code default order on empty/garbage input.
 */

const channels = (levels: { channel: string }[]) => levels.map((l) => l.channel);

describe("resolveLadder", () => {
  it("falls back to the exact code default order when order is empty/absent", () => {
    expect(resolveLadder(undefined)).toBe(ESCALATION_LEVELS);
    expect(resolveLadder(null)).toBe(ESCALATION_LEVELS);
    expect(resolveLadder([])).toBe(ESCALATION_LEVELS);
    expect(channels(ESCALATION_LEVELS)).toEqual(["PUSH", "TELEGRAM", "EMAIL", "WHATSAPP", "SMS"]);
  });

  it("reorders the cascade to the user's preference (WhatsApp first)", () => {
    const out = resolveLadder(["WHATSAPP", "EMAIL", "TELEGRAM", "PUSH"]);
    // SMS nu e în preferință, deci se adaugă la coadă în ordinea implicită.
    expect(channels(out)).toEqual(["WHATSAPP", "EMAIL", "TELEGRAM", "PUSH", "SMS"]);
  });

  it("re-indexes level numbers 1..n in the new order", () => {
    const out = resolveLadder(["EMAIL", "PUSH", "WHATSAPP", "TELEGRAM"]);
    expect(out.map((l) => l.level)).toEqual([1, 2, 3, 4, 5]);
    expect(out[0].channel).toBe("EMAIL");
  });

  it("keeps each channel's own template when moved", () => {
    const push = ESCALATION_LEVELS.find((l) => l.channel === "PUSH")!;
    const out = resolveLadder(["WHATSAPP", "PUSH", "EMAIL", "TELEGRAM"]);
    const movedPush = out.find((l) => l.channel === "PUSH")!;
    expect(movedPush.templateId).toBe(push.templateId);
    expect(movedPush.level).toBe(2);
  });

  it("appends unlisted channels in default order (never drops a rung)", () => {
    const out = resolveLadder(["WHATSAPP"]);
    expect(channels(out)).toEqual(["WHATSAPP", "PUSH", "TELEGRAM", "EMAIL", "SMS"]);
    expect(out).toHaveLength(ESCALATION_LEVELS.length);
  });

  it("is case-insensitive on the saved values", () => {
    expect(channels(resolveLadder(["whatsapp", "email"]))).toEqual([
      "WHATSAPP",
      "EMAIL",
      "PUSH",
      "TELEGRAM",
      "SMS",
    ]);
  });

  it("ignores unknown and duplicate entries", () => {
    const out = resolveLadder(["BANANA", "EMAIL", "EMAIL", "SMS", "PUSH"]);
    expect(channels(out)).toEqual(["EMAIL", "SMS", "PUSH", "TELEGRAM", "WHATSAPP"]);
    expect(out).toHaveLength(ESCALATION_LEVELS.length);
  });

  it("ORDERABLE_CHANNELS matches the actual cascade channels", () => {
    expect(ORDERABLE_CHANNELS).toEqual(channels(ESCALATION_LEVELS));
  });
});
