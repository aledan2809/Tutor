import { describe, it, expect } from "vitest";
import {
  measureGuessBaseline,
  describeGuessBaseline,
  clauseCount,
  upperTail,
  GUESS_ALARM_P,
} from "@/lib/guess-baseline";

// Un lot curat: variante paralele ca formă, corecta rotită pe toate pozițiile.
function cleanBatch() {
  const items = [];
  const bodies = [
    ["Extras de carte funciară", "Certificat de urbanism", "Certificat fiscal", "Adeverință de vecinătate"],
    ["Comisionul se plătește la semnare", "Comisionul se plătește la promisiune", "Comisionul se plătește la vizionare", "Comisionul se plătește la listare"],
  ];
  for (let i = 0; i < 40; i++) {
    const opts = [...bodies[i % 2]];
    items.push({ options: opts, correctAnswer: opts[i % 4] });
  }
  return items;
}

describe("clauseCount — aproximarea numărului de propoziții", () => {
  it("numără virgulele și conjuncțiile, nu doar caracterele", () => {
    expect(clauseCount("Un lucru simplu")).toBe(1);
    expect(clauseCount("Acces la cumpărători, un preț apărat și un dosar complet")).toBe(3);
    expect(clauseCount("Documentul care ajunge la notar, dacă e complet")).toBe(3);
  });
});

describe("upperTail — pragul statistic", () => {
  it("un scor la nivelul întâmplării nu e semnificativ", () => {
    expect(upperTail(15, 60, 0.25)).toBeGreaterThan(0.3);
  });
  it("un scor mult peste întâmplare e semnificativ", () => {
    expect(upperTail(31, 62, 0.25)).toBeLessThan(0.001);
  });
  it("nu depășește 1 și nu scade sub 0", () => {
    expect(upperTail(0, 10, 0.25)).toBeCloseTo(1, 5);
    expect(upperTail(10, 10, 0.25)).toBeGreaterThan(0);
  });
});

describe("measureGuessBaseline — prinde scurgerea în ORICE unitate, nu doar în cea căutată", () => {
  it("un lot curat nu declanșează alarma", () => {
    const b = measureGuessBaseline(cleanBatch());
    expect(b.n).toBe(40);
    expect(b.chance).toBeCloseTo(0.25, 5);
    expect(b.best!.pValue).toBeGreaterThan(GUESS_ALARM_P);
    expect(describeGuessBaseline(b)).toContain("nivelul întâmplării");
  });

  it("prinde scurgerea prin PROPOZIȚII chiar când caracterele sunt echilibrate", () => {
    // Exact forma pe care a luat-o defectul real: distractorii umpluți la aceeași
    // lungime în caractere, dar corecta e singura frază compusă.
    const items = Array.from({ length: 40 }, (_, i) => {
      const correct = "Acces la cumpărători, un preț apărat și un dosar care ajunge complet";
      const filler = [
        "Promovarea intensivă pe portalurile imobiliare naționale specializate",
        "Redactarea documentației cadastrale pentru intabularea proprietății",
        "Estimarea valorii comparative folosind tranzacțiile recente locale",
      ];
      const options = [...filler];
      options.splice(i % 4, 0, correct);
      return { options, correctAnswer: correct };
    });
    const b = measureGuessBaseline(items);
    const clauses = b.scores.find((s) => s.name === "cele mai multe propoziții")!;
    expect(clauses.rate).toBeGreaterThan(0.9);
    expect(clauses.pValue).toBeLessThan(GUESS_ALARM_P);
    // ...iar caracterele NU o prind — motivul pentru care măsurăm familia.
    const chars = b.scores.find((s) => s.name === "cea mai lungă variantă (caractere)")!;
    expect(chars.rate).toBeLessThan(0.9);
    expect(describeGuessBaseline(b)).toContain("⚠️");
  });

  it("prinde regresia de poziție dacă amestecarea se strică vreodată", () => {
    const items = Array.from({ length: 40 }, () => {
      const options = ["corecta", "alta una", "alta doua", "alta trei"];
      return { options, correctAnswer: "corecta" };
    });
    const b = measureGuessBaseline(items);
    const pos1 = b.scores.find((s) => s.name === "mereu poziția 1")!;
    expect(pos1.rate).toBe(1);
    expect(pos1.pValue).toBeLessThan(GUESS_ALARM_P);
  });

  it("ignoră itemii cu cheia lipsă din variante, în loc să-i numere greșit", () => {
    const b = measureGuessBaseline([
      { options: ["a", "b", "c", "d"], correctAnswer: "z" },
      { options: ["a", "b", "c", "d"], correctAnswer: "a" },
    ]);
    expect(b.n).toBe(1);
  });

  it("nu se prăbușește pe lot gol", () => {
    const b = measureGuessBaseline([]);
    expect(b.n).toBe(0);
    expect(describeGuessBaseline(b)).toContain("Prea puține");
  });
});
