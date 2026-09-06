import { describe, it, expect } from "vitest";
import { shuffleOptions } from "@/lib/shuffle-options";

const OPTS = ["prima", "a doua", "a treia", "a patra"];

// Deterministic generator so the assertions are about the shuffle, not about luck.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

describe("shuffleOptions — poziția răspunsului nu trebuie să-l trădeze", () => {
  it("păstrează exact aceleași variante, doar în altă ordine", () => {
    const out = shuffleOptions(OPTS, "prima", seeded(7));
    expect([...out].sort()).toEqual([...OPTS].sort());
    expect(out).toHaveLength(OPTS.length);
  });

  it("răspunsul corect rămâne printre variante (se compară pe text, nu pe poziție)", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const out = shuffleOptions(OPTS, "a treia", seeded(seed));
      expect(out).toContain("a treia");
    }
  });

  it("împrăștie poziția corectă — nu o lasă lipită de prima", () => {
    const pos = [0, 0, 0, 0];
    for (let seed = 1; seed <= 400; seed++) {
      const out = shuffleOptions(OPTS, "prima", seeded(seed));
      pos[out.indexOf("prima")]++;
    }
    // La întâmplare ar da 100 pe poziție. Pragul e larg intenționat: testul prinde
    // o distribuție stricată (ca cei 44% măsurați), nu fluctuația normală.
    for (const n of pos) expect(n).toBeGreaterThan(50);
    for (const n of pos) expect(n).toBeLessThan(160);
  });

  it("nu atinge grilele cu variante legate de poziție", () => {
    const anchored = ["prima", "a doua", "a treia", "Toate cele de mai sus"];
    expect(shuffleOptions(anchored, "prima", seeded(3))).toBe(anchored);
    const none = ["prima", "a doua", "a treia", "Niciuna dintre variante"];
    expect(shuffleOptions(none, "prima", seeded(3))).toBe(none);
  });

  it("nu atinge nimic dacă răspunsul corect nu e printre variante", () => {
    expect(shuffleOptions(OPTS, "a cincea", seeded(3))).toBe(OPTS);
  });

  it("lasă în pace întrebările adevărat/fals (sub trei variante)", () => {
    const tf = ["Adevărat", "Fals"];
    expect(shuffleOptions(tf, "Adevărat", seeded(3))).toBe(tf);
  });
});
