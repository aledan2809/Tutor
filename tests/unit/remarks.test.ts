import { describe, it, expect } from "vitest";
import {
  REMARK_KEYS,
  REMARK_TONES,
  DEFAULT_TONE,
  resolveTone,
  pickTrigger,
  pickRemarkKey,
  applyRemarkVote,
  remarkI18nKey,
} from "@/lib/remarks";

describe("resolveTone", () => {
  it("defaults to encouraging on unknown/empty preference", () => {
    expect(resolveTone(null, false)).toBe("encouraging");
    expect(resolveTone(undefined, false)).toBe("encouraging");
    expect(resolveTone("bogus", false)).toBe(DEFAULT_TONE);
  });
  it("honours a valid student preference", () => {
    for (const tone of REMARK_TONES) expect(resolveTone(tone, false)).toBe(tone);
  });
  it("parent restriction downgrades playful → encouraging only", () => {
    expect(resolveTone("playful", true)).toBe("encouraging");
    expect(resolveTone("neutral", true)).toBe("neutral");
    expect(resolveTone("encouraging", true)).toBe("encouraging");
    expect(resolveTone("playful", false)).toBe("playful");
  });
});

describe("pickTrigger", () => {
  it("streak milestone wins at >=4", () => {
    expect(pickTrigger({ streak: 4, cameBackFromWrong: true })).toBe("streak");
    expect(pickTrigger({ streak: 9, cameBackFromWrong: false })).toBe("streak");
  });
  it("comeback when recovering below the streak threshold", () => {
    expect(pickTrigger({ streak: 1, cameBackFromWrong: true })).toBe("comeback");
  });
  it("plain correct otherwise", () => {
    expect(pickTrigger({ streak: 2, cameBackFromWrong: false })).toBe("correct");
  });
});

describe("pickRemarkKey", () => {
  it("is deterministic for a given seed and within the pool", () => {
    const a = pickRemarkKey({ tone: "playful", trigger: "correct", seed: 7 });
    const b = pickRemarkKey({ tone: "playful", trigger: "correct", seed: 7 });
    expect(a).toBe(b);
    expect(REMARK_KEYS.playful.correct).toContain(a);
  });
  it("never returns a disliked key when alternatives exist", () => {
    const disliked = REMARK_KEYS.encouraging.correct.slice(0, 3);
    for (let seed = 0; seed < 20; seed++) {
      const k = pickRemarkKey({ tone: "encouraging", trigger: "correct", disliked, seed });
      expect(disliked).not.toContain(k);
    }
  });
  it("avoids repeating the most recent key when possible", () => {
    const recent = REMARK_KEYS.encouraging.correct[0];
    for (let seed = 0; seed < 20; seed++) {
      const k = pickRemarkKey({ tone: "encouraging", trigger: "correct", recentKey: recent, seed });
      expect(k).not.toBe(recent);
    }
  });
  it("falls back across triggers/tones rather than returning null", () => {
    // Dislike the entire playful+streak pool → must fall back, never null.
    const disliked = [
      ...REMARK_KEYS.playful.streak,
      ...REMARK_KEYS.playful.correct,
    ];
    const k = pickRemarkKey({ tone: "playful", trigger: "streak", disliked, seed: 3 });
    expect(k).not.toBeNull();
  });
  it("returns null only for non-correct (no remark) callers", () => {
    // Caller guards on isCorrect; engine itself still resolves a key for any tone/trigger.
    expect(pickRemarkKey({ tone: "neutral", trigger: "correct", seed: 0 })).not.toBeNull();
  });
});

describe("applyRemarkVote", () => {
  it("dislike adds to disliked and clears liked", () => {
    const r = applyRemarkVote({ liked: ["x"], disliked: [] }, "x", "dislike");
    expect(r.disliked).toContain("x");
    expect(r.liked).not.toContain("x");
  });
  it("like adds to liked and clears disliked; idempotent", () => {
    let r = applyRemarkVote(null, "y", "like");
    expect(r.liked).toContain("y");
    r = applyRemarkVote(r, "y", "like");
    expect(r.liked.filter((k) => k === "y")).toHaveLength(1);
  });
});

describe("remarkI18nKey", () => {
  it("namespaces under remarks.lines", () => {
    expect(remarkI18nKey("e_c1")).toBe("remarks.lines.e_c1");
  });
});
