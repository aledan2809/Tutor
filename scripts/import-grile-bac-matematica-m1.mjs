#!/usr/bin/env node
/**
 * import-grile-bac-matematica-m1.mjs — BAC Matematică M1 (Mate-Info) → GRILE (MCQ)
 *
 * BAC Matematică Subiectul I has 6 short-answer items per paper, each with a concrete
 * result in the official BAREM. These grile are built FROM that ground truth (L09):
 *   • the question is the official cerință (reframed "Arătați că…/Determinați…" → "valoarea … este:"),
 *   • the CORRECT option is the official barem result (verbatim),
 *   • distractors are plausible numeric/sign alternatives (manual, no AI).
 * Math notation is plain Unicode inline (the UI has no KaTeX/MathJax) — transcribed from the
 * rendered PDF, not from the (garbled) fitz text dump.
 *
 * Target: domain `matematica-m1-ix-xii` (slug → Bacalaureat), subject
 * "Matematică M1 (Mate-Info) — Bacalaureat", source MANUAL, status PUBLISHED.
 * The 3 BAC programs (M1/M2/M3) are NEVER mixed — each has its own domain + script.
 * Idempotent: deletes prior bac-grile-mate-m1:% rows in this domain then recreates.
 *
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL from env (VPS2 local PG).
 */
import { PrismaClient } from "@prisma/client";

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

const SUBJECT = "Matematică M1 (Mate-Info) — Bacalaureat";
const DOMAIN_SLUG = "matematica-m1-ix-xii";
const TAG_PREFIX = "bac-grile-mate-m1";

