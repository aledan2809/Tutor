import { describe, expect, it } from "vitest";
import { CACHE_PROASPAT_MS, MARIME_MINIMA_VALIDA_BYTES, esteContinutPdfValid, stareCachePdf } from "@/lib/posta-pdf-cache";

describe("stareCachePdf — ce facem cu PDF-ul din cache", () => {
  const acum = 1_000_000_000;

  it("un fișier mai nou decât pragul e proaspăt (se servește, nu se regenerează)", () => {
    expect(stareCachePdf(acum - CACHE_PROASPAT_MS + 1, acum)).toBe("proaspat");
  });

  it("un fișier mai vechi decât pragul e vechi: se servește PE LOC și se regenerează în fundal", () => {
    expect(stareCachePdf(acum - CACHE_PROASPAT_MS, acum)).toBe("vechi");
    expect(stareCachePdf(acum - 30 * 24 * 3600 * 1000, acum)).toBe("vechi");
  });

  it("fără fișier, sau cu fișier gol, nu avem ce servi: se generează și se așteaptă", () => {
    expect(stareCachePdf(null, acum)).toBe("lipsa");
    expect(stareCachePdf(undefined, acum)).toBe("lipsa");
    expect(stareCachePdf(acum - 1000, acum, 0)).toBe("lipsa");
    expect(stareCachePdf(Number.NaN, acum)).toBe("lipsa");
  });
});

describe("esteContinutPdfValid — prinde un about:blank tipărit de Chromium", () => {
  it("un fișier cât prezentarea reală (~230 KB) e valid", () => {
    expect(esteContinutPdfValid(231_714)).toBe(true);
  });

  it("856 octeți (cazul măsurat: 1 pagină goală, about:blank) NU e valid", () => {
    expect(esteContinutPdfValid(856)).toBe(false);
  });

  it("pragul însuși nu e valid; imediat peste, da", () => {
    expect(esteContinutPdfValid(MARIME_MINIMA_VALIDA_BYTES)).toBe(true);
    expect(esteContinutPdfValid(MARIME_MINIMA_VALIDA_BYTES - 1)).toBe(false);
  });

  it("valori nefinite nu sunt valide", () => {
    expect(esteContinutPdfValid(Number.NaN)).toBe(false);
    expect(esteContinutPdfValid(Number.POSITIVE_INFINITY)).toBe(false);
    expect(esteContinutPdfValid(-1)).toBe(false);
  });
});
