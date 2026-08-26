import { describe, it, expect } from "vitest";
import { countOfKind, ordinalWithinKind, planSlots, remainingOfKind } from "@/lib/sprint-plan";
import { SPRINT_QUESTION_COUNT } from "@/lib/mental-chain";

describe("planSlots", () => {
  it("splits a standard sprint evenly between direct operations and chains", () => {
    const slots = planSlots(SPRINT_QUESTION_COUNT);
    expect(slots).toHaveLength(SPRINT_QUESTION_COUNT);
    expect(countOfKind(slots, "single")).toBe(SPRINT_QUESTION_COUNT / 2);
    expect(countOfKind(slots, "chain")).toBe(SPRINT_QUESTION_COUNT / 2);
  });

  it("opens on a direct operation — the gentler warm-up of the two", () => {
    expect(planSlots(20)[0]).toBe("single");
  });

  it("alternates, so he has to keep switching between the two modes", () => {
    const slots = planSlots(8);
    expect(slots).toEqual(["single", "chain", "single", "chain", "single", "chain", "single", "chain"]);
  });

  it("handles degenerate lengths without throwing", () => {
    expect(planSlots(0)).toEqual([]);
    expect(planSlots(1)).toEqual(["single"]);
    expect(planSlots(-3)).toEqual([]);
  });
});

describe("per-kind progression", () => {
  it("numbers each question within its own kind", () => {
    const slots = planSlots(6); // S C S C S C
    expect(ordinalWithinKind(slots, 0)).toBe(0); // 1st single
    expect(ordinalWithinKind(slots, 1)).toBe(0); // 1st chain
    expect(ordinalWithinKind(slots, 2)).toBe(1); // 2nd single
    expect(ordinalWithinKind(slots, 5)).toBe(2); // 3rd chain
  });

  it("lets the chain ramp still reach its hardest step", () => {
    // The point of indexing per kind: with 10 chains out of 20 slots, indexing
    // by overall position would leave the ramp only half-travelled at the end.
    const slots = planSlots(20);
    const lastChain = slots.lastIndexOf("chain");
    expect(ordinalWithinKind(slots, lastChain)).toBe(countOfKind(slots, "chain") - 1);
  });

  it("counts the slots of a kind still ahead", () => {
    const slots = planSlots(6);
    expect(remainingOfKind(slots, 0, "single")).toBe(3);
    expect(remainingOfKind(slots, 4, "single")).toBe(1);
    expect(remainingOfKind(slots, 6, "single")).toBe(0);
  });
});
