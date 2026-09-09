import { describe, it, expect } from "vitest";
import {
  citesteLista,
  ghicesteSeparator,
  imparteRand,
  normalizeazaTelefon,
} from "@/lib/import-destinatari";

describe("normalizeazaTelefon", () => {
  it("pune prefixul de țară la un număr scris cu zero", () => {
    expect(normalizeazaTelefon("0712 383 492")).toBe("40712383492");
  });
  it("lasă în pace un număr deja internațional", () => {
    expect(normalizeazaTelefon("+40712383492")).toBe("40712383492");
  });
  it("completează un număr scris fără zero la început", () => {
    expect(normalizeazaTelefon("712383492")).toBe("40712383492");
  });
});

describe("imparteRand", () => {
  it("nu rupe o celulă care conține separatorul între ghilimele", () => {
    expect(imparteRand('Popescu;Ion;"Slatina, jud. Olt"', ";")).toEqual([
      "Popescu", "Ion", "Slatina, jud. Olt",
    ]);
  });
});

describe("ghicesteSeparator", () => {
  it("alege ce apare mai des pe antet", () => {
    expect(ghicesteSeparator("nume;prenume;telefon")).toBe(";");
    expect(ghicesteSeparator("nume,prenume,telefon")).toBe(",");
  });
});

describe("citesteLista", () => {
  const antet = "Nume;Prenume;Functie;Marca;Telefon;Judet;Localitate;Oficiu";

  it("citește un rând bun, fără probleme", () => {
    const r = citesteLista(`${antet}\nPopescu;Ion;factor;PR-1;0712383492;Olt;Slatina;OP Slatina 3`);
    expect(r.randuri).toHaveLength(1);
    expect(r.randuri[0].probleme).toEqual([]);
    expect(r.randuri[0]).toMatchObject({
      lastName: "Popescu", firstName: "Ion", jobTitle: "factor",
      badgeNo: "PR-1", phone: "40712383492", county: "Olt",
      city: "Slatina", postOffice: "OP Slatina 3",
    });
  });

  it("recunoaște antetul scris cu diacritice și majuscule", () => {
    const r = citesteLista("NUME;Prenume;Județ;Telefon\nIonescu;Ana;Olt;0733111222");
    expect(r.randuri[0].county).toBe("Olt");
    expect(r.randuri[0].probleme).toEqual([]);
  });

  it("spune ce lipsește, în loc să importe pe jumătate", () => {
    const r = citesteLista(`${antet}\n;Ion;factor;;;;;`);
    expect(r.randuri[0].probleme).toContain("lipsește numele");
    expect(r.randuri[0].probleme).toContain("lipsește telefonul");
  });

  it("prinde un telefon neplauzibil", () => {
    const r = citesteLista(`${antet}\nPopescu;Ion;;;123;;;`);
    expect(r.randuri[0].probleme.join(" ")).toMatch(/neplauzibil/);
  });

  it("prinde același telefon de două ori în fișier", () => {
    const r = citesteLista(
      `${antet}\nPopescu;Ion;;;0712383492;;;\nIonescu;Ana;;;0712383492;;;`
    );
    expect(r.randuri[0].probleme).toEqual([]);
    expect(r.randuri[1].probleme).toContain("telefon repetat în fișier");
  });

  it("numerotează liniile ca omul, cu antetul pe 1", () => {
    const r = citesteLista(`${antet}\nA;B;;;0712383492;;;\nC;D;;;0733111222;;;`);
    expect(r.randuri.map((x) => x.linie)).toEqual([2, 3]);
  });

  it("spune ce coloane n-a recunoscut, în loc să le înghită", () => {
    const r = citesteLista("Nume;Prenume;Telefon;Salariu\nA;B;0712383492;5000");
    expect(r.necunoscute).toContain("salariu");
    expect(r.coloane).toEqual(["lastName", "firstName", "phone"]);
  });

  it("un fișier gol nu produce rânduri", () => {
    expect(citesteLista("").randuri).toEqual([]);
  });
});
