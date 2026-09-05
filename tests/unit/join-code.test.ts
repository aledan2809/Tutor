import { describe, it, expect } from "vitest";
import { normalizeJoinCode, formatJoinCode, JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH } from "@/lib/join-code";
import { generateJoinCode } from "@/lib/join-code-server";

describe("generateJoinCode", () => {
  it("draws only from the unambiguous alphabet, at the fixed length", () => {
    for (let i = 0; i < 200; i++) {
      const c = generateJoinCode();
      expect(c).toHaveLength(JOIN_CODE_LENGTH);
      for (const ch of c) expect(JOIN_CODE_ALPHABET).toContain(ch);
    }
  });
  it("the alphabet has none of the lookalikes", () => {
    expect(JOIN_CODE_ALPHABET).not.toMatch(/[0O1IL]/);
  });
  it("does not repeat itself", () => {
    const seen = new Set(Array.from({ length: 200 }, generateJoinCode));
    expect(seen.size).toBe(200);
  });
});

describe("normalizeJoinCode", () => {
  it("accepts the display form, spaces and lowercase", () => {
    expect(normalizeJoinCode("kx7m-2pq4")).toBe("KX7M2PQ4");
    expect(normalizeJoinCode(" KX7M 2PQ4 ")).toBe("KX7M2PQ4");
  });
  it("rejects the wrong length and letters outside the alphabet", () => {
    expect(normalizeJoinCode("KX7M2PQ")).toBeNull();
    expect(normalizeJoinCode("KX7M2PQ45")).toBeNull();
    expect(normalizeJoinCode("KX7M2PQ0")).toBeNull(); // 0 is not a code letter
    expect(normalizeJoinCode("KX7M2PQI")).toBeNull(); // nor is I
    expect(normalizeJoinCode("")).toBeNull();
  });
  it("round-trips what the generator produces, through the display form", () => {
    const c = generateJoinCode();
    expect(normalizeJoinCode(formatJoinCode(c))).toBe(c);
  });
});

describe("formatJoinCode", () => {
  it("splits 4-4 with a dash", () => {
    expect(formatJoinCode("KX7M2PQ4")).toBe("KX7M-2PQ4");
  });
});
