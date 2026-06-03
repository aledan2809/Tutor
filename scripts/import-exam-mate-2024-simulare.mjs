#!/usr/bin/env node
/**
 * import-exam-mate-2024-simulare.mjs — Exam-Bank series 2, pair 2024 Simulare (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2023–2024, Simulare.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1a 2d 3c 4d 5d 6a · II = 1d 2b 3c 4c 5c 6d
 * Figures: 10 PNG (en-viii-2024-mate-simulare-s{1,2,3}-{label}.png). finalAnswer: III.1=149, III.3=342, III.5=1/3.
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2024-mate-simulare-${s}.png`;

const MATH = {
  source: "EN VIII 2024 Simulare (edu.ro)",
  examType: "EN_VIII", year: 2024, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "simulare", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2024/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 52 − 2 · (25 − 5) este:",
      options: [{ key: "a", text: "12" }, { key: "b", text: "92" }, { key: "c", text: "100" }, { key: "d", text: "1000" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporții. Calcul algebric",
      content: "Dacă (x − 2)/5 = y/3, atunci rezultatul calculului 3x − 5y este:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "2" }, { key: "c", text: "5" }, { key: "d", text: "6" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Mulțimi",
      content: "Se consideră mulțimile A = {1, 2, 3, 4, 5, 6} și B = {0, 2, 4, 6, 8}. Intersecția mulțimilor A și B este mulțimea:",
      options: [{ key: "a", text: "{0, 2, 4, 6, 8}" }, { key: "b", text: "{0, 1, 2, 3, 4, 5, 6, 8}" }, { key: "c", text: "{2, 4, 6}" }, { key: "d", text: "{0, 2, 4, 6}" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Inecuații",
      content: "Mulțimea soluțiilor reale ale inecuației 2x + 2 ≥ 4 este:",
      options: [{ key: "a", text: "(−∞, −1]" }, { key: "b", text: "(−∞, 1]" }, { key: "c", text: "[−1, +∞)" }, { key: "d", text: "[1, +∞)" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Module. Radicali",
      content: "Patru elevi, Ana, Ioan, Dana și Vlad, determină numărul a = |2 − 4√3| + 2(√12 + 1). Rezultatele obținute: Ana → 0; Ioan → 4; Dana → 4√3; Vlad → 8√3. Conform informațiilor din tabel, elevul care a determinat corect numărul a este:",
      options: [{ key: "a", text: "Ana" }, { key: "b", text: "Ioan" }, { key: "c", text: "Dana" }, { key: "d", text: "Vlad" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Interpretarea diagramelor",
      hasFigure: true, figureUrl: FIG("s1-6"),
      figureNote: "Diagramă cu bare — numărul de elevi pe note: Nota 4 → 1, Nota 5 → 3, Nota 6 → 6, Nota 7 → 5, Nota 8 → 5, Nota 9 → 6, Nota 10 → 4.",
      content: "În diagrama alăturată sunt prezentate rezultatele obținute de elevii unei clase, la un test de matematică. Afirmația: „Conform informațiilor din diagramă, jumătate din numărul elevilor acestei clase a obținut la testul de matematică cel puțin nota 8.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea (figuri) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare, în această ordine; BC = 2·AB, CD = 2·BC, AB = 2 cm; M mijlocul lui AB, N mijlocul lui CD.",
      content: "În figura alăturată punctele A, B, C și D sunt coliniare, în această ordine, astfel încât BC = 2·AB, CD = 2·BC și AB = 2 cm. Punctul M este mijlocul segmentului AB și punctul N este mijlocul segmentului CD. Lungimea segmentului MN este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "5 cm" }, { key: "c", text: "7 cm" }, { key: "d", text: "9 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri complementare. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiurile adiacente complementare AOB și BOC; OM bisectoarea unghiului AOB; ∢BOC = 3·∢AOM.",
      content: "În figura alăturată sunt reprezentate unghiurile adiacente complementare AOB și BOC. Semidreapta OM este bisectoarea unghiului AOB și ∢BOC = 3·∢AOM. Măsura unghiului AOB este egală cu:",
      options: [{ key: "a", text: "18°" }, { key: "b", text: "36°" }, { key: "c", text: "40°" }, { key: "d", text: "54°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi. Bisectoare. Linie paralelă",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi ABC cu AB = 10 cm, AC = 12 cm; BI, CI bisectoarele unghiurilor ABC, ACB; paralela prin I la BC taie AB în D și AC în E.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu AB = 10 cm și AC = 12 cm. Semidreapta BI este bisectoarea unghiului ABC și semidreapta CI este bisectoarea unghiului ACB. Paralela prin punctul I la dreapta BC intersectează dreptele AB și AC în punctele D, respectiv E. Perimetrul triunghiului ADE este egal cu:",
      options: [{ key: "a", text: "11 cm" }, { key: "b", text: "20 cm" }, { key: "c", text: "22 cm" }, { key: "d", text: "24 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Trapez. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Dreptunghi ABCD cu AB = 3√2 cm; triunghi BEC dreptunghic în E; F mijlocul lui BC, EF = 4 cm.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD, cu AB = 3√2 cm și triunghiul BEC dreptunghic în E. Punctul F este mijlocul segmentului BC și EF = 4 cm. Aria trapezului AFCD este egală cu:",
      options: [{ key: "a", text: "6√2 cm²" }, { key: "b", text: "12√2 cm²" }, { key: "c", text: "18√2 cm²" }, { key: "d", text: "24√2 cm²" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Tangente",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cerc de centru O, rază 3 cm; P la distanța 6 cm de O; PA, PB tangente în A, B.",
      content: "În figura alăturată este reprezentat cercul cu centrul în punctul O și raza egală cu 3 cm. Punctul P este situat la o distanță de 6 cm de centrul cercului. Dreptele PA și PB sunt tangente la cerc în punctele A și B. Măsura arcului mic AB este egală cu:",
      options: [{ key: "a", text: "60°" }, { key: "b", text: "90°" }, { key: "c", text: "120°" }, { key: "d", text: "150°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Piramidă. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Piramidă patrulateră regulată VABCD (bază ABCD), VA = AB; O = AC ∩ DB; M mijlocul lui VB.",
      content: "În figura alăturată este reprezentată piramida patrulateră regulată VABCD cu baza ABCD, VA = AB și O este punctul de intersecție a dreptelor AC și DB. Dacă punctul M este mijlocul segmentului VB, atunci măsura unghiului dreptelor OM și CD este egală cu:",
      options: [{ key: "a", text: "0°" }, { key: "b", text: "30°" }, { key: "c", text: "45°" }, { key: "d", text: "60°" }], correctAnswer: "d" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Divizibilitate. C.m.m.m.c.",
      finalAnswer: "149",
      content: "Maria aranjează cărțile din bibliotecă și observă că dacă le grupează câte 8, câte 12 sau câte 18 îi rămân de fiecare dată 5 cărți.",
      rubric: [
        { label: "a)", points: 2, answer: "Restul împărțirii lui 53 la 18 este 17; cum 17 ≠ 5, Maria nu poate avea în bibliotecă 53 de cărți." },
        { label: "b)", points: 3, answer: "n = 8c₁ + 5 = 12c₂ + 5 = 18c₃ + 5, deci n − 5 este multiplu comun al numerelor 8, 12 și 18 ⇒ n = 72k + 5 (k natural). Cum n este cel mai mic număr natural de trei cifre cu această proprietate, n = 149." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = (2x + 3)² + (x − 2)(x + 2) − 3(1 − x) + 2, unde x este număr real.",
      rubric: [
        { label: "a)", points: 2, answer: "E(0) = (2·0 + 3)² + (0 − 2)(0 + 2) − 3(1 − 0) + 2 = 9 − 4 − 3 + 2 = 4." },
        { label: "b)", points: 3, answer: "E(n) + 6 = 4n² + 12n + 9 + n² − 4 − 3 + 3n + 2 + 6 = 5n² + 15n + 10. N = 5(n² + 3n + 2) = 5(n + 1)(n + 2). Cum (n + 1) și (n + 2) sunt naturale consecutive, produsul lor este par, deci N este divizibil cu 10." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Numere. Proporționalitate",
      finalAnswer: "342",
      content: "Se consideră numărul natural abc cu a, b, c cifre nenule, unde a = 5·(1/2 + 1/3 + 1/6) − (2/3) : (1/3) și b = (3·3² · 3³ · 3⁴) : 9⁴ − 25⁴ : 5⁷.",
      rubric: [
        { label: "a)", points: 2, answer: "a = 5·(3/6 + 2/6 + 1/6) − (2/3)·(3/1) = 5·1 − 2 = 3." },
        { label: "b)", points: 3, answer: "b = 3¹⁰ : 3⁸ − 5⁸ : 5⁷ = 9 − 5 = 4. Numerele ac = „3c” și cb = „c4” sunt direct proporționale cu 4 și 3: (3c)/4 = (cb)/3 ⇒ 37c = 74 ⇒ c = 2, de unde obținem abc = 342." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi. Romb",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghi ABC dreptunghic în A, ∢A = 90°, ∢B = 40°; BE bisectoarea unghiului ABC (E pe AC); AD ⊥ BC, EF ⊥ BC (D, F pe BC); M = BE ∩ AD.",
      content: "În figura alăturată este reprezentat triunghiul dreptunghic ABC, cu ∢A = 90° și ∢B = 40°. Semidreapta BE este bisectoarea unghiului ABC, punctul E aparține segmentului AC. Perpendiculara din punctul A pe BC intersectează dreapta BC în punctul D, iar perpendiculara din punctul E pe BC intersectează dreapta BC în punctul F. Dreptele BE și AD se intersectează în punctul M.",
      rubric: [
        { label: "a)", points: 2, answer: "∢ABE = ∢EBC = 20°, deci în triunghiul BMD: ∢BMD = 70°. Cum ∢BMD = ∢EMA (opuse la vârf), ∢EMA = 70°." },
        { label: "b)", points: 3, answer: "EF ⊥ BC și AD ⊥ BC ⇒ EF ∥ AD. ∢AEB = 70° ⇒ ∢AEM = ∢EMA ⇒ ΔEAM isoscel, deci AE = AM. ΔEFB ≡ ΔEAB ⇒ EF = EA; cum AM = EA și EF ∥ AM, AMFE este romb." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Paralelogram. Raport de arii",
      hasFigure: true, figureUrl: FIG("s3-5"),
      finalAnswer: "1/3",
      figureNote: "Paralelogram ABCD cu AB = 15 cm; P pe AB cu PB = 2·AP; O = AC ∩ BD; N = AC ∩ DP.",
      content: "În figura alăturată este reprezentat paralelogramul ABCD cu AB = 15 cm. Punctul P aparține laturii AB, astfel încât PB = 2·AP și O este punctul de intersecție a dreptelor AC și BD.",
      rubric: [
        { label: "a)", points: 2, answer: "AB = 3·AP ⇒ 3·AP = 15, de unde AP = 5 cm." },
        { label: "b)", points: 3, answer: "ΔANP ∼ ΔCND ⇒ AN/CN = NP/ND = AP/CD = 1/3, deci AN = AC/4; cum AO = AC/2, AN = NO. PS ⊥ AN, DV ⊥ NO și ΔSNP ∼ ΔVND ⇒ PS/DV = NP/ND = 1/3. Aria(ANP)/Aria(DNO) = (AN·PS)/(NO·DV) = PS/DV = 1/3." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Paralelism dreaptă-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cub ABCDA'B'C'D'; M, N, P, Q mijloacele segmentelor AA', A'D', DD', respectiv AD; T mijlocul lui PQ.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D'. Punctele M, N, P și Q sunt mijloacele segmentelor AA', A'D', DD', respectiv AD.",
      rubric: [
        { label: "a)", points: 2, answer: "MN este linie mijlocie în triunghiul AA'D' ⇒ MN = AD'/2. PQ este linie mijlocie în triunghiul ADD' ⇒ PQ = AD'/2, deci MN = PQ." },
        { label: "b)", points: 3, answer: "MN ∥ AD' și PQ ∥ AD' ⇒ MN ∥ PQ. MPCB este paralelogram ⇒ MB ∥ PC. Cum MN ∩ MB = {M} și PQ ∩ PC = {P}, planele (MNB) și (PQC) sunt paralele. Cum CT ⊂ (PQC), rezultă CT ∥ (MNB)." },
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
  console.log(`\n=== import-exam-mate-2024-simulare (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
