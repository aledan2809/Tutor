import { describe, expect, it } from "vitest";
import {
  PUNCTE_PRIMA,
  PUNCTE_RAPID,
  PUNCTE_RECUPERARE,
  PUNCTE_REPETITIE,
  calculeazaPuncte,
  rezumaModul,
  type IstoricIntrebare,
} from "@/lib/scor-reluare";

const nou: IstoricIntrebare = { incercariAnterioare: 0, aFostCorectVreodata: false, repetitiiAzi: 0 };
const gresitInainte: IstoricIntrebare = { incercariAnterioare: 1, aFostCorectVreodata: false, repetitiiAzi: 0 };
const stiutDeja = (repetitiiAzi = 0): IstoricIntrebare => ({
  incercariAnterioare: 1,
  aFostCorectVreodata: true,
  repetitiiAzi,
});

describe("calculeazaPuncte", () => {
  it("greșit nu aduce nimic, oricâte încercări ar fi", () => {
    for (const ist of [nou, gresitInainte, stiutDeja()]) {
      expect(calculeazaPuncte(false, false, ist).puncte).toBe(0);
    }
  });

  it("corect din prima: 10, plus 5 dacă a fost rapid", () => {
    expect(calculeazaPuncte(true, false, nou)).toMatchObject({ puncte: PUNCTE_PRIMA, fel: "prima" });
    expect(calculeazaPuncte(true, true, nou).puncte).toBe(PUNCTE_PRIMA + PUNCTE_RAPID);
  });

  it("greșit → corect aduce 7 — comportamentul de susținut", () => {
    expect(calculeazaPuncte(true, false, gresitInainte)).toMatchObject({
      puncte: PUNCTE_RECUPERARE,
      fel: "recuperare",
    });
  });

  it("recuperarea NU depășește niciodată răspunsul din prima", () => {
    // Dacă ar depăși, greșeala intenționată ar deveni strategie.
    const dinPrima = calculeazaPuncte(true, false, nou).puncte;
    const recuperare = calculeazaPuncte(true, false, gresitInainte).puncte;
    expect(recuperare).toBeLessThan(dinPrima);
  });

  it("bonusul de viteză NU se dă la reluări", () => {
    // Altfel repetarea rapidă ar fi a doua cale de măcinare: 15 puncte de fiecare dată.
    expect(calculeazaPuncte(true, true, gresitInainte).puncte).toBe(PUNCTE_RECUPERARE);
    expect(calculeazaPuncte(true, true, stiutDeja(0)).puncte).toBe(PUNCTE_REPETITIE[0]);
  });

  it("exersarea scade: 3, 2, 1, apoi zero", () => {
    expect(calculeazaPuncte(true, false, stiutDeja(0)).puncte).toBe(3);
    expect(calculeazaPuncte(true, false, stiutDeja(1)).puncte).toBe(2);
    expect(calculeazaPuncte(true, false, stiutDeja(2)).puncte).toBe(1);
    expect(calculeazaPuncte(true, false, stiutDeja(3))).toMatchObject({ puncte: 0, fel: "peste-plafon" });
    expect(calculeazaPuncte(true, false, stiutDeja(50)).puncte).toBe(0);
  });

  it("plafonul zilnic ESTE lungimea secvenței — nu se pot desincroniza", () => {
    // Prima variantă avea plafon 2 peste secvența 2-1-0, deci ridicarea plafonului la 3
    // n-ar fi schimbat nimic: a treia repetiție valora deja zero. Legându-le, nu se
    // poate întâmpla din nou.
    const total = PUNCTE_REPETITIE.reduce((a, b) => a + b, 0);
    let acumulat = 0;
    for (let i = 0; i < PUNCTE_REPETITIE.length + 3; i++) {
      acumulat += calculeazaPuncte(true, false, stiutDeja(i)).puncte;
    }
    expect(acumulat).toBe(total);
    expect(PUNCTE_REPETITIE.at(-1)).toBeGreaterThan(0);
  });
});

