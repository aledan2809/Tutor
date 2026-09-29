import { describe, it, expect } from "vitest";
import { ageOn, needsParentConsent, isAdult, parseBirthDate, birthDateString } from "@/lib/age";
import { mayShowPrices } from "@/lib/price-visibility";
import { USERNAME_RE, normalizeUsername } from "@/lib/username";

// 28 Sept 2026, midday in Romania.
const now = new Date("2026-09-28T09:00:00Z");
const d = (s: string) => parseBirthDate(s, now)!;

describe("age from a date of birth", () => {
  it("counts the exact day: 16 today, 15 until tomorrow", () => {
    expect(ageOn(d("2010-09-28"), now)).toBe(16);
    expect(ageOn(d("2010-09-29"), now)).toBe(15);
    expect(needsParentConsent(d("2010-09-29"), now)).toBe(true);
    expect(needsParentConsent(d("2010-09-28"), now)).toBe(false);
  });
  it("18 on the birthday, not before", () => {
    expect(isAdult(d("2008-09-28"), now)).toBe(true);
    expect(isAdult(d("2008-09-29"), now)).toBe(false);
  });
  it("uses the day in Romania, not UTC: at 23:30 UTC on the 27th it's already the 28th there", () => {
    const lateUtc = new Date("2026-09-27T23:30:00Z");
    expect(ageOn(d("2010-09-28"), lateUtc)).toBe(16);
  });
  it("29 February: in a year without it, the birthday is 28 February", () => {
    const feb28 = new Date("2027-02-28T10:00:00Z");
    expect(ageOn(parseBirthDate("2012-02-29", feb28)!, feb28)).toBe(15);
    expect(ageOn(parseBirthDate("2012-02-29", new Date("2027-02-27T10:00:00Z"))!, new Date("2027-02-27T10:00:00Z"))).toBe(14);
    expect(ageOn(parseBirthDate("2008-02-29", new Date("2025-02-28T10:00:00Z"))!, new Date("2025-02-28T10:00:00Z"))).toBe(17);
    expect(ageOn(parseBirthDate("2008-02-29", new Date("2025-02-27T10:00:00Z"))!, new Date("2025-02-27T10:00:00Z"))).toBe(16);
  });
  it("only real days, from 1920, at least 5 years old", () => {
    expect(parseBirthDate("2012-02-30", now)).toBeNull();
    expect(parseBirthDate("2013-02-29", now)).toBeNull();
    expect(parseBirthDate("1919-12-31", now)).toBeNull();
    expect(parseBirthDate("2022-01-01", now)).toBeNull();
    expect(parseBirthDate("2012-5-1", now)).toBeNull();
    expect(parseBirthDate(20120501, now)).toBeNull();
    expect(parseBirthDate("2012-05-01", now)?.toISOString()).toBe("2012-05-01T00:00:00.000Z");
  });
  it("builds the date from the three lists", () => {
    expect(birthDateString("1", "5", "2012")).toBe("2012-05-01");
    expect(birthDateString("", "5", "2012")).toBe("");
  });
});

describe("mayShowPrices", () => {
  const base = { accountRole: null, learning: false, isChild: false, birthDate: null, now };
  it("a parent or a non-learner: yes", () => {
    expect(mayShowPrices({ ...base, accountRole: "PARENT" })).toBe(true);
    expect(mayShowPrices(base)).toBe(true);
  });
  it("a child whose parent is in the account: never, even with an adult date", () => {
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", isChild: true, birthDate: d("1990-01-01") })).toBe(false);
  });
  it("a learner on their own: only from the 18th birthday", () => {
    expect(mayShowPrices({ ...base, accountRole: "STUDENT" })).toBe(false);
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", birthDate: d("2008-09-29") })).toBe(false);
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", birthDate: d("2008-09-28") })).toBe(true);
    expect(mayShowPrices({ ...base, learning: true })).toBe(false);
  });
  it("staff and company learners are adults at work: prices shown without a date", () => {
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", staff: true })).toBe(true);
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", companyCovered: true })).toBe(true);
    // …but a declared minor never, company course or not.
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", companyCovered: true, birthDate: d("2013-01-01") })).toBe(false);
  });
  it("a parent with an old student enrollment is a parent, not a learner", () => {
    expect(mayShowPrices({ ...base, learning: true, isParent: true })).toBe(true);
  });
});

describe("username", () => {
  it("3–30 characters, lowercase letters, digits, . _ -; starts with a letter or digit", () => {
    for (const ok of ["ana", "ana.pop", "ionut_12", "m-2012"]) expect(USERNAME_RE.test(ok)).toBe(true);
    for (const bad of ["an", ".ana", "ana pop", "ana@x.ro", "Ana", "a".repeat(31)]) expect(USERNAME_RE.test(bad)).toBe(false);
    expect(normalizeUsername("  Ana.Pop ")).toBe("ana.pop");
  });
});

import { suggestUsername } from "@/lib/username";
describe("suggestUsername", () => {
  it("from a Romanian name, without diacritics", () => {
    expect(suggestUsername("Ana-Maria Popescu")).toBe("ana-maria.popescu");
    expect(suggestUsername("  Ștefan Țăranu ")).toBe("stefan.taranu");
  });
  it("nothing usable → empty (the parent types one)", () => {
    expect(suggestUsername("Al")).toBe("");
    expect(suggestUsername("!!!")).toBe("");
  });
});
