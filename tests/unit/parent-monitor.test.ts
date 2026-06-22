import { describe, it, expect } from "vitest";
import { shouldRenotifyParent, RENOTIFY_MIN } from "@/lib/escalation/parent-monitor";

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
