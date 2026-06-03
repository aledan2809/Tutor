#!/usr/bin/env node
/**
 * import-exam-mate-2021-rezerva-2.mjs — Exam-Bank series 3, pair 2021 Rezervă Varianta 2 (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Rezervă Varianta 2.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1b 2c 3b 4c 5c 6b · II = 1b 2c 3d 4a 5a 6c
 * Figures: 10 PNG (en-viii-2021-mate-rezerva-2-s{2,3}-{label}.png) — toate 6 SII + s3-3..6.
 *   finalAnswer: III.1=240, III.2=62, III.4=12,5, III.5=160 (III.3=3√10, III.6=2√6 radicali).
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-rezerva-2-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Rezervă Varianta 2 (edu.ro)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "rezerva-2", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Multipli",
      content: "Cel mai mare număr natural de două cifre, multiplu al numărului 20, este egal cu:",
      options: [{ key: "a", text: "20" }, { key: "b", text: "80" }, { key: "c", text: "99" }, { key: "d", text: "100" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporții",
      content: "Dacă x/4 = 5/2, atunci x este egal cu:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "5" }, { key: "c", text: "10" }, { key: "d", text: "20" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 8 + 2 · 4 este egal cu:",
      options: [{ key: "a", text: "40" }, { key: "b", text: "16" }, { key: "c", text: "14" }, { key: "d", text: "0" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "Într-o școală, 400 de elevi au ales culoarea favorită. Opțiunile au fost înregistrate în raport procentual: albastru 25%, roșu 35%, galben 14%, verde x%, altele 20%. Conform tabelului, numărul elevilor care au ales culoarea verde este egal cu:",
      options: [{ key: "a", text: "6" }, { key: "b", text: "16" }, { key: "c", text: "24" }, { key: "d", text: "80" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Adunare",
      content: "Patru elevi, Alina, Bianca, George și Iosif, adună numărul a = 3 + 5√2 cu numărul b = 5 − 5√2 și obțin rezultatele: Alina → 8 − 10√2; Bianca → 4; George → 8; Iosif → 8 + 10√2. Dintre cei patru elevi, cel care a efectuat corect adunarea este:",
      options: [{ key: "a", text: "Alina" }, { key: "b", text: "Bianca" }, { key: "c", text: "George" }, { key: "d", text: "Iosif" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Intervale de numere reale",
      content: "Se consideră intervalul de numere reale I = (3, 4]. Mircea afirmă că: „Numărul 3√2 aparține intervalului I.”. Afirmația lui Mircea este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea (toate cu figură) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare, în această ordine; AC = 4 cm, BD = 8 cm; B mijlocul lui AC.",
      content: "În figura alăturată sunt reprezentate punctele coliniare A, B, C și D, în această ordine, astfel încât AC = 4 cm și BD = 8 cm. Punctul B este mijlocul segmentului AC. Lungimea segmentului CD este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "6 cm" }, { key: "c", text: "10 cm" }, { key: "d", text: "12 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte paralele. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Triunghiul ABC cu ∢B = 45°; A, C, D coliniare; EC ∥ AB; ∢ECD = 135°.",
      content: "În figura alăturată este reprezentat triunghiul ABC, cu măsura unghiului B de 45°. Punctele A, C și D sunt coliniare în această ordine. Dreptele EC și AB sunt paralele și măsura unghiului ECD este egală cu 135°. Măsura unghiului ACB este egală cu:",
      options: [{ key: "a", text: "45°" }, { key: "b", text: "80°" }, { key: "c", text: "90°" }, { key: "d", text: "100°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi isoscel. Teorema cosinusului",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul isoscel ABC cu ∢BAC = 120°, AC = 6 cm.",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC. Măsura unghiului BAC este egală cu 120° și AC = 6 cm. Lungimea laturii BC este egală cu:",
      options: [{ key: "a", text: "3√3 cm" }, { key: "b", text: "3 cm" }, { key: "c", text: "6 cm" }, { key: "d", text: "6√3 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelogram. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Paralelogramul ABCD cu AD = 3 cm; E pe DC; AE bisectoarea ∢DAB, BE bisectoarea ∢ABC.",
      content: "În figura alăturată este reprezentat paralelogramul ABCD, cu AD = 3 cm, în care punctul E se află pe latura DC astfel încât AE este bisectoarea unghiului DAB și BE este bisectoarea unghiului ABC. Perimetrul paralelogramului ABCD este egal cu:",
      options: [{ key: "a", text: "18 cm" }, { key: "b", text: "15 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "9 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Arce congruente",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Punctele A, B, C pe cercul de centru O; arcele mici AB, BC, CA congruente.",
      content: "În figura alăturată, punctele A, B și C sunt situate pe cercul de centru O, astfel încât arcele mici AB, BC și CA sunt congruente. Măsura unghiului BOC este egală cu:",
      options: [{ key: "a", text: "120°" }, { key: "b", text: "90°" }, { key: "c", text: "60°" }, { key: "d", text: "30°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Arie totală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cubul ABCDA'B'C'D'; suma lungimilor tuturor muchiilor este 120 cm.",
      content: "În figura alăturată este reprezentat un cub ABCDA'B'C'D'. Suma lungimilor tuturor muchiilor cubului este egală cu 120 cm. Aria totală a cubului este egală cu:",
      options: [{ key: "a", text: "100 cm²" }, { key: "b", text: "400 cm²" }, { key: "c", text: "600 cm²" }, { key: "d", text: "1000 cm²" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Fracții. Probleme",
      finalAnswer: "240",
      content: "Un automobil a parcurs distanța dintre două orașe în trei zile. În prima zi a parcurs 3/10 din distanță și încă 13 km. În a doua zi a parcurs 2/5 din distanța rămasă după prima zi. În a treia zi a parcurs restul distanței, adică 93 de km.",
      rubric: [
        { label: "a)", points: 2, answer: "În a treia zi automobilul a parcurs 3/5 din distanța rămasă după prima zi; cum în a doua zi a parcurs 2/3 din 93 km, adică 62 km, distanța parcursă în a doua zi nu poate fi egală cu 60 km." },
        { label: "b)", points: 3, answer: "(3/10)x + 13 este distanța parcursă în prima zi, unde x este distanța dintre cele două orașe. Din (3/10·x + 13) + (2/5)(7/10·x − 13) + 93 = x rezultă x = 240 km." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Sume",
      finalAnswer: "62",
      content: "Se consideră expresia E(x) = (x + 4)² + (x − 1)² − (√2·x + 3)(√2·x − 3), unde x este număr real.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = (x² + 8x + 16) + (x² − 2x + 1) − (2x² − 9) = 6x + 26, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "A − B = (E(1) − E(2)) + (E(3) − E(4)) + ... + (E(9) − E(10)) + E(11) = (−6)·5 + 6·11 + 26 = 62." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Distanța dintre două puncte",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu reprezentarea grafică a funcției f(x) = −3x + 5.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = −3x + 5.",
      rubric: [
        { label: "a)", points: 2, answer: "f(3) = −4; f(0) = 5, deci f(3) + f(0) = −4 + 5 = 1." },
        { label: "b)", points: 3, answer: "Abscisa lui A este 3, deci A(3, −4); f(x) = 5 ⇒ x = 0, deci B(0, 5); atunci AB = √(3² + 9²) = 3√10." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez. Asemănare. Arii",
      hasFigure: true, figureUrl: FIG("s3-4"), finalAnswer: "12,5",
      figureNote: "Trapezul ABCD cu AB ∥ CD, AB = 15 cm, CD = 5 cm, BC = 8 cm, AD = 6 cm; AD ∩ BC = P.",
      content: "Se consideră trapezul ABCD, cu AB ∥ CD, AB = 15 cm, CD = 5 cm, BC = 8 cm și AD = 6 cm. Dreptele AD și BC se intersectează în punctul P.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔPDC ~ ΔPAB ⇒ PD/PA = DC/AB = 1/3; din PD/(PD + 6) = 1/3 rezultă PD = 3 cm." },
        { label: "b)", points: 3, answer: "A(ABCD) = 8·A(PDC); din A(PDC) = p%·A(ABCD) rezultă p/100 = 1/8, deci p = 12,5 (aria triunghiului PCD reprezintă 12,5% din aria trapezului ABCD)." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Teorema înălțimii",
      hasFigure: true, figureUrl: FIG("s3-5"), finalAnswer: "160",
      figureNote: "Triunghiul ABC dreptunghic în A, AC = 40 cm; AD ⊥ BC (D pe BC); CD/AD = 3/4.",
      content: "Se consideră triunghiul ABC, dreptunghic în A, cu AC = 40 cm. Dreptele AD și BC sunt perpendiculare, punctul D aparține dreptei BC și CD/AD = 3/4.",
      rubric: [
        { label: "a)", points: 2, answer: "AD = 4k, CD = 3k (k > 0); cum AD² + CD² = AC², rezultă k = 8, deci AD = 32 cm." },
        { label: "b)", points: 3, answer: "AD² = CD·BD ⇒ BD = 128/3 cm, deci BC = 200/3 cm; AB² = BD·BC ⇒ AB = 160/3 cm; P(ABC) = AC + AB + BC = 40 + 160/3 + 200/3 = 160 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Paralelipiped dreptunghic. Distanță punct-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Paralelipipedul dreptunghic ABCDA'B'C'D' cu AB = 6√2 cm, BC = 6 cm, ∢D'CA' = 30°.",
      content: "Se consideră paralelipipedul dreptunghic ABCDA'B'C'D', cu AB = 6√2 cm, BC = 6 cm și măsura unghiului D'CA' egală cu 30°.",
      rubric: [
        { label: "a)", points: 2, answer: "A'D' ⊥ (C'D'D), D'C ⊂ (C'D'D), deci triunghiul A'D'C este dreptunghic în D' și, cum ∢A'CD' = 30°, A'C = 12 cm; D'C = 6√3 cm, deci DD' = √(12² − (6√3)²) = 6 cm." },
        { label: "b)", points: 3, answer: "D'A' ⊥ (A'AB); fie M ∈ A'B cu AM ⊥ A'B: A'D' ⊥ AM și A'D' ∩ A'B = {A'} ⇒ AM ⊥ (A'D'C), deci d(A, (A'D'C)) = AM; în triunghiul A'AB dreptunghic în A, A'B = 6√3 cm și AM = (AA'·AB)/A'B = 2√6 cm." },
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
  console.log(`\n=== import-exam-mate-2021-rezerva-2 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
