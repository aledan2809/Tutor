import { describe, it, expect } from "vitest";
import {
  shouldRenotifyParent,
  shouldRenotifyParentMode,
  RENOTIFY_MIN,
} from "@/lib/escalation/parent-monitor";

describe("shouldRenotifyParent", () => {
  const now = new Date("2026-06-22T10:00:00Z");

  it("notifies immediately when never notified", () => {
    expect(shouldRenotifyParent(null, now)).toBe(true);
  });

  it("does not re-notify before the interval", () => {
    const recent = new Date(now.getTime() - (RENOTIFY_MIN - 1) * 60_000);
    expect(shouldRenotifyParent(recent, now)).toBe(false);
  });

  it("re-notifies at/after the interval", () => {
    const due = new Date(now.getTime() - RENOTIFY_MIN * 60_000);
    expect(shouldRenotifyParent(due, now)).toBe(true);
    const past = new Date(now.getTime() - (RENOTIFY_MIN + 10) * 60_000);
    expect(shouldRenotifyParent(past, now)).toBe(true);
  });

  it("honours a custom interval", () => {
    const t = new Date(now.getTime() - 20 * 60_000);
    expect(shouldRenotifyParent(t, now, 15)).toBe(true);
    expect(shouldRenotifyParent(t, now, 30)).toBe(false);
  });
});

describe("shouldRenotifyParentMode", () => {
  const cfg = (o: Partial<{ mode: string; everyH: number; at: string }>) => ({
    mode: "STANDARD_30",
    everyH: 6,
    at: "20:00",
    ...o,
  });
  const now = new Date("2026-06-22T10:00:00Z");

  it("STANDARD_30 mirrors the 30-min default", () => {
    expect(shouldRenotifyParentMode(cfg({ mode: "STANDARD_30" }), null, now)).toBe(true);
    expect(shouldRenotifyParentMode(cfg({}), new Date(now.getTime() - 20 * 60_000), now)).toBe(false);
    expect(shouldRenotifyParentMode(cfg({}), new Date(now.getTime() - 30 * 60_000), now)).toBe(true);
  });

  it("ONCE never re-notifies (auto-stop after the first alert)", () => {
    expect(shouldRenotifyParentMode(cfg({ mode: "ONCE" }), null, now)).toBe(false);
    expect(shouldRenotifyParentMode(cfg({ mode: "ONCE" }), new Date(now.getTime() - 5 * 3600_000), now)).toBe(false);
  });

  it("EVERY_H waits the configured number of hours", () => {
    const c = cfg({ mode: "EVERY_H", everyH: 3 });
    expect(shouldRenotifyParentMode(c, new Date(now.getTime() - 2 * 3600_000), now)).toBe(false);
    expect(shouldRenotifyParentMode(c, new Date(now.getTime() - 3 * 3600_000), now)).toBe(true);
  });

  it("EVERY_H falls back to 6h on a bad hour value", () => {
    const c = cfg({ mode: "EVERY_H", everyH: 0 });
    expect(shouldRenotifyParentMode(c, new Date(now.getTime() - 5 * 3600_000), now)).toBe(false);
    expect(shouldRenotifyParentMode(c, new Date(now.getTime() - 6 * 3600_000), now)).toBe(true);
  });

  it("FIXED_AT fires once a day at the local slot", () => {
    const c = cfg({ mode: "FIXED_AT", at: "20:00" });
    const before = new Date("2026-06-22T19:00:00Z");
    expect(shouldRenotifyParentMode(c, null, before, "UTC")).toBe(false); // slot not reached yet
    const past = new Date("2026-06-22T20:05:00Z");
    // opened at 14:00 today → today's 20:00 slot not fired yet → fire
    expect(shouldRenotifyParentMode(c, new Date("2026-06-22T14:00:00Z"), past, "UTC")).toBe(true);
    // already alerted at 20:00 today → skip
    expect(shouldRenotifyParentMode(c, new Date("2026-06-22T20:00:00Z"), past, "UTC")).toBe(false);
    // last alert was yesterday's slot → fire today
    expect(shouldRenotifyParentMode(c, new Date("2026-06-21T20:00:00Z"), past, "UTC")).toBe(true);
  });

  it("unknown mode falls back to STANDARD_30", () => {
    expect(shouldRenotifyParentMode(cfg({ mode: "WHATEVER" }), null, now)).toBe(true);
  });
});
