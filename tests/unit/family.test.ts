import { describe, it, expect } from "vitest";
import {
  FAMILY_PLANS,
  getFamilyPlan,
  resolveFamilyPlanKey,
  resolveFamilyPlanFromRecord,
  isFamilyPlanKey,
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

describe("isFamilyPlanKey", () => {
  it("accepts known keys, rejects everything else", () => {
    expect(isFamilyPlanKey("FAMILY_TRIO")).toBe(true);
    expect(isFamilyPlanKey("ELEV")).toBe(true);
    expect(isFamilyPlanKey("family")).toBe(false); // case-sensitive key, not a name
    expect(isFamilyPlanKey("BOGUS")).toBe(false);
    expect(isFamilyPlanKey(null)).toBe(false);
    expect(isFamilyPlanKey(undefined)).toBe(false);
  });
});

describe("resolveFamilyPlanFromRecord", () => {
  it("prefers the stored familyPlanKey over the name", () => {
    // Name says Family, but the stored key is authoritative → Family Trio.
    const plan = resolveFamilyPlanFromRecord({
      name: "Family",
      familyPlanKey: "FAMILY_TRIO",
    });
    expect(plan?.key).toBe("FAMILY_TRIO");
    expect(plan?.maxTutors).toBe(FAMILY_PLANS.FAMILY_TRIO.maxTutors);
  });

  it("falls back to name derivation when familyPlanKey is null (legacy row)", () => {
    const plan = resolveFamilyPlanFromRecord({ name: "Family Duo", familyPlanKey: null });
    expect(plan?.key).toBe("FAMILY_DUO");
    expect(plan?.maxParents).toBe(2);
  });

  it("inherits the key's canonical seats when override columns are null", () => {
    const plan = resolveFamilyPlanFromRecord({ familyPlanKey: "TRIO" });
    expect(plan).toMatchObject({
      maxParents: FAMILY_PLANS.TRIO.maxParents,
      maxChildren: FAMILY_PLANS.TRIO.maxChildren,
      maxTutors: FAMILY_PLANS.TRIO.maxTutors,
    });
  });

  it("applies per-seat overrides on top of the key composition", () => {
    const plan = resolveFamilyPlanFromRecord({
      familyPlanKey: "FAMILY",
      maxChildren: 4,
      maxParents: null, // null inherits canonical
    });
    expect(plan?.maxChildren).toBe(4); // overridden
    expect(plan?.maxParents).toBe(FAMILY_PLANS.FAMILY.maxParents); // inherited
    expect(plan?.features.tutorAccess).toBe(false); // features still from key
  });

  it("ignores a bogus familyPlanKey and falls back to the name", () => {
    const plan = resolveFamilyPlanFromRecord({ name: "Trio", familyPlanKey: "NONSENSE" });
    expect(plan?.key).toBe("TRIO");
  });

  it("returns null for a non-family record and for null input", () => {
    expect(resolveFamilyPlanFromRecord({ name: "Random Add-on" })).toBeNull();
    expect(resolveFamilyPlanFromRecord(null)).toBeNull();
    expect(resolveFamilyPlanFromRecord({})).toBeNull();
  });
});
