import { describe, it, expect } from "vitest";
import { extractJson, extractJsonObjects } from "@/lib/json-from-model";

describe("extractJson", () => {
  it("JSON curat", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('[1,2]')).toEqual([1, 2]);
  });

  it("scoate gardul de cod", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('```\n[{"b":2}]\n```')).toEqual([{ b: 2 }]);
  });

  it("ignora textul dinainte si de dupa", () => {
    expect(extractJson('Sigur! Iata planul:\n{"title":"X"}\nSper ca ajuta.')).toEqual({ title: "X" });
  });

  it("o acolada intr-un sir NU termina obiectul — de-asta nu e regex lacom", () => {
    expect(extractJson('{"t":"are } inauntru","n":2}')).toEqual({ t: "are } inauntru", n: 2 });
  });

  it("ghilimele escapate intr-un sir nu incurca numaratoarea", () => {
    expect(extractJson('{"q":"el a zis \\"da\\" }","n":1}')).toEqual({ q: 'el a zis "da" }', n: 1 });
  });

  it("obiecte imbricate", () => {
    expect(extractJson('text {"a":{"b":{"c":[1,{"d":2}]}}} coada')).toEqual({ a: { b: { c: [1, { d: 2 }] } } });
  });

  it("ia PRIMUL obiect balansat, nu ultimul", () => {
    expect(extractJson('{"first":1} apoi {"second":2}')).toEqual({ first: 1 });
  });

  it("esueaza clar cand nu e JSON deloc", () => {
    expect(() => extractJson("nu am putut genera nimic")).toThrow(/nu conține JSON/i);
    expect(() => extractJson("")).toThrow();
  });

  it("esueaza clar cand JSON-ul e taiat la jumatate (raspuns trunchiat de maxTokens)", () => {
    expect(() => extractJson('{"a":1,"b":[1,2')).toThrow(/nu se închide/i);
  });
});

describe("extractJsonObjects — recuperare cand lotul e partial stricat", () => {
  it("tabloul curat trece neatins, in ordine", () => {
    expect(extractJsonObjects('[{"a":1},{"a":2}]')).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("un singur obiect devine lista de unu", () => {
    expect(extractJsonObjects('{"a":1}')).toEqual([{ a: 1 }]);
  });

  it("raspuns TRUNCHIAT: pastreaza obiectele intregi, il arunca pe cel taiat", () => {
    const r = extractJsonObjects('[{"a":1},{"b":2},{"c":');
    expect(r).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("un obiect STRICAT nu omoara lotul — restul supravietuiesc", () => {
    const r = extractJsonObjects('[{"a":1},{"b":stricat},{"c":3}]');
    expect(r).toEqual([{ a: 1 }, { c: 3 }]);
  });

  it("acolade in interiorul sirurilor nu rup numaratoarea", () => {
    const r = extractJsonObjects('[{"t":"contine } si {"},{"t":"altul"}]');
    expect(r).toEqual([{ t: "contine } si {" }, { t: "altul" }]);
  });

  it("obiecte imbricate se intorc ca UN singur element, nu desfacute", () => {
    expect(extractJsonObjects('[{"a":{"b":1}}]')).toEqual([{ a: { b: 1 } }]);
  });

  it("fara niciun obiect → lista goala, nu exceptie", () => {
    expect(extractJsonObjects("nu am generat nimic")).toEqual([]);
    expect(extractJsonObjects("")).toEqual([]);
  });
});
