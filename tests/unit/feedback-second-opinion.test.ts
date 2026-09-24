import { describe, it, expect } from "vitest";
import { applySecondOpinion, describeSecondOpinion, statusForAction, isInteractiveExercise } from "@/lib/feedback-review";
import { recommendFor, daysWaiting } from "@/lib/feedback-digest";

const agrees = { verdict: "agrees" as const, defect: null, reason: "", answer: "9 J" };
const disagrees = { verdict: "disagrees" as const, defect: "wrong-answer", reason: "rezultatul corect e 45 J, nu 45 kJ", answer: "45 J" };
const unavailable = { verdict: "unavailable" as const, defect: null, reason: "timeout", answer: null };

describe("a doua opinie — ce schimbă și ce nu", () => {
  it("o respingere contrazisă nu mai spune nimănui că elevul greșește", () => {
    const r = applySecondOpinion("dismissed", "Reclamație respinsă: …", disagrees);
    expect(r.action).toBe("flagged");
    expect(r.decision).toMatch(/nu sunt de acord/);
    expect(r.decision).toMatch(/45 J/);
    // …și tot așteaptă un om.
    expect(statusForAction(r.action)).toBe("pending_review");
  });

  it("o respingere confirmată rămâne respingere și tot așteaptă un om", () => {
    const r = applySecondOpinion("dismissed", "Reclamație respinsă: x", agrees);
    expect(r).toEqual({ action: "dismissed", decision: "Reclamație respinsă: x" });
    expect(statusForAction(r.action)).toBe("pending_review");
  });

  it("o a doua opinie indisponibilă nu contează nici ca acord, nici ca dezacord", () => {
    expect(applySecondOpinion("dismissed", "d", unavailable)).toEqual({ action: "dismissed", decision: "d" });
  });

  it("verdictele care nu așteaptă un om nu sunt atinse", () => {
    expect(applySecondOpinion("corrected", "c", disagrees)).toEqual({ action: "corrected", decision: "c" });
    expect(applySecondOpinion("hidden", "h", null)).toEqual({ action: "hidden", decision: "h" });
  });

  it("descrierea pentru admin spune în cuvinte simple ce a găsit", () => {
    expect(describeSecondOpinion(agrees)).toMatch(/confirmă răspunsul/);
    expect(describeSecondOpinion(disagrees)).toMatch(/wrong-answer: rezultatul corect/);
    expect(describeSecondOpinion(unavailable)).toMatch(/n-a putut judeca \(timeout\)/);
  });
});

describe("mesajul zilnic — recomandarea, nu numărul", () => {
  it("dezacord → probabil elevul are dreptate", () => {
    expect(recommendFor({ reviewAction: "flagged", secondOpinion: "disagrees" })).toMatch(/elevul are dreptate/);
  });
  it("respingere + acord → confirmă și explică elevului", () => {
    expect(recommendFor({ reviewAction: "dismissed", secondOpinion: "agrees" })).toMatch(/confirmă respingerea/);
  });
  it("fără a doua opinie → decide tu", () => {
    expect(recommendFor({ reviewAction: "dismissed", secondOpinion: null })).toMatch(/decide tu/);
    expect(recommendFor({ reviewAction: "flagged", secondOpinion: "unavailable" })).toMatch(/decide tu/);
  });
  it("zilele de așteptare", () => {
    const now = new Date("2026-09-24T10:00:00Z");
    expect(daysWaiting(new Date("2026-09-24T01:00:00Z"), now)).toBe(0);
    expect(daysWaiting(new Date("2026-09-21T10:00:00Z"), now)).toBe(3);
  });
});

describe("exercițiile interactive nu primesc a doua opinie din text", () => {
  it("recunoaște marcajele ascunse", () => {
    expect(isInteractiveExercise("[CUBEVOICE] start=Față; moves=up,left")).toBe(true);
    expect(isInteractiveExercise("[AUDIODICT:ro] 4 7 2")).toBe(true);
    expect(isInteractiveExercise("[MEMORIE:8] ABC")).toBe(true);
    expect(isInteractiveExercise("[CLOCK] 3:15")).toBe(true);
  });
  it("un pasaj obișnuit sau lipsă nu e exercițiu interactiv", () => {
    expect(isInteractiveExercise("Citește textul: ...")).toBe(false);
    expect(isInteractiveExercise(null)).toBe(false);
    expect(isInteractiveExercise("Text care pomenește [CLOCK] la mijloc")).toBe(false);
  });
});

import { matchOption } from "@/lib/content-quality-mesh";

describe("matchOption — ce a scris judecătorul → textul exact al variantei", () => {
  const opts = ["9 J", "9 kJ", "6 J", "18 J"];
  it("literă, literă cu paranteză, text", () => {
    expect(matchOption("a", opts)).toBe("9 J");
    expect(matchOption("b) 9 kJ", opts)).toBe("9 kJ");
    expect(matchOption("18 J", opts)).toBe("18 J");
  });
  it("niciuna / gol / literă inexistentă → null", () => {
    expect(matchOption("NONE", opts)).toBeNull();
    expect(matchOption("", opts)).toBeNull();
    expect(matchOption("e", opts)).toBeNull();
  });
});

import { composeDigestItem } from "@/lib/feedback-digest";

describe("mesajul pentru decizie — tot ce trebuie, fără să deschizi ceva", () => {
  const base = {
    header: "⏳ De decis 1/1",
    student: "Rareș",
    comment: "e 9 J",
    question: "Un corp cu masa de 2 kg se mișcă cu 3 m/s. Energia cinetică?",
    passage: null,
    options: ["9 J", "9 kJ", "6 J", "18 J"],
    marked: "9 kJ",
    suggested: "9 J",
    explanation: "Ec = mv²/2",
    firstVerdict: "Reclamație respinsă",
    secondVerdict: "A doua verificare a găsit o problemă.",
    recommendation: "Probabil elevul are dreptate.",
  };
  it("arată întrebarea întreagă și toate variantele, cu marcata și sugerata", () => {
    const t = composeDigestItem(base);
    expect(t).toContain(base.question);
    expect(t).toMatch(/a\) 9 J {3}← 💡 sugerat/);
    expect(t).toMatch(/b\) 9 kJ {3}← ✅ marcat corect/);
    expect(t).toContain("c) 6 J");
    expect(t).toContain("d) 18 J");
    expect(t).toMatch(/altă variantă: „9 J”/);
  });
  it("când a doua verificare alege tot varianta marcată, o spune", () => {
    const t = composeDigestItem({ ...base, marked: "9 J", suggested: "9 J" });
    expect(t).toMatch(/aceeași variantă ca cea marcată/);
    expect(t).not.toContain("💡");
  });
  it("exercițiile dictate își arată datele ascunse", () => {
    const t = composeDigestItem({ ...base, passage: "[CUBEVOICE] start=Față; moves=up,left" });
    expect(t).toMatch(/Date dictate\/afișate elevului.*CUBEVOICE/);
  });
  it("încape în limita Telegram", () => {
    const t = composeDigestItem({ ...base, question: "x".repeat(5000), comment: "y".repeat(5000) });
    expect(t.length).toBeLessThanOrEqual(3900);
  });
});
