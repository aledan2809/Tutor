import { describe, it, expect } from "vitest";
import {
  EARNING_PCT,
  REFERRAL_MAX_PAID_MONTHS,
  payoutFor,
  earningFor,
  applyCredit,
  clawbackCredit,
  clawbackCash,
  foldCreditBalance,
} from "@/lib/referral-credit";

describe("cine primește credit și cine primește bani", () => {
  it("clientul care recomandă primește credit", () => {
    expect(payoutFor("CLIENT", "REFERRAL")).toBe("CREDIT");
  });
  it("meditatorul și creatorul primesc bani, nu credit", () => {
    expect(payoutFor("TUTOR", "REFERRAL")).toBe("CASH");
    expect(payoutFor("CREATOR", "REFERRAL")).toBe("CASH");
  });
  it("câștigul din conținut e mereu în bani — un creator poate să nu fie abonat", () => {
    expect(payoutFor("CLIENT", "CONTENT")).toBe("CASH");
    expect(payoutFor("TUTOR", "CONTENT")).toBe("CASH");
  });
});

describe("fereastra de 3 luni la recomandări", () => {
  const base = { kind: "CLIENT" as const, type: "REFERRAL" as const, paymentAmount: 2490 };

  it("acordă pe primele trei plăți încasate", () => {
    for (let m = 1; m <= REFERRAL_MAX_PAID_MONTHS; m++) {
      expect(earningFor({ ...base, monthIndex: m })?.amount).toBe(1245);
    }
  });

  it("a patra plată nu mai produce nimic", () => {
    expect(earningFor({ ...base, monthIndex: 4 })).toBeNull();
    expect(earningFor({ ...base, monthIndex: 12 })).toBeNull();
  });

  it("conținutul NU e plafonat — asta e diferența față de recomandare", () => {
    const e = earningFor({ kind: "CREATOR", type: "CONTENT", paymentAmount: 2490, monthIndex: 40 });
    expect(e?.amount).toBe(1245);
  });

  it("50% din abonamentul ACTUAL, nu dintr-un minim fix", () => {
    expect(earningFor({ ...base, paymentAmount: 4990, monthIndex: 1 })?.amount).toBe(2495);
    expect(earningFor({ ...base, paymentAmount: 990, monthIndex: 1 })?.amount).toBe(495);
    expect(EARNING_PCT).toBe(0.5);
  });

  it("rotunjește ÎN JOS — platforma nu plătește peste procent", () => {
    expect(earningFor({ ...base, paymentAmount: 999, monthIndex: 1 })?.amount).toBe(499);
  });

  it("„fără drept” se întoarce ca null, nu ca zero lei", () => {
    expect(earningFor({ ...base, paymentAmount: 0, monthIndex: 1 })).toBeNull();
    expect(earningFor({ ...base, paymentAmount: -100, monthIndex: 1 })).toBeNull();
    expect(earningFor({ ...base, paymentAmount: 1, monthIndex: 1 })).toBeNull(); // 50% din 1 ban = 0
    expect(earningFor({ ...base, monthIndex: 0 })).toBeNull();
    expect(earningFor({ ...base, monthIndex: 1.5 })).toBeNull();
  });
});

describe("aplicarea creditului pe factură", () => {
  it("acoperă integral când ajunge", () => {
    expect(applyCredit(5000, 2490)).toEqual({ creditUsed: 2490, charged: 0, balanceAfter: 2510 });
  });

  it("acoperă parțial când nu ajunge — restul se plătește cu cardul", () => {
    expect(applyCredit(1000, 2490)).toEqual({ creditUsed: 1000, charged: 1490, balanceAfter: 0 });
  });

  it("fără credit, factura se plătește integral", () => {
    expect(applyCredit(0, 2490)).toEqual({ creditUsed: 0, charged: 2490, balanceAfter: 0 });
  });

  it("nu dă rest și nu produce sold negativ", () => {
    const r = applyCredit(2490, 2490);
    expect(r.balanceAfter).toBe(0);
    expect(r.charged).toBe(0);
    expect(applyCredit(-500, 2490).balanceAfter).toBe(0);
  });
});

