import { describe, it, expect } from "vitest";
import { bucharestDateAYearLater, bucharestTimeToUtc, bucharestYmd, endOfBucharestDay } from "@/lib/bucharest-day";

describe("endOfBucharestDay", () => {
  it("summer time: 23:59:59.999 in Bucharest is 20:59:59.999 UTC", () => {
    expect(endOfBucharestDay(new Date("2026-10-08T10:05:00Z")).toISOString()).toBe("2026-10-08T20:59:59.999Z");
  });
  it("winter time: 21:59:59.999 UTC", () => {
    expect(endOfBucharestDay(new Date("2026-12-01T10:00:00Z")).toISOString()).toBe("2026-12-01T21:59:59.999Z");
  });
  it("late evening UTC that is already the next day in Bucharest", () => {
    // 22:30 UTC on 8 Oct = 01:30 on 9 Oct in Bucharest.
    expect(endOfBucharestDay(new Date("2026-10-08T22:30:00Z")).toISOString()).toBe("2026-10-09T20:59:59.999Z");
  });
  it("the day the clocks go back (25 hours long)", () => {
    // 25 Oct 2026: 04:00 summer → 03:00 winter. The day ends at 00:00 winter time on the 26th.
    expect(endOfBucharestDay(new Date("2026-10-25T12:00:00Z")).toISOString()).toBe("2026-10-25T21:59:59.999Z");
  });
  it("the day the clocks go forward (23 hours long)", () => {
    expect(endOfBucharestDay(new Date("2027-03-28T12:00:00Z")).toISOString()).toBe("2027-03-28T20:59:59.999Z");
  });
  it("month and year overflow", () => {
    expect(endOfBucharestDay(new Date("2026-12-31T12:00:00Z")).toISOString()).toBe("2026-12-31T21:59:59.999Z");
  });
});

describe("bucharestTimeToUtc / bucharestYmd", () => {
  it("round trip at midnight in both seasons", () => {
    expect(bucharestTimeToUtc(2026, 7, 1).toISOString()).toBe("2026-06-30T21:00:00.000Z");
    expect(bucharestTimeToUtc(2026, 1, 1).toISOString()).toBe("2025-12-31T22:00:00.000Z");
    expect(bucharestYmd(new Date("2025-12-31T22:00:00Z"))).toEqual({ y: 2026, m: 1, d: 1 });
  });
});

describe("bucharestDateAYearLater", () => {
  it("the same day a year later", () => {
    expect(bucharestDateAYearLater(new Date("2026-09-29T10:00:00Z"))).toEqual({ y: 2027, m: 9, d: 29 });
  });
  it("29 February becomes 1 March, never 28", () => {
    expect(bucharestDateAYearLater(new Date("2028-02-29T10:00:00Z"))).toEqual({ y: 2029, m: 3, d: 1 });
  });
  it("uses the Bucharest date, not the UTC one", () => {
    expect(bucharestDateAYearLater(new Date("2027-02-28T23:30:00Z"))).toEqual({ y: 2028, m: 3, d: 1 });
  });
});
