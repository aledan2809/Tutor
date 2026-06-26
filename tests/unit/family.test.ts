import { describe, it, expect } from "vitest";
import {
  FAMILY_PLANS,
  getFamilyPlan,
  resolveFamilyPlanKey,
  childDiscountPercent,
  subjectDiscountPercent,
  canAddParent,
  canAddChild,
  canAddTutor,
} from "@/lib/family";

/**
 * Family-packages config + seat-rule tests (Faza 0). Pure logic — no DB.
 */

describe("resolveFamilyPlanKey", () => {
  it("maps the marketing names to plan keys, most specific first", () => {
    expect(resolveFamilyPlanKey("Family Trio")).toBe("FAMILY_TRIO");
    expect(resolveFamilyPlanKey("Family Duo")).toBe("FAMILY_DUO");
    expect(resolveFamilyPlanKey("Trio")).toBe("TRIO");
    expect(resolveFamilyPlanKey("Family")).toBe("FAMILY");
    expect(resolveFamilyPlanKey("Elev")).toBe("ELEV");
  });

  it("is case/space tolerant", () => {
    expect(resolveFamilyPlanKey("  family DUO  ")).toBe("FAMILY_DUO");
    expect(resolveFamilyPlanKey("FAMILY TRIO")).toBe("FAMILY_TRIO");
  });

  it("returns null for non-family / empty names", () => {
    expect(resolveFamilyPlanKey(null)).toBeNull();
    expect(resolveFamilyPlanKey(undefined)).toBeNull();
    expect(resolveFamilyPlanKey("")).toBeNull();
    expect(resolveFamilyPlanKey("Premium")).toBeNull();
  });
});

describe("childDiscountPercent", () => {
  it("first child = base (0%), 2nd = 20%, 3rd+ = 30%", () => {
    expect(childDiscountPercent(1)).toBe(0);
    expect(childDiscountPercent(2)).toBe(20);
    expect(childDiscountPercent(3)).toBe(30);
    expect(childDiscountPercent(5)).toBe(30);
  });
});

describe("subjectDiscountPercent", () => {
  it("first subject = base price (0%), 2nd = 15%, 3rd+ = 25%", () => {
    expect(subjectDiscountPercent(1)).toBe(0);
    expect(subjectDiscountPercent(2)).toBe(15);
    expect(subjectDiscountPercent(3)).toBe(25);
    expect(subjectDiscountPercent(5)).toBe(25);
  });
});

describe("canAddParent", () => {
  it("blocks when no family plan", () => {
    const r = canAddParent(null, 0);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("no_family_plan");
  });

  it("Family allows the owner only — 2nd parent upgrades to Duo", () => {
    expect(canAddParent(FAMILY_PLANS.FAMILY, 0).allowed).toBe(true);
    const blocked = canAddParent(FAMILY_PLANS.FAMILY, 1);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("parent_limit");
    expect(blocked.upgradeTo).toBe("FAMILY_DUO");
  });

  it("Duo allows a 2nd parent then blocks the 3rd", () => {
    expect(canAddParent(FAMILY_PLANS.FAMILY_DUO, 1).allowed).toBe(true);
    const blocked = canAddParent(FAMILY_PLANS.FAMILY_DUO, 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.upgradeTo).toBeUndefined(); // no plan beyond Duo for parents
  });

  it("Trio upgrades to Family Trio for a 2nd parent", () => {
    expect(canAddParent(FAMILY_PLANS.TRIO, 1).upgradeTo).toBe("FAMILY_TRIO");
  });
});

describe("canAddChild", () => {
  it("blocks when no family plan", () => {
    expect(canAddChild(null, 0).reason).toBe("no_family_plan");
  });

  it("allows the base child then offers a discounted add-on", () => {
    expect(canAddChild(FAMILY_PLANS.FAMILY, 0).allowed).toBe(true);
    const addon = canAddChild(FAMILY_PLANS.FAMILY, 1);
    expect(addon.allowed).toBe(false);
    expect(addon.reason).toBe("child_addon");
    expect(addon.addon).toBe(true);
    expect(addon.discountPercent).toBe(20); // 2nd child
  });

  it("third child add-on carries 30%", () => {
    expect(canAddChild(FAMILY_PLANS.FAMILY, 2).discountPercent).toBe(30);
  });
});

describe("canAddTutor", () => {
  it("blocks when no family plan", () => {
    expect(canAddTutor(null, 0).reason).toBe("no_family_plan");
  });

  it("Family has no tutor seat — points to Trio", () => {
    const r = canAddTutor(FAMILY_PLANS.FAMILY, 0);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("tutor_feature_off");
    expect(r.upgradeTo).toBe("TRIO");
  });

  it("Family Duo unlocks tutor via Family Trio", () => {
    expect(canAddTutor(FAMILY_PLANS.FAMILY_DUO, 0).upgradeTo).toBe("FAMILY_TRIO");
  });

  it("Trio allows one tutor then blocks the 2nd", () => {
    expect(canAddTutor(FAMILY_PLANS.TRIO, 0).allowed).toBe(true);
    const blocked = canAddTutor(FAMILY_PLANS.TRIO, 1);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("tutor_limit");
  });
});

describe("FAMILY_PLANS shape", () => {
  it("every plan key is self-consistent and Elev has zero family seats", () => {
    for (const key of Object.keys(FAMILY_PLANS) as (keyof typeof FAMILY_PLANS)[]) {
      expect(getFamilyPlan(key).key).toBe(key);
    }
    const elev = FAMILY_PLANS.ELEV;
    expect(elev.maxParents).toBe(0);
    expect(elev.maxChildren).toBe(0);
    expect(elev.features.tutorAccess).toBe(false);
  });
});
