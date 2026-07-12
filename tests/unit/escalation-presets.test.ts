import { describe, it, expect } from "vitest";
import {
  sanitizeEscalationSteps,
  resolveLadderFromSteps,
  resolveUserLadder,
  resolveUserGraceMs,
  ESCALATION_PRESETS,
  ESCALATION_LEVELS,
} from "@/lib/escalation/config";

/**
 * Feature 2 (Batch 3): parent-set custom escalation cascade — presets + per-step
 * minutes. All pure, no DB. Guarantees: bad payloads never corrupt delivery (fall
 * back to the default ladder), custom steps override channelOrder + the window grace.
 */

describe("sanitizeEscalationSteps", () => {
  it("returns undefined for non-array / empty / all-junk", () => {
    expect(sanitizeEscalationSteps(undefined)).toBeUndefined();
    expect(sanitizeEscalationSteps(null)).toBeUndefined();
    expect(sanitizeEscalationSteps([])).toBeUndefined();
    expect(sanitizeEscalationSteps("x")).toBeUndefined();
    expect(sanitizeEscalationSteps([{ channel: "BANANA", delayMinutes: 5 }])).toBeUndefined();
  });

  it("keeps known cascade channels in order, upper-cased, de-duped; drops non-orderable", () => {
    const out = sanitizeEscalationSteps([
      { channel: "push", delayMinutes: 0 },
      { channel: "EMAIL", delayMinutes: 30 },
      { channel: "email", delayMinutes: 99 }, // dupe → dropped
      { channel: "SMS", delayMinutes: 5 }, // not cascade-orderable → dropped
    ]);
    expect(out).toEqual([
      { channel: "PUSH", delayMinutes: 0 },
      { channel: "EMAIL", delayMinutes: 30 },
    ]);
  });

  it("clamps delayMinutes to [0,1440] and floors every non-lead rung to >= 1", () => {
    const out = sanitizeEscalationSteps([
      { channel: "PUSH", delayMinutes: -5 }, // lead → 0
      { channel: "TELEGRAM", delayMinutes: 0 }, // non-lead → 1
      { channel: "EMAIL", delayMinutes: 99999 }, // → 1440
    ]);
    expect(out).toEqual([
      { channel: "PUSH", delayMinutes: 0 },
      { channel: "TELEGRAM", delayMinutes: 1 },
      { channel: "EMAIL", delayMinutes: 1440 },
    ]);
  });

  it("drops entries whose delay is not a finite number", () => {
    const out = sanitizeEscalationSteps([
      { channel: "PUSH", delayMinutes: 0 },
      { channel: "EMAIL", delayMinutes: "abc" },
    ]);
    expect(out).toEqual([{ channel: "PUSH", delayMinutes: 0 }]);
  });
});

describe("ESCALATION_PRESETS", () => {
  it("every preset sanitizes to itself (valid + idempotent)", () => {
    for (const k of ["BLAND", "STANDARD", "INSISTENT"] as const) {
      expect(sanitizeEscalationSteps(ESCALATION_PRESETS[k])).toEqual(ESCALATION_PRESETS[k]);
    }
  });

  it("Standard preset matches the default cascade channels", () => {
    expect(ESCALATION_PRESETS.STANDARD.map((s) => s.channel)).toEqual(
      ESCALATION_LEVELS.map((l) => l.channel),
    );
  });
});

describe("resolveLadderFromSteps", () => {
  it("builds levels 1..n keeping each channel's default template", () => {
    const out = resolveLadderFromSteps([
      { channel: "PUSH", delayMinutes: 0 },
      { channel: "EMAIL", delayMinutes: 30 },
    ]);
    expect(out.map((l) => [l.level, l.channel, l.delayMinutes])).toEqual([
      [1, "PUSH", 0],
      [2, "EMAIL", 30],
    ]);
    expect(out[1].templateId).toBe(ESCALATION_LEVELS.find((l) => l.channel === "EMAIL")!.templateId);
  });
});

describe("resolveUserLadder", () => {
  it("uses custom steps when present — overrides channelOrder, allows a shorter ladder", () => {
    const out = resolveUserLadder({
      channelOrder: ["WHATSAPP", "PUSH"],
      escalationSteps: [
        { channel: "PUSH", delayMinutes: 0 },
        { channel: "EMAIL", delayMinutes: 20 },
      ],
    });
    expect(out.map((l) => l.channel)).toEqual(["PUSH", "EMAIL"]);
  });

  it("falls back to the channelOrder ladder when steps are absent/invalid", () => {
    expect(resolveUserLadder({ channelOrder: ["EMAIL"] }).map((l) => l.channel)).toEqual([
      "EMAIL",
      "PUSH",
      "TELEGRAM",
      "WHATSAPP",
    ]);
    expect(resolveUserLadder({ escalationSteps: [] }).map((l) => l.channel)).toEqual([
      "PUSH",
      "TELEGRAM",
      "EMAIL",
      "WHATSAPP",
    ]);
  });
});

describe("resolveUserGraceMs", () => {
  const steps = [
    { channel: "PUSH", delayMinutes: 0 },
    { channel: "EMAIL", delayMinutes: 30 },
  ];

  it("returns undefined (caller keeps its window fallback) when there are no custom steps", () => {
    expect(resolveUserGraceMs(undefined, 0)).toBeUndefined();
    expect(resolveUserGraceMs([], 0)).toBeUndefined();
  });

  it("returns the NEXT step's delay in ms for a non-terminal rung", () => {
    expect(resolveUserGraceMs(steps, 0)).toBe(30 * 60_000);
  });

  it("returns null at the terminal rung (no next step)", () => {
    expect(resolveUserGraceMs(steps, 1)).toBeNull();
  });
});
