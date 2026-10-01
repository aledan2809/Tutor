import { describe, it, expect } from "vitest";
import { isUndeliverableAddress } from "@/lib/email-recipients";

describe("isUndeliverableAddress (no mail to addresses that can only bounce)", () => {
  it("lets real addresses through", () => {
    expect(isUndeliverableAddress("parinte@gmail.com")).toBe(false);
    expect(isUndeliverableAddress("ana.pop@yahoo.ro")).toBe(false);
    // A real domain that merely ends in a reserved word is not reserved.
    expect(isUndeliverableAddress("cineva@mytest.com")).toBe(false);
    expect(isUndeliverableAddress("cineva@contest.com")).toBe(false);
  });

  it("stops the seed and reserved domains (RFC 2606) and their subdomains", () => {
    for (const a of [
      "parent@test.com",
      "PARENT@Test.Com",
      "x@mail.test.com",
      "x@example.com",
      "x@example.org",
      "x@example.net",
      "x@foo.example",
      "x@foo.invalid",
      "x@foo.localhost",
      "x@foo.test",
      // The reserved names on their own, not only their subdomains.
      "x@test",
      "x@example",
      "x@invalid",
      "x@localhost",
    ]) {
      expect(isUndeliverableAddress(a), a).toBe(true);
    }
  });

  it("stops eTutor's own test domains", () => {
    expect(isUndeliverableAddress("x@tutor.app")).toBe(true);
    expect(isUndeliverableAddress("x@demo.tutor.app")).toBe(true);
  });

  it("treats a missing or malformed address as undeliverable", () => {
    expect(isUndeliverableAddress(null)).toBe(true);
    expect(isUndeliverableAddress(undefined)).toBe(true);
    expect(isUndeliverableAddress("")).toBe(true);
    expect(isUndeliverableAddress("fara-domeniu")).toBe(true);
    expect(isUndeliverableAddress("x@")).toBe(true);
  });
});
