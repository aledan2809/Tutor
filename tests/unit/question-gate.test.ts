import { describe, it, expect, vi, beforeEach } from "vitest";

const finalJudge = vi.fn();
vi.mock("@/lib/content-quality-mesh", () => ({
  finalJudge: (...a: unknown[]) => finalJudge(...a),
}));

const { gateGeneratedQuestions, describeGateOutcome } = await import("@/lib/question-gate");

const q = (content: string) => ({ content, options: ["a", "b"], correctAnswer: "a", explanation: "x" });

beforeEach(() => finalJudge.mockReset());

describe("the gate on AI-generated questions", () => {
  it("keeps what passes and drops what does not", async () => {
    finalJudge
      .mockResolvedValueOnce({ pass: true, reason: "", defect: null })
      .mockResolvedValueOnce({ pass: false, reason: "answer is 250 not 50", defect: "wrong-answer" });

    const out = await gateGeneratedQuestions([q("bun"), q("gresit")]);
    expect(out.kept.map((k) => k.content)).toEqual(["bun"]);
    expect(out.rejected).toHaveLength(1);
    expect(out.rejected[0].defect).toBe("wrong-answer");
  });

  it("fails CLOSED when the judge is unreachable", async () => {
    // The whole point. An unreachable verifier reading as "approved" is the
    // failure that produced the defective bank in the first place — and the one
    // that made a sweep report 85 unchecked questions as clean.
    // How it actually reaches us: `finalJudge` catches internally and RETURNS a
    // failing verdict rather than throwing — see its "fail-CLOSED on
    // parse/network error" contract. The thrown case is covered separately
    // below, because both paths must land in the same place.
    finalJudge.mockImplementation(() =>
      Promise.resolve({ pass: false, reason: "judge error: network down", defect: null })
    );
    const out = await gateGeneratedQuestions([q("a"), q("b"), q("c")]);
    expect(out.kept).toEqual([]);
    expect(out.rejected).toHaveLength(3);
    expect(out.rejected.every((r) => r.reason.includes("network down"))).toBe(true);
  });

  it("does not let one thrown judge take down the batch", async () => {
    let first = true;
    finalJudge.mockImplementation(() => {
      if (first) { first = false; throw new Error("boom"); }
      return Promise.resolve({ pass: true, reason: "", defect: null });
    });
    const out = await gateGeneratedQuestions([q("1"), q("2"), q("3")]);
    expect(out.kept).toHaveLength(2);
    expect(out.rejected).toHaveLength(1);
  });

  it("judges every candidate, not just the first batch", async () => {
    finalJudge.mockResolvedValue({ pass: true, reason: "", defect: null });
    const many = Array.from({ length: 11 }, (_, i) => q(`q${i}`));
    const out = await gateGeneratedQuestions(many);
    expect(finalJudge).toHaveBeenCalledTimes(11);
    expect(out.kept).toHaveLength(11);
  });

  it("names what was discarded instead of only counting it", async () => {
    finalJudge
      .mockResolvedValueOnce({ pass: true, reason: "", defect: null })
      .mockResolvedValueOnce({ pass: false, reason: "r", defect: "multiple-correct" })
      .mockResolvedValueOnce({ pass: false, reason: "r", defect: "multiple-correct" });
    const out = await gateGeneratedQuestions([q("1"), q("2"), q("3")]);
    const text = describeGateOutcome(out);
    expect(text).toContain("1 din 3");
    expect(text).toContain("2× multiple-correct");
  });

  it("says so plainly when nothing was rejected", async () => {
    finalJudge.mockResolvedValue({ pass: true, reason: "", defect: null });
    const out = await gateGeneratedQuestions([q("1"), q("2")]);
    expect(describeGateOutcome(out)).toContain("Toate cele 2");
  });
});
