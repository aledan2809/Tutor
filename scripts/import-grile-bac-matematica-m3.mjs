#!/usr/bin/env node
/**
 * import-grile-bac-matematica-m2.mjs — BAC Matematică M3 (Tehnologic) → GRILE (MCQ)
 *
 * Clone of import-grile-bac-matematica-m1.mjs for the M3 (tehnologic) program. BAC Matematică
 * Subiectul I has 6 short-answer items per paper, each with a concrete result in the official
 * BAREM. These grile are built FROM that ground truth (L09):
 *   • the question is the official cerință (reframed "Arătați că…/Determinați…" → "valoarea … este:"),
 *   • the CORRECT option is the official barem result (verbatim),
 *   • distractors are plausible numeric/sign alternatives (manual, no AI).
 * Math notation is plain Unicode inline (the UI has no KaTeX/MathJax) — transcribed from the
 * rendered PDF, not from the (garbled) fitz text dump.
 *
 * Target: domain `matematica-m3-ix-xii` (slug → Bacalaureat), subject
 * "Matematică M3 (Tehnologic) — Bacalaureat", source MANUAL, status PUBLISHED.
 * The 3 BAC programs (M1/M2/M3) are NEVER mixed — each has its own domain + script.
 * Idempotent: deletes prior bac-grile-mate-m3:% rows in this domain then recreates.
 *
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL from env (VPS2 local PG).
 */
import { PrismaClient } from "@prisma/client";

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

const SUBJECT = "Matematică M3 (Tehnologic) — Bacalaureat";
const DOMAIN_SLUG = "matematica-m3-ix-xii";
const TAG_PREFIX = "bac-grile-mate-m3";

