import { describe, it, expect } from "vitest";
import {
  NEEDS_HUMAN_CONFIRMATION,
  needsHumanConfirmation,
  statusForAction,
  tellsStudentNow,
  decideReviewAction,
} from "@/lib/feedback-review";

describe("no automated verdict closes a student's complaint by itself", () => {
  it("keeps a dismissal and a flag open for a person", () => {
    // The exact failure: between June and August a student reported nine
    // defective questions, seven of them real. The verdicts were written with
    // status "resolved" — including the ones that said, in their own text, that
    // the reviewer could not decide. They looked finished in every list an admin
    // might open, so nobody looked, for two months.
    expect(statusForAction("dismissed")).toBe("pending_review");
    expect(statusForAction("flagged")).toBe("pending_review");
  });

  it("still closes the verdicts that acted on the question", () => {
    expect(statusForAction("corrected")).toBe("resolved");
    expect(statusForAction("hidden")).toBe("resolved");
    expect(statusForAction("product_flagged")).toBe("resolved");
  });

  it("does not tell a child he was wrong before a person agrees", () => {
    expect(tellsStudentNow("dismissed")).toBe(false);
    // Everything else is either good news or neutral, and goes out at once.
    expect(tellsStudentNow("corrected")).toBe(true);
    expect(tellsStudentNow("hidden")).toBe(true);
    expect(tellsStudentNow("flagged")).toBe(true);
    expect(tellsStudentNow("product_flagged")).toBe(true);
  });

  it("names exactly the two verdicts that need a human", () => {
    expect([...NEEDS_HUMAN_CONFIRMATION].sort()).toEqual(["dismissed", "flagged"]);
    expect(needsHumanConfirmation("corrected")).toBe(false);
  });
});

describe("the verdict itself is unchanged", () => {
  const j = (over: Partial<Parameters<typeof decideReviewAction>[0]> = {}) =>
    ({ valid: true, fixable: false, issue: "x", reason: "y", complaintType: "content", correctedAnswer: null, ...over }) as Parameters<typeof decideReviewAction>[0];

  it("routes a platform complaint away from the question", () => {
    expect(decideReviewAction(j({ complaintType: "platform" }), true, [], "prea repede").action)
      .toBe("product_flagged");
  });

  it("dismisses an invalid complaint — but that no longer ends the thread", () => {
    const { action } = decideReviewAction(j({ valid: false }), true, [], null);
    expect(action).toBe("dismissed");
    expect(statusForAction(action)).toBe("pending_review");
  });

  it("auto-corrects only when the fix is one of the offered options", () => {
    expect(decideReviewAction(j({ fixable: true, correctedAnswer: "b) 2" }), true, ["a) 1", "b) 2"], null).action)
      .toBe("corrected");
    // Not among the options → cannot be corrected in place; it gets hidden.
    expect(decideReviewAction(j({ fixable: true, correctedAnswer: "c) 9" }), true, ["a) 1", "b) 2"], null).action)
      .toBe("hidden");
  });

  it("never auto-edits a curriculum question — it flags, and now waits", () => {
    const { action } = decideReviewAction(j({ fixable: true, correctedAnswer: "a) 1" }), false, ["a) 1"], null);
    expect(action).toBe("flagged");
    expect(statusForAction(action)).toBe("pending_review");
  });
});
