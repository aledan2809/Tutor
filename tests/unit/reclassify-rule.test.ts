import { describe, it, expect } from "vitest";
// @ts-expect-error — plain .mjs helper, shared with the script that runs on the VPS
import { classifyAccount, STUDY_SIGNALS } from "../../scripts/lib/reclassify-rule.mjs";

const base = {
  isSuperAdmin: false,
  hasAdminOrInstructorRole: false,
  isBanned: false,
  guardianOfAsParent: 0,
  guardianOfAsTutor: 0,
  invitedAChild: 0,
  usedParentFeatures: 0,
  hasPaidFamilyPlan: false,
  isSomeonesChild: false,
  studyActivity: {},
  weakSignals: {},
};
const sig = (o: Record<string, unknown> = {}) => ({ ...base, ...o });

describe("classifyAccount — who gets reclassified", () => {
  it("reclassifies a guardian with no study activity", () => {
    const r = classifyAccount(sig({ guardianOfAsParent: 1 }));
    expect(r.verdict).toBe("APPLY");
    expect(r.role).toBe("PARENT");
  });

  it("reclassifies someone who invited a child, even before the link exists", () => {
    expect(classifyAccount(sig({ invitedAChild: 2 })).verdict).toBe("APPLY");
  });

  it("reclassifies someone who used parent-only features", () => {
    expect(classifyAccount(sig({ usedParentFeatures: 3 })).verdict).toBe("APPLY");
  });

  it("marks a tutor-relation guardian as TUTOR, not PARENT", () => {
    const r = classifyAccount(sig({ guardianOfAsTutor: 1 }));
    expect(r.verdict).toBe("APPLY");
    expect(r.role).toBe("TUTOR");
  });

  it("prefers PARENT when someone is both a parent and a tutor", () => {
    expect(classifyAccount(sig({ guardianOfAsParent: 1, guardianOfAsTutor: 1 })).role).toBe("PARENT");
  });
});

describe("classifyAccount — the guard that matters", () => {
  // Hiding Grile from a child who uses them is the one outcome worth engineering
  // against; a parent left on the old menu is merely untidy.
  it("keeps an account with ANY study signal, whatever the parent evidence", () => {
    for (const key of STUDY_SIGNALS as string[]) {
      const r = classifyAccount(
        sig({
          guardianOfAsParent: 3,
          invitedAChild: 2,
          usedParentFeatures: 5,
          studyActivity: { [key]: 1 },
        })
      );
      expect(r.verdict, `${key} must block the demotion`).toBe("KEEP");
      expect(r.reasons.join(" ")).toContain(key);
    }
  });

  it("keeps an account that is itself somebody's child", () => {
    const r = classifyAccount(sig({ isSomeonesChild: true, guardianOfAsParent: 1 }));
    expect(r.verdict).toBe("KEEP");
  });

  it("keeps an account with no parent signal at all", () => {
    expect(classifyAccount(sig()).verdict).toBe("KEEP");
  });
});

describe("classifyAccount — sent for human review, not applied", () => {
  it("reviews a paid family plan with nothing else", () => {
    const r = classifyAccount(sig({ hasPaidFamilyPlan: true }));
    expect(r.verdict).toBe("REVIEW");
    expect(r.role).toBe("PARENT");
  });

  // A parent may well have tried the demo quiz or paid — suggestive both ways.
  it("reviews a strong signal accompanied by weak learner traces", () => {
    const r = classifyAccount(sig({ guardianOfAsParent: 1, weakSignals: { magicQuizzes: 1 } }));
    expect(r.verdict).toBe("REVIEW");
    expect(r.reasons.join(" ")).toContain("magicQuizzes");
  });

  it("does not review a payment on its own as a learner trace", () => {
    expect(classifyAccount(sig({ weakSignals: { payments: 2 } })).verdict).toBe("KEEP");
  });
});

describe("classifyAccount — accounts a script must not touch", () => {
  it("skips superadmins, admins/instructors and banned accounts", () => {
    expect(classifyAccount(sig({ isSuperAdmin: true, guardianOfAsParent: 1 })).verdict).toBe("SKIP");
    expect(classifyAccount(sig({ hasAdminOrInstructorRole: true, guardianOfAsParent: 1 })).verdict).toBe(
      "SKIP"
    );
    expect(classifyAccount(sig({ isBanned: true, guardianOfAsParent: 1 })).verdict).toBe("SKIP");
  });

  it("never returns a role on a verdict that changes nothing", () => {
    for (const s of [
      sig(),
      sig({ isSuperAdmin: true }),
      sig({ isSomeonesChild: true }),
      sig({ studyActivity: { attempts: 1 } }),
    ]) {
      const r = classifyAccount(s);
      expect(["KEEP", "SKIP"]).toContain(r.verdict);
      expect(r.role).toBeNull();
    }
  });

  it("always explains itself", () => {
    for (const s of [sig(), sig({ guardianOfAsParent: 1 }), sig({ hasPaidFamilyPlan: true })]) {
      expect(classifyAccount(s).reasons.length).toBeGreaterThan(0);
    }
  });
});