// Per paper: barem-anchored MCQ. `correct` MUST equal one option verbatim.
const GRILE = [
  {
    year: 2022, variant: "model",
    items: [
      { label: "I.1", topic: "Numere reale. Radicali",
        content: "Valoarea expresiei (√8+1)·(2√2−1)−√36 este:",
        options: ["1", "7", "13", "−5"], correct: "1" },
      { label: "I.2", topic: "Funcții. Grafic",
        content: "Coordonatele punctului de intersecție a graficelor funcțiilor f:ℝ→ℝ, f(x)=5x−1 și g:ℝ→ℝ, g(x)=5+2x sunt:",
        options: ["(2, 9)", "(9, 2)", "(2, 5)", "(1, 4)"], correct: "(2, 9)" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Soluția reală a ecuației √(x²+6x)=x este:",
        options: ["0", "6", "−6", "1"], correct: "0" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea A={0,1,2,3,4,5,6,7,8,9}, numărul 4·n să fie element al mulțimii A, este:",
        options: ["3/10", "1/10", "2/5", "1/4"], correct: "3/10" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(2,1), B(3,4) și C, astfel încât A este mijlocul segmentului BC. Triunghiul AOC (O fiind originea reperului) este:",
        options: ["dreptunghic isoscel", "echilateral", "dreptunghic neisoscel", "isoscel nedreptunghic"], correct: "dreptunghic isoscel" },
      { label: "I.6", topic: "Trigonometrie",
        content: "În triunghiul ascuțitunghic ABC are loc relația sin30°·sin A=cos60°·cos A. Valoarea tg A este:",
        options: ["1", "√3", "√3/3", "1/2"], correct: "1" },
    ],
  },
  {
    year: 2022, variant: "simulare",
    items: [
      { label: "I.1", topic: "Progresii aritmetice",
        content: "Termenul a₁ al progresiei aritmetice (aₙ)ₙ≥₁, cu a₃=6 și a₄=9, este:",
        options: ["0", "3", "6", "−3"], correct: "0" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcțiile f:ℝ→ℝ, f(x)=x²+2x−3 și g:ℝ→ℝ, g(x)=x−3. Mulțimea valorilor reale ale lui a pentru care f(a)=g(a) este:",
        options: ["{−1, 0}", "{0, 1}", "{−3, 0}", "{−1}"], correct: "{−1, 0}" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Soluția reală a ecuației log₃(x+3)=2 este:",
        options: ["6", "9", "3", "2"], correct: "6" },
      { label: "I.4", topic: "Procente",
        content: "În urma unei scumpiri cu 30%, prețul unui produs a crescut cu 60 de lei. Prețul produsului după scumpire este:",
        options: ["260 lei", "200 lei", "78 lei", "180 lei"], correct: "260 lei" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Se consideră punctele A(−4,1), B(2,3) și dreapta d de ecuație y=2x+a. Valoarea reală a lui a, știind că mijlocul segmentului AB aparține dreptei d, este:",
        options: ["4", "−4", "2", "0"], correct: "4" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Aria triunghiului ABC, cu AB=AC, BC=12 și măsura unghiului B egală cu 45°, este:",
        options: ["36", "72", "18", "36√2"], correct: "36" },
    ],
  },
  {
    year: 2022, variant: "var-01",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei 5−3·(1+1/3) este:",
        options: ["1", "2", "0", "5"], correct: "1" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x−4. Valoarea reală a lui a pentru care f(a)=2 este:",
        options: ["6", "2", "−2", "4"], correct: "6" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Soluția reală a ecuației √(4+2x)=2 este:",
        options: ["0", "2", "−2", "4"], correct: "0" },
      { label: "I.4", topic: "Procente",
        content: "Un produs costă 90 de lei. Prețul produsului după o scumpire cu 10% este:",
        options: ["99 lei", "100 lei", "81 lei", "9 lei"], correct: "99 lei" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(1,4), B(5,0) și M(a,b). Numerele reale a și b, știind că M este mijlocul segmentului AB, sunt:",
        options: ["a=3, b=2", "a=2, b=3", "a=6, b=4", "a=3, b=4"], correct: "a=3, b=2" },
      { label: "I.6", topic: "Geometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu măsura unghiului C egală cu 30° și AB=3. Lungimea ipotenuzei BC este:",
        options: ["6", "3√3", "9", "3√2"], correct: "6" },
    ],
  },
  {
    year: 2022, variant: "var-03",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei (1,5−0,5)·3−2·0,5 este:",
        options: ["2", "3", "1", "4"], correct: "2" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x−3. Valoarea reală a lui a pentru care f(a)=9 este:",
        options: ["6", "9", "3", "12"], correct: "6" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Soluția reală a ecuației log₄(3x−1)=log₄5 este:",
        options: ["2", "5", "1", "6"], correct: "2" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea A={0,1,2,3,4,5,6,7,8,9}, acesta să verifice inegalitatea 5n≤22, este:",
        options: ["1/2", "2/5", "4/10", "11/50"], correct: "1/2" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Coordonatele mijlocului segmentului AB, cu A(−2,1) și B(6,3), sunt:",
        options: ["(2, 2)", "(2, 4)", "(4, 2)", "(−1, 2)"], correct: "(2, 2)" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AC=4 și BC=5. Aria triunghiului ABC este:",
        options: ["6", "10", "12", "20"], correct: "6" },
    ],
  },
  {
    year: 2022, variant: "var-07",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei 1+6·(1/2+1/3) este:",
        options: ["6", "5", "11", "1"], correct: "6" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x−2. Valoarea expresiei f(3)−f(2) este:",
        options: ["1", "−1", "2", "0"], correct: "1" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Soluția reală a ecuației √(3x+1)=2 este:",
        options: ["1", "2", "3", "4"], correct: "1" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea A={1,2,3,4,5,6,7,8,9}, numărul 10−n să fie par, este:",
        options: ["4/9", "5/9", "1/2", "2/9"], correct: "4/9" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Pentru orice număr real a, lungimea segmentului AB, unde A(a,0) și B(a,6), este:",
        options: ["6", "36", "a", "√6"], correct: "6" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AB=5 și AC=2AB. Aria triunghiului ABC este:",
        options: ["25", "50", "12,5", "10"], correct: "25" },
    ],
  },
  {
    year: 2023, variant: "model",
    items: [
      { label: "I.1", topic: "Progresii aritmetice",
        content: "Termenul a₁ al progresiei aritmetice (aₙ)ₙ≥₁, cu a₂=7 și a₆=23, este:",
        options: ["3", "4", "7", "11"], correct: "3" },
      { label: "I.2", topic: "Funcții. Grafic",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=8x−5. Valoarea reală a lui a pentru care punctul A(a,3a) aparține graficului funcției f este:",
        options: ["1", "−1", "5", "3"], correct: "1" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Soluția reală a ecuației log₄x+log₄(3x)=log₄12 este:",
        options: ["2", "−2", "4", "6"], correct: "2" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea numerelor naturale de două cifre, √n să fie număr natural par, este:",
        options: ["1/30", "1/10", "1/45", "3/100"], correct: "1/30" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Distanța dintre mijloacele segmentelor AB și OC, unde A(−3,2), B(1,4), C(6,0) și O este originea reperului, este:",
        options: ["5", "4", "√13", "√34"], correct: "5" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Aria triunghiului ABC, dreptunghic în A, cu BC=16 și măsura unghiului B egală cu 30°, este:",
        options: ["32√3", "64√3", "16√3", "32"], correct: "32√3" },
    ],
  },
  {
    year: 2023, variant: "simulare",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei (1−0,2):2+0,3·2 este:",
        options: ["1", "0,4", "1,6", "0,7"], correct: "1" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcțiile f:ℝ→ℝ, f(x)=x²−3x+2 și g:ℝ→ℝ, g(x)=x+m, unde m este număr real. Valoarea reală a lui m pentru care f(2)=g(2) este:",
        options: ["−2", "2", "0", "−4"], correct: "−2" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 7^(x+3)=49^x este:",
        options: ["3", "2", "6", "1"], correct: "3" },
      { label: "I.4", topic: "Procente",
        content: "După o ieftinire cu 30%, un produs costă 210 lei. Prețul produsului înainte de ieftinire este:",
        options: ["300 lei", "273 lei", "240 lei", "280 lei"], correct: "300 lei" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Se consideră punctele A(0,5) și B(2,−1), iar M mijlocul segmentului AB. Triunghiul OMB (O originea reperului) este dreptunghic în vârful:",
        options: ["O", "M", "B", "niciunul"], correct: "O" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Valoarea expresiei √3·sin45°+2·sin30°−√2·cos30° este:",
        options: ["1", "√6", "√2", "0"], correct: "1" },
    ],
  },
  {
    year: 2023, variant: "var-01",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei 3·(1+1/2)−1/2 este:",
        options: ["4", "5", "9/2", "3"], correct: "4" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x+2. Valoarea reală a lui a pentru care f(a)=6 este:",
        options: ["4", "6", "8", "2"], correct: "4" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Soluția reală a ecuației log₇(2x+1)=log₇9 este:",
        options: ["4", "9", "5", "8"], correct: "4" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea A={1,2,3,…,23}, acesta să verifice inegalitatea n≥10, este:",
        options: ["14/23", "13/23", "10/23", "1/2"], correct: "14/23" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Coordonatele mijlocului segmentului AB, cu A(−1,2) și B(1,6), sunt:",
        options: ["(0, 4)", "(0, 8)", "(1, 4)", "(−1, 4)"], correct: "(0, 4)" },
      { label: "I.6", topic: "Geometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AC=√2 și BC=2. Lungimea catetei AB este:",
        options: ["√2", "2", "√6", "1"], correct: "√2" },
    ],
  },
  {
    year: 2023, variant: "var-05",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei 4·(1−4/5)+1/5 este:",
        options: ["1", "4/5", "5", "2"], correct: "1" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=3x+2. Valoarea produsului f(0)·f(1) este:",
        options: ["10", "7", "5", "12"], correct: "10" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 3^(2x−3)=3^x este:",
        options: ["3", "−3", "1", "2"], correct: "3" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea A={0,1,2,3,4,5,6,7,8,9}, acesta să verifice inegalitatea n²≤23, este:",
        options: ["1/2", "2/5", "5/9", "11/50"], correct: "1/2" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Perimetrul triunghiului OAB, unde O este originea reperului, A(0,3) și B(4,0), este:",
        options: ["12", "7", "5", "24"], correct: "12" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Valoarea expresiei (1+2cos60°)·sin30° este:",
        options: ["1", "2", "1/2", "√3"], correct: "1" },
    ],
  },
  {
    year: 2023, variant: "var-06",
    items: [
      { label: "I.1", topic: "Progresii aritmetice",
        content: "Termenul a₃ al progresiei aritmetice (aₙ)ₙ≥₁, cu a₁=10 și a₂=20, este:",
        options: ["30", "40", "20", "25"], correct: "30" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x+4. Valoarea expresiei f(0)+f(1) este:",
        options: ["10", "8", "6", "12"], correct: "10" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Soluția reală a ecuației log₂(x−4)=log₂4 este:",
        options: ["8", "4", "12", "0"], correct: "8" },
      { label: "I.4", topic: "Procente",
        content: "Un produs costă 80 de lei. Prețul produsului după o ieftinire cu 20% este:",
        options: ["64 lei", "60 lei", "16 lei", "96 lei"], correct: "64 lei" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Distanța dintre punctele M(0,2) și N(3,6) este:",
        options: ["5", "7", "√13", "4"], correct: "5" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Aria triunghiului ABC, dreptunghic în A, cu AB=4 și măsura unghiului C egală cu 45°, este:",
        options: ["8", "16", "4", "8√2"], correct: "8" },
    ],
  },
  {
    year: 2023, variant: "var-07",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei 1,5+3·(1−0,5) este:",
        options: ["3", "1,5", "4,5", "2"], correct: "3" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=5−x. Valoarea expresiei f(0)−f(1) este:",
        options: ["1", "−1", "9", "0"], correct: "1" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Soluția reală a ecuației √(3x−8)=1 este:",
        options: ["3", "1", "9", "2"], correct: "3" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea A={1,3,5,7,9}, acesta să verifice inegalitatea 2n≥9, este:",
        options: ["3/5", "2/5", "4/5", "1/5"], correct: "3/5" },
      { label: "I.5", topic: "Geometrie analitică. Triunghi isoscel",
        content: "Se consideră punctele A(1,0), B(1,2) și C(4,1). Triunghiul ABC este isoscel, lungimea comună a laturilor AC și BC fiind:",
        options: ["√10", "2", "3", "√13"], correct: "√10" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu aria egală cu 50 și AC=5. Lungimea laturii AB este:",
        options: ["20", "10", "25", "4"], correct: "20" },
    ],
  },
  {
    year: 2024, variant: "model",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei 1/8+3·(1−3/8) este:",
        options: ["2", "1", "5/8", "3"], correct: "2" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x−2. Valoarea reală a lui a pentru care f(a)=0 este:",
        options: ["1", "0", "2", "−1"], correct: "1" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 5^(2x)=5^(2+x) este:",
        options: ["2", "1", "−2", "3"], correct: "2" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea A={1,2,3,4,5,6,7,8,9}, acesta să verifice inegalitatea n+9≤15, este:",
        options: ["2/3", "1/3", "5/9", "6/10"], correct: "2/3" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Numerele reale a și b, știind că C(a,b) este mijlocul segmentului AB cu A(0,5) și B(4,−5), sunt:",
        options: ["a=2, b=0", "a=0, b=2", "a=4, b=0", "a=2, b=5"], correct: "a=2, b=0" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Valoarea expresiei √2·(sin45°+cos45°)·sin30° este:",
        options: ["1", "2", "√2", "1/2"], correct: "1" },
    ],
  },
  {
    year: 2024, variant: "simulare",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei (0,2+3/10)·10 este:",
        options: ["5", "2", "0,5", "3"], correct: "5" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x+3. Valoarea reală a lui a pentru care f(a)=7 este:",
        options: ["2", "7", "5", "4"], correct: "2" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Mulțimea soluțiilor reale ale ecuației √(x²+2x+4)=2 este:",
        options: ["{−2, 0}", "{0, 2}", "{−2}", "{0}"], correct: "{−2, 0}" },
      { label: "I.4", topic: "Procente",
        content: "După o scumpire cu 50%, prețul unui obiect este de 225 de lei. Prețul obiectului înainte de scumpire este:",
        options: ["150 lei", "175 lei", "112,5 lei", "200 lei"], correct: "150 lei" },
      { label: "I.5", topic: "Geometrie analitică. Triunghi isoscel",
        content: "Se consideră punctele A(1,3), B(5,0) și C(5,5). Triunghiul ABC este isoscel, lungimea comună a laturilor AB și BC fiind:",
        options: ["5", "2√5", "√20", "4"], correct: "5" },
      { label: "I.6", topic: "Trigonometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AB=3 și BC=5. Valoarea tg B este:",
        options: ["4/3", "3/4", "4/5", "5/3"], correct: "4/3" },
    ],
  },
  {
    year: 2024, variant: "var-01",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei (1/2+1/4)·4/3 este:",
        options: ["1", "3/4", "4/3", "2"], correct: "1" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x−8. Valoarea reală a lui a pentru care f(a)=0 este:",
        options: ["4", "8", "0", "−4"], correct: "4" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Soluția reală a ecuației √(3x−2)=1 este:",
        options: ["1", "3", "2", "0"], correct: "1" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea A={11,12,13,14,15,16,17,18,19,20}, acesta să aibă suma cifrelor egală cu 2, este:",
        options: ["1/5", "1/10", "3/10", "2/5"], correct: "1/5" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Se consideră punctele A(3,4) și B(6,8). Lungimea comună a segmentelor OA și AB (O originea reperului) este:",
        options: ["5", "√5", "10", "25"], correct: "5" },
      { label: "I.6", topic: "Geometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AB=12, AC=8 și M mijlocul laturii AB. Lungimea segmentului CM este:",
        options: ["10", "6", "√208", "14"], correct: "10" },
    ],
  },
  {
    year: 2024, variant: "var-03",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei (0,3+0,4)·10+2·0,5 este:",
        options: ["8", "7", "6", "9"], correct: "8" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x−1. Valoarea expresiei f(1)+f(2) este:",
        options: ["4", "3", "5", "2"], correct: "4" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Soluția reală a ecuației log₅(2x+1)=log₅5 este:",
        options: ["2", "5", "4", "1"], correct: "2" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr din mulțimea A={11,21,31,41,51,61,71,81,91}, acesta să fie divizibil cu 3, este:",
        options: ["1/3", "2/9", "1/9", "4/9"], correct: "1/3" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Se consideră punctele A(3,1), B(m,2) și C(5,3). Valoarea reală a lui m, știind că punctul B este mijlocul segmentului AC, este:",
        options: ["4", "2", "8", "3"], correct: "4" },
      { label: "I.6", topic: "Geometrie. Triunghi dreptunghic",
        content: "Perimetrul triunghiului ABC, dreptunghic în A, cu BC=20 și AC=16, este:",
        options: ["48", "36", "56", "44"], correct: "48" },
    ],
  },
  {
    year: 2024, variant: "var-09",
    items: [
      { label: "I.1", topic: "Numere reale. Radicali",
        content: "Valoarea expresiei √2·(3+2√2)−3√2+3 este:",
        options: ["7", "4", "3", "6√2"], correct: "7" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=3x−6. Valoarea reală a lui m pentru care f(m)=3 este:",
        options: ["3", "9", "−3", "1"], correct: "3" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 5^(4x−2)=5² este:",
        options: ["1", "2", "4", "−1"], correct: "1" },
      { label: "I.4", topic: "Procente",
        content: "Prețul unui obiect este 300 de lei. Prețul obiectului după o ieftinire cu 30% este:",
        options: ["210 lei", "270 lei", "90 lei", "390 lei"], correct: "210 lei" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Se consideră punctele A(1,1), B(5,m) și M(3,4). Valoarea reală a lui m, știind că punctul M este mijlocul segmentului AB, este:",
        options: ["7", "4", "8", "3"], correct: "7" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Valoarea expresiei 2(sin45°+sin30°)(sin45°−sin30°) este:",
        options: ["1/2", "1", "√2/2", "1/4"], correct: "1/2" },
    ],
  },
  {
    year: 2024, variant: "var-10",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei 12/5·(1/2+1/3) este:",
        options: ["2", "5/6", "1", "3"], correct: "2" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=5x+1. Valoarea reală a lui a pentru care f(a)=6 este:",
        options: ["1", "6", "5", "−1"], correct: "1" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Soluția reală a ecuației √(4x+1)=3 este:",
        options: ["2", "3", "9", "4"], correct: "2" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr din mulțimea A={10,20,30,40,50,60,70,80,90}, acesta să fie divizibil cu 20, este:",
        options: ["4/9", "1/3", "5/9", "2/9"], correct: "4/9" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Se consideră punctele A(2,0), B(8,8) și C(11,4). Lungimile segmentelor AB și BC sunt:",
        options: ["AB=10, BC=5", "AB=5, BC=10", "AB=BC=10", "AB=8, BC=4"], correct: "AB=10, BC=5" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Valoarea expresiei 2sin60°·cos30° este:",
        options: ["3/2", "1", "2", "√3"], correct: "3/2" },
    ],
  },
];

