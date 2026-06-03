#!/usr/bin/env node
/**
 * import-exam-mate-2024-model.mjs — Exam-Bank series 2, pair 2024 Model (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2023–2024, Model.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1b 2c 3b 4d 5a 6b · II = 1a 2d 3b 4c 5b 6c
 * Figures: 10 PNG (en-viii-2024-mate-model-s{2,3}-{label}.png). finalAnswer: III.1=200, III.2=2.
 *   (I.6 = numere întregi în interval, fără figură.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2024-mate-model-${s}.png`;

const MATH = {
  source: "EN VIII 2024 Model (edu.ro)",
  examType: "EN_VIII", year: 2024, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "model", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2024/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 3 + 2 · 5 este egal cu:",
      options: [{ key: "a", text: "25" }, { key: "b", text: "13" }, { key: "c", text: "10" }, { key: "d", text: "1" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporții",
      content: "Dacă x/2 = 3/4, atunci 4·x este egal cu:",
      options: [{ key: "a", text: "3/2" }, { key: "b", text: "8/3" }, { key: "c", text: "6" }, { key: "d", text: "12" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Ecuații",
      content: "Soluția ecuației 2 − x = 2 este numărul:",
      options: [{ key: "a", text: "−4" }, { key: "b", text: "0" }, { key: "c", text: "2" }, { key: "d", text: "4" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea fracțiilor",
      content: "Cel mai mic element al mulțimii A = {1/9, 1/99, 1/999, 1/9999} este:",
      options: [{ key: "a", text: "1/9" }, { key: "b", text: "1/99" }, { key: "c", text: "1/999" }, { key: "d", text: "1/9999" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Produs",
      content: "Patru elevi, Andra, Marius, Ioana și David, au calculat produsul numerelor a = √5 și b = √20. Rezultatele obținute: Andra → 10; Marius → 5; Ioana → 2√5; David → √10. Rezultatul corect a fost obținut de către:",
      options: [{ key: "a", text: "Andra" }, { key: "b", text: "Marius" }, { key: "c", text: "Ioana" }, { key: "d", text: "David" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Intervale. Numere întregi",
      content: "Alina afirmă că: „În intervalul de numere reale [−3, 2] sunt 7 numere întregi.” Afirmația Alinei este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea (figuri) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente congruente",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare, în această ordine; AB = BC = CD; CD = 10 cm.",
      content: "În figura alăturată sunt reprezentate punctele coliniare A, B, C și D, în această ordine, astfel încât AB = BC = CD, iar lungimea segmentului CD este egală cu 10 cm. Lungimea segmentului AD este egală cu:",
      options: [{ key: "a", text: "30 cm" }, { key: "b", text: "20 cm" }, { key: "c", text: "15 cm" }, { key: "d", text: "10 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri opuse la vârf. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiurile opuse la vârf AOB și COD; A, O, D coliniare; ∢AOB = 50°; OM bisectoarea unghiului AOB.",
      content: "În figura alăturată sunt reprezentate unghiurile opuse la vârf AOB și COD, cu punctele A, O și D coliniare. Măsura unghiului AOB este egală cu 50° și OM este bisectoarea unghiului AOB. Măsura unghiului DOM este egală cu:",
      options: [{ key: "a", text: "25°" }, { key: "b", text: "50°" }, { key: "c", text: "130°" }, { key: "d", text: "155°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi isoscel",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi isoscel ABC (AB = AC), ∢BAC = 50°; D pe AC cu BD = BC.",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC cu AB = AC și ∢BAC = 50°. Punctul D aparține segmentului AC, astfel încât BD = BC. Măsura unghiului BDC este egală cu:",
      options: [{ key: "a", text: "50°" }, { key: "b", text: "65°" }, { key: "c", text: "115°" }, { key: "d", text: "130°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelogram. Perimetru",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Paralelogram ABCD cu AB = 10 cm, BC = 6 cm.",
      content: "În figura alăturată este reprezentat paralelogramul ABCD cu AB = 10 cm și BC = 6 cm. Perimetrul paralelogramului ABCD este egal cu:",
      options: [{ key: "a", text: "16 cm" }, { key: "b", text: "24 cm" }, { key: "c", text: "32 cm" }, { key: "d", text: "40 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Lungime",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cerc de centru O; A, B pe cerc; ∢AOB = 60°, AB = 10 cm.",
      content: "În figura alăturată este reprezentat cercul de centru O. Punctele A și B aparțin cercului, astfel încât măsura unghiului AOB este de 60° și AB = 10 cm. Lungimea cercului este egală cu:",
      options: [{ key: "a", text: "10π cm" }, { key: "b", text: "20π cm" }, { key: "c", text: "100π cm" }, { key: "d", text: "200π cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Con. Aria bazei",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Con circular drept cu secțiunea axială triunghiul dreptunghic VAB; înălțimea conului = 2√2 cm.",
      content: "În figura alăturată este reprezentat un con circular drept cu secțiunea axială triunghiul dreptunghic VAB. Înălțimea conului are lungimea egală cu 2√2 cm. Aria bazei conului este egală cu:",
      options: [{ key: "a", text: "8 cm²" }, { key: "b", text: "16 cm²" }, { key: "c", text: "8π cm²" }, { key: "d", text: "16π cm²" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Procente. Probleme",
      finalAnswer: "200",
      content: "Mihai a cheltuit o sumă de bani în patru zile. În prima zi a cheltuit 20% din întreaga sumă, în a doua zi 30% din suma rămasă, în a treia zi cu 20 de lei mai mult decât a doua zi, iar în a patra zi a cheltuit ultimii 44 de lei.",
      rubric: [
        { label: "a)", points: 2, answer: "În a doua zi: (30/100)·(x − (20/100)·x) = (24/100)·x (x = întreaga sumă). Cum (24/100)·x < (25/100)·x = (1/4)·x, Mihai nu a cheltuit în a doua zi un sfert din întreaga sumă." },
        { label: "b)", points: 3, answer: "x/5 + 6x/25 + (6x/25 + 20) + 44 = x ⇒ 17x/25 + 64 = x ⇒ x = 200 de lei." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      finalAnswer: "2",
      content: "Se consideră expresia E(x) = (x/(9+3x) − 2/(x+3) + 3/(x²+3x)) : (x/3 + 3/x − 2), unde x este un număr real, x ≠ −3, x ≠ 0 și x ≠ 3.",
      rubric: [
        { label: "a)", points: 2, answer: "x/(9+3x) − 2/(x+3) + 3/(x²+3x) = (x² − 6x + 9)/(3x(x+3)) = (x−3)²/(3x(x+3)), pentru orice x real, x ≠ −3, x ≠ 0." },
        { label: "b)", points: 3, answer: "x/3 + 3/x − 2 = (x² + 9 − 6x)/(3x) = (x−3)²/(3x). E(x) = ((x−3)²/(3x(x+3)))·(3x/(x−3)²) = 1/(x+3). 5·E(n) = 5/(n+3) este număr natural ⇒ n + 3 ∈ {1, 5} și, cum n este natural, n = 2." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Coliniaritate",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu graficul funcției f(x) = x + 2.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x + 2.",
      rubric: [
        { label: "a)", points: 2, answer: "f(−2) = 0, deci 2023·f(−2) = 2023·0 = 0." },
        { label: "b)", points: 3, answer: "A(−2, 0) și B(0, 2) sunt punctele de intersecție cu axele. În triunghiul dreptunghic isoscel AOB, OM (mediana) este bisectoare ⇒ ∢MOB = 45°. Cu P(3, 0): ∢MON = ∢MOB + ∢BOP + ∢PON = 45° + 90° + 45° = 180°, deci punctele N(3, −3), O și M sunt coliniare." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Asemănare. Arii",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Dreptunghi ABCD cu AB = 12 cm, BC = 9 cm; E pe AC cu AE = 10 cm; QN ∥ AB, PM ∥ BC prin E.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD cu AB = 12 cm și BC = 9 cm. Punctul E aparține segmentului AC, astfel încât AE = 10 cm. Prin E se duc dreptele QN și PM paralele cu dreptele AB, respectiv BC. Punctele M, N, P și Q aparțin segmentelor AB, BC, CD și respectiv AD.",
      rubric: [
        { label: "a)", points: 2, answer: "În triunghiul dreptunghic ABC: AC = √(AB² + BC²) = √(144 + 81) = √225 = 15 cm." },
        { label: "b)", points: 3, answer: "QN ∥ AB ∥ CD, PM ∥ BC ∥ AD și ∢QAM = ∢PCN = 90° ⇒ AMEQ și CNEP sunt dreptunghiuri. PC ∥ AM ⇒ ΔPEC ∼ ΔMEA ⇒ PE/ME = PC/AM = EC/EA = 1/2 ⇒ ME = 2·PE, AM = 2·PC, deci Aria(AMEQ) = AM·ME = 4·PC·PE = 4·Aria(CNEP)." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Distanță",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghi ABC dreptunghic în B, AB = 2√2 cm, BC = 2√6 cm; triunghi dreptunghic isoscel AEB (AE = EB); E și C de aceeași parte a dreptei AB.",
      content: "În figura alăturată este reprezentat triunghiul ABC, dreptunghic în B, cu AB = 2√2 cm, BC = 2√6 cm și triunghiul dreptunghic isoscel AEB cu AE = EB. Punctele E și C sunt de aceeași parte a dreptei AB.",
      rubric: [
        { label: "a)", points: 2, answer: "În triunghiul dreptunghic ABC: AC = √(AB² + BC²) = 4√2 cm. P(ABC) = AB + AC + BC = 2√2 + 4√2 + 2√6 = 2√2(3 + √3) cm." },
        { label: "b)", points: 3, answer: "EM mediană în triunghiul dreptunghic isoscel AEB ⇒ EM = AB/2 = √2 cm. EM ⊥ AB (M pe AB) și EN ⊥ BC (N pe BC) ⇒ EM = EN = √2 cm. Aria(AEC) = Aria(ABC) − Aria(AEB) − Aria(BEC) = (AB·BC)/2 − (AB·EM)/2 − (BC·EN)/2 = 2(√3 − 1) cm². Aria(AEC) = (AC·EP)/2 (EP ⊥ AC) ⇒ EP = (√6 − √2)/2 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Paralelipiped. Paralelism dreaptă-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Paralelipiped dreptunghic ABCDA'B'C'D' cu AB = AA' = 4 cm, BC = 2 cm; N proiecția lui C' pe B'D', P proiecția lui C' pe CB'.",
      content: "În figura alăturată este reprezentat paralelipipedul dreptunghic ABCDA'B'C'D' cu AB = AA' = 4 cm și BC = 2 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "A_total = 2(AB·BC + BC·AA' + AB·AA') = 2(8 + 8 + 16) = 2·32 = 64 cm²." },
        { label: "b)", points: 3, answer: "ΔB'C'D' ≡ ΔB'C'C ⇒ B'D' = B'C. În ΔB'C'D' dreptunghic: B'N = B'C'²/B'D'; în ΔB'C'C dreptunghic: B'P = B'C'²/B'C, de unde B'N = B'P. În ΔB'D'C: B'N/B'D' = B'P/B'C ⇒ NP ∥ D'C, iar D'C ⊂ (ACD') ⇒ NP ∥ (ACD')." },
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
  console.log(`\n=== import-exam-mate-2024-model (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
