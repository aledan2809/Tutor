import { describe, it, expect } from "vitest";
import ro from "@/messages/ro.json";
import en from "@/messages/en.json";

/**
 * The project relies on ro/en having identical key sets — a key added to one file
 * only surfaces as a raw key string in the other locale's UI, which nobody notices
 * until a user switches language. Nothing enforced it until now.
 */
function flatten(obj: Record<string, unknown>, prefix = ""): Set<string> {
  const keys = new Set<string>();
  for (const [k, v] of Object.entries(obj)) {
    const key = `${prefix}${k}`;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const nested of flatten(v as Record<string, unknown>, `${key}.`)) keys.add(nested);
    } else {
      keys.add(key);
    }
  }
  return keys;
}

describe("i18n ro/en parity", () => {
  const roKeys = flatten(ro as Record<string, unknown>);
  const enKeys = flatten(en as Record<string, unknown>);

  it("has no key present in ro but missing from en", () => {
    expect([...roKeys].filter((k) => !enKeys.has(k))).toEqual([]);
  });

  it("has no key present in en but missing from ro", () => {
    expect([...enKeys].filter((k) => !roKeys.has(k))).toEqual([]);
  });

  it("has no empty translation on either side", () => {
    const empties: string[] = [];
    const walk = (o: Record<string, unknown>, p = "", loc = "") => {
      for (const [k, v] of Object.entries(o)) {
        if (v && typeof v === "object" && !Array.isArray(v)) walk(v as Record<string, unknown>, `${p}${k}.`, loc);
        else if (typeof v === "string" && v.trim() === "") empties.push(`${loc}:${p}${k}`);
      }
    };
    walk(ro as Record<string, unknown>, "", "ro");
    walk(en as Record<string, unknown>, "", "en");
    expect(empties).toEqual([]);
  });

  it("carries every nav key the sidebar sections need", () => {
    const nav = (ro as { nav: Record<string, string> }).nav;
    for (const k of [
      "sectionLearn",
      "sectionProgress",
      "sectionAccount",
      "sectionMyChild",
      "sectionMyStudents",
      "sectionContent",
      "subscription",
      "reports",
      "progressStats",
      "progressAchievements",
      "help",
    ]) {
      expect(nav[k], `nav.${k} missing`).toBeTruthy();
    }
  });
});
