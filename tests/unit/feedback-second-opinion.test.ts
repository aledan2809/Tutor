import { describe, it, expect } from "vitest";
import { applySecondOpinion, describeSecondOpinion, statusForAction, isInteractiveExercise } from "@/lib/feedback-review";
import { recommendFor, daysWaiting } from "@/lib/feedback-digest";

const agrees = { verdict: "agrees" as const, defect: null, reason: "" };
const disagrees = { verdict: "disagrees" as const, defect: "wrong-answer", reason: "rezultatul corect e 45 J, nu 45 kJ" };
const unavailable = { verdict: "unavailable" as const, defect: null, reason: "timeout" };

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
