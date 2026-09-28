import { describe, it, expect } from "vitest";
import { validBirthYear, needsParentConsent, surelyAdult } from "@/lib/age";
import { mayShowPrices } from "@/lib/price-visibility";
import { USERNAME_RE, normalizeUsername } from "@/lib/username";

const now = new Date("2026-09-28T10:00:00Z");

describe("age from a year of birth", () => {
  it("consent is asked up to the year that turns 16 now (may still be 15)", () => {
    expect(needsParentConsent(2012, now)).toBe(true); // 13–14
    expect(needsParentConsent(2010, now)).toBe(true); // 15–16
    expect(needsParentConsent(2009, now)).toBe(false); // 16–17
  });
  it("adult only when surely 18 or over", () => {
    expect(surelyAdult(2008, now)).toBe(false); // 17–18
    expect(surelyAdult(2007, now)).toBe(true); // 18–19
  });
  it("valid years: 1920 up to 5 years ago, integers only", () => {
    expect(validBirthYear(2012, now)).toBe(true);
    expect(validBirthYear(2022, now)).toBe(false);
    expect(validBirthYear(1919, now)).toBe(false);
    expect(validBirthYear(2010.5, now)).toBe(false);
    expect(validBirthYear("2010", now)).toBe(false);
  });
});

describe("mayShowPrices", () => {
  const base = { accountRole: null, learning: false, isChild: false, birthYear: null, now };
  it("a parent or a non-learner: yes", () => {
    expect(mayShowPrices({ ...base, accountRole: "PARENT" })).toBe(true);
    expect(mayShowPrices(base)).toBe(true);
  });
  it("a child whose parent is in the account: never, even with an adult year", () => {
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", isChild: true, birthYear: 1990 })).toBe(false);
  });
  it("a learner on their own: only when surely adult", () => {
    expect(mayShowPrices({ ...base, accountRole: "STUDENT" })).toBe(false);
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", birthYear: 2008 })).toBe(false);
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", birthYear: 1995 })).toBe(true);
    expect(mayShowPrices({ ...base, learning: true })).toBe(false);
  });
  it("staff and company learners are adults at work: prices shown without a year", () => {
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", staff: true })).toBe(true);
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", companyCovered: true })).toBe(true);
    // …but a declared minor never, company course or not.
    expect(mayShowPrices({ ...base, accountRole: "STUDENT", companyCovered: true, birthYear: 2013 })).toBe(false);
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