describe("clawback la refund — cazul de care depinde riscul legal", () => {
  it("creditul neatins se recuperează integral", () => {
    expect(clawbackCredit(2000, 1245)).toEqual({
      fromBalance: 1245, alreadyConsumed: 0, balanceAfter: 755,
    });
  });

  it("creditul deja CONSUMAT nu devine sold negativ — devine datorie explicită", () => {
    const r = clawbackCredit(300, 1245);
    expect(r.fromBalance).toBe(300);
    expect(r.balanceAfter).toBe(0);
    expect(r.alreadyConsumed).toBe(945); // partea cheltuită deja, de decis separat
  });

  it("credit consumat integral → tot cuantumul e datorie, soldul rămâne zero", () => {
    const r = clawbackCredit(0, 1245);
    expect(r).toEqual({ fromBalance: 0, alreadyConsumed: 1245, balanceAfter: 0 });
  });

  it("la bani: ce e în reținere se anulează, ce s-a plătit devine recuperabil", () => {
    expect(clawbackCash({ pendingAmount: 1245, paidAmount: 0, granted: 1245 }))
      .toEqual({ voided: 1245, recoverable: 0 });
    expect(clawbackCash({ pendingAmount: 0, paidAmount: 1245, granted: 1245 }))
      .toEqual({ voided: 0, recoverable: 1245 });
    expect(clawbackCash({ pendingAmount: 500, paidAmount: 745, granted: 1245 }))
      .toEqual({ voided: 500, recoverable: 745 });
  });
});

describe("soldul recalculat din istoric (fold pur)", () => {
  it("povestea completă: trei recomandări, două facturi, un refund", () => {
    const r = foldCreditBalance([
      { kind: "earn", amount: 1245 },
      { kind: "earn", amount: 1245 },
      { kind: "invoice", amount: 2490 },   // acoperit integral
      { kind: "earn", amount: 1245 },
      { kind: "invoice", amount: 2490 },   // 1245 credit + 1245 card
      { kind: "clawback", amount: 1245 },  // refund pe una dintre plăți
    ]);
    expect(r.balance).toBe(0);
    expect(r.charged).toBe(1245);
    expect(r.unrecovered).toBe(1245); // creditul fusese deja consumat
  });

  it("același istoric dă mereu același sold — se poate recalcula, nu ținut într-un contor", () => {
    const ev = [
      { kind: "earn" as const, amount: 1000 },
      { kind: "invoice" as const, amount: 400 },
      { kind: "earn" as const, amount: 500 },
    ];
    expect(foldCreditBalance(ev)).toEqual(foldCreditBalance(ev));
    expect(foldCreditBalance(ev).balance).toBe(1100);
  });

  it("istoric gol = sold zero, nu eroare", () => {
    expect(foldCreditBalance([])).toEqual({ balance: 0, charged: 0, unrecovered: 0 });
  });
});

describe("robustețe la intrare stricată (istoricul va veni din DB/JSON)", () => {
  it("nu aruncă pe null, undefined sau un obiect în loc de tablou", () => {
    const zero = { balance: 0, charged: 0, unrecovered: 0 };
    // @ts-expect-error — exact cazul pe care tipul îl exclude, dar runtime-ul nu
    expect(foldCreditBalance(null)).toEqual(zero);
    // @ts-expect-error — la fel: tipul exclude undefined, runtime-ul îl poate primi
    expect(foldCreditBalance(undefined)).toEqual(zero);
    // @ts-expect-error — un obiect în loc de tablou, cum ar veni dintr-un JSON stricat
    expect(foldCreditBalance({ kind: "earn", amount: 100 })).toEqual(zero);
  });
});
