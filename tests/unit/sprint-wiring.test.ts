import { describe, it, expect } from "vitest";
import {
  buildInitialSprintMetadata,
  seedFamilyBaselines,
  chainTotalOf,
  isLegacyAllChain,
  singleTotalOf,
  slotKindsOf,
  type SprintMetadata,
} from "@/lib/sprint-session";
import { SPRINT_QUESTION_COUNT } from "@/lib/mental-chain";

const profile = {
  level: 3,
  timeFactor: 1.2,
  sessions: 4,
  families: { mul: { level: 4, timeFactor: 0.9 }, div: { level: 2, timeFactor: 1.4 } },
};

describe("the metadata a sprint starts with", () => {
  const meta = buildInitialSprintMetadata(profile, SPRINT_QUESTION_COUNT, 600);

  it("carries the per-family profile into the session", () => {
    // The bug this exists to prevent: the engine reads `meta.familyBaselines`,
    // the route never wrote it, so every session silently restarted every
    // operation at level 1. The drill adapted within a run and forgot between
    // runs — indistinguishable from working, unless you look here.
    // The stored families arrive untouched…
    expect(meta.familyBaselines?.mul).toEqual({ level: 4, timeFactor: 0.9 });
    expect(meta.familyBaselines?.div).toEqual({ level: 2, timeFactor: 1.4 });
    // …and the ones he has never been asked are seeded from what he earned
    // elsewhere, rather than left at the stingiest default (see below).
    expect(meta.familyBaselines?.add?.timeFactor).toBe(profile.timeFactor);
    expect(meta.familyBaselines?.sub?.timeFactor).toBe(profile.timeFactor);
  });

  it("marks itself as a session that knows about direct operations", () => {
    // Presence, not content: this is what separates a new sprint from one that
    // predates direct operations.
    expect(Array.isArray(meta.questionKinds)).toBe(true);
    expect(Array.isArray(meta.questionFamilies)).toBe(true);
    expect(isLegacyAllChain(meta)).toBe(false);
  });

  it("plans half direct operations and half chains", () => {
    expect(chainTotalOf(meta)).toBe(SPRINT_QUESTION_COUNT / 2);
    expect(singleTotalOf(meta)).toBe(SPRINT_QUESTION_COUNT / 2);
  });

  it("starts from the student's stored level and pace", () => {
    expect(meta.level).toBe(3);
    expect(meta.timeFactor).toBe(1.2);
    expect(meta.questionIds).toEqual([]);
  });
});

describe("what a student has already earned carries into a new exercise type", () => {
  // Measured on production 2026-08-27: a student whose profile held a 2.06×
  // clock (earned by telling us repeatedly that the pace was too tight) was
  // handed 5 seconds for `46 + 27` and timed out on it. The per-family clock
  // had restarted at 1, so he was paying timeouts to re-earn what he already had.
  const earned = { level: 3, timeFactor: 2.06, sessions: 9, families: {} };

  it("starts every unseen family at the pace he already earned, not at 1", () => {
    const seeded = seedFamilyBaselines(earned);
    for (const f of ["mul", "div", "add", "sub"] as const) {
      expect(seeded[f]?.timeFactor).toBe(2.06);
    }
  });

  it("starts a tier below his chain level, not at the trivial floor", () => {
    // Tier 1 singles are `5 × 2`. For someone working through
    // `25 × 5 − 40 ÷ 8 − 95` that measures nothing.
    expect(seedFamilyBaselines(earned).mul?.level).toBe(2);
    expect(seedFamilyBaselines({ ...earned, level: 1 }).mul?.level).toBe(1);
    expect(seedFamilyBaselines({ ...earned, level: 5 }).sub?.level).toBe(4);
  });

  it("never overwrites a family that already has its own history", () => {
    const withHistory = { ...earned, families: { mul: { level: 4, timeFactor: 0.8 } } };
    const seeded = seedFamilyBaselines(withHistory);
    expect(seeded.mul).toEqual({ level: 4, timeFactor: 0.8 });
    // …while the families never met still inherit the earned pace.
    expect(seeded.div?.timeFactor).toBe(2.06);
  });

  it("puts the seeded values where the engine actually reads them", () => {
    const meta = buildInitialSprintMetadata(earned, 20, 600);
    expect(meta.familyBaselines?.add?.timeFactor).toBe(2.06);
  });
});

describe("a sprint that predates direct operations", () => {
  const legacy: SprintMetadata = {
    duration: 600,
    totalQuestions: 20,
    questionIds: ["q1", "q2", "q3"],
    questionSeconds: [45, 43, 41],
    level: 2,
    timeFactor: 1,
  };

  it("is recognised as all-chain", () => {
    expect(isLegacyAllChain(legacy)).toBe(true);
    expect(slotKindsOf(legacy)).toEqual(["chain", "chain", "chain"]);
  });

  it("keeps counting its chains against the WHOLE session", () => {
    // If it flipped to the new plan mid-run, the chain ramp's total would drop
    // from 20 to 10 and the clock would jump between two questions — under a
    // student who is being timed.
    expect(chainTotalOf(legacy)).toBe(20);
    expect(singleTotalOf(legacy)).toBe(0);
  });
});

describe("a new sprint mid-run", () => {
  const running: SprintMetadata = {
    ...buildInitialSprintMetadata(profile, 20, 600),
    questionIds: ["a", "b", "c"],
    questionSeconds: [12, 40, 11],
    questionKinds: ["single", "chain", "single"],
    questionFamilies: ["mul", null, "div"],
  };

  it("reads back the kind and family of every question it handed out", () => {
    expect(slotKindsOf(running)).toEqual(["single", "chain", "single"]);
    expect(running.questionFamilies).toEqual(["mul", null, "div"]);
  });

  it("stays on the split plan", () => {
    expect(isLegacyAllChain(running)).toBe(false);
    expect(chainTotalOf(running)).toBe(10);
  });
});