// Per paper: barem-anchored MCQ. `correct` MUST equal one option verbatim.
const GRILE = [
  {
    year: 2024, variant: "model",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Valoarea expresiei 2(1−2i)+i(4+i), unde i²=−1, este:",
        options: ["1", "−1", "5", "1+8i"], correct: "1" },
      { label: "I.2", topic: "Funcții. Grafic",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²+ax−a, unde a este număr real. Valoarea reală a lui a pentru care punctul A(3,−3) aparține graficului funcției f este:",
        options: ["−6", "6", "−3", "3"], correct: "−6" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Mulțimea soluțiilor reale ale ecuației log₂(x²+8)=log₂(8−2x) este:",
        options: ["{−2, 0}", "{0, 2}", "{−2, 2}", "{−4, 0}"], correct: "{−2, 0}" },
      { label: "I.4", topic: "Elemente de combinatorică",
        content: "Numărul numerelor naturale de două cifre distincte, cu cifra zecilor pară, care se pot forma cu elementele mulțimii A={1,2,3,4,5} este:",
        options: ["8", "10", "6", "16"], correct: "8" },
      { label: "I.5", topic: "Vectori. Geometrie analitică",
        content: "În sistemul cartezian xOy se consideră punctele A(0,3) și B(4,0). Coordonatele punctului C pentru care OC⃗=OA⃗+OB⃗ sunt:",
        options: ["(4, 3)", "(3, 4)", "(4, −3)", "(−4, 3)"], correct: "(4, 3)" },
      { label: "I.6", topic: "Trigonometrie. Triunghiul",
        content: "Se consideră triunghiul ascuțitunghic ABC, cu AB=5, măsura unghiului C egală cu π/4 și înălțimea AD=4 (D pe BC). Lungimea laturii BC este:",
        options: ["7", "5", "9", "6"], correct: "7" },
    ],
  },
  {
    year: 2022, variant: "model",
    items: [
      { label: "I.1", topic: "Progresii geometrice. Radicali",
        content: "Valoarea produsului (6−3√3)(2+√3) este:",
        options: ["3", "1", "9", "6"], correct: "3" },
      { label: "I.2", topic: "Funcția de gradul II. Tangentă",
        content: "Valorile reale ale lui m pentru care axa Ox este tangentă graficului funcției f:ℝ→ℝ, f(x)=x²+mx+1, sunt:",
        options: ["{−2, 2}", "{−4, 4}", "{−1, 1}", "{0, 4}"], correct: "{−2, 2}" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 5^(x+2)=5^x+24 este:",
        options: ["0", "1", "2", "−1"], correct: "0" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre distincte, acesta să aibă cifra zecilor multiplu de 3, este:",
        options: ["1/3", "1/9", "3/10", "27/90"], correct: "1/3" },
      { label: "I.5", topic: "Vectori. Coliniaritate",
        content: "Se consideră triunghiul ABC, D mijlocul laturii AC și punctul M astfel încât MA⃗+2MB⃗+3MC⃗=0⃗. Vectorul MD⃗ este coliniar cu vectorul:",
        options: ["AB⃗", "AC⃗", "BC⃗", "BD⃗"], correct: "AB⃗" },
      { label: "I.6", topic: "Trigonometrie. Teorema sinusurilor",
        content: "În triunghiul ABC cu AC=3, măsura unghiului A de 30° și măsura unghiului B de 60°, lungimea laturii AB este:",
        options: ["2√3", "3√3", "√3", "6"], correct: "2√3" },
    ],
  },
  {
    year: 2022, variant: "simulare",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Se consideră numerele complexe z₁=1−2i și z₂=2+i. Valoarea expresiei (z₁+i)(z₂−1) este:",
        options: ["2", "1+i", "1−i", "0"], correct: "2" },
      { label: "I.2", topic: "Funcția de gradul II. Semnul",
        content: "Valorile reale ale lui m pentru care f:ℝ→ℝ, f(x)=x²+4x+m, satisface f(x)>0 pentru orice număr real x, sunt:",
        options: ["(4, +∞)", "(−∞, 4)", "(−4, 4)", "(0, 4)"], correct: "(4, +∞)" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Soluția reală a ecuației 1+2log₂√(x−2)=log₂x este:",
        options: ["4", "2", "8", "3"], correct: "4" },
      { label: "I.4", topic: "Probabilități",
        content: "Se consideră mulțimea A a numerelor naturale de două cifre. Probabilitatea ca, alegând un număr din A, acesta să aibă exact doi multipli în mulțimea A, este:",
        options: ["8/45", "1/9", "16/45", "2/9"], correct: "8/45" },
      { label: "I.5", topic: "Geometrie analitică. Paralelogram",
        content: "În reperul cartezian xOy se consideră punctele A(−2,−2), B(3,1) și M(2,4). Coordonatele punctului N pentru care patrulaterul ABMN este paralelogram sunt:",
        options: ["(−3, 1)", "(3, 1)", "(−3, −1)", "(7, 3)"], correct: "(−3, 1)" },
      { label: "I.6", topic: "Trigonometrie. Triunghiul",
        content: "În triunghiul ABC are loc relația sin(A+B)+cos C=1. Măsura unghiului C este:",
        options: ["π/2", "π/3", "π/4", "π/6"], correct: "π/2" },
    ],
  },
  {
    year: 2022, variant: "var-01",
    items: [
      { label: "I.1", topic: "Radicali",
        content: "Valoarea expresiei 8−6√6+6(√6−1) este:",
        options: ["2", "8", "−6", "2√6"], correct: "2" },
      { label: "I.2", topic: "Funcții. Compunere",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=3x+m, unde m este număr real. Valoarea reală a lui m pentru care (f∘f)(0)=4 este:",
        options: ["1", "4", "3", "−1"], correct: "1" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 3·2^(2x)+4^x=4 este:",
        options: ["0", "1", "2", "−1"], correct: "0" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să aibă cifra zecilor divizor al numărului 6, este:",
        options: ["4/9", "2/9", "1/3", "4/10"], correct: "4/9" },
      { label: "I.5", topic: "Geometrie analitică. Dreapta",
        content: "Punctul A(a, a) aparține dreptei d de ecuație y=3x−2. Valoarea reală a lui a este:",
        options: ["1", "−1", "2", "3"], correct: "1" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Aria triunghiului isoscel ABC, cu AB=AC=10 și măsura unghiului A egală cu 90°, este:",
        options: ["50", "100", "25", "50√2"], correct: "50" },
    ],
  },
  {
    year: 2022, variant: "var-03",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Valoarea expresiei 5(1+2i)−2i(5−i), unde i²=−1, este:",
        options: ["3", "5", "−3", "3+20i"], correct: "3" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²−2x−3. Valoarea reală a lui a pentru care f(a)=1+a² este:",
        options: ["−2", "2", "−1", "−4"], correct: "−2" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Mulțimea soluțiilor reale ale ecuației log₃(2x²+x)=1 este:",
        options: ["{−3/2, 1}", "{−2, 1}", "{−1, 3/2}", "{−3, 1}"], correct: "{−3/2, 1}" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să aibă ambele cifre impare și distincte, este:",
        options: ["2/9", "4/9", "1/5", "2/5"], correct: "2/9" },
      { label: "I.5", topic: "Geometrie analitică. Vectori",
        content: "Se consideră punctele A(2,0), B(1,6) și C(4,2). Coordonatele punctului D pentru care AB⃗=DC⃗ sunt:",
        options: ["(5, −4)", "(−5, 4)", "(5, 4)", "(3, 8)"], correct: "(5, −4)" },
      { label: "I.6", topic: "Trigonometrie. Triunghiul dreptunghic",
        content: "În triunghiul ABC dreptunghic în A, cu BC=10 și sin B=2 sin C, lungimea laturii AB este:",
        options: ["2√5", "4√5", "5", "2√10"], correct: "2√5" },
    ],
  },
  {
    // I.3 omis: enunțul oficial (formă logaritmică) nu a putut fi transcris cu certitudine din PDF (L10).
    year: 2023, variant: "model",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Numerele reale a și b pentru care (a+bi)(1+i)=4, unde i²=−1, sunt:",
        options: ["a=2, b=−2", "a=2, b=2", "a=−2, b=2", "a=4, b=0"], correct: "a=2, b=−2" },
      { label: "I.2", topic: "Funcția de gradul II. Simetrie",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=mx²−2x+m, cu m≠0. Valorile reale ale lui m pentru care f(m−x)=f(m+x), pentru orice x real, sunt:",
        options: ["{−1, 1}", "{−2, 2}", "{0, 1}", "{1}"], correct: "{−1, 1}" },
      { label: "I.4", topic: "Probabilități. Funcții",
        content: "Se consideră mulțimea A={1,2,3,4} și F mulțimea funcțiilor f:A→A. Probabilitatea ca o funcție f∈F să verifice f(n)≤n, pentru orice n∈A, este:",
        options: ["3/32", "1/24", "3/16", "1/16"], correct: "3/32" },
      { label: "I.5", topic: "Geometrie analitică. Vectori",
        content: "Se consideră punctele A(5,3) și B(−1,5). Coordonatele punctului C pentru care CA⃗+CB⃗=2OC⃗ sunt:",
        options: ["(1, 2)", "(2, 4)", "(4, 8)", "(1, 4)"], correct: "(1, 2)" },
      { label: "I.6", topic: "Trigonometrie. Cercul circumscris",
        content: "Se consideră triunghiul ABC cu AB=8 și măsura unghiului C egală cu 30°, iar O centrul cercului circumscris. Distanța de la O la dreapta AB este:",
        options: ["4√3", "8", "4", "8√3"], correct: "4√3" },
    ],
  },
  {
    year: 2023, variant: "simulare",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Se consideră numerele complexe z₁=1+2i și z₂=1−i, unde i²=−1. Valoarea expresiei z₁²+4z₂ este:",
        options: ["1", "−1", "5", "1+4i"], correct: "1" },
      { label: "I.2", topic: "Funcții. Punct comun",
        content: "Se consideră funcțiile f:ℝ→ℝ, f(x)=3x+1 și g:ℝ→ℝ, g(x)=x²+x+m, unde m este număr real. Valoarea reală a lui m pentru care graficele funcțiilor f și g au exact un punct comun este:",
        options: ["2", "−2", "1", "3"], correct: "2" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Soluția reală a ecuației lg(x²+9)=2lg(x√10) este:",
        options: ["1", "−1", "3", "10"], correct: "1" },
      { label: "I.4", topic: "Probabilități",
        content: "Se consideră mulțimea A a numerelor naturale de cel mult două cifre. Probabilitatea ca, alegând un număr din mulțimea A, acesta să fie divizibil cu 9, este:",
        options: ["3/25", "11/100", "1/9", "3/10"], correct: "3/25" },
      { label: "I.5", topic: "Vectori",
        content: "Se consideră triunghiul ABC, M mijlocul laturii AC, iar D și E puncte pe segmentul AB astfel încât AD=BE. Vectorul MD⃗+ME⃗ este egal cu:",
        options: ["CB⃗", "BC⃗", "CA⃗", "AB⃗"], correct: "CB⃗" },
      { label: "I.6", topic: "Trigonometrie. Ecuații",
        content: "Mulțimea soluțiilor ecuației sin2x=1+cos2x, unde x∈[0,π], este:",
        options: ["{π/4, π/2}", "{π/2}", "{π/4}", "{0, π/2}"], correct: "{π/4, π/2}" },
    ],
  },
  {
    year: 2023, variant: "var-01",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Se consideră numărul complex z=3+i, unde i²=−1. Valoarea expresiei z(z−2i) este:",
        options: ["10", "8", "9", "10i"], correct: "10" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=5x+1. Valoarea expresiei f(2x)−2f(x), pentru orice număr real x, este:",
        options: ["−1", "1", "−2", "0"], correct: "−1" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Soluția reală a ecuației ∛(x³−2x+2)=x este:",
        options: ["1", "−1", "0", "2"], correct: "1" },
      { label: "I.4", topic: "Probabilități",
        content: "Se consideră mulțimea A a numerelor naturale de două cifre. Probabilitatea ca, alegând un număr n din mulțimea A, numărul n+5 să fie multiplu de 10, este:",
        options: ["1/10", "1/9", "9/100", "1/18"], correct: "1/10" },
      { label: "I.5", topic: "Geometrie analitică. Dreapta",
        content: "În reperul cartezian xOy se consideră punctele A(4,0) și B(5,4). Ecuația dreptei d care trece prin punctul O și este paralelă cu dreapta AB este:",
        options: ["y=4x", "y=−4x", "y=x/4", "y=4x+4"], correct: "y=4x" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Aria triunghiului isoscel ABC, dreptunghic în A, este egală cu 4. Lungimea ipotenuzei BC este:",
        options: ["4", "2", "8", "4√2"], correct: "4" },
    ],
  },
  {
    year: 2023, variant: "var-06",
    items: [
      { label: "I.1", topic: "Numere complexe",
        content: "Valoarea expresiei (2−i)²+i(4+i), unde i²=−1, este:",
        options: ["2", "−2", "0", "4"], correct: "2" },
      { label: "I.2", topic: "Funcții. Compunere",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x+3. Valoarea reală a lui m pentru care (f∘f)(m)=2m este:",
        options: ["6", "3", "−6", "2"], correct: "6" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 5^(x+1)−3·5^x=10 este:",
        options: ["1", "2", "0", "5"], correct: "1" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr din mulțimea numerelor naturale de două cifre, acesta să aibă ambele cifre mai mari sau egale cu 7, este:",
        options: ["1/10", "1/9", "9/100", "1/30"], correct: "1/10" },
      { label: "I.5", topic: "Geometrie analitică. Perpendicularitate",
        content: "În reperul cartezian xOy se consideră punctele A(0,4), B(3,−2) și C(2a,a), unde a este număr real nenul. Pentru orice a, dreptele AB și OC sunt:",
        options: ["perpendiculare", "paralele", "concurente în B", "confundate"], correct: "perpendiculare" },
      { label: "I.6", topic: "Trigonometrie. Expresii",
        content: "Se consideră expresia E(x)=sin x+4cos(x/3)·sin(2x/3), unde x este număr real. Valoarea E(π/2) este:",
        options: ["4", "1", "2", "3"], correct: "4" },
    ],
  },
  {
    year: 2023, variant: "var-07",
    items: [
      { label: "I.1", topic: "Progresii aritmetice",
        content: "Termenul a₆ al progresiei aritmetice (aₙ)ₙ≥₁, cu a₁=3 și a₅=23, este:",
        options: ["28", "25", "23", "33"], correct: "28" },
      { label: "I.2", topic: "Funcția de gradul II",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²−6x+8. Valoarea reală a lui m pentru care punctul A(m,−1) aparține graficului funcției f este:",
        options: ["3", "−3", "9", "6"], correct: "3" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 3^(2x−1)=9·3^(x+1) este:",
        options: ["4", "3", "2", "5"], correct: "4" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul submulțimilor nevide cu cel mult două elemente ale mulțimii A={1,2,3,4,5} este:",
        options: ["15", "10", "5", "31"], correct: "15" },
      { label: "I.5", topic: "Geometrie analitică. Vectori",
        content: "Se consideră punctele A(3,1) și B(4,4). Coordonatele punctului C pentru care OA⃗=BC⃗ sunt:",
        options: ["(7, 5)", "(1, −3)", "(7, −5)", "(−1, 3)"], correct: "(7, 5)" },
      { label: "I.6", topic: "Trigonometrie. Cercul circumscris",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AB=6 și înălțimea AD=3 (D pe BC). Raza cercului circumscris triunghiului ABC este:",
        options: ["2√3", "√3", "4√3", "3√3"], correct: "2√3" },
    ],
  },
  {
    year: 2024, variant: "simulare",
    items: [
      { label: "I.1", topic: "Logaritmi",
        content: "Valoarea expresiei (3+lg(1/10))·lg√10 este:",
        options: ["1", "2", "1/2", "0"], correct: "1" },
      { label: "I.2", topic: "Funcții. Compunere",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²+ax−1, unde a este număr real. Mulțimea valorilor reale ale lui a pentru care (f∘f)(1)=1 este:",
        options: ["{−1, 1}", "{1}", "{−1}", "{0, 1}"], correct: "{−1, 1}" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 2^(x+1)·8^x=32 este:",
        options: ["1", "2", "4", "5"], correct: "1" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea numerelor naturale de două cifre, numărul √(n+100) să fie natural, este:",
        options: ["2/45", "1/45", "4/45", "2/9"], correct: "2/45" },
      { label: "I.5", topic: "Geometrie analitică. Vectori",
        content: "Se consideră punctele A(1,4), B(4,6) și C(4,2). Coordonatele punctului D pentru care OD⃗=½(AB⃗+AC⃗) sunt:",
        options: ["(3, 0)", "(3, 2)", "(0, 3)", "(6, 0)"], correct: "(3, 0)" },
      { label: "I.6", topic: "Trigonometrie. Expresii",
        content: "Se consideră expresia E(x)=tg x−4cos(x/2)·cos x, unde x∈(0,π/2). Valoarea E(π/3) este:",
        options: ["0", "√3", "1", "−√3"], correct: "0" },
    ],
  },
  {
    year: 2024, variant: "var-03",
    items: [
      { label: "I.1", topic: "Progresii aritmetice",
        content: "Termenul a₁ al progresiei aritmetice (aₙ)ₙ≥₁, cu a₂=14 și a₃=18, este:",
        options: ["10", "12", "18", "6"], correct: "10" },
      { label: "I.2", topic: "Funcții. Compunere",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x+2. Valoarea (f∘f)(5) este:",
        options: ["9", "7", "11", "14"], correct: "9" },
      { label: "I.3", topic: "Ecuații cu radicali",
        content: "Mulțimea soluțiilor reale ale ecuației ∛(x²+2x+1)=∛(1−x) este:",
        options: ["{−3, 0}", "{0, 3}", "{−3}", "{0}"], correct: "{−3, 0}" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul numerelor naturale impare de două cifre distincte care se pot forma cu elementele mulțimii A={1,2,3,7,9} este:",
        options: ["16", "20", "12", "25"], correct: "16" },
      { label: "I.5", topic: "Geometrie analitică. Vectori",
        content: "Se consideră punctul A(2,1). Coordonatele punctului B pentru care AB⃗=2OA⃗ sunt:",
        options: ["(6, 3)", "(4, 2)", "(6, −3)", "(2, 6)"], correct: "(6, 3)" },
      { label: "I.6", topic: "Geometrie. Aria triunghiului",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu BC=12 și AB=BC/2. Aria triunghiului ABC este:",
        options: ["18√3", "36√3", "9√3", "18"], correct: "18√3" },
    ],
  },
  {
    year: 2024, variant: "var-09",
    items: [
      { label: "I.1", topic: "Progresii aritmetice",
        content: "Termenul a₃ al progresiei aritmetice (aₙ)ₙ≥₁, cu a₁=2 și a₂=12, este:",
        options: ["22", "14", "20", "24"], correct: "22" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x−8. Valoarea reală a lui m pentru care f(1+m)=1−m este:",
        options: ["4", "−4", "7", "8"], correct: "4" },
      { label: "I.3", topic: "Ecuații logaritmice",
        content: "Mulțimea soluțiilor reale ale ecuației lg(x²−3x+5)=lg5 este:",
        options: ["{0, 3}", "{−3, 0}", "{3}", "{0}"], correct: "{0, 3}" },
      { label: "I.4", topic: "Probabilități",
        content: "Probabilitatea ca, alegând un număr n din mulțimea numerelor naturale de două cifre, numărul √(n+1) să fie natural, este:",
        options: ["7/90", "1/9", "8/90", "7/100"], correct: "7/90" },
      { label: "I.5", topic: "Geometrie analitică. Paralelism",
        content: "Se consideră punctele A(1,2), B(3,0) și C(5,a), unde a este număr real. Valoarea reală a lui a pentru care dreptele OA și BC sunt paralele este:",
        options: ["4", "−4", "2", "1"], correct: "4" },
      { label: "I.6", topic: "Trigonometrie. Triunghiul dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu AC=9 și măsura unghiului B egală cu π/3. Lungimea laturii AB este:",
        options: ["3√3", "9√3", "√3", "3"], correct: "3√3" },
    ],
  },
  {
    year: 2024, variant: "var-10",
    items: [
      { label: "I.1", topic: "Logaritmi",
        content: "Valoarea expresiei 2lg100+lg2+lg5 este:",
        options: ["5", "4", "6", "2"], correct: "5" },
      { label: "I.2", topic: "Funcții",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x−6. Valoarea reală a lui a pentru care f(a)+f(3a)=0 este:",
        options: ["3", "−3", "6", "2"], correct: "3" },
      { label: "I.3", topic: "Ecuații exponențiale",
        content: "Soluția reală a ecuației 5^(3x)·5²=5^x este:",
        options: ["−1", "1", "−2", "0"], correct: "−1" },
      { label: "I.4", topic: "Combinatorică",
        content: "Numărul submulțimilor cu două elemente, ambele numere pare, ale mulțimii A={1,2,4,6,8,9} este:",
        options: ["6", "10", "4", "3"], correct: "6" },
      { label: "I.5", topic: "Geometrie analitică. Vectori",
        content: "Se consideră punctele A(3,1) și B(3,0). Coordonatele punctului C pentru care AC⃗=OB⃗ sunt:",
        options: ["(6, 1)", "(3, 1)", "(6, −1)", "(0, 3)"], correct: "(6, 1)" },
      { label: "I.6", topic: "Trigonometrie. Triunghiul dreptunghic",
        content: "Se consideră triunghiul ABC, dreptunghic în A, cu aria egală cu 18 și măsura unghiului B egală cu π/4. Lungimea laturii AB este:",
        options: ["6", "3", "9", "6√2"], correct: "6" },
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
    if (!domain) throw new Error(`domain ${DOMAIN_SLUG} not found — run band-matematica-bac.mjs first`);
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
