import { describe, expect, it } from "vitest";
import { CACHE_PROASPAT_MS, stareCachePdf } from "@/lib/posta-pdf-cache";

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