function validate() {
  let errs = 0, n = 0;
  for (const p of GRILE) {
    const labels = new Set();
    for (const it of p.items) {
      n++;
      const where = `${p.year}-${p.variant}-${it.label}`;
      if (labels.has(it.label)) { console.error(`  ✗ dup label ${where}`); errs++; }
      labels.add(it.label);
      if (!it.options || it.options.length < 3) { console.error(`  ✗ <3 options ${where}`); errs++; }
      if (new Set(it.options).size !== it.options.length) { console.error(`  ✗ dup option ${where}`); errs++; }
      if (!it.options.includes(it.correct)) { console.error(`  ✗ correct not in options ${where}: "${it.correct}"`); errs++; }
      if (!it.content || !it.content.trim().endsWith(":")) { console.error(`  ✗ content should end with ":" ${where}`); errs++; }
    }
  }
  console.log(`validate: ${n} grile across ${GRILE.length} paper(s), ${errs} error(s)`);
  return errs;
}

async function run(dry) {
  const prisma = new PrismaClient();
  try {
    const domain = await prisma.domain.findUnique({ where: { slug: DOMAIN_SLUG } });
    if (!domain) throw new Error(`domain ${DOMAIN_SLUG} not found`);
    const rows = [];
    for (const p of GRILE) {
      for (const it of p.items) {
        rows.push({
          domainId: domain.id, subject: SUBJECT, topic: it.topic, difficulty: 3,
          type: "MULTIPLE_CHOICE", content: it.content, passage: null,
          options: it.options, correctAnswer: it.correct, imageUrl: null,
          sourceReference: `${TAG_PREFIX}:${p.year}-${p.variant}-${it.label}`, source: "MANUAL", status: "PUBLISHED",
        });
      }
    }
    console.log(`  domain=${DOMAIN_SLUG} grile to create=${rows.length}`);
    if (dry) { console.log("  (dry — no writes)"); return; }
    const del = await prisma.question.deleteMany({ where: { domainId: domain.id, sourceReference: { startsWith: `${TAG_PREFIX}:` } } });
    let created = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const slice = rows.slice(i, i + 50);
      await prisma.question.createMany({ data: slice });
      created += slice.length;
    }
    const pub = await prisma.question.count({ where: { domainId: domain.id, status: "PUBLISHED", type: "MULTIPLE_CHOICE" } });
    console.log(`  ✅ deleted ${del.count} prior ${TAG_PREFIX}, created ${created}. Domain PUBLISHED MCQ now=${pub}`);
  } finally { await prisma.$disconnect(); }
}

if (MODE === "validate") { process.exit(validate() > 0 ? 1 : 0); }
else { run(MODE === "dry").catch((e) => { console.error(e); process.exit(1); }); }
