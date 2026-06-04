#!/usr/bin/env node
/**
 * import-exam-mate-2022-test-06.mjs — Exam-Bank, CNCE training Test 6 (Matematică, EN VIII 2021–2022)
 *   ÎNCHIDE anul 2022 Mate (Test_01..06 complet).
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2021–2022, Test de antrenament nr. 6. Public.
 *
 * Barem chei: I = 1d 2c 3b 4a 5a 6d · II = 1c 2b 3b 4d 5c 6c
 * NB: SI 1-5 fără figură (5 autoGradable); SI.6 are figură (diagramă circulară sondaj). SII 1-6 toate cu
 *     figură. SIII.3 (grafic), 4 (triunghi), 5 (dreptunghi), 6 (cub) cu figură. Total figuri = 11
 *     (s1-6 + s2-1..6 + s3-3,4,5,6). Via 4uPDF.
 * finalAnswer: III.1="300" (sumă), III.2="4" (n), III.5="9" (aria trapez DEFC). SKIP: III.3 (m∈{0,4}
 *   multi-valoare), III.4 (3√3/2 radical), III.6 (b 4√3 radical).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2022-mate-test-06-${s}.png`;

const MATH = {
  source: "EN VIII 2022 Testul 6 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2022, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-06", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2022/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 8 − 6 : 2 este egal cu:",
      options: [{ key: "a", text: "−5" }, { key: "b", text: "−1" }, { key: "c", text: "1" }, { key: "d", text: "5" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "Numărul natural care reprezintă 10% din 1000 este egal cu:",
      options: [{ key: "a", text: "1" }, { key: "b", text: "10" }, { key: "c", text: "100" }, { key: "d", text: "990" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Ecuații de gradul I",
      content: "Soluția ecuației 4 − x = 6 este:",
      options: [{ key: "a", text: "−10" }, { key: "b", text: "−2" }, { key: "c", text: "2" }, { key: "d", text: "24" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea numerelor zecimale",
      content: "Din setul de numere 3,(21); 32,1; 3,21; 3,2(1) cel mai mic număr este:",
      options: [{ key: "a", text: "3,21" }, { key: "b", text: "3,(21)" }, { key: "c", text: "3,2(1)" }, { key: "d", text: "32,1" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Media geometrică. Radicali",
      content: "Patru elevi Dan, Mihai, Ana și Miruna calculează media geometrică a numerelor reale a = 6 − 2√5 și b = 6 + 2√5 și au obținut rezultatele înregistrate în tabelul de mai jos:\n\nDan | Mihai | Ana | Miruna\n4 | 6 | 12 | 16\n\nConform informațiilor din tabel, dintre cei patru elevi, cel care a calculat corect media geometrică este:",
      options: [{ key: "a", text: "Dan" }, { key: "b", text: "Mihai" }, { key: "c", text: "Ana" }, { key: "d", text: "Miruna" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Interpretarea unei diagrame circulare",
      hasFigure: true, figureUrl: FIG("s1-6"),
      figureNote: "Diagramă circulară „Număr de răspunsuri” cu patru sectoare: Niciodată 100, Întotdeauna 150, Deseori 130, Ocazional 120.",
      content: "Răspunsurile primite în urma unui sondaj de opinie privind folosirea unui produs de curățenie în gospodărie sunt înregistrate în diagrama alăturată. Numărul persoanelor care au răspuns la acest chestionar este egal cu:",
      options: [{ key: "a", text: "100" }, { key: "b", text: "150" }, { key: "c", text: "400" }, { key: "d", text: "500" }], correctAnswer: "d" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Interiorul unui unghi",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Unghiul propriu AOB (O vârf la stânga, A pe semidreapta superioară, B pe semidreapta inferioară) și punctele M, N, P, Q, R, S; M deasupra lui A, R sub B, restul împrăștiate în jur — punctele din interiorul unghiului sunt S, P, Q.",
      content: "În figura alăturată este reprezentat unghiul propriu AOB și punctele M, N, P, Q, R și S. Punctele care se află în interiorul unghiului AOB sunt:",
      options: [{ key: "a", text: "N, S și P" }, { key: "b", text: "M, R și Q" }, { key: "c", text: "S, P și Q" }, { key: "d", text: "A, N și B" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri adiacente suplementare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Pe dreapta AC, unghiurile adiacente suplementare AOB și BOC (B sus), cu ∢AOB = 2·∢BOC; semidreapta OD opusă semidreptei OB (D jos).",
      content: "În figura alăturată sunt reprezentate unghiurile adiacente suplementare AOB și BOC, iar ∢AOB = 2·∢BOC. Semidreapta OD este opusă semidreptei OB. Măsura unghiului COD este egală cu:",
      options: [{ key: "a", text: "180°" }, { key: "b", text: "120°" }, { key: "c", text: "60°" }, { key: "d", text: "30°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Perimetre. Segment cevian",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC (A sus, B jos-stânga, C jos-dreapta) cu M pe latura BC și segmentul AM trasat; P(ABC)=48 cm, P(ABM)=24 cm, P(ACM)=36 cm.",
      content: "În figura alăturată este reprezentat triunghiul ABC care are perimetrul egal cu 48 cm. Punctul M aparține segmentului BC, astfel încât perimetrul triunghiului ABM este egal cu 24 cm și perimetrul triunghiului ACM este egal cu 36 cm. Lungimea segmentului AM este egală cu:",
      options: [{ key: "a", text: "3 cm" }, { key: "b", text: "6 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "24 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Pătrat. Diagonale perpendiculare",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Pătratul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta) cu diagonalele AC și BD intersectându-se în O.",
      content: "În figura alăturată este reprezentat pătratul ABCD. Dreptele AC și BD se intersectează în punctul O. Măsura unghiului DOC este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "90°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghiuri la centru congruente",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu punctele A (stânga), B (jos) și C (dreapta-sus) pe cerc; unghiurile la centru AOB, BOC și AOC sunt congruente (fiecare 120°).",
      content: "În figura alăturată, pe cercul de centru O, sunt reprezentate punctele A, B și C. Unghiurile AOB, BOC și AOC sunt congruente. Măsura arcului mic AB este egală cu:",
      options: [{ key: "a", text: "60°" }, { key: "b", text: "90°" }, { key: "c", text: "120°" }, { key: "d", text: "180°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Prismă dreaptă. Aria laterală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Prisma dreaptă ABCA'B'C' cu baza triunghiul echilateral ABC (baza inferioară ABC, baza superioară A'B'C'); AB = 2 cm, BB' = 4 cm.",
      content: "În figura alăturată este reprezentată prisma dreaptă ABCA'B'C' cu baza triunghiul echilateral ABC, AB = 2 cm și BB' = 4 cm. Aria laterală a prismei ABCA'B'C' este egală cu:",
      options: [{ key: "a", text: "8 cm²" }, { key: "b", text: "18 cm²" }, { key: "c", text: "24 cm²" }, { key: "d", text: "32 cm²" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Fracții. Ecuații",
      finalAnswer: "300",
      content: "Laura cheltuiește o sumă de bani în trei zile. În prima zi cheltuiește 1/2 din sumă, în a doua zi cheltuiește 1/3 din suma rămasă, iar în a treia zi cheltuiește restul de 100 de lei.\na) Verifică dacă Laura cheltuiește în prima zi mai mult decât cheltuiește în a doua zi. Justifică răspunsul dat.\nb) Determină ce sumă a cheltuit Laura în cele trei zile.",
      rubric: [
        { label: "a)", points: 2, answer: "Notăm cu x suma cheltuită în cele trei zile. În prima zi Laura a cheltuit x/2, iar în a doua zi a cheltuit 1/3 din suma rămasă (x/2), adică x/6. Deoarece 1/2 > 1/6, deducem că Laura a cheltuit mai mult în prima zi." },
        { label: "b)", points: 3, answer: "Din x/2 + x/6 + 100 = x rezultă 100 = x − x/2 − x/6 = x/3, deci 2x = 600 și x = 300 lei." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Numere prime",
      finalAnswer: "4",
      content: "Se consideră expresia E(x) = 3(x − 2)(x + 2) − (x − 3)² − 9(x − 1) + 3, unde x este număr real.\na) Arată că E(x) = (x − 3)(2x + 3), pentru orice număr real x.\nb) Determină numărul natural n pentru care E(n) este număr prim.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = 3(x²−4) − (x²−6x+9) − 9(x−1) + 3 = 3x²−12 − x²+6x−9 − 9x+9 + 3 = 2x²−3x−9 = (x−3)(2x+3), pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(n) = (n−3)(2n+3). Cum E(n) este număr prim, un factor trebuie să fie 1: n−3 = 1 ⇒ n = 4, E(4) = 1·11 = 11 (prim); 2n+3 = 1 ⇒ n = −1, care nu este număr natural. Deci n = 4." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Arii în plan",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistemul de axe ortogonale xOy cu graficul funcției f(x)=3x−6 (dreaptă crescătoare care intersectează axa Ox în A(2,0) și axa Oy în B(0,−6)).",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = 3x − 6.\na) Calculează f(2)·f(3).\nb) În sistemul de axe ortogonale xOy se consideră punctul M(m, 0) și punctele A și B care sunt punctele de intersecție a reprezentării grafice a funcției f cu axele Ox, respectiv Oy. Află valorile numărului m pentru care aria triunghiului ABM este egală cu 6.",
      rubric: [
        { label: "a)", points: 2, answer: "f(2) = 3·2 − 6 = 0, deci f(2)·f(3) = 0·f(3) = 0." },
        { label: "b)", points: 3, answer: "A(2, 0) și B(0, −6) sunt intersecțiile graficului cu axele Ox, respectiv Oy. A(ABM) = (AM·OB)/2 = (|m−2|·6)/2 = 3|m−2| = 6, deci |m−2| = 2, de unde m = 4 sau m = 0." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Distanță punct-dreaptă",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghiul ABC dreptunghic în A (A sus, B jos-stânga, C jos-dreapta) cu ∢ABC=60°, AB=6 cm; M mijlocul ipotenuzei BC, P mijlocul segmentului AM.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu ∢BAC = 90°, ∢ABC = 60° și AB = 6 cm. Punctul M este mijlocul segmentului BC, iar punctul P este mijlocul segmentului AM.\na) Arată că AM = 6 cm.\nb) Determină distanța de la punctul P la dreapta BC.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiul ABC este dreptunghic în A cu ∢ACB = 30°, deci AB = BC/2, de unde BC = 12 cm. AM este mediană corespunzătoare ipotenuzei, deci AM = BC/2 = 6 cm." },
        { label: "b)", points: 3, answer: "Triunghiul AMB este echilateral (AM = AB = BM = 6 cm), deci ∢AMB = 60°. Fie Q proiecția lui P pe BM; triunghiul PMQ este dreptunghic în Q cu ∢MPQ = 30°, QM = PM/2 = 3/2 cm și PQ = √(PM² − QM²) = √(9 − 9/4) = 3√3/2 cm = d(P, BC)." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Linie mijlocie. Trapez",
      hasFigure: true, figureUrl: FIG("s3-5"), finalAnswer: "9",
      figureNote: "Dreptunghiul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta) cu AB=8 cm, AD=6 cm; O intersecția diagonalelor AC și BD; E mijlocul lui OD, F mijlocul lui CO; trapezul DEFC evidențiat.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD cu AB = 8 cm, AD = 6 cm și O este punctul de intersecție a dreptelor AC și BD. Punctul E este mijlocul segmentului OD, iar punctul F este mijlocul segmentului CO.\na) Determină lungimea segmentului EF.\nb) Determină aria trapezului DEFC.",
      rubric: [
        { label: "a)", points: 2, answer: "EF este linie mijlocie în triunghiul COD, deci EF = CD/2 = AB/2 = 8/2 = 4 cm." },
        { label: "b)", points: 3, answer: "EF ∥ CD, deci ΔOEF ~ ΔODC cu raportul (OE/OD)² = 1/4. A(ODC) = A(ADC)/2 = (AD·DC)/4 = (6·8)/4 = 12 cm², deci A(OEF) = 12/4 = 3 cm². Aria trapezului DEFC = A(ODC) − A(OEF) = 12 − 3 = 9 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Unghi și distanță punct-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cubul ABCDA'B'C'D' (baza inferioară ABCD, baza superioară A'B'C'D') cu AB=12 cm; secțiunea triunghi AB'C evidențiată.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D' cu AB = 12 cm.\na) Determină măsura unghiului AB'C.\nb) Determină distanța de la punctul B la planul (AB'C).",
      rubric: [
        { label: "a)", points: 2, answer: "AB' = B'C = AC = 12√2 cm (diagonale ale fețelor cubului), deci triunghiul AB'C este echilateral, de unde ∢AB'C = 60°." },
        { label: "b)", points: 3, answer: "AC ⊥ BD și AC ⊥ BB', cu BD ∩ BB' = {B}, deci AC ⊥ (BB'O), unde {O} = AC ∩ BD. Fie BQ ⊥ B'O, Q ∈ B'O; cum BQ ⊂ (BB'O), AC ⊥ BQ, deci BQ ⊥ (AB'C). În triunghiul BB'O dreptunghic în B, BQ = (BB'·BO)/B'O = (12·6√2)/(6√6) = 4√3 cm = d(B, (AB'C))." },
      ] },
  ],
};

const PAPERS = [MATH];

function validate() {
  const errors = [];
  for (const p of PAPERS) {
    const tag = `${p.subjectKey}/${p.variant}`;
    const expectedItemPoints = p.maxScore - p.officeBonus;
    let sum = 0; const labels = new Set();
    for (const it of p.items) {
      if (!it.section || !it.label || !it.type || typeof it.points !== "number") errors.push(`[${tag}] item missing field: ${JSON.stringify(it.label)}`);
      if (!it.content || !it.content.trim()) errors.push(`[${tag}] item ${it.label} empty content`);
      const lk = `${it.section}::${it.label}`;
      if (labels.has(lk)) errors.push(`[${tag}] duplicate label ${it.section} ${it.label}`);
      labels.add(lk);
      if (it.type === "MCQ") {
        if (!Array.isArray(it.options) || it.options.length < 2) errors.push(`[${tag}] MCQ ${it.label} needs >=2 options`);
        if (!it.correctAnswer) errors.push(`[${tag}] MCQ ${it.label} missing correctAnswer`);
        const keys = (it.options || []).map((o) => o.key);
        if (it.correctAnswer && !keys.includes(it.correctAnswer)) errors.push(`[${tag}] MCQ ${it.label} correctAnswer '${it.correctAnswer}' not in keys`);
      }
      if (it.autoGradable && it.hasFigure) errors.push(`[${tag}] item ${it.label} autoGradable+hasFigure`);
      if (it.autoGradable && it.type === "OPEN") errors.push(`[${tag}] item ${it.label} autoGradable+OPEN`);
      if (it.hasFigure && !it.figureUrl) errors.push(`[${tag}] item ${it.label} hasFigure but no figureUrl`);
      if (Array.isArray(it.rubric) && it.rubric.length && it.rubric.every((r) => typeof r.points === "number")) {
        const rsum = it.rubric.reduce((a, r) => a + r.points, 0);
        if (rsum !== it.points) errors.push(`[${tag}] item ${it.label} rubric ${rsum} != points ${it.points}`);
      }
      sum += it.points;
    }
    if (sum !== expectedItemPoints) errors.push(`[${tag}] points sum ${sum} != ${expectedItemPoints}`);
    console.log(`  ${tag.padEnd(22)} items=${p.items.length} pts=${sum}(+${p.officeBonus}=${sum + p.officeBonus}) autoGradable=${p.items.filter((i) => i.autoGradable).length} figures=${p.items.filter((i) => i.hasFigure).length}`);
  }
  if (errors.length) { console.error(`\n❌ VALIDATE FAILED (${errors.length}):`); for (const e of errors) console.error("   - " + e); process.exit(1); }
  console.log("\n✅ VALIDATE OK — points sum to 90 (+10 oficiu = 100).");
}

async function run(dry) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const p of PAPERS) {
      const existing = await prisma.examPaper.findUnique({
        where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } },
        include: { _count: { select: { items: true } } },
      });
      console.log(`  ${p.subjectKey}/${p.variant} ${existing ? "UPDATE" : "CREATE"} → items=${p.items.length}${existing ? ` (replacing ${existing._count.items})` : ""}`);
      if (dry) continue;
      const paper = await prisma.examPaper.upsert({
        where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } },
        update: { source: p.source, subjectName: p.subjectName, grade: p.grade, maxScore: p.maxScore, officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language, sourceUrl: p.sourceUrl, license: p.license, isActive: true },
        create: { source: p.source, examType: p.examType, year: p.year, subjectKey: p.subjectKey, subjectName: p.subjectName, grade: p.grade, variant: p.variant, maxScore: p.maxScore, officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language, sourceUrl: p.sourceUrl, license: p.license },
      });
      await prisma.examItem.deleteMany({ where: { paperId: paper.id } });
      await prisma.examPassage.deleteMany({ where: { paperId: paper.id } });
      await prisma.examItem.createMany({
        data: p.items.map((it, idx) => ({
          paperId: paper.id, section: it.section, label: it.label, orderIndex: idx, type: it.type, points: it.points, content: it.content,
          options: it.options ?? undefined, correctAnswer: it.correctAnswer ?? null, rubric: it.rubric ?? undefined, passageRef: it.passageRef ?? null,
          hasFigure: !!it.hasFigure, figureNote: it.figureNote ?? null, figureUrl: it.figureUrl ?? null, finalAnswer: it.finalAnswer ?? null,
          autoGradable: !!it.autoGradable, topic: it.topic ?? null,
        })),
      });
    }
    const [papers, items] = await Promise.all([prisma.examPaper.count(), prisma.examItem.count()]);
    console.log(`\n${dry ? "🔎 DRY — no writes." : "✅ APPLIED."} DB totals: ExamPaper=${papers} ExamItem=${items}`);
  } finally { await prisma.$disconnect(); }
}

(async () => {
  console.log(`\n=== import-exam-mate-2022-test-06 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
