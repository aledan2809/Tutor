import { describe, it, expect } from "vitest";
// Plain .mjs shared with the seed script that runs on the VPS (same pattern as reclassify-rule).
import { genSeries, genNumerical, genHeading, genAttitude, validateItem, rng } from "../../scripts/lib/aptitudini-extins-gen.mjs";
import { parseInstrument } from "@/lib/flight-instrument-marker";

describe("Aptitudini — set extins: fiecare exercițiu e curat", () => {
  it("5000 de serii: 5 variante distincte, răspunsul printre ele", () => {
    const r = rng(1);
    for (let i = 0; i < 5000; i++) {
      const q = genSeries(r);
      expect(validateItem(q), `${q.ref} ${q.content} ${q.options}`).toBeNull();
    }
  });

  it("5000 de probleme numerice: la fel", () => {
    const r = rng(2);
    for (let i = 0; i < 5000; i++) {
      const q = genNumerical(r);
      expect(validateItem(q), `${q.ref} ${q.content} ${q.options}`).toBeNull();
    }
  });

  it("răspunsul unei serii chiar continuă regula (pas constant recalculat)", () => {
    const r = rng(3);
    let checked = 0;
    for (let i = 0; i < 2000 && checked < 50; i++) {
      const q = genSeries(r);
      if (!q.ref.endsWith("pas constant")) continue;
      const nums = q.content.split("\n")[1].split(",").map((x: string) => x.trim()).filter((x: string) => x !== "?").map(Number);
      const d = nums[1] - nums[0];
      expect(Number(q.correctAnswer)).toBe(nums[nums.length - 1] + d);
      checked++;
    }
    expect(checked).toBeGreaterThan(10);
  });

  it("gradul de ocupare: răspunsul = pasageri / locuri", () => {
    const r = rng(4);
    let checked = 0;
    for (let i = 0; i < 2000 && checked < 30; i++) {
      const q = genNumerical(r);
      if (!q.ref.endsWith("grad de ocupare")) continue;
      const [seats, pax] = (q.content.match(/\d+/g) ?? []).map(Number);
      expect(q.correctAnswer).toBe(`${(pax / seats) * 100}%`);
      checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });

  it("aceeași sămânță → aceleași exerciții (rulare reproductibilă)", () => {
    expect(genSeries(rng(7))).toEqual(genSeries(rng(7)));
  });

  it("busola: 5 variante curate, marcajul se citește, răspunsul = direcția din marcaj", () => {
    const r = rng(11);
    for (let i = 0; i < 3000; i++) {
      const q = genHeading(r);
      expect(validateItem(q), `${q.passage} ${q.options}`).toBeNull();
      const ins = parseInstrument(q.passage);
      expect(ins?.kind).toBe("heading");
      if (ins?.kind === "heading") expect(q.correctAnswer).toBe(`${String(ins.heading).padStart(3, "0")}°`);
    }
  });

  it("orizontul: 5 variante curate, marcajul se citește, direcția înclinării e cea din marcaj", () => {
    const r = rng(12);
    for (let i = 0; i < 3000; i++) {
      const q = genAttitude(r);
      expect(validateItem(q), `${q.passage} ${q.options}`).toBeNull();
      const ins = parseInstrument(q.passage);
      expect(ins?.kind).toBe("attitude");
      if (ins?.kind === "attitude" && ins.bank !== 0) {
        expect(q.correctAnswer).toContain(ins.bank > 0 ? "la dreapta" : "la stânga");
      }
    }
  });
});
