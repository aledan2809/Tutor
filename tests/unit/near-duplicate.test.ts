import { describe, it, expect } from "vitest";
import {
  stemSimilarity,
  isNearDuplicate,
  dropNearDuplicates,
  NEAR_DUPLICATE_THRESHOLD,
} from "@/lib/near-duplicate";

// Perechea reală din lot, cea care a produs două chei diferite la aceeași întrebare.
const A = "Care sunt cele trei lucruri pe care un agent imobiliar le vinde și pe care proprietarul nu le poate obține singur?";
const B = "Un agent imobiliar profesionist vinde, în esență, trei lucruri pe care proprietarul nu le poate obține singur. Care sunt?";
const ALTCEVA = "La câte zile după semnarea actelor la notar se face predarea cheilor către cumpărător?";

describe("stemSimilarity", () => {
  it("vede că două formulări diferite întreabă același lucru", () => {
    expect(stemSimilarity(A, B)).toBeGreaterThanOrEqual(NEAR_DUPLICATE_THRESHOLD);
  });

  it("nu confundă două întrebări diferite din aceeași materie", () => {
    expect(stemSimilarity(A, ALTCEVA)).toBeLessThan(NEAR_DUPLICATE_THRESHOLD);
  });

  it("un text cu sine însuși dă 1", () => {
    expect(stemSimilarity(A, A)).toBeCloseTo(1, 5);
  });

  it("nu se prăbușește pe text gol sau doar cuvinte de legătură", () => {
    expect(stemSimilarity("", A)).toBe(0);
    expect(stemSimilarity("care este si sau", A)).toBe(0);
  });

  it("ignoră diacriticele, ca să nu rateze aceeași frază scrisă fără ele", () => {
    expect(stemSimilarity("Care sunt condițiile de intabulare?", "Care sunt conditiile de intabulare?")).toBeCloseTo(1, 5);
  });
});

describe("isNearDuplicate", () => {
  it("prinde reformularea", () => {
    expect(isNearDuplicate(B, [ALTCEVA, A])).toBe(true);
  });
  it("lasă să treacă o întrebare nouă", () => {
    expect(isNearDuplicate(ALTCEVA, [A, B])).toBe(false);
  });
  it("fără nimic stocat, nimic nu e duplicat", () => {
    expect(isNearDuplicate(A, [])).toBe(false);
  });
});

describe("dropNearDuplicates — și dublurile din interiorul lotului proaspăt", () => {
  it("taie a doua formulare a aceleiași întrebări chiar dacă niciuna nu era stocată", () => {
    const { kept, dropped } = dropNearDuplicates([{ content: A }, { content: B }, { content: ALTCEVA }], []);
    expect(kept.map((k) => k.content)).toEqual([A, ALTCEVA]);
    expect(dropped.map((d) => d.content)).toEqual([B]);
  });

  it("compară și cu ce e deja stocat", () => {
    const { kept, dropped } = dropNearDuplicates([{ content: B }], [A]);
    expect(kept).toHaveLength(0);
    expect(dropped).toHaveLength(1);
  });

  it("păstrează ordinea și nu pierde itemi", () => {
    const input = [{ content: A }, { content: ALTCEVA }];
    const { kept, dropped } = dropNearDuplicates(input, []);
    expect(kept.length + dropped.length).toBe(input.length);
    expect(kept[0].content).toBe(A);
  });
});
