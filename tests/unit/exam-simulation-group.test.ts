import { describe, it, expect } from "vitest";
import { simulationGroupKeyFor, stripLevelSuffix } from "@/lib/exam-level";

// The groups as on production (14.10.2026): ExamPaper (examType, subjectName).
const PAPERS: [string, string][] = [
  ["EN_VIII", "Matematică"],
  ["EN_VIII", "Limba și literatura română"],
  ["BAC", "Matematică M1 (Mate-Info)"],
  ["BAC", "Matematică M2 (Științele naturii)"],
  ["BAC", "Matematică M3 (Tehnologic)"],
  ["BAC", "Limba și literatura română"],
];
const groups = PAPERS.map(([level, subject]) => ({ key: `${level}::${subject}`, level, subjectDisplay: stripLevelSuffix(subject) }));

describe("simulationGroupKeyFor — the Simulări of a subject", () => {
  it("matematica cl. VIII → Matematică, Evaluarea Națională (diacritics ignored)", () => {
    expect(simulationGroupKeyFor({ slug: "matematica-v-viii", name: "Matematica cl. VIII" }, groups)).toBe("EN_VIII::Matematică");
  });
  it("română: the subject is contained in „Limba și literatura română”, at the right level", () => {
    expect(simulationGroupKeyFor({ slug: "romana-cl-viii", name: "Română cl. VIII" }, groups)).toBe("EN_VIII::Limba și literatura română");
    expect(simulationGroupKeyFor({ slug: "romana-ix-xii", name: "Română IX-XII" }, groups)).toBe("BAC::Limba și literatura română");
  });
  it("Bac M1/M2/M3 → exactly their own paper", () => {
    expect(simulationGroupKeyFor({ slug: "matematica-m2-ix-xii", name: "Matematică M2 (Științele naturii) — Bacalaureat" }, groups)).toBe("BAC::Matematică M2 (Științele naturii)");
  });
  it("a general Bac subject preselects the first Bac mathematics paper, never an EN VIII one", () => {
    expect(simulationGroupKeyFor({ slug: "matematica-ix-xii", name: "Matematica IX-XII" }, groups)).toBe("BAC::Matematică M1 (Mate-Info)");
  });
  it("the level decides: a Bac subject never gets an EN VIII paper of the same name", () => {
    const onlyEn = groups.filter((g) => g.level === "EN_VIII");
    expect(simulationGroupKeyFor({ slug: "romana-ix-xii", name: "Română IX-XII" }, onlyEn)).toBeNull();
  });
  it("whole words only: a short or partial name is not a match; „Limba română” is", () => {
    expect(simulationGroupKeyFor({ slug: "info-ix-xii", name: "Info IX-XII" }, groups)).toBeNull();
    expect(simulationGroupKeyFor({ slug: "ro-ix-xii", name: "RO IX-XII" }, groups)).toBeNull();
    expect(simulationGroupKeyFor({ slug: "limba-romana-ix-xii", name: "Limba română IX-XII" }, groups)).toBe("BAC::Limba și literatura română");
  });
  it("an empty paper name never matches", () => {
    expect(simulationGroupKeyFor({ slug: "romana-cl-viii", name: "Română cl. VIII" }, [{ key: "EN_VIII::", level: "EN_VIII", subjectDisplay: "" }])).toBeNull();
  });
  it("no exam level (aviation, a course) or no papers → null", () => {
    expect(simulationGroupKeyFor({ slug: "aptitudini-aviatie-extins", name: "Aptitudini Aviație — Set extins" }, groups)).toBeNull();
    expect(simulationGroupKeyFor({ slug: "biologie-v-viii", name: "Biologie cl. VIII" }, groups)).toBeNull();
    expect(simulationGroupKeyFor({ slug: "matematica-v-viii", name: "Matematica cl. VIII" }, [])).toBeNull();
  });
});
