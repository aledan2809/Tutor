import { describe, it, expect } from "vitest";
import { hasLengthCue, LENGTH_CUE_RATIO, LENGTH_CUE_MIN_DIFF } from "@/lib/answer-length-cue";

describe("hasLengthCue — varianta corectă nu trebuie să se anunțe singură", () => {
  it("prinde cazul clasic: corectă lungă, distractori scurți", () => {
    const opts = [
      "Acceptă cererea proprietarului",
      "Refuză și explică riscul juridic, propunând să declare viciul din start și să ajusteze prețul controlat",
      "Amână discuția",
      "Cere sfatul agenției",
    ];
    expect(hasLengthCue(opts, opts[1])).toBe(true);
  });

  it("nu se declanșează când toate sunt comparabile", () => {
    const opts = [
      "10 conversații noi pe zi",
      "20 de conversații noi pe zi",
      "30 de conversații noi pe zi",
      "50 de conversații noi pe zi",
    ];
    expect(hasLengthCue(opts, opts[1])).toBe(false);
  });

  it("corectă cea mai lungă, dar doar puțin → NU se aruncă (altfel pierdem un sfert din grile bune)", () => {
    const opts = ["Extras CF", "Certificat fiscal", "Extras de carte funciară", "Procură"];
    expect(hasLengthCue(opts, opts[2])).toBe(false);
  });

  it("corectă mult mai lungă dar NU cea mai lungă → nu e indiciu, distractorul e cel lung", () => {
    const opts = [
      "Da",
      "Nu, pentru că vânzătorul răspunde pentru vicii ascunse",
      "Un distractor și mai lung decât varianta corectă, scris anume ca să nu existe indiciu deloc",
      "Poate",
    ];
    expect(hasLengthCue(opts, opts[1])).toBe(false);
  });

  it("pragul e explicit și peste 1 — un raport sub el nu se aruncă", () => {
    expect(LENGTH_CUE_RATIO).toBeGreaterThan(1);
  });

  it("nu se aplică la mai puțin de 3 variante", () => {
    expect(hasLengthCue(["a", "raspuns foarte lung care ar fi indiciu"], "raspuns foarte lung care ar fi indiciu")).toBe(false);
  });

  it("răspuns care nu e printre variante → fals, nu excepție", () => {
    expect(hasLengthCue(["a", "b", "c"], "d")).toBe(false);
  });
});

describe("pragul absolut — de ce nu ajunge raportul singur", () => {
  it("termenul propriu complet, între variante scurte, NU e indiciu (raport 2.2 dar doar 13 caractere)", () => {
    const opts = ["Extras CF", "Certificat fiscal", "Extras de carte funciară", "Procură"];
    expect(hasLengthCue(opts, opts[2])).toBe(false);
  });

  it("dar aceleași variante scurte cu o justificare întreagă drept răspuns → indiciu", () => {
    const opts = [
      "Extras CF",
      "Certificat fiscal",
      "Extras de carte funciară actualizat, obținut cu cel mult 24 de ore înainte de autentificare",
      "Procură",
    ];
    expect(hasLengthCue(opts, opts[2])).toBe(true);
  });
});

describe("pragurile sunt explicite", () => {
  it("ambele sunt peste zero și documentate", () => {
    expect(LENGTH_CUE_RATIO).toBeGreaterThan(1);
    expect(LENGTH_CUE_MIN_DIFF).toBeGreaterThan(0);
  });
});
