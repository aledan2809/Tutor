import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { screenQuestion, type QuestionForMesh, type MeshResult } from "@/lib/content-quality-mesh";

/**
 * POST /api/admin/questions/mesh-validate
 *
 * Validation endpoint for mesh calibration testing.
 * Runs positive + negative control questions through the mesh and reports
 * detection rate, false-positive rate, and per-question results.
 *
 * Use this to verify mesh calibration before shipping changes.
 * Track A requirement: detection ~100%, FP < 5% on GOOD set.
 */

// ── Positive controls (GOOD — should PASS with high confidence) ──────────

const GOOD_QUESTIONS: Array<QuestionForMesh & { label: string }> = [
  {
    label: "GOOD1: factual recall (câte)",
    content: "Câte provincii avea Dacia după cucerirea romană?",
    options: ["a) Una singură", "b) Două", "c) Trei", "d) Patru"],
    correctAnswer: "c) Trei",
    explanation: "După cucerirea Daciei de către Traian în 106 d.Hr., provincia a fost împărțită în trei: Dacia Superior, Dacia Inferior și Dacia Porolissensis.",
    sourceText: "După cucerirea Daciei de către Traian în 106 d.Hr., provincia a fost împărțită în trei: Dacia Superior, Dacia Inferior și Dacia Porolissensis. Capitala provinciei era Ulpia Traiana Sarmizegetusa.",
  },
  {
    label: "GOOD2: recall cine/când",
    content: "Cine a cucerit Dacia în anul 106 d.Hr.?",
    options: ["a) Iulius Caesar", "b) Augustus", "c) Traian", "d) Hadrian"],
    correctAnswer: "c) Traian",
    explanation: "Împăratul Traian a cucerit Dacia în urma a două campanii militare (101-102 și 105-106 d.Hr.).",
    sourceText: "Împăratul Traian a cucerit Dacia în urma a două campanii militare, în anii 101-102 și 105-106 d.Hr. Victoria romană a fost marcată prin ridicarea Columnei lui Traian la Roma.",
  },
  {
    label: "GOOD3: comprehension",
    content: "Ce rol avea Columna lui Traian?",
    options: [
      "a) Servea ca templu religios",
      "b) Marca victoria asupra dacilor",
      "c) Era un turn de apărare",
      "d) Funcționa ca far de navigație",
    ],
    correctAnswer: "b) Marca victoria asupra dacilor",
    explanation: "Columna lui Traian a fost ridicată la Roma pentru a marca victoria împăratului asupra dacilor.",
    sourceText: "Victoria romană a fost marcată prin ridicarea Columnei lui Traian la Roma. Aceasta prezintă scene sculptate din cele două campanii militare și este un monument de artă romană remarcabil.",
  },
  {
    label: "GOOD4: geography factual",
    content: "Care era capitala provinciei romane Dacia?",
    options: [
      "a) Napoca",
      "b) Apulum",
      "c) Ulpia Traiana Sarmizegetusa",
      "d) Drobeta",
    ],
    correctAnswer: "c) Ulpia Traiana Sarmizegetusa",
    explanation: "Ulpia Traiana Sarmizegetusa era capitala provinciei Dacia, fondată pe locul vechii capitale dacice.",
    sourceText: "Capitala provinciei era Ulpia Traiana Sarmizegetusa, fondată pe locul vechii capitale a regatului dac. Alte orașe importante erau Napoca, Apulum și Drobeta.",
  },
];

// ── Negative controls (BAD — should be FLAGGED) ──────────────────────────

