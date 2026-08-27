import { describe, it, expect } from "vitest";
import {
  buildInitialSprintMetadata,
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
    expect(meta.familyBaselines).toEqual(profile.families);
    expect(meta.familyBaselines?.mul?.level).toBe(4);
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