describe("cele șase cazuri arătate userului — modul de 4 întrebări", () => {
  /** Punctele unui om, dat fiind câte a știut din prima și câte a recuperat. */
  function totalModul(dinPrima: number, recuperate: number, repetariPeIntrebare = 0) {
    let t = dinPrima * calculeazaPuncte(true, false, nou).puncte;
    t += recuperate * calculeazaPuncte(true, false, gresitInainte).puncte;
    const stapanite = dinPrima + recuperate;
    for (let i = 0; i < repetariPeIntrebare; i++) {
      t += stapanite * calculeazaPuncte(true, false, stiutDeja(i)).puncte;
    }
    return t;
  }

  it("dă exact cifrele din tabelul arătat", () => {
    expect(totalModul(4, 0)).toBe(40); // A. știe din prima
    expect(totalModul(2, 2)).toBe(34); // B. 2/4, apoi le învață
    expect(totalModul(1, 3)).toBe(31); // C. 1/4, apoi le învață
    expect(totalModul(2, 0)).toBe(20); // D. 2/4 și se oprește
    expect(totalModul(4, 0, 9)).toBe(64); // E. macină de 9 ori — plafonat
    expect(totalModul(0, 4)).toBe(28); // F. greșește tot, apoi învață tot
  });

  it("cine se întoarce bate pe cine se oprește, la aceleași răspunsuri din prima", () => {
    // B și D au amândoi 2 corecte din prima. Diferența e strict determinarea.
    expect(totalModul(2, 2)).toBeGreaterThan(totalModul(2, 0));
  });

  it("cine știe din prima rămâne peste cine recuperează", () => {
    expect(totalModul(4, 0)).toBeGreaterThan(totalModul(2, 2));
    expect(totalModul(2, 2)).toBeGreaterThan(totalModul(1, 3));
  });

  it("măcinarea e mărginită: 64, nu 400", () => {
    expect(totalModul(4, 0, 9)).toBe(64);
    expect(totalModul(4, 0, 100)).toBe(64); // oricât ar repeta
  });
});

describe("rezumaModul — ce vede managerul", () => {
  const inc = (q: string, ok: boolean, min: number) => ({
    questionId: q,
    isCorrect: ok,
    createdAt: new Date(2026, 0, 1, 10, min),
  });

  it("cazul cerut de user: 2/4, apoi le învață pe cele două greșite", () => {
    const r = rezumaModul([
      inc("q1", true, 0), inc("q2", true, 1), inc("q3", false, 2), inc("q4", false, 3),
      inc("q3", true, 40), inc("q4", true, 41),
    ]);
    // Vechiul tablou ar fi arătat 4/6 = 67%.
    expect(r).toEqual({ stieAcum: 4, atinse: 4, dinPrima: 2, recuperari: 2, incaGresite: 0 });
  });

  it("«din prima» înseamnă prima ÎN TIMP, nu prima din listă", () => {
    // Lista vine în ordine amestecată: reluarea corectă e scrisă înaintea greșelii.
    const r = rezumaModul([inc("q1", true, 40), inc("q1", false, 2)]);
    expect(r).toMatchObject({ dinPrima: 0, recuperari: 1, stieAcum: 1 });
  });

  it("cine se oprește la 2/4 nu apare cu recuperări", () => {
    const r = rezumaModul([
      inc("q1", true, 0), inc("q2", true, 1), inc("q3", false, 2), inc("q4", false, 3),
    ]);
    expect(r).toEqual({ stieAcum: 2, atinse: 4, dinPrima: 2, recuperari: 0, incaGresite: 2 });
  });

  it("mai multe încercări greșite pe aceeași întrebare rămân O recuperare", () => {
    const r = rezumaModul([
      inc("q1", false, 0), inc("q1", false, 5), inc("q1", false, 9), inc("q1", true, 30),
    ]);
    expect(r).toMatchObject({ stieAcum: 1, recuperari: 1, atinse: 1 });
  });

  it("exersarea după ce știi nu schimbă niciun număr", () => {
    const fara = rezumaModul([inc("q1", true, 0)]);
    const cu = rezumaModul([inc("q1", true, 0), inc("q1", true, 10), inc("q1", true, 20)]);
    expect(cu).toEqual(fara);
  });

  it("listă goală nu împarte la zero", () => {
    expect(rezumaModul([])).toEqual({ stieAcum: 0, atinse: 0, dinPrima: 0, recuperari: 0, incaGresite: 0 });
  });
});