const BAD_QUESTIONS: Array<QuestionForMesh & { label: string; expectedDefect: string }> = [
  {
    label: "BAD1: hallucinated date",
    expectedDefect: "grounding",
    content: "În ce an a cucerit Traian Dacia?",
    options: ["a) 89 d.Hr.", "b) 106 d.Hr.", "c) 112 d.Hr.", "d) 117 d.Hr."],
    correctAnswer: "c) 112 d.Hr.",
    explanation: "Traian a cucerit Dacia în 112 d.Hr.",
    sourceText: "Împăratul Traian a cucerit Dacia în urma a două campanii militare, în anii 101-102 și 105-106 d.Hr.",
  },
  {
    label: "BAD2: answer not in source",
    expectedDefect: "grounding",
    content: "Ce limba vorbeau dacii?",
    options: ["a) Latina", "b) Greaca", "c) Daca", "d) Traca"],
    correctAnswer: "c) Daca",
    explanation: "Dacii vorbeau limba dacă.",
    sourceText: "Capitala provinciei era Ulpia Traiana Sarmizegetusa. Alte orașe importante erau Napoca, Apulum și Drobeta.",
  },
  {
    label: "BAD3: two correct answers",
    expectedDefect: "single-correct",
    content: "Care erau orașe importante în Dacia romană?",
    options: ["a) Napoca", "b) Apulum", "c) Roma", "d) Atena"],
    correctAnswer: "a) Napoca",
    explanation: "Napoca era un oraș important.",
    sourceText: "Alte orașe importante erau Napoca, Apulum și Drobeta.",
  },
  {
    label: "BAD4: accidentally true distractor",
    expectedDefect: "single-correct",
    content: "Care era un oraș important în provincia Dacia?",
    options: [
      "a) Napoca",
      "b) Apulum",
      "c) Ulpia Traiana Sarmizegetusa",
      "d) Constantinopol",
    ],
    correctAnswer: "a) Napoca",
    explanation: "Napoca era un oraș important.",
    sourceText: "Capitala provinciei era Ulpia Traiana Sarmizegetusa. Alte orașe importante erau Napoca, Apulum și Drobeta.",
  },
  {
    label: "BAD5: named-entity thin coverage",
    expectedDefect: "distractor-clarity",
    content: "Cine a fost Augustin cel Mare?",
    options: [
      "a) Un împărat roman",
      "b) Un episcop din Hippo",
      "c) Un general dac",
      "d) Un filosof grec",
    ],
    correctAnswer: "b) Un episcop din Hippo",
    explanation: "Augustin cel Mare a fost episcopul Hippoi.",
    sourceText: "Împăratul Traian a cucerit Dacia în urma a două campanii militare.",
  },
  {
    label: "BAD6: length cue (correct answer much longer)",
    expectedDefect: "distractor-clarity",
    content: "Ce s-a întâmplat după cucerirea Daciei?",
    options: [
      "a) Nimic",
      "b) Pace",
      "c) Provincia a fost împărțită în trei: Dacia Superior, Dacia Inferior și Dacia Porolissensis, cu capitala la Ulpia Traiana Sarmizegetusa",
      "d) Război",
    ],
    correctAnswer: "c) Provincia a fost împărțită în trei: Dacia Superior, Dacia Inferior și Dacia Porolissensis, cu capitala la Ulpia Traiana Sarmizegetusa",
    explanation: "Dacia a fost organizată ca provincie romană.",
    sourceText: "După cucerirea Daciei, provincia a fost împărțită în trei: Dacia Superior, Dacia Inferior și Dacia Porolissensis. Capitala provinciei era Ulpia Traiana Sarmizegetusa.",
  },
];

interface ValidationResult {
  label: string;
  expected: "pass" | "flag";
  actual: "pass" | "flag";
  correct: boolean;
  confidence: number;
  flags: MeshResult["flags"];
  recommendation: string;
  expectedDefect?: string;
}

async function _POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const results: ValidationResult[] = [];

  // Run GOOD questions (expect: pass = high confidence, no flags)
  for (const q of GOOD_QUESTIONS) {
    try {
      const mesh = await screenQuestion(q);
      const actual = mesh.recommendation === "high-confidence" ? "pass" : "flag";
      results.push({
        label: q.label,
        expected: "pass",
        actual,
        correct: actual === "pass",
        confidence: mesh.confidence,
        flags: mesh.flags,
        recommendation: mesh.recommendation,
      });
    } catch (err) {
      results.push({
        label: q.label,
        expected: "pass",
        actual: "flag",
        correct: false,
        confidence: 0,
        flags: [],
        recommendation: `error: ${(err as Error).message}`,
      });
    }
  }

  // Run BAD questions (expect: flag = should be caught)
  for (const q of BAD_QUESTIONS) {
    try {
      const mesh = await screenQuestion(q);
      const actual = mesh.flags.length > 0 ? "flag" : "pass";
      results.push({
        label: q.label,
        expected: "flag",
        actual,
        correct: actual === "flag",
        confidence: mesh.confidence,
        flags: mesh.flags,
        recommendation: mesh.recommendation,
        expectedDefect: q.expectedDefect,
      });
    } catch (err) {
      results.push({
        label: q.label,
        expected: "flag",
        actual: "pass",
        correct: false,
        confidence: 0,
        flags: [],
        recommendation: `error: ${(err as Error).message}`,
        expectedDefect: q.expectedDefect,
      });
    }
  }

  // Calculate metrics
  const goodResults = results.filter(r => r.expected === "pass");
  const badResults = results.filter(r => r.expected === "flag");

  const falsePositives = goodResults.filter(r => !r.correct).length;
  const falseNegatives = badResults.filter(r => !r.correct).length;
  const fpRate = goodResults.length > 0 ? falsePositives / goodResults.length : 0;
  const detectionRate = badResults.length > 0 ? (badResults.length - falseNegatives) / badResults.length : 0;

  return NextResponse.json({
    summary: {
      totalTests: results.length,
      goodTests: goodResults.length,
      badTests: badResults.length,
      falsePositives,
      falseNegatives,
      fpRate: Math.round(fpRate * 100),
      detectionRate: Math.round(detectionRate * 100),
      passesThreshold: fpRate <= 0.05 && detectionRate >= 0.95,
    },
    results,
  });
}

export const POST = withErrorHandler(_POST);
