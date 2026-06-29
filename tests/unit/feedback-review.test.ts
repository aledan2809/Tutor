import { describe, it, expect, vi } from "vitest";

// feedback-review.ts imports @/lib/prisma + @/lib/grila-generate at module load;
// stub prisma so no client is instantiated (decideReviewAction is pure).
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/grila-generate", () => ({ callTextAI: async () => "" }));

import { decideReviewAction, type Judgment } from "@/lib/feedback-review";

const base: Judgment = {
  valid: true,
  issue: "issue",
  fixable: false,
  correctedAnswer: null,
  reason: "reason",
  complaintType: "question",
};
const OPTS = ["A", "B", "C"];

describe("decideReviewAction", () => {
  it("REGRESSION: a platform complaint never hides/corrects, even valid + private bank", () => {
    // This is exactly what wrongly hid Rareș's listening questions over a
    // "the robot reads too fast" complaint.
    const j: Judgment = { ...base, valid: true, complaintType: "platform", issue: "TTS prea rapid" };
    const r = decideReviewAction(j, /*isPrivate*/ true, OPTS, "tot vorbeste prea rapid robotul");
    expect(r.action).toBe("product_flagged");
    expect(r.decision).toMatch(/produs/i);
  });

  it("platform complaint with no issue falls back to the comment text", () => {
    const j: Judgment = { ...base, complaintType: "platform", issue: "" };
    const r = decideReviewAction(j, false, OPTS, "vorbeste prea repede");
    expect(r.action).toBe("product_flagged");
    expect(r.decision).toContain("vorbeste prea repede");
  });

  it("an invalid (not-real) complaint is dismissed", () => {
    const r = decideReviewAction({ ...base, valid: false }, true, OPTS, "nu am nevoie de asta");
    expect(r.action).toBe("dismissed");
  });

  it("valid + private + fixable with a real option → corrected", () => {
    const j: Judgment = { ...base, valid: true, fixable: true, correctedAnswer: "B" };
    expect(decideReviewAction(j, true, OPTS, null).action).toBe("corrected");
  });

  it("valid + private + fixable but correctedAnswer not among options → hidden (no blind correction)", () => {
    const j: Judgment = { ...base, valid: true, fixable: true, correctedAnswer: "Z" };
    expect(decideReviewAction(j, true, OPTS, null).action).toBe("hidden");
  });

  it("valid + private + not fixable → hidden", () => {
    expect(decideReviewAction({ ...base, valid: true, fixable: false }, true, OPTS, null).action).toBe("hidden");
  });

  it("valid + curriculum (not private) → flagged for an admin, never auto-edited", () => {
    expect(decideReviewAction({ ...base, valid: true }, false, OPTS, null).action).toBe("flagged");
  });
});
