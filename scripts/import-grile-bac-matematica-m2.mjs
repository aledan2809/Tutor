#!/usr/bin/env node
/**
 * import-grile-bac-matematica-m2.mjs — BAC Matematică M2 (Științele naturii) → GRILE (MCQ)
 *
 * Clone of import-grile-bac-matematica-m1.mjs for the M2 (st-nat) program. BAC Matematică
 * Subiectul I has 6 short-answer items per paper, each with a concrete result in the official
 * BAREM. These grile are built FROM that ground truth (L09):
 *   • the question is the official cerință (reframed "Arătați că…/Determinați…" → "valoarea … este:"),
 *   • the CORRECT option is the official barem result (verbatim),
 *   • distractors are plausible numeric/sign alternatives (manual, no AI).
 * Math notation is plain Unicode inline (the UI has no KaTeX/MathJax) — transcribed from the
 * rendered PDF, not from the (garbled) fitz text dump.
 *
 * Target: domain `matematica-m2-ix-xii` (slug → Bacalaureat), subject
 * "Matematică M2 (Științele naturii) — Bacalaureat", source MANUAL, status PUBLISHED.
 * The 3 BAC programs (M1/M2/M3) are NEVER mixed — each has its own domain + script.
 * Idempotent: deletes prior bac-grile-mate-m2:% rows in this domain then recreates.
 *
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL from env (VPS2 local PG).
 */
import { PrismaClient } from "@prisma/client";

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

const SUBJECT = "Matematică M2 (Științele naturii) — Bacalaureat";
const DOMAIN_SLUG = "matematica-m2-ix-xii";
const TAG_PREFIX = "bac-grile-mate-m2";

