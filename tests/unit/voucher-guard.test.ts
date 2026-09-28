import { describe, it, expect, vi, afterEach } from "vitest";
import { reserveVoucherLookup } from "@/lib/voucher-guard";

// True E2E 2026-09-28: every route that looks a typed code up tells whether it exists; the budget
// is per address and counts only codes that don't exist, so families with a real code never count.
const from = (ip: string) => new Headers({ "x-real-ip": ip });

describe("voucher-guard", () => {
  afterEach(() => vi.useRealTimers());

  it("20 unknown codes from one address, then no more lookups there — other addresses unaffected", () => {
    const h = from("203.0.113.10");
    for (let i = 0; i < 20; i++) expect(reserveVoucherLookup(h)).not.toBeNull();
    expect(reserveVoucherLookup(h)).toBeNull();
    expect(reserveVoucherLookup(from("203.0.113.11"))).not.toBeNull();
  });

  it("codes that exist are given back: a school full of families with real codes is never blocked", () => {
    const h = from("203.0.113.12");
    for (let i = 0; i < 200; i++) {
      const lookup = reserveVoucherLookup(h);
      expect(lookup).not.toBeNull();
      lookup!.found();
      lookup!.found(); // twice changes nothing
    }
    for (let i = 0; i < 20; i++) expect(reserveVoucherLookup(h)).not.toBeNull();
    expect(reserveVoucherLookup(h)).toBeNull();
  });

  it("requests sent together are counted before their lookups finish — a burst can't pass the cap", () => {
    const h = from("203.0.113.13");
    const inFlight = Array.from({ length: 150 }, () => reserveVoucherLookup(h));
    expect(inFlight.filter(Boolean).length).toBe(20);
  });

  it("a spoofed X-Forwarded-For doesn't change the address counted", () => {
    const real = "203.0.113.20";
    for (let i = 0; i < 20; i++) reserveVoucherLookup(new Headers({ "x-real-ip": real, "x-forwarded-for": `10.0.0.${i}` }));
    expect(reserveVoucherLookup(new Headers({ "x-real-ip": real, "x-forwarded-for": "10.9.9.9" }))).toBeNull();
  });

  it("the block lifts after ten minutes, and an old reservation can't lower the new window", () => {
    vi.useFakeTimers();
    const h = from("203.0.113.30");
    const first = reserveVoucherLookup(h)!;
    for (let i = 0; i < 19; i++) reserveVoucherLookup(h);
    expect(reserveVoucherLookup(h)).toBeNull();
    vi.advanceTimersByTime(10 * 60_000 + 1);
    for (let i = 0; i < 20; i++) expect(reserveVoucherLookup(h)).not.toBeNull();
    first.found();
    expect(reserveVoucherLookup(h)).toBeNull();
  });
});
