#!/usr/bin/env node
/**
 * import-exam-mate-2021-simulare.mjs — Exam-Bank series 3, pair 2021 Simulare (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Simulare.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1d 2a 3c 4b 5b 6c · II = 1d 2a 3c 4b 5d 6c
 * Figures: 9 PNG (en-viii-2021-mate-simulare-s{2,3}-{label}.png) — toate 6 SII + s3-4..6.
 *   finalAnswer: III.1=256, III.2=-3, III.3=1 (III.4/6 demonstrații paralelism; III.5 inegalitate).
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-simulare-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Simulare (edu.ro)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "simulare", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 45 : 5 + 4 este egal cu:",
      options: [{ key: "a", text: "4" }, { key: "b", text: "5" }, { key: "c", text: "9" }, { key: "d", text: "13" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "Numărul care reprezintă 40% din 50 este egal cu:",
      options: [{ key: "a", text: "20" }, { key: "b", text: "25" }, { key: "c", text: "40" }, { key: "d", text: "50" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Suma numerelor −2, −1, 0, 1, 2 și 3 este egală cu:",
      options: [{ key: "a", text: "−9" }, { key: "b", text: "−3" }, { key: "c", text: "3" }, { key: "d", text: "9" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții echivalente",
      content: "Fracția 14/21 este echivalentă cu:",
      options: [{ key: "a", text: "3/7" }, { key: "b", text: "2/3" }, { key: "c", text: "21/14" }, { key: "d", text: "7/3" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Mulțimi. Numere întregi",
      content: "Se consideră mulțimea A = {x ∈ ℤ | −2 ≤ x < 2}. Dintre următoarele mulțimi, cea care reprezintă scrierea mulțimii A prin enumerarea elementelor sale este:",
      options: [{ key: "a", text: "{−2, −1, 0, 1, 2}" }, { key: "b", text: "{−2, −1, 0, 1}" }, { key: "c", text: "{0, 1, 2}" }, { key: "d", text: "{−1, 0, 1, 2}" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "La alegerile pentru stabilirea responsabilului unei clase, elevii candidați au fost: Andrei, Vali, Sanda și Dana. După ce toți elevii clasei au votat, procentele obținute de candidați au fost: Andrei 15%, Vali 25%, Sanda 35%, Dana x%. Dana a fost votată de:",
      options: [{ key: "a", text: "45% din elevii clasei" }, { key: "b", text: "35% din elevii clasei" }, { key: "c", text: "25% din elevii clasei" }, { key: "d", text: "15% din elevii clasei" }], correctAnswer: "c" },
    // ── Subiectul al II-lea (toate cu figură) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D, E coliniare, în această ordine; AB ≠ BC; AB ≅ CD; BC ≅ DE.",
      content: "În figura alăturată punctele A, B, C, D și E, în această ordine, sunt coliniare, astfel încât AB ≠ BC. Dacă segmentul AB este congruent cu segmentul CD și segmentul BC este congruent cu segmentul DE, atunci:",
      options: [{ key: "a", text: "punctul B este mijlocul segmentului AC" }, { key: "b", text: "punctul C este mijlocul segmentului CD" }, { key: "c", text: "punctul D este mijlocul segmentului CE" }, { key: "d", text: "punctul C este mijlocul segmentului AE" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri în jurul unui punct",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiurile congruente AOB, BOC, COD, DOE și EOA formate în jurul punctului O.",
      content: "Unghiurile congruente AOB, BOC, COD, DOE și EOA sunt unghiuri formate în jurul punctului O. Măsura unghiului AOC este egală cu:",
      options: [{ key: "a", text: "144°" }, { key: "b", text: "120°" }, { key: "c", text: "72°" }, { key: "d", text: "36°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC dreptunghic în A, ∢ABC = 30°; bisectoarea unghiului ACB taie AB în M; AM = 3 cm.",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în A, cu măsura unghiului ABC de 30°. Bisectoarea unghiului ACB intersectează dreapta AB în punctul M și AM = 3 cm. Lungimea catetei AB este egală cu:",
      options: [{ key: "a", text: "3 cm" }, { key: "b", text: "6 cm" }, { key: "c", text: "9 cm" }, { key: "d", text: "12 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Romb. Patrulaterul mijloacelor",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Rombul ABCD; E, F, G, H mijloacele segmentelor AB, BC, CD, respectiv AD.",
      content: "În figura alăturată este reprezentat rombul ABCD. Punctele E, F, G și H sunt mijloacele segmentelor AB, BC, CD, respectiv AD. Raportul dintre aria patrulaterului EFGH și aria rombului ABCD este egal cu:",
      options: [{ key: "a", text: "1/4" }, { key: "b", text: "1/2" }, { key: "c", text: "2/3" }, { key: "d", text: "3/4" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Arce congruente",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Punctele A, B, C, D pe cerc; arcele AB, BC, CD și AD congruente; AC = 12 cm.",
      content: "În figura alăturată punctele distincte A, B, C și D sunt situate pe cerc, astfel încât arcele AB, BC, CD și AD sunt congruente. Dacă AC = 12 cm, atunci lungimea cercului este egală cu:",
      options: [{ key: "a", text: "3π cm" }, { key: "b", text: "4π cm" }, { key: "c", text: "6π cm" }, { key: "d", text: "12π cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cubul ABCDA'B'C'D'.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D'. Măsura unghiului dreptelor BC' și DC' este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "90°" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Fracții. Probleme",
      finalAnswer: "256",
      content: "Oana începe să citească o carte. În prima zi citește jumătate din numărul paginilor cărții, în a doua zi jumătate din rest, iar în a treia zi citește jumătate din numărul paginilor rămase și constată că mai are de citit 32 de pagini.",
      rubric: [
        { label: "a)", points: 2, answer: "În a patra zi Oana ar citi 32 : 2 = 16 pagini; în a cincea zi ar avea de citit 16 : 2 = 8 pagini." },
        { label: "b)", points: 3, answer: "x/2 + x/4 + x/8 + 32 = x, unde x este numărul de pagini ale cărții, de unde x = 256 de pagini." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Formule de calcul",
      finalAnswer: "-3",
      content: "Se consideră expresia E(x) = (x + 1)² − 2(x² − 1) + (x − 1)² − x², unde x este număr real.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = ((x + 1)² − (x − 1)²) − x² = 4 − x² = (2 + x)(2 − x), pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(√2) = E(−√2) = 2; A = E(√2) + E(−√2) − 7 = 4 − 7 = −3 și, cum −√10 < −√9 < −√8, rezultă A ∈ [−√10, −2√2]." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul cu numere raționale și radicali",
      finalAnswer: "1",
      content: "Se consideră numerele reale a = (2/3 + 3/4 · 5/6) : 31/12 și b = 3/√2 : (5√2 − 3a√8).",
      rubric: [
        { label: "a)", points: 2, answer: "a = (2/3 + 5/8) · 12/31 = 31/24 · 12/31 = 1/2." },
        { label: "b)", points: 3, answer: "b = 3/√2 : (5√2 − 3√2) = 3/√2 · 1/(2√2) = 3/4; atunci N = √(2a + 4b)/2 = √(2·(1/2) + 4·(3/4))/2 = √4/2 = 1, care este număr natural." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez isoscel. Linie mijlocie. Centru de greutate",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Trapezul isoscel ABCD cu AB ∥ CD, AD = BC = 6 cm, AB = 2·CD = 8 cm; M mijlocul lui AB; N pe DM cu DN = 4 cm; P centrul de greutate al triunghiului BCD.",
      content: "În figura alăturată este reprezentat trapezul isoscel ABCD cu AB ∥ CD, AD = BC = 6 cm și AB = 2·CD = 8 cm. Punctul M este mijlocul segmentului AB.",
      rubric: [
        { label: "a)", points: 2, answer: "MBCD este paralelogram, de unde rezultă DM = BC = 6 cm; P(ADM) = AD + DM + AM = 6 + 6 + 4 = 16 cm." },
        { label: "b)", points: 3, answer: "CP/CO = 2/3 (O mijlocul lui BD) și, cum DN = (2/3)·DM și M mijlocul lui AB, N este centrul de greutate în ΔADB, deci AN/AO = 2/3. Din AN/AO = CP/CO rezultă NP ∥ AC." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Trigonometrie. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A, AB = 5 cm, AC = 12 cm; D pe AC cu DC = 3·AD; DE ⊥ BC (E pe BC).",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în A, AB = 5 cm și AC = 12 cm. Punctul D aparține segmentului AC astfel încât DC = 3·AD. Perpendiculara din punctul D pe dreapta BC intersectează latura BC în punctul E.",
      rubric: [
        { label: "a)", points: 2, answer: "BC = √(AB² + AC²) = 13 cm; sin(∢ACB) = AB/BC = 5/13." },
        { label: "b)", points: 3, answer: "DC = (3/4)·AC = 9 cm; ΔACB ~ ΔECD ⇒ BC/CD = AB/DE ⇒ DE = 45/13 cm și, cum 45/13 < 3,5, rezultă DE < 3,5 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă patrulateră regulată. Plane paralele",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Piramida patrulateră regulată VABCD cu baza ABCD, AB = VA = 6 cm; M, N, P mijloacele muchiilor BC, AD, respectiv VB.",
      content: "În figura alăturată este reprezentată o piramidă patrulateră regulată VABCD cu baza ABCD, AB = VA = 6 cm. Punctele M, N și P sunt mijloacele muchiilor BC, AD, respectiv VB.",
      rubric: [
        { label: "a)", points: 2, answer: "∢(VB, (ABC)) = ∢VBO, unde {O} = AC ∩ BD; triunghiul VBD este dreptunghic isoscel, deci ∢(VB, (ABC)) = 45°." },
        { label: "b)", points: 3, answer: "AMCN este paralelogram ⇒ AM ∥ CN; PM este linie mijlocie în ΔBCV ⇒ PM ∥ CV și, cum CN ∩ CV = {C} și MA ∩ MP = {M}, rezultă (NCV) ∥ (AMP)." },
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
  console.log(`\n=== import-exam-mate-2021-simulare (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