// Per paper: barem-anchored MCQ. `correct` MUST equal one option verbatim.
const GRILE = [
  {
    year: 2022, variant: "model",
    items: [
      { label: "I.1", topic: "Logaritmi",
        content: "Valoarea numărului N=log₂24−log₂12+3 este:",
        options: ["4", "2", "8", "1"], correct: "4" },
      { label: "I.2", topic: "Funcții. Grafic",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x−1. Valoarea reală a lui a pentru care punctul A(a,a²) aparține graficului funcției f este:",
        options: ["1", "−1", "2", "0"], correct: "1" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Soluția reală a ecuației √(x²−2x−2)=x−2 este:",
        options: ["3", "2", "−1", "1"], correct: "3" },
      { label: "I.4", topic: "Probabilități",
        content: "Se consideră mulțimea A={1!,2!,3!,…,10!}. Probabilitatea ca, alegând un număr din mulțimea A, acesta să fie divizibil cu 9, este:",
        options: ["1/2", "2/5", "1/9", "3/10"], correct: "1/2" },
      { label: "I.5", topic: "Vectori",
        content: "Se consideră triunghiul ABC, D mijlocul segmentului BC, iar E și F puncte astfel încât AE⃗=FD⃗. Vectorul 2(EB⃗+FC⃗) este egal cu:",
        options: ["AB⃗+AC⃗", "AB⃗−AC⃗", "2AB⃗", "BC⃗"], correct: "AB⃗+AC⃗" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Pentru orice număr real x, expresia (sin x+cos x)²−(sin x−cos x)² este egală cu:",
        options: ["2sin2x", "2cos2x", "sin2x", "4cos2x"], correct: "2sin2x" },
    ],
  },
  {
    year: 2022, variant: "simulare",
    items: [
      { label: "I.1", topic: "Progresii geometrice",
        content: "Termenul b₄ al progresiei geometrice (bₙ)ₙ≥₁, cu b₁=√2 și b₂=4, este:",
        options: ["32", "16", "8√2", "16√2"], correct: "32" },
      { label: "I.2", topic: "Funcția de gradul II. Tangentă",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=mx²−2x+1, cu m număr real nenul. Valoarea reală a lui m pentru care axa Ox este tangentă graficului funcției f este:",
        options: ["1", "−1", "2", "4"], correct: "1" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 3^(x+2)−3^x−6·3^(x−1)=6 este:",
        options: ["0", "1", "2", "−1"], correct: "0" },
      { label: "I.4", topic: "Probabilități",
        content: "Se consideră mulțimea A a numerelor naturale de două cifre. Probabilitatea ca, alegând un număr n din mulțimea A, numărul 2n−60 să aparțină mulțimii A, este:",
        options: ["1/2", "45/100", "9/10", "1/3"], correct: "1/2" },
      { label: "I.5", topic: "Geometrie analitică. Perpendicularitate",
        content: "În reperul cartezian xOy se consideră punctele A(−1,4), B(5,2) și C, mijlocul segmentului AB. Ecuația dreptei d care trece prin punctul C și este perpendiculară pe dreapta AB este:",
        options: ["y=3x−3", "y=−x/3+3", "y=3x+3", "y=−3x−3"], correct: "y=3x−3" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Aria triunghiului isoscel ABC, cu măsura unghiului A egală cu 120° și AB=6, este:",
        options: ["9√3", "18√3", "9", "36√3"], correct: "9√3" },
    ],
  },
  {
    year: 2022, variant: "var-01",
    items: [
      { label: "I.1", topic: "Progresii aritmetice",
        content: "Termenul a₁ al progresiei aritmetice (aₙ)ₙ≥₁, cu a₂=6 și a₃=12, este:",
        options: ["0", "2", "6", "−6"], correct: "0" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x−5. Valoarea reală a lui a pentru care f(a)+f(2a)=2 este:",
        options: ["4", "2", "3", "6"], correct: "4" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 5^x·(1/5)=25 este:",
        options: ["3", "2", "1", "4"], correct: "3" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să fie multiplu de 16, este:",
        options: ["1/15", "6/100", "1/16", "3/45"], correct: "1/15" },
      { label: "I.5", topic: "Geometrie analitică. Vectori",
        content: "În reperul cartezian xOy se consideră punctele A(3,2) și B(1,4). Coordonatele punctului C, astfel încât punctul A este mijlocul segmentului BC, sunt:",
        options: ["(5, 0)", "(2, 3)", "(−1, 6)", "(5, 6)"], correct: "(5, 0)" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Se consideră expresia E(x)=sin x+sin(3x/2)−cos(x/2), unde x este număr real. Valoarea E(π/3) este:",
        options: ["1", "0", "√3", "1/2"], correct: "1" },
    ],
  },
  {
    year: 2022, variant: "var-03",
    items: [
      { label: "I.1", topic: "Numere reale. Radicali",
        content: "Valoarea expresiei √2(√2−1)(2+√2) este:",
        options: ["2", "4", "2√2", "0"], correct: "2" },
      { label: "I.2", topic: "Funcții. Grafic",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x²−4x. Abscisele punctelor de intersecție a graficului funcției f cu axa Ox sunt:",
        options: ["0 și 2", "0 și 4", "2 și 4", "−2 și 0"], correct: "0 și 2" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 2^(x−3)=1/2^(2x) este:",
        options: ["1", "3", "−1", "0"], correct: "1" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să fie multiplu de 11, este:",
        options: ["1/10", "9/100", "1/11", "1/9"], correct: "1/10" },
      { label: "I.5", topic: "Geometrie analitică. Triunghi isoscel",
        content: "Se consideră punctele A(−1,0), B(0,3) și C(4,0). Triunghiul ABC este isoscel, lungimea comună a laturilor AC și BC fiind:",
        options: ["5", "√10", "√13", "4"], correct: "5" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Se consideră expresia E(x)=tg x+sin(3x/2)−2cos(x/2), unde x∈(0,π/2). Valoarea E(π/3) este:",
        options: ["1", "0", "√3", "2"], correct: "1" },
    ],
  },
  {
    year: 2022, variant: "var-07",
    items: [
      { label: "I.1", topic: "Numere reale. Medii",
        content: "Media aritmetică a numerelor a=20−√21 și b=22+√21 este:",
        options: ["21", "20", "22", "42"], correct: "21" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcțiile f:ℝ→ℝ, f(x)=x−1 și g:ℝ→ℝ, g(x)=3−x. Pentru orice număr real a, valoarea expresiei f(a)+g(a) este:",
        options: ["2", "4", "2a", "a+2"], correct: "2" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Mulțimea soluțiilor reale ale ecuației √(7x−6)=x este:",
        options: ["{1, 6}", "{6}", "{1}", "{−1, 6}"], correct: "{1, 6}" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul numerelor naturale pare, de două cifre, care au cifrele elemente ale mulțimii {1,2,3,4}, este:",
        options: ["8", "6", "4", "16"], correct: "8" },
      { label: "I.5", topic: "Geometrie analitică. Triunghi isoscel",
        content: "Se consideră punctele A(6,0) și B(6,6), iar M mijlocul segmentului OB. Triunghiul AOM este isoscel, lungimea comună a laturilor OM și AM fiind:",
        options: ["3√2", "6", "2√3", "3"], correct: "3√2" },
      { label: "I.6", topic: "Geometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AC=4 și măsura unghiului B egală cu 60°. Lungimea înălțimii din vârful A a triunghiului ABC este:",
        options: ["2", "4", "2√3", "√3"], correct: "2" },
    ],
  },
  {
    year: 2023, variant: "model",
    items: [
      { label: "I.1", topic: "Progresii geometrice. Radicali",
        content: "Valoarea expresiei (5−2√6)(5+√24) este:",
        options: ["1", "49", "25", "2√6"], correct: "1" },
      { label: "I.2", topic: "Funcții. Compunere",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=ax+1, cu a număr real nenul. Valoarea reală nenulă a lui a pentru care (f∘f)(1)=1 este:",
        options: ["−1", "1", "−2", "2"], correct: "−1" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 2^x·(1/4)^(2−x)=32 este:",
        options: ["3", "2", "5", "1"], correct: "3" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul submulțimilor ordonate, cu câte două elemente, care se pot forma cu elementele mulțimii M={0,1,2,3,4}, este:",
        options: ["20", "10", "25", "16"], correct: "20" },
      { label: "I.5", topic: "Geometrie analitică. Perpendicularitate",
        content: "În reperul cartezian xOy se consideră punctele A(−2,1) și B(2,5). Ecuația dreptei d care trece prin punctul B și este perpendiculară pe dreapta AB este:",
        options: ["y=−x+7", "y=x+3", "y=−x+3", "y=x+7"], correct: "y=−x+7" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Pentru orice x∈(0,π/2), expresia (tg x+1)(ctg x−1) este egală cu:",
        options: ["2ctg2x", "2tg2x", "ctg2x", "2cos2x"], correct: "2ctg2x" },
    ],
  },
  {
    year: 2023, variant: "simulare",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Valoarea expresiei 2(1+i)−i(2−i), unde i²=−1, este:",
        options: ["1", "−1", "3", "1+2i"], correct: "1" },
      { label: "I.2", topic: "Funcții. Grafic",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=3x+10. Valoarea reală a lui a pentru care punctul A(2a,a) aparține graficului funcției f este:",
        options: ["−2", "2", "−10", "10"], correct: "−2" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Soluția reală a ecuației √(2x²+2)=2x este:",
        options: ["1", "−1", "2", "√2"], correct: "1" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul numerelor naturale impare, de trei cifre, care se pot forma cu elementele mulțimii A={0,1,2,3,4}, este:",
        options: ["40", "48", "50", "20"], correct: "40" },
      { label: "I.5", topic: "Vectori. Coliniaritate",
        content: "Valoarea reală a lui a pentru care vectorii u⃗=ai⃗+(a−1)j⃗ și v⃗=i⃗+2j⃗ sunt coliniari este:",
        options: ["−1", "1", "2", "−2"], correct: "−1" },
      { label: "I.6", topic: "Geometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu măsura unghiului B egală cu π/6 și BC=24. Bisectoarea unghiului C intersectează latura AB în punctul D. Lungimea segmentului CD este:",
        options: ["8√3", "12", "12√3", "16"], correct: "8√3" },
    ],
  },
  {
    year: 2023, variant: "var-01",
    items: [
      { label: "I.1", topic: "Numere reale. Radicali",
        content: "Valoarea expresiei 4−6√3+3(2√3−1) este:",
        options: ["1", "4", "−3", "6√3"], correct: "1" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcțiile f:ℝ→ℝ, f(x)=5x−3 și g:ℝ→ℝ, g(x)=2x+3. Valoarea reală a lui a pentru care f(a)=g(a) este:",
        options: ["2", "−2", "3", "6"], correct: "2" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 2^(2x+1)·2³=1 este:",
        options: ["−2", "2", "−1", "0"], correct: "−2" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul numerelor naturale de două cifre distincte care se pot forma cu cifre din mulțimea A={3,4,5,6} este:",
        options: ["12", "16", "8", "6"], correct: "12" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(4,0), B(0,2), C(3,3) și M, mijlocul segmentului AB. Lungimea comună a segmentelor MO și MC este:",
        options: ["√5", "5", "√10", "2√5"], correct: "√5" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Se consideră E(x)=2sin x·sin2x−cos x, unde x este număr real. Valoarea E(π/6) este:",
        options: ["0", "√3/2", "1", "−√3/2"], correct: "0" },
    ],
  },
  {
    year: 2023, variant: "var-06",
    items: [
      { label: "I.1", topic: "Numere reale. Radicali",
        content: "Valoarea expresiei (√6−2)(√6+2) este:",
        options: ["2", "4", "6", "√6"], correct: "2" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²+1. Mulțimea valorilor reale ale lui a pentru care f(a)=1−a este:",
        options: ["{−1, 0}", "{0, 1}", "{−1}", "{0}"], correct: "{−1, 0}" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Mulțimea soluțiilor reale ale ecuației log₄(x²+4)=log₄(6x−4) este:",
        options: ["{2, 4}", "{−2, 4}", "{2}", "{4}"], correct: "{2, 4}" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul numerelor naturale de două cifre, cu cifra zecilor număr impar, care se pot forma cu elementele mulțimii {1,2,3,4,5}, este:",
        options: ["15", "10", "25", "9"], correct: "15" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "Distanța de la punctul O la mijlocul segmentului AB, unde A(1,−5) și B(5,5), este:",
        options: ["3", "5", "√34", "4"], correct: "3" },
      { label: "I.6", topic: "Geometrie. Triunghi dreptunghic",
        content: "Aria triunghiului ABC, dreptunghic în A, cu AC=6 și tg C=√3, este:",
        options: ["18√3", "36√3", "9√3", "18"], correct: "18√3" },
    ],
  },
  {
    year: 2023, variant: "var-07",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Valoarea expresiei 3−4i+i(4−i), unde i²=−1, este:",
        options: ["4", "2", "3", "4+4i"], correct: "4" },
      { label: "I.2", topic: "Funcții. Compunere",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=4−2x. Valoarea (f∘f)(1) este:",
        options: ["0", "2", "4", "−2"], correct: "0" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Mulțimea soluțiilor reale ale ecuației log₅(x²−2x+6)=log₅6 este:",
        options: ["{0, 2}", "{−2, 0}", "{2}", "{0}"], correct: "{0, 2}" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să fie divizibil cu 3 și cu 7, este:",
        options: ["2/45", "1/45", "4/45", "1/21"], correct: "2/45" },
      { label: "I.5", topic: "Geometrie analitică. Vectori",
        content: "În reperul cartezian xOy se consideră punctele A(1,2), B(a,0) și C(0,b). Numerele reale a și b pentru care punctul A este mijlocul segmentului BC sunt:",
        options: ["a=2, b=4", "a=4, b=2", "a=1, b=2", "a=2, b=2"], correct: "a=2, b=4" },
      { label: "I.6", topic: "Geometrie. Triunghi isoscel",
        content: "Se consideră triunghiul ABC, cu AB=AC=10 și BC=16. Lungimea înălțimii AD din vârful A este:",
        options: ["6", "8", "10", "12"], correct: "6" },
    ],
  },
  {
    year: 2024, variant: "model",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei 0,5+10·(1−0,75) este:",
        options: ["3", "2,5", "10", "0,5"], correct: "3" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcțiile f:ℝ→ℝ, f(x)=2x−1 și g:ℝ→ℝ, g(x)=x+1. Pentru orice număr real m, valoarea expresiei f(m)+g(−m) este:",
        options: ["m", "2m", "−m", "m−1"], correct: "m" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Mulțimea soluțiilor reale ale ecuației √(x²+6)=√(5x) este:",
        options: ["{2, 3}", "{−2, 3}", "{2}", "{3}"], correct: "{2, 3}" },
      { label: "I.4", topic: "Probabilități",
        content: "Se consideră mulțimea A={1,2,3,4,5,6,7,8,9}. Probabilitatea ca, alegând un număr din mulțimea A, acesta să fie divizor al lui 30, este:",
        options: ["5/9", "1/3", "4/9", "2/3"], correct: "5/9" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(1,1), B(2,2) și C(4,0). Triunghiul ABC este dreptunghic în vârful:",
        options: ["B", "A", "C", "O"], correct: "B" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Se consideră E(x)=3cos²x−cos(x/2)·sin x, unde x este număr real. Valoarea E(π/3) este:",
        options: ["0", "3/4", "1", "√3/2"], correct: "0" },
    ],
  },
  {
    year: 2024, variant: "simulare",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Valoarea expresiei z₁+iz₂, unde z₁=3−i și z₂=1+i, este:",
        options: ["2", "4", "3", "2+2i"], correct: "2" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcțiile f:ℝ→ℝ, f(x)=5−x și g:ℝ→ℝ, g(x)=x+2. Valoarea reală a lui a pentru care f(a)=g(a+1) este:",
        options: ["1", "−1", "2", "3"], correct: "1" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Mulțimea soluțiilor reale ale ecuației log₃(4x−x²)=1 este:",
        options: ["{1, 3}", "{−1, 3}", "{1}", "{3}"], correct: "{1, 3}" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul numerelor naturale impare, de două cifre, cu cifra zecilor număr par, care se pot forma cu elementele mulțimii A={1,2,3,4,5,6,7}, este:",
        options: ["12", "9", "16", "21"], correct: "12" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(0,3), B(2,0) și C, știind că punctul B este mijlocul segmentului OC. Distanța dintre punctele A și C este:",
        options: ["5", "4", "√13", "√7"], correct: "5" },
      { label: "I.6", topic: "Geometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu B=π/6 și mediana AM=4. Aria triunghiului ABC este:",
        options: ["8√3", "16√3", "4√3", "8"], correct: "8√3" },
    ],
  },
  {
    year: 2024, variant: "var-03",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Valoarea expresiei 2−5i+i(5−3i), unde i²=−1, este:",
        options: ["5", "−1", "2", "5−5i"], correct: "5" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=6x+m, unde m este număr real. Valoarea reală a lui m pentru care f(2)=15 este:",
        options: ["3", "12", "15", "−3"], correct: "3" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 7^(2x+1)=7^x·7² este:",
        options: ["1", "2", "3", "−1"], correct: "1" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să aibă cel puțin una dintre cifre egală cu 1, este:",
        options: ["1/5", "1/9", "2/9", "18/100"], correct: "1/5" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(2,5) și B(4,2). Distanța dintre punctul A și mijlocul segmentului OB este:",
        options: ["4", "2", "√17", "5"], correct: "4" },
      { label: "I.6", topic: "Trigonometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AB=5 și BC=5√5. Valoarea sin C este:",
        options: ["√5/5", "2√5/5", "1/5", "√5"], correct: "√5/5" },
    ],
  },
  {
    year: 2024, variant: "var-08",
    items: [
      { label: "I.1", topic: "Numere reale",
        content: "Valoarea expresiei 2·(1,2+0,1)+0,4 este:",
        options: ["3", "2,6", "2", "3,4"], correct: "3" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x+1. Valoarea reală a lui a pentru care f(a)−f(2)=a este:",
        options: ["4", "2", "5", "−4"], correct: "4" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Mulțimea soluțiilor reale ale ecuației log₈(x²−5x+5)=log₈x este:",
        options: ["{1, 5}", "{−1, 5}", "{1}", "{5}"], correct: "{1, 5}" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul numerelor naturale impare, de două cifre distincte, care se pot forma cu elementele mulțimii A={1,3,4,6,8}, este:",
        options: ["8", "10", "6", "4"], correct: "8" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(0,8), B(4,2) și C, mijlocul segmentului OA. Coordonatele mijlocului segmentului BC sunt:",
        options: ["(2, 3)", "(2, 5)", "(4, 6)", "(0, 4)"], correct: "(2, 3)" },
      { label: "I.6", topic: "Geometrie. Triunghi dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AB=8 și C=π/4. Aria triunghiului ABC este:",
        options: ["32", "64", "16", "32√2"], correct: "32" },
    ],
  },
  {
    year: 2024, variant: "var-09",
    items: [
      { label: "I.1", topic: "Numere reale. Radicali",
        content: "Valoarea expresiei 6−2√5+√5·(2−√5) este:",
        options: ["1", "6", "−5", "2√5"], correct: "1" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=2x−3. Valoarea reală a lui a pentru care f(a)+f(1)=0 este:",
        options: ["2", "−2", "1", "3"], correct: "2" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 10^(x−1)=10^(−2x)·10² este:",
        options: ["1", "−1", "2", "3"], correct: "1" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul numerelor naturale de două cifre distincte, care se pot forma cu cifre din mulțimea A={1,2,3,4,5,6} și au ambele cifre pare, este:",
        options: ["6", "9", "12", "3"], correct: "6" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(4,6) și B(6,0), iar M mijlocul segmentului OA. Distanța dintre punctele B și M este:",
        options: ["5", "4", "√13", "6"], correct: "5" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AC=6 și aria egală cu 24. Lungimea laturii AB este:",
        options: ["8", "4", "12", "6"], correct: "8" },
    ],
  },
  {
    year: 2024, variant: "var-10",
    items: [
      { label: "I.1", topic: "Progresii aritmetice",
        content: "Termenul a₁ al progresiei aritmetice (aₙ)ₙ≥₁, cu a₂=8 și a₃=12, este:",
        options: ["4", "2", "8", "−4"], correct: "4" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=3x−2. Valoarea reală a lui m pentru care f(m)=m este:",
        options: ["1", "−1", "2", "3"], correct: "1" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Mulțimea soluțiilor reale ale ecuației log₆(9−x²)=log₆5 este:",
        options: ["{−2, 2}", "{−4, 4}", "{2}", "{4}"], correct: "{−2, 2}" },
      { label: "I.4", topic: "Probabilități",
        content: "Se consideră mulțimea A={0,1,2,…,9}. Probabilitatea ca, alegând un număr n din mulțimea A, numărul √(2n+1) să aparțină mulțimii A, este:",
        options: ["1/5", "1/10", "3/10", "2/9"], correct: "1/5" },
      { label: "I.5", topic: "Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(1,0), B(4,4) și C(5,2). Triunghiul ABC este dreptunghic în vârful:",
        options: ["C", "A", "B", "O"], correct: "C" },
      { label: "I.6", topic: "Trigonometrie",
        content: "Se consideră expresia E(x)=2sin x·cos(x/2)+(sin(3x/4))², unde x este număr real. Valoarea E(π/3) este:",
        options: ["2", "1", "3", "3/2"], correct: "2" },
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
