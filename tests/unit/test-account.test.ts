import { describe, it, expect, vi } from "vitest";

// The seam imports prisma (for resolveIsTestForUser); stub it so the pure
// resolveIsTest wiring can be tested without a DB.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { resolveIsTest } from "@/lib/notifications/test-account";

describe("resolveIsTest (Tutor seam over @aledan/notify-ladder)", () => {
  it("flags Tutor's seed/demo domains", () => {
    expect(resolveIsTest("admin@tutor.app")).toBe(true);
    expect(resolveIsTest("student@tutor.app")).toBe(true);
    expect(resolveIsTest("maria.popescu@demo.tutor.app")).toBe(true);
    expect(resolveIsTest("qa@sub.tutor.app")).toBe(true);
  });

  it("still honors the built-in defaults", () => {
    expect(resolveIsTest("x@eat.test")).toBe(true);
    expect(resolveIsTest("x@example.com")).toBe(true);
  });

  it("does not flag real learners", () => {
    expect(resolveIsTest("ana.maria@gmail.com")).toBe(false);
    expect(resolveIsTest("user@yahoo.com")).toBe(false);
    expect(resolveIsTest(null)).toBe(false);
    expect(resolveIsTest(undefined)).toBe(false);
  });
});
