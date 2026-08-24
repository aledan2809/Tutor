import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CURRICULUM,
  BAND_YEARS,
  SCHOOL_YEARS,
  BAC_MATE_CHAPTERS,
  bandForDomainSlug,
  schoolWeekAt,
  schoolYearStructureAt,
  unitsForStudent,
  expectedByWeek,
  buildChecklist,
  visibleChaptersFromChecklist,
  type CurriculumUnit,
} from "@/lib/curriculum";

// Capitolele TREBUIE să fie exact cele produse de scripts/lib/macro-topic.mjs,
// fiindcă poarta compară cu Question.topic. O divergență de un caracter ar
// bloca tăcut un capitol întreg — de aceea sunt verificate literal.
const MATE_CH = [
  "Numere întregi și operații",
  "Fracții și numere raționale",
  "Rapoarte, proporții și procente",
  "Statistică, medii și probleme practice",
  "Geometrie plană",
  "Numere reale și radicali",
  "Ecuații, inecuații și mulțimi",
  "Geometrie în spațiu",
];
const RO_CH = [
  "Fonetică și ortografie",
  "Vocabular și semantică",
  "Înțelegerea textului",
  "Formarea cuvintelor",
  "Morfologie",
  "Sintaxă",
];

const chaptersOf = (units: readonly CurriculumUnit[]) =>
  [...new Set(units.flatMap((u) => u.chapters))].sort();

