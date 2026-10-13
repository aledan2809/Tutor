import { describe, it, expect } from "vitest";
import { billingIntervalOf, paidPeriodEnd } from "@/lib/billing-period";
import { latePaymentCopy, namesRo, paymentFailedCopy } from "@/lib/billing-messages";

/** A payment for a subscription that had ended buys one period, with an end (Alex, 13.10.2026). */
describe("o perioadă plătită", () => {
  it("o lună, cu ziua păstrată; a 31-a devine ultima zi a lunii", () => {
    expect(paidPeriodEnd(new Date("2026-10-13T08:00:00Z"), "MONTH").toISOString()).toBe("2026-11-13T08:00:00.000Z");
    expect(paidPeriodEnd(new Date("2026-10-31T08:00:00Z"), "MONTH").toISOString()).toBe("2026-11-30T08:00:00.000Z");
    expect(paidPeriodEnd(new Date("2027-01-31T08:00:00Z"), "MONTH").toISOString()).toBe("2027-02-28T08:00:00.000Z");
  });
  it("un an; 29 februarie devine 28", () => {
    expect(paidPeriodEnd(new Date("2026-10-13T08:00:00Z"), "YEAR").toISOString()).toBe("2027-10-13T08:00:00.000Z");
    expect(paidPeriodEnd(new Date("2028-02-29T08:00:00Z"), "YEAR").toISOString()).toBe("2029-02-28T08:00:00.000Z");
  });
  it("intervalul vine din metadatele plății; necunoscut = lună", () => {
    expect(billingIntervalOf("YEAR")).toBe("YEAR");
    expect(billingIntervalOf("MONTH")).toBe("MONTH");
    expect(billingIntervalOf(undefined)).toBe("MONTH");
  });
});

describe("mesajele despre card", () => {
  it("plata refuzată: numește copiii și spune drumul înapoi (cardul), fără alt pachet", () => {
    const one = paymentFailedCopy(["Andrei"]);
    expect(one.message).toContain("și al copilului (Andrei)");
    expect(one.message).toContain("Actualizează cardul");
    const two = paymentFailedCopy(["Andrei", "Maria"]);
    expect(two.message).toContain("și al copiilor (Andrei și Maria)");
    expect(paymentFailedCopy([]).message).not.toContain("copil");
    expect(namesRo(["A", "B", "C"])).toBe("A, B și C");
  });
  it("plata sosită după anulare: suma, data până la care ține și că nu se mai încasează singur", () => {
    const m = latePaymentCopy(49.8, new Date("2026-11-13T08:00:00Z")).message;
    expect(m).toContain("49,80 lei");
    expect(m).toContain("până pe 13 noiembrie");
    expect(m).toContain("nu se mai încasează nimic de la sine");
  });
});
