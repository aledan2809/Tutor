import { describe, it, expect } from "vitest";
import { packagePrice } from "@/lib/package-price";

// Prices as /api/plans sends them: major units. The annual row is stored at ten months.
const family = { price: 33.2, interval: "MONTH" as const, familyPlanKey: "FAMILY", maxParents: 1, maxChildren: 1, maxTutors: 0 };
const familyYear = { ...family, price: 332, interval: "YEAR" as const };
const elev = { price: 26.53, interval: "MONTH" as const, familyPlanKey: "ELEV", maxParents: 0, maxChildren: 0, maxTutors: 0 };

const trialTelegram = { trialActive: true, telegram: true };

describe("prețul unui pachet, cum îl arată paginile (aceleași reguli ca plata)", () => {
  it("Family în probă, cu Telegram, o materie: 20,92 în loc de 33,20", () => {
    const p = packagePrice(family, trialTelegram, null);
    expect(p).toMatchObject({ subjects: 1, total: 2092, normal: 3320, first: 2092 });
    expect(p.discount.base).toBe("trial");
  });

  it("trei materii ale copilului: 20,92 + 17,78 + 15,69, din 33,20 + 28,22 + 24,90", () => {
    const p = packagePrice(family, { ...trialTelegram, subjects: { self: 1, child: { count: 3 } } }, null);
    expect(p.total).toBe(2092 + 1778 + 1569);
    expect(p.normal).toBe(3320 + 2822 + 2490);
  });

  it("Elev numără materiile elevului, un pachet de familie pe ale copilului", () => {
    const subjects = { self: 2, child: { count: 3 } };
    expect(packagePrice(elev, { trialActive: false, telegram: false, subjects }, null).subjects).toBe(2);
    expect(packagePrice(family, { trialActive: false, telegram: false, subjects }, null).subjects).toBe(3);
    // Nothing known yet: the price covers the first subject.
    expect(packagePrice(family, { trialActive: false, telegram: false }, null).subjects).toBe(1);
  });

  it("anual = zece luni din prețul lunar cu reduceri: 209,20", () => {
    expect(packagePrice(familyYear, trialTelegram, null)).toMatchObject({ total: 20920, first: 20920, normal: 33200 });
  });

  it("un cod care se reînnoiește (V126S) după probă, cu Telegram: 22,41 pe viață", () => {
    const p = packagePrice(family, { trialActive: false, telegram: true }, { planKey: "FAMILY", discountPercent: 25, recurring: true });
    expect(p).toMatchObject({ total: 2241, first: 2241 });
    expect(p.discount.codeUsed).toBe(true);
  });

  it("un cod care nu se reînnoiește și bate proba: doar prima plată, prețul rămâne cu Telegram", () => {
    const p = packagePrice(family, trialTelegram, { planKey: null, discountPercent: 50, recurring: false });
    expect(p).toMatchObject({ total: 2988, first: 1494 });
    expect(p.discount.base).toBe("code");
  });

  it("un cod pentru alt pachet nu se aplică: rămâne oferta din probă", () => {
    const p = packagePrice(family, trialTelegram, { planKey: "ELEV", discountPercent: 50, recurring: true });
    expect(p.discount.codeUsed).toBe(false);
    expect(p.total).toBe(2092);
  });

  it("un abonament plătit cu cardul păstrează reducerea lui: nici codul, nici regulile de azi", () => {
    // Plătit în probă, fără Telegram: −30% pe viață → 23,24, deși azi nu mai e în probă și are un cod.
    const p = packagePrice(
      family,
      { trialActive: false, telegram: true, locked: { percent: 30, base: "trial", telegram: false } },
      { planKey: null, discountPercent: 25, recurring: true },
    );
    expect(p).toMatchObject({ total: 2324, first: 2324, normal: 3320 });
    expect(p.discount).toMatchObject({ base: "trial", telegram: false, codeUsed: false, onceCouponPercent: null });
  });

  it("un pachet cu plată unică e o singură plată, oricâte materii", () => {
    const once = { ...family, interval: "ONE_TIME" as const, price: 99 };
    const p = packagePrice(once, { trialActive: false, telegram: false, subjects: { self: 3, child: { count: 3 } } }, null);
    expect(p).toMatchObject({ subjects: 1, total: 9900 });
  });
});