describe("integritatea curriculumului", () => {
  it("gimnaziul acoperă exact capitolele reale — nici lipsuri, nici invenții", () => {
    expect(chaptersOf(CURRICULUM["mate-gimnaziu"])).toEqual([...MATE_CH].sort());
    expect(chaptersOf(CURRICULUM["romana-gimnaziu"])).toEqual([...RO_CH].sort());
  });

  it("cheile unităților sunt unice per bandă (sunt chei de stocare)", () => {
    for (const units of Object.values(CURRICULUM)) {
      const keys = units.map((u) => u.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("fiecare unitate are anul în intervalul benzii și săptămâni valide", () => {
    for (const [band, units] of Object.entries(CURRICULUM)) {
      const years = BAND_YEARS[band as keyof typeof BAND_YEARS];
      for (const u of units) {
        expect(years, `${band}/${u.key}`).toContain(u.year);
        if (u.weeks) {
          expect(u.weeks[0], u.key).toBeGreaterThanOrEqual(1);
          expect(u.weeks[1], u.key).toBeGreaterThanOrEqual(u.weeks[0]);
          expect(u.weeks[1], u.key).toBeLessThanOrEqual(36);
        }
      }
    }
  });

  it("clasele VII și VIII de mate au săptămâni reale (au planificare)", () => {
    for (const u of CURRICULUM["mate-gimnaziu"].filter((u) => u.year >= 7)) {
      expect(u.weeks, u.key).not.toBeNull();
    }
  });
});

describe("bandForDomainSlug", () => {
  it("mapează domeniile cu programă", () => {
    expect(bandForDomainSlug("matematica-v-viii")).toBe("mate-gimnaziu");
    expect(bandForDomainSlug("romana-cl-viii")).toBe("romana-gimnaziu");
    expect(bandForDomainSlug("matematica-m1-ix-xii")).toBe("bac-mate");
    expect(bandForDomainSlug("matematica-m2-ix-xii")).toBe("bac-mate");
    expect(bandForDomainSlug("matematica-m3-ix-xii")).toBe("bac-mate");
    expect(bandForDomainSlug("romana-ix-xii")).toBe("bac-romana");
  });

  it("lasă neatinse domeniile fără programă", () => {
    for (const s of ["aviation", "licenta-rares", "aptitudini-aviatie", "", null, undefined]) {
      expect(bandForDomainSlug(s as string)).toBeNull();
    }
  });
});

describe("schoolWeekAt — structura multi-an", () => {
  it("prima zi de școală 2025 = săptămâna 1", () => {
    expect(schoolWeekAt(new Date("2025-09-08T08:00:00+03:00"))).toBe(1);
  });

  it("mijlocul modulului 2 (noiembrie 2025) numără corect de la S8", () => {
    expect(schoolWeekAt(new Date("2025-11-03T10:00:00+02:00"))).toBe(8);
    expect(schoolWeekAt(new Date("2025-11-12T10:00:00+02:00"))).toBe(9);
  });

  it("vacanța de iarnă îngheață la ultima săptămână încheiată", () => {
    expect(schoolWeekAt(new Date("2025-12-28T12:00:00+02:00"))).toBe(14);
  });

  it("modulele care încep joi se ancorează la LUNEA săptămânii (Sigma S16 = 12-16 ian)", () => {
    // Modulul 3 al lui 2025-2026 începe JOI 8 ian; fără ancorare la luni,
    // săptămânile ar fi numărate joi→miercuri și tot restul anului ar fi
    // decalat cu o săptămână față de planificarea reală (finding review).
    expect(schoolWeekAt(new Date("2026-01-08T10:00:00+02:00"))).toBe(15);
    expect(schoolWeekAt(new Date("2026-01-12T10:00:00+02:00"))).toBe(16);
    expect(schoolWeekAt(new Date("2026-01-16T10:00:00+02:00"))).toBe(16);
  });

  it("vara dintre doi ani configurați = 0, nu ultima săptămână a anului vechi", () => {
    // Fix-ul critic din review: pe 24 aug 2026 vechiul cod întorcea 36 și
    // pre-completa integral checklistul noului elev de a VIII-a.
    expect(schoolWeekAt(new Date("2026-08-24T12:00:00+03:00"))).toBe(0);
  });

  it("anul 2026-2027 (OM 3.194/2026): 7 sept = S1, 2 nov = S8", () => {
    expect(schoolWeekAt(new Date("2026-09-07T08:00:00+03:00"))).toBe(1);
    expect(schoolWeekAt(new Date("2026-11-02T08:00:00+02:00"))).toBe(8);
  });

  it("în afara ORICĂRUI an configurat = 0 (fail-closed)", () => {
    expect(schoolWeekAt(new Date("2030-10-01T12:00:00+03:00"))).toBe(0);
    expect(schoolYearStructureAt(new Date("2030-10-01T12:00:00+03:00"))).toBeNull();
  });

  it("structurile sunt cronologice și au etichete distincte", () => {
    const labels = SCHOOL_YEARS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("expectedByWeek — rândul programei", () => {
  const u = (year: number, weeks: readonly [number, number] | null): CurriculumUnit => ({
    key: "t", label: "t", year, weeks, chapters: ["X"],
  });

  it("anii anteriori sunt predați indiferent de săptămână", () => {
    expect(expectedByWeek(u(7, [30, 33]), 8, 0)).toBe(true);
  });

  it("anul curent se deblochează la PRIMA săptămână a unității", () => {
    expect(expectedByWeek(u(8, [15, 20]), 8, 14)).toBe(false);
    expect(expectedByWeek(u(8, [15, 20]), 8, 15)).toBe(true);
  });

  it("anul curent fără săptămâni cunoscute NU se marchează — nu ghicim", () => {
    expect(expectedByWeek(u(6, null), 6, 30)).toBe(false);
  });

  it("anii viitori nu apar niciodată ca predați", () => {
    expect(expectedByWeek(u(8, [2, 7]), 7, 36)).toBe(false);
  });
});

describe("buildChecklist — cele două rânduri în paralel", () => {
  it("elev de a VIII-a în septembrie: anii V-VII bifați, anul curent gol", () => {
    const rows = buildChecklist("mate-gimnaziu", 8, 1);
    const prior = rows.filter((r) => r.unit.year < 8);
    const current = rows.filter((r) => r.unit.year === 8);
    expect(prior.every((r) => r.expectedByNow && r.taught)).toBe(true);
    // S1 < S2 (prima unitate de a VIII-a începe în S2) → nimic din anul curent
    expect(current.every((r) => !r.expectedByNow && !r.taught)).toBe(true);
  });

  it("elev de a VIII-a în S16: ecuațiile de gradul II au intrat în rândul programei", () => {
    const rows = buildChecklist("mate-gimnaziu", 8, 16);
    const gr2 = rows.find((r) => r.unit.key === "viii-ecuatii-gr2")!;
    const rotunde = rows.find((r) => r.unit.key === "viii-rotunde")!;
    expect(gr2.expectedByNow).toBe(true);
    expect(rotunde.expectedByNow).toBe(false); // S29-S32, încă nu
  });

  it("bifele elevului bat programa în AMBELE direcții (rândul 2 comandă)", () => {
    const overrides = new Map<string, boolean>([
      ["viii-ecuatii-gr2", false], // profesorul e în urmă
      ["viii-rotunde", true], // predat în avans
    ]);
    const rows = buildChecklist("mate-gimnaziu", 8, 16, overrides);
    expect(rows.find((r) => r.unit.key === "viii-ecuatii-gr2")!.taught).toBe(false);
    expect(rows.find((r) => r.unit.key === "viii-rotunde")!.taught).toBe(true);
    // rândul 1 rămâne netulburat — e informativ
    expect(rows.find((r) => r.unit.key === "viii-ecuatii-gr2")!.expectedByNow).toBe(true);
  });

  it("elev de a VI-a nu vede unitățile claselor VII-VIII", () => {
    const rows = buildChecklist("mate-gimnaziu", 6, 10);
    expect(rows.every((r) => r.unit.year <= 6)).toBe(true);
  });

  it("elev de a XII-a la BAC: totul e an anterior → pre-bifat integral", () => {
    const rows = buildChecklist("bac-mate", 12, 1);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.taught)).toBe(true);
  });

  it("elev de a IX-a la BAC: unitățile EXISTĂ (nu listă goală) și nimic nu e pre-bifat", () => {
    // Non-vacuous: prima versiune trecea pe [] (every() e adevărat pe gol) și
    // ascundea un lockout total al elevului de a IX-a (finding review).
    const rows = buildChecklist("bac-mate", 9, 20);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => !r.taught)).toBe(true);
  });

  it("unitsForStudent nu întoarce gol pentru niciun an valid al vreunei benzi", () => {
    for (const [band, years] of Object.entries(BAND_YEARS)) {
      for (const y of years) {
        expect(
          unitsForStudent(band as keyof typeof BAND_YEARS, y).length,
          `${band}/${y}`
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe("visibleChaptersFromChecklist — bazinul", () => {
  it("un capitol devine vizibil la prima unitate bifată care îl atinge", () => {
    // viii-poliedre poartă capitolul; viii-corpuri-intro deliberat NU (e doar
    // reprezentare — vezi testul dedicat de mai jos).
    const rows = buildChecklist("mate-gimnaziu", 8, 1, new Map([["viii-poliedre", true]]));
    const visible = visibleChaptersFromChecklist(rows);
    expect(visible).toContain("Geometrie în spațiu");
  });

  it("fără nicio bifă, nimic nu e vizibil — poarta e închisă implicit", () => {
    const rows = buildChecklist("mate-gimnaziu", 5, 0);
    expect(visibleChaptersFromChecklist(rows)).toEqual([]);
  });

  it("elevul de a VIII-a în septembrie NU vede Geometrie în spațiu", () => {
    const rows = buildChecklist("mate-gimnaziu", 8, 1);
    const visible = visibleChaptersFromChecklist(rows);
    expect(visible).not.toContain("Geometrie în spațiu");
    expect(visible).toContain("Geometrie plană"); // predată din anii anteriori
  });

  it("unitatea de REPREZENTARE a corpurilor (S2-S7) nu deblochează capitolul de calcul", () => {
    // Grilele din "Geometrie în spațiu" sunt arii/volume/unghiuri; a le
    // deschide în S2 pe baza lecției de reprezentare ar reintroduce exact
    // problema-țintă (finding review).
    const rows = buildChecklist("mate-gimnaziu", 8, 7);
    expect(visibleChaptersFromChecklist(rows)).not.toContain("Geometrie în spațiu");
  });
});

describe("BAC — sincronizarea cu banca reală", () => {
  // Sursa care scrie Question.topic sunt scripturile de import; lista din
  // curriculum TREBUIE să le acopere integral. Prima versiune, transcrisă
  // dintr-o agregare trunchiată, pierdea 25 din 46 de topicuri — grile
  // permanent invizibile pentru orice elev (finding review 2026-08-24).
  it("capitolele BAC mate acoperă exact topicurile din importere", () => {
    const root = join(__dirname, "..", "..");
    const topics = new Set<string>();
    for (const f of [
      "scripts/import-grile-bac-matematica-m1.mjs",
      "scripts/import-grile-bac-matematica-m2.mjs",
      "scripts/import-grile-bac-matematica-m3.mjs",
    ]) {
      const src = readFileSync(join(root, f), "utf-8");
      for (const m of src.matchAll(/topic: "([^"]+)"/g)) topics.add(m[1]);
    }
    expect(topics.size).toBeGreaterThan(0);
    expect([...topics].sort()).toEqual([...BAC_MATE_CHAPTERS].sort());
  });

  it("cheile de unitate generate din capitole nu colizionează", () => {
    // unitKey e cheie unică în DB — două capitole care ar slugifica identic
    // s-ar contopi tăcut sub constraintul unic (finding review).
    for (const band of ["bac-mate", "bac-romana"] as const) {
      const keys = CURRICULUM[band].map((u) => u.key);
      expect(new Set(keys).size, band).toBe(keys.length);
    }
  });
});
