import { describe, it, expect } from "vitest";
import {
  ALL_FEATURES,
  PAID_FEATURES,
  hasFeature,
  unlockedFeatures,
  featureMap,
  isPaidStatus,
  type PlanFeature,
} from "@/lib/plan-features";

const PAID_STATUSES = ["active", "trialing"] as const;
const FREE_STATUSES = ["canceled", "past_due", "", "free", null, undefined] as const;

describe("plan-features", () => {
  it("reuses plan-channels isPaidStatus as the single paid predicate", () => {
    for (const s of PAID_STATUSES) expect(isPaidStatus(s)).toBe(true);
    for (const s of FREE_STATUSES) expect(isPaidStatus(s)).toBe(false);
  });

  it("every paid feature is gated behind a paid status", () => {
    for (const feature of PAID_FEATURES) {
      for (const s of PAID_STATUSES) {
        expect(hasFeature(feature, s)).toBe(true);
      }
      for (const s of FREE_STATUSES) {
        expect(hasFeature(feature, s)).toBe(false);
      }
    }
  });

  it("a feature not in PAID_FEATURES is unlocked for everyone", () => {
    const freeFeature = "some_free_function" as unknown as PlanFeature;
    expect(PAID_FEATURES.includes(freeFeature)).toBe(false);
    expect(hasFeature(freeFeature, null)).toBe(true);
    expect(hasFeature(freeFeature, "canceled")).toBe(true);
  });

  it("unlockedFeatures returns all features for paid, none of the paid ones for free", () => {
    expect(unlockedFeatures("active").sort()).toEqual([...ALL_FEATURES].sort());
    expect(unlockedFeatures("trialing").sort()).toEqual([...ALL_FEATURES].sort());

    const freeUnlocked = unlockedFeatures(null);
    for (const f of PAID_FEATURES) {
      expect(freeUnlocked).not.toContain(f);
    }
  });

  it("featureMap returns a boolean for every feature", () => {
    const paidMap = featureMap("active");
    const freeMap = featureMap(null);
    for (const f of ALL_FEATURES) {
      expect(paidMap[f]).toBe(true);
      expect(freeMap[f]).toBe(false); // all four current features are paid-only
    }
    expect(Object.keys(paidMap).sort()).toEqual([...ALL_FEATURES].sort());
  });
});
