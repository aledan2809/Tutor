import { describe, expect, it } from "vitest";
import {
  agregaGreseliPeModul,
  procentGreseli,
  type IncercareRoster,
  type ModulRoster,
} from "@/lib/roster-aggregate";

const M: ModulRoster[] = [
  { id: "m1", order: 1, title: "Prima încercare", questionTopic: "Prima încercare" },
  { id: "m2", order: 2, title: "Banii și dovada", questionTopic: "Banii și dovada" },
  { id: "m3", order: 3, title: "Omul de la ușă", questionTopic: "Omul de la ușă" },
  { id: "m4", order: 4, title: "Fără test", questionTopic: null },
];

const inc = (userId: string, topic: string | null, isCorrect: boolean): IncercareRoster => ({
  userId,
  topic,
  isCorrect,
});

describe("agregaGreseliPeModul", () => {
  it("numără încercările, nu oamenii, și ține minte câți oameni au ajuns", () => {
    // un om greșește de trei ori pe m1; trei oameni greșesc o dată pe m2.
    // Aceeași rată, dar informații diferite — de aia există coloana `cursanti`.
    const r = agregaGreseliPeModul(M, [
      inc("u1", "Prima încercare", false),
      inc("u1", "Prima încercare", false),
      inc("u1", "Prima încercare", false),
      inc("u1", "Banii și dovada", false),
      inc("u2", "Banii și dovada", false),
      inc("u3", "Banii și dovada", false),
    ]);
    const m1 = r.find((x) => x.moduleId === "m1")!;
    const m2 = r.find((x) => x.moduleId === "m2")!;
    expect(m1).toMatchObject({ total: 3, greseli: 3, cursanti: 1 });
    expect(m2).toMatchObject({ total: 3, greseli: 3, cursanti: 3 });
  });

  it("ordonează după rata de greșeală, descrescător", () => {
    const r = agregaGreseliPeModul(M, [
      // m1: 1/4 greșit = 25%
      inc("u1", "Prima încercare", false),
      inc("u1", "Prima încercare", true),
      inc("u2", "Prima încercare", true),
      inc("u3", "Prima încercare", true),
      // m2: 3/4 greșit = 75%
      inc("u1", "Banii și dovada", false),
      inc("u2", "Banii și dovada", false),
      inc("u3", "Banii și dovada", false),
      inc("u4", "Banii și dovada", true),
    ]);
    expect(r.map((x) => x.moduleId)).toEqual(["m2", "m1"]);
    expect(procentGreseli(r[0])).toBe(75);
    expect(procentGreseli(r[1])).toBe(25);
  });

  it("un singur răspuns greșit NU trece peste un modul la care au picat 400 din 500", () => {
    // Defectul pentru care există netezirea. Cu rata brută, 1/1 = 100% bătea 400/500 = 80%
    // și panoul îl arăta primul — adică îndrepta greșit chiar decizia pe care o servește.
    const multe: IncercareRoster[] = [];
    for (let i = 0; i < 500; i++) {
      multe.push(inc(`u${i}`, "Banii și dovada", i >= 400)); // 400 greșite din 500
    }
    const r = agregaGreseliPeModul(M, [
      inc("u999", "Prima încercare", false), // un singur răspuns, greșit
      ...multe,
    ]);
    expect(r.map((x) => x.moduleId)).toEqual(["m2", "m1"]);
    // procentul AFIȘAT rămâne cel brut — netezirea decide doar ordinea
    expect(procentGreseli(r[0])).toBe(80);
    expect(procentGreseli(r[1])).toBe(100);
  });

  it("netezirea nu răstoarnă un eșantion mare cu adevărat mai rău", () => {
    const a: IncercareRoster[] = [];
    for (let i = 0; i < 200; i++) a.push(inc(`x${i}`, "Prima încercare", i >= 180)); // 90% greșit
    const b: IncercareRoster[] = [];
    for (let i = 0; i < 200; i++) b.push(inc(`y${i}`, "Banii și dovada", i >= 100)); // 50% greșit
    const r = agregaGreseliPeModul(M, [...a, ...b]);
    expect(r.map((x) => x.moduleId)).toEqual(["m1", "m2"]);
  });

  it("la rată egală, pune primul modulul cu mai multe răspunsuri", () => {
    const r = agregaGreseliPeModul(M, [
      inc("u1", "Prima încercare", false),
      inc("u2", "Prima încercare", true),
      inc("u1", "Banii și dovada", false),
      inc("u2", "Banii și dovada", true),
      inc("u3", "Banii și dovada", false),
      inc("u4", "Banii și dovada", true),
    ]);
    // ambele 50%, dar m2 are 4 răspunsuri față de 2
    expect(r.map((x) => x.moduleId)).toEqual(["m2", "m1"]);
  });

  it("exclude modulele fără niciun răspuns, nu le arată cu 0%", () => {
    // Aici e capcana: un modul la care n-a ajuns nimeni NU e un modul înțeles.
    // Cu 0% ar fi stat lângă cele reușite și ar fi liniștit managerul degeaba.
    const r = agregaGreseliPeModul(M, [inc("u1", "Prima încercare", true)]);
    expect(r.map((x) => x.moduleId)).toEqual(["m1"]);
    expect(r.find((x) => x.moduleId === "m3")).toBeUndefined();
  });

  it("ignoră răspunsurile la teme care nu aparțin niciunui modul", () => {
    const r = agregaGreseliPeModul(M, [
      inc("u1", "Temă dintr-un alt curs", false),
      inc("u1", null, false),
      inc("u1", "Prima încercare", false),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ moduleId: "m1", total: 1, greseli: 1 });
  });

  it("un modul fără temă nu poate primi răspunsuri", () => {
    const r = agregaGreseliPeModul(M, [inc("u1", "Fără test", false)]);
    expect(r).toHaveLength(0);
  });

  it("nu împarte la zero pe listă goală", () => {
    expect(agregaGreseliPeModul(M, [])).toEqual([]);
    expect(procentGreseli({ moduleId: "x", titlu: "x", ordine: 1, total: 0, greseli: 0, cursanti: 0 })).toBe(0);
  });
});
