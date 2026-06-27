import { describe, it, expect } from "vitest";
import { dayIsScheduled, bucharestWeekday } from "@/lib/escalation/scheduled-days";

// Weekday legend: 0=Sun, 1=Mon … 5=Fri, 6=Sat.

describe("dayIsScheduled", () => {
  it("a Mon–Fri schedule is off on the weekend", () => {
    const monFri = [[1, 2, 3, 4, 5]];
    expect(dayIsScheduled(5, monFri)).toBe(true); // Friday
    expect(dayIsScheduled(6, monFri)).toBe(false); // Saturday
    expect(dayIsScheduled(0, monFri)).toBe(false); // Sunday
  });

  it("respects an explicit weekend reminder", () => {
    expect(dayIsScheduled(6, [[6]])).toBe(true); // Saturday reminder → Saturday on
    expect(dayIsScheduled(0, [[2], [0]])).toBe(true); // a Sunday reminder among others
  });

  it("no reminders → school week (Mon–Fri), never the weekend", () => {
    expect(dayIsScheduled(3, [])).toBe(true); // Wednesday
    expect(dayIsScheduled(1, [])).toBe(true); // Monday
    expect(dayIsScheduled(6, [])).toBe(false); // Saturday
    expect(dayIsScheduled(0, [])).toBe(false); // Sunday
  });
});

describe("bucharestWeekday", () => {
  it("returns the Bucharest-calendar weekday", () => {
    expect(bucharestWeekday(new Date("2026-06-27T12:00:00Z"))).toBe(6); // Saturday
    expect(bucharestWeekday(new Date("2026-06-26T12:00:00Z"))).toBe(5); // Friday
  });

  it("rolls to the next day past Bucharest midnight (UTC+3 in summer)", () => {
    // 22:30Z Sat = 01:30 Sun in Bucharest → Sunday.
    expect(bucharestWeekday(new Date("2026-06-27T22:30:00Z"))).toBe(0);
  });
});
