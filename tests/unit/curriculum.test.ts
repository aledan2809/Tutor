import { describe, it, expect } from "vitest";
import {
  CHAPTER_YEAR,
  bandForDomainSlug,
  chapterYear,
  chaptersForBand,
  defaultCoveredChapters,
  visibleChapters,
} from "@/lib/curriculum";

// Capitolele TREBUIE să fie exact cele produse de scripts/lib/macro-topic.mjs,
// fiindcă poarta compară cu Question.topic. O divergență de un caracter ar
// bloca tăcut un capitol întreg — de aceea sunt verificate literal.
const MATE = [
  "Numere întregi și operații",
  "Fracții și numere raționale",
  "Rapoarte, proporții și procente",
  "Statistică, medii și probleme practice",
  "Geometrie plană",
  "Numere reale și radicali",
  "Ecuații, inecuații și mulțimi",
  "Geometrie în spațiu",
];
const RO = [
  "Fonetică și ortografie",
  "Vocabular și semantică",
  "Înțelegerea textului",
  "Formarea cuvintelor",
  "Morfologie",
  "Sintaxă",
];

describe("capitolele mapate", () => {
  it("acoperă exact capitolele reale, fără lipsuri și fără invenții", () => {
    expect(Object.keys(CHAPTER_YEAR["mate-gimnaziu"]).sort()).toEqual([...MATE].sort());
    expect(Object.keys(CHAPTER_YEAR["romana-gimnaziu"]).sort()).toEqual([...RO].sort());
  });

  it("dă fiecărui capitol un an din gimnaziu", () => {
    for (const band of ["mate-gimnaziu", "romana-gimnaziu"] as const) {
      for (const [cap, an] of Object.entries(CHAPTER_YEAR[band])) {
        expect(an, cap).toBeGreaterThanOrEqual(5);
        expect(an, cap).toBeLessThanOrEqual(8);
      }
    }
  });
});

describe("bandForDomainSlug", () => {
  it("recunoaște cele două domenii sub programă", () => {
    expect(bandForDomainSlug("matematica-v-viii")).toBe("mate-gimnaziu");
    expect(bandForDomainSlug("romana-cl-viii")).toBe("romana-gimnaziu");
  });

  it("lasă neatinse domeniile din afara programei", () => {
    // Aviație, licență, drept: fără poartă — bazinul rămâne întreg.
    for (const s of ["aviation", "licenta-rares", "drept-penal-si-procedura-penala", "", null, undefined]) {
      expect(bandForDomainSlug(s as string)).toBeNull();
    }
  });
});

describe("chapterYear", () => {
  it("citește anul capitolului", () => {
    expect(chapterYear("mate-gimnaziu", "Geometrie în spațiu")).toBe(8);
    expect(chapterYear("romana-gimnaziu", "Sintaxă")).toBe(7);
  });

  it("returnează null pentru capitole necunoscute, nu un an ghicit", () => {
    expect(chapterYear("mate-gimnaziu", "Trigonometrie")).toBeNull();
    expect(chapterYear("mate-gimnaziu", "geometrie în spațiu")).toBeNull(); // majuscule contează
    expect(chapterYear("mate-gimnaziu", null)).toBeNull();
  });
});

describe("chaptersForBand", () => {
  it("ordonează pe an, apoi alfabetic românește", () => {
    const ani = chaptersForBand("mate-gimnaziu").map((c) => c.year);
    expect(ani).toEqual([...ani].sort((a, b) => a - b));
    expect(chaptersForBand("mate-gimnaziu")).toHaveLength(MATE.length);
  });
});

describe("defaultCoveredChapters", () => {
  it("deschide anii anteriori, dar NU anul curent", () => {
    const covered = defaultCoveredChapters("mate-gimnaziu", 8);
    expect(covered).toContain("Geometrie plană"); // cl. VI
    expect(covered).toContain("Numere reale și radicali"); // cl. VII
    expect(covered).not.toContain("Geometrie în spațiu"); // cl. VIII = anul curent
  });

  it("elevul care intră în clasa a V-a nu are nimic parcurs", () => {
    expect(defaultCoveredChapters("mate-gimnaziu", 5)).toEqual([]);
  });

  it("nu ghicește când clasa lipsește sau e absurdă", () => {
    for (const y of [null, undefined, NaN, Infinity]) {
      expect(defaultCoveredChapters("mate-gimnaziu", y as number)).toEqual([]);
    }
  });
});

describe("visibleChapters", () => {
  it("ignoră bifele rămase pentru capitole scoase din programă", () => {
    const v = visibleChapters("mate-gimnaziu", ["Geometrie plană", "Capitol inventat"]);
    expect(v).toEqual(["Geometrie plană"]);
  });

  it("deduplică bifele repetate", () => {
    expect(visibleChapters("romana-gimnaziu", ["Sintaxă", "Sintaxă"])).toEqual(["Sintaxă"]);
  });

  it("fără bife, nimic nu e vizibil — poarta e închisă implicit", () => {
    expect(visibleChapters("mate-gimnaziu", [])).toEqual([]);
  });
});
