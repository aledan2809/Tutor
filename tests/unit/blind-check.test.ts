import { describe, it, expect } from "vitest";
import { buildBlindPrompt, parseBlindReply, BLIND_BATCH } from "@/lib/blind-check";

const ITEMS = [
  { options: ["prima", "a doua", "a treia", "a patra"], correctAnswer: "a doua" },
  { options: ["alfa", "beta", "gama", "delta"], correctAnswer: "gama" },
];

describe("buildBlindPrompt — judecătorul nu are voie să vadă întrebarea", () => {
  it("nu conține enunțul, doar variantele", () => {
    const p = buildBlindPrompt(ITEMS);
    expect(p).toContain("prima");
    expect(p).toContain("delta");
    expect(p).not.toContain("stem");
    expect(p).toContain("Nu îți dau întrebările");
  });

  it("numerotează continuu peste loturi, ca răspunsurile să se poată lipi", () => {
    const p = buildBlindPrompt(ITEMS, 8);
    expect(p).toContain("Q09:");
    expect(p).toContain("Q10:");
    // „Q01" apare în exemplul de format, deci verific blocurile reale de itemi.
    expect(p).not.toContain("Q11:");
    expect(p.slice(p.indexOf("Q09:"))).not.toContain("Q01:");
  });
});

describe("parseBlindReply — „nu știu” nu trebuie citit ca un răspuns", () => {
  it("citește alegerea și încrederea", () => {
    const v = parseBlindReply("Q01: 2 sigur\nQ02: 4 ghicesc", 2);
    expect(v[0]).toEqual({ index: 0, picked: 1, solvedBlind: true });
    expect(v[1]).toEqual({ index: 1, picked: 3, solvedBlind: false });
  });

  it("„nu” înseamnă că nu poate departaja, nu varianta 1", () => {
    const v = parseBlindReply("Q01: nu", 1);
    expect(v[0]).toEqual({ index: 0, picked: null, solvedBlind: false });
  });

  it("un ghicit nu contează ca rezolvare oarbă — la 4 variante nimerește 1 din 4 oricum", () => {
    const v = parseBlindReply("Q01: 2 ghicesc", 1);
    expect(v[0]!.solvedBlind).toBe(false);
  });

  it("ține offsetul lotului", () => {
    const v = parseBlindReply("Q09: 3 sigur", 1, 8);
    expect(v[0]).toEqual({ index: 8, picked: 2, solvedBlind: true });
  });

  it("ignoră liniile în afara lotului în loc să le înghesuie", () => {
    const v = parseBlindReply("Q01: 2 sigur\nQ77: 1 sigur", 1);
    expect(v).toHaveLength(1);
    expect(v[0]!.picked).toBe(1);
  });

  it("întoarce null pentru itemii la care judecătorul n-a răspuns deloc", () => {
    const v = parseBlindReply("Q02: 1 sigur", 3);
    expect(v[0]).toBeNull();
    expect(v[2]).toBeNull();
    expect(v[1]!.picked).toBe(0);
  });

  it("suportă răspunsul înecat în text în plus", () => {
    const v = parseBlindReply("Sigur, iată:\n\nQ01: 3 sigur\n\nSper că ajută.", 1);
    expect(v[0]!.picked).toBe(2);
  });

  it("lotul are o dimensiune declarată, nu magică", () => {
    expect(BLIND_BATCH).toBeGreaterThan(1);
  });
});
