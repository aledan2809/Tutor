#!/usr/bin/env node
/**
 * import-exam-mate-2022-rezerva-1.mjs — Exam-Bank series 3, pair 2022 Rezervă Varianta 1 (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2021–2022, Rezervă (examen), Varianta 1.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1c 2a 3d 4d 5a 6b · II = 1c 2d 3c 4c 5b 6c
 * Figures: 10 PNG (en-viii-2022-mate-rezerva-1-s{2,3}-{label}.png) — s2-1..6, s3-3..6.
 *   finalAnswer: III.1=320, III.4=4,5, III.6=1/2. (III.2/III.3 demonstrații; III.5 radical → skip.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2022-mate-rezerva-1-${s}.png`;

const MATH = {
  source: "EN VIII 2022 Rezervă Varianta 1 (edu.ro)",
  examType: "EN_VIII", year: 2022, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "rezerva-1", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2022/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 4 + 2·5 este egal cu:",
      options: [{ key: "a", text: "6" }, { key: "b", text: "10" }, { key: "c", text: "14" }, { key: "d", text: "30" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte",
      content: "Dacă a = 3·b și b ≠ 0, atunci raportul a/b este egal cu:",
      options: [{ key: "a", text: "3" }, { key: "b", text: "1" }, { key: "c", text: "1/3" }, { key: "d", text: "1/9" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Ecuații. Numere întregi",
      content: "Știind că −2 + a = 2, atunci numărul a este egal cu:",
      options: [{ key: "a", text: "−4" }, { key: "b", text: "−1" }, { key: "c", text: "0" }, { key: "d", text: "4" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții ordinare",
      content: "Triplul numărului 2/5 este egal cu:",
      options: [{ key: "a", text: "2/15" }, { key: "b", text: "6/15" }, { key: "c", text: "1" }, { key: "d", text: "6/5" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Media aritmetică",
      content: "Media aritmetică a numerelor 7√3 și 21√3 este egală cu:",
      options: [{ key: "a", text: "14√3" }, { key: "b", text: "14√6" }, { key: "c", text: "28√3" }, { key: "d", text: "28√6" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Probleme. Proporționalitate",
      content: "Trei caiete și două pixuri costă împreună 8 lei. Afirmația: „Șase caiete și patru pixuri, de același fel, costă împreună 12 lei.”, este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, E, D, C, B coliniare; C mijlocul lui AB, D mijlocul lui AC, E mijlocul lui AD, ED = 2 cm.",
      content: "În figura alăturată, punctul C este mijlocul segmentului AB, punctul D este mijlocul segmentului AC, punctul E este mijlocul segmentului AD și ED = 2 cm. Lungimea segmentului DB este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "8 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "14 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Semidreapta OC bisectoarea unghiului AOB; OD bisectoarea unghiului BOC; ∢COD = 13°.",
      content: "În figura alăturată, semidreapta OC este bisectoarea unghiului AOB și semidreapta OD este bisectoarea unghiului BOC. Unghiul COD are măsura de 13°. Măsura unghiului AOB este egală cu:",
      options: [{ key: "a", text: "13°" }, { key: "b", text: "26°" }, { key: "c", text: "39°" }, { key: "d", text: "52°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Mediană",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC dreptunghic în A; D mijlocul lui BC; AC = CD; AB = 2√3 cm.",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în A, punctul D este mijlocul segmentului BC și AC = CD. Știind că AB = 2√3 cm, atunci lungimea segmentului BC este egală cu:",
      options: [{ key: "a", text: "2 cm" }, { key: "b", text: "2√3 cm" }, { key: "c", text: "4 cm" }, { key: "d", text: "4√3 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Trapez. Linie mijlocie",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Trapezul ABCD cu AB ∥ CD, AB = 12 cm, CD = 8 cm.",
      content: "În figura alăturată este reprezentat trapezul ABCD cu AB ∥ CD, AB = 12 cm și CD = 8 cm. Lungimea liniei mijlocii a trapezului ABCD este egală cu:",
      options: [{ key: "a", text: "2 cm" }, { key: "b", text: "4 cm" }, { key: "c", text: "10 cm" }, { key: "d", text: "20 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Pătrat înscris în cerc. Lungimea cercului",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Pătratul ABCD cu AB = 4√2 cm, înscris într-un cerc de centru O.",
      content: "În figura alăturată este reprezentat pătratul ABCD, cu AB = 4√2 cm, înscris într-un cerc de centru O. Lungimea cercului este egală cu:",
      options: [{ key: "a", text: "8√2·π cm" }, { key: "b", text: "8π cm" }, { key: "c", text: "4√2·π cm" }, { key: "d", text: "4π cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Volum",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cubul ABCDA'B'C'D' cu AB = 4 cm.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D' cu AB = 4 cm. Volumul cubului este egal cu:",
      options: [{ key: "a", text: "4√3 cm³" }, { key: "b", text: "16√2 cm³" }, { key: "c", text: "64 cm³" }, { key: "d", text: "96 cm³" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Procente. Ecuații",
      finalAnswer: "320",
      content: "Un excursionist a parcurs un traseu în trei zile. În prima zi a parcurs 60% din lungimea traseului, în a doua zi o treime din distanța parcursă în prima zi, iar în a treia zi a parcurs restul de 64 km.",
      rubric: [
        { label: "a)", points: 2, answer: "În a doua zi excursionistul a parcurs (1/3)·(60/100)·x = x/5, unde x reprezintă lungimea traseului. Cum x/5 ≠ x/4, obținem că nu este posibil ca distanța parcursă în a doua zi să reprezinte o pătrime din lungimea traseului." },
        { label: "b)", points: 3, answer: "Din 60x/100 + x/5 + 64 = x rezultă 4x + 320 = 5x, deci x = 320 km." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = 3(x + 2)² − 2(4x − 3 − x²) + 7(3x + 2) − 2, unde x este număr real.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = 3(x² + 4x + 4) − 2(4x − 3 − x²) + 21x + 14 − 2 = 3x² + 12x + 12 + 2x² − 8x + 6 + 21x + 12 = 5x² + 25x + 30, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(n) = 5(n² + 5n + 6) = 5(n(n + 5) + 6). Cum n și n + 5 au parități diferite, n(n + 5) este par, deci n(n + 5) + 6 este par. Prin urmare ultima cifră a lui E(n) este 0, deci E(n) este divizibil cu 10, pentru orice număr natural n." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Triunghi dreptunghic",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu reprezentarea grafică a funcției f(x) = x − 2; A pe Ox, B pe Oy.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x − 2.",
      rubric: [
        { label: "a)", points: 2, answer: "f(2) = 0; f(3) = 1, deci f(2) + f(3) = 0 + 1 = 1." },
        { label: "b)", points: 3, answer: "A(2, 0) și B(0, −2) sunt punctele de intersecție a graficului funcției f cu axele Ox, respectiv Oy. Dacă MC ⊥ Ox, C ∈ Ox, atunci ΔMCA și ΔAOB sunt dreptunghice isoscele, deci ∢MAC = 45° și ∢OAB = 45°. Atunci ∢MAB = ∢MAC + ∢CAB = 45° + 45° = 90°, deci triunghiul AMB este dreptunghic în A." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez dreptunghic. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-4"), finalAnswer: "4,5",
      figureNote: "Trapezul dreptunghic ABCD cu AB ∥ CD, ∢BAD = 90°; AC ⊥ BD; BD = 10 cm, AD = 6 cm; O = AC ∩ BD.",
      content: "În figura alăturată este reprezentat trapezul dreptunghic ABCD cu AB ∥ CD și ∢BAD = 90°. Dreptele AC și BD sunt perpendiculare, BD = 10 cm și AD = 6 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔDAB dreptunghic în A ⇒ AB = √(BD² − AD²) = √(100 − 36) = 8 cm. P_DAB = AB + BD + DA = 8 + 10 + 6 = 24 cm." },
        { label: "b)", points: 3, answer: "În triunghiul DAB dreptunghic în A cu AC ⊥ BD: AB² = BO·BD, deci BO = 6,4 cm. ΔDOC ~ ΔBOA ⇒ DC/BA = DO/BO, de unde DC = 4,5 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrat. Triunghi echilateral. Arie trapez",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Pătratul ABCD cu AB = 6 cm și triunghiul echilateral BPQ, P și Q pe dreapta DC.",
      content: "În figura alăturată este reprezentat pătratul ABCD cu AB = 6 cm și triunghiul echilateral BPQ, unde punctele P și Q se află pe dreapta DC.",
      rubric: [
        { label: "a)", points: 2, answer: "AC = √(6² + 6²) = √72 = 6√2 cm." },
        { label: "b)", points: 3, answer: "În triunghiul echilateral BPQ, ∢BCP = 90° ⇒ BC este înălțime, deci PQ = 4√3 cm. A_ABQP = ((AB + PQ)·BC)/2 = ((6 + 4√3)·6)/2 = 6(3 + 2√3) cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Paralelipiped dreptunghic. Unghi diedru",
      hasFigure: true, figureUrl: FIG("s3-6"), finalAnswer: "1/2",
      figureNote: "Paralelipipedul dreptunghic ABCDA'B'C'D' cu AB = 3√2 cm, BC = CC' = 3 cm.",
      content: "În figura alăturată este reprezentat paralelipipedul dreptunghic ABCDA'B'C'D' cu AB = 3√2 cm și BC = CC' = 3 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "BD = √(3² + (3√2)²) = √(9 + 18) = 3√3 cm. În triunghiul D'DB dreptunghic în D: BD' = √((3√3)² + 3²) = √(27 + 9) = 6 cm." },
        { label: "b)", points: 3, answer: "(D'AB) ∩ (A'BC') = BC'. Fie O și O' mijloacele segmentelor BC', respectiv AD'. A'O ⊥ BC', A'O ⊂ (A'BC'), OO' ⊥ BC', OO' ⊂ (D'AB), deci ∢((D'AB),(A'BC')) = ∢(A'O, OO') = ∢A'OO'. Cum A'O' = 3√2/2 cm și OO' = 3√2 cm, în triunghiul A'OO' dreptunghic în O': tg(∢A'OO') = A'O'/OO' = 1/2." },
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
  console.log(`\n=== import-exam-mate-2022-rezerva-1 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
