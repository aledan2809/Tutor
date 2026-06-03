#!/usr/bin/env node
/**
 * import-exam-mate-2025-rezerva-02.mjs — Exam-Bank series 2, pair 2025 Rezervă Varianta 2 (Matematică)
 *
 * SOURCE: Ministerul Educației și Cercetării / CNCCE — EN VIII, an școlar 2024–2025, Rezervă Varianta 2.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1d 2c 3d 4a 5d 6a · II = 1a 2c 3d 4d 5c 6b
 * Figures: 11 PNG (en-viii-2025-mate-rezerva-02-s{1,2,3}-{label}.png). finalAnswer: III.1=130, III.2=10.
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2025-mate-rezerva-02-${s}.png`;

const MATH = {
  source: "EN VIII 2025 Rezervă, Varianta 2 (edu.ro)",
  examType: "EN_VIII", year: 2025, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "rezerva-02", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNCCE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Cel mai mare număr întreg de două cifre este:",
      options: [{ key: "a", text: "−99" }, { key: "b", text: "−10" }, { key: "c", text: "10" }, { key: "d", text: "99" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporții. Calcul algebric",
      content: "Știind că (x − 1)/7 = y/2, rezultatul calculului 2x − 7y este egal cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "1" }, { key: "c", text: "2" }, { key: "d", text: "5" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Luni, temperatura înregistrată la ora 9 la o stație meteo a fost de −4°C, iar marți, la aceeași oră, au fost înregistrate 2°C. Temperatura înregistrată marți este mai mare decât temperatura înregistrată luni cu:",
      options: [{ key: "a", text: "−6°C" }, { key: "b", text: "−2°C" }, { key: "c", text: "2°C" }, { key: "d", text: "6°C" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea fracțiilor",
      content: "Dintre numerele 7/2, 7/3, 7/4 și 7/5, cel mai mic este:",
      options: [{ key: "a", text: "7/5" }, { key: "b", text: "7/4" }, { key: "c", text: "7/3" }, { key: "d", text: "7/2" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Produs",
      content: "Patru elevi, Elena, Sofia, Petrică și Tudor, calculează produsul numerelor a = √5 − 2 și b = √5 + 2. Rezultatele obținute: Elena → 9; Sofia → 7; Petrică → 3; Tudor → 1. Conform informațiilor din tabel, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Elena" }, { key: "b", text: "Sofia" }, { key: "c", text: "Petrică" }, { key: "d", text: "Tudor" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Interpretarea diagramelor",
      hasFigure: true, figureUrl: FIG("s1-6"),
      figureNote: "Diagramă cu bare — cărți vândute pe luni: Ianuarie 1500, Februarie 2000, Martie 500, Aprilie 2500, Mai 1500.",
      content: "În diagrama alăturată sunt prezentate informații despre numărul de cărți vândute într-o librărie în primele cinci luni ale anului 2025. Afirmația: „Conform informațiilor din diagramă, cele mai multe cărți au fost vândute în luna aprilie.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea (figuri) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C coliniare, în această ordine; AB = 4 cm, BC = 14 cm; M mijlocul lui AB, N mijlocul lui BC.",
      content: "În figura alăturată, punctele A, B și C sunt coliniare, în această ordine, astfel încât AB = 4 cm și BC = 14 cm. Știind că punctul M este mijlocul segmentului AB, iar punctul N este mijlocul segmentului BC, lungimea segmentului MN este egală cu:",
      options: [{ key: "a", text: "9 cm" }, { key: "b", text: "7 cm" }, { key: "c", text: "4 cm" }, { key: "d", text: "2 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri congruente",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiurile congruente AOB, BOC și COA în jurul punctului O.",
      content: "În figura alăturată sunt reprezentate unghiurile congruente AOB, BOC și COA. Măsura unghiului AOB este egală cu:",
      options: [{ key: "a", text: "60°" }, { key: "b", text: "90°" }, { key: "c", text: "120°" }, { key: "d", text: "150°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi isoscel. Unghi exterior",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi isoscel ABC (AC = BC), ∢ACB = 40°; A, B, D coliniare, în această ordine.",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC, cu AC = BC și măsura unghiului ACB este de 40°. Punctele A, B și D sunt coliniare, în această ordine. Măsura unghiului CBD este egală cu:",
      options: [{ key: "a", text: "40°" }, { key: "b", text: "70°" }, { key: "c", text: "100°" }, { key: "d", text: "110°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelogram",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Paralelogram ABCD cu AD = BD = 4√2 cm; ∢ADB = 90°.",
      content: "În figura alăturată este reprezentat paralelogramul ABCD, cu AD = BD = 4√2 cm. Măsura unghiului ADB este egală cu 90°. Lungimea segmentului CD este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "4√2 cm" }, { key: "c", text: "4√3 cm" }, { key: "d", text: "8 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Triunghi echilateral înscris",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cerc de centru O, rază 10 cm; triunghi echilateral ABC înscris.",
      content: "În figura alăturată este reprezentat cercul de centru O și raza de 10 cm. Triunghiul echilateral ABC este înscris în acest cerc. Lungimea laturii triunghiului echilateral ABC este egală cu:",
      options: [{ key: "a", text: "10√2 cm" }, { key: "b", text: "15 cm" }, { key: "c", text: "10√3 cm" }, { key: "d", text: "20 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Sferă. Volum",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Sferă cu raza de 3 cm.",
      content: "În figura alăturată este reprezentată o sferă cu raza de 3 cm. Volumul sferei este egal cu:",
      options: [{ key: "a", text: "108π cm³" }, { key: "b", text: "36π cm³" }, { key: "c", text: "27π cm³" }, { key: "d", text: "12π cm³" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Numere naturale",
      finalAnswer: "130",
      content: "Doi copii, Alin și Maria, au împreună o sumă de bani S. Sumele de bani ale fiecărui copil sunt exprimate prin numere naturale. Dacă Alin ar cheltui 10 lei, atunci lui Alin i-ar rămâne de două ori mai puțini bani decât are Maria.",
      rubric: [
        { label: "a)", points: 2, answer: "Maria are 2(x − 10) lei (x = suma lui Alin). Din x + 2(x − 10) = 140 ⇒ x = 160/3, care nu este număr natural, deci nu este posibil ca suma S să fie egală cu 140 de lei." },
        { label: "b)", points: 3, answer: "2(x − 10) = y și x + 15 = y − 15 (x = suma lui Alin, y = suma Mariei). Rezolvând sistemul: x = 50, y = 80, deci S = 50 + 80 = 130 lei." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Expresii raționale",
      finalAnswer: "10",
      content: "Se consideră expresia E(x) = (1/(x²−4) + 1/(x+2)) : 1/(x³−4x), unde x este număr real, x ≠ 0, x ≠ −2 și x ≠ 2.",
      rubric: [
        { label: "a)", points: 2, answer: "1/(x²−4) + 1/(x+2) = 1/((x+2)(x−2)) + 1/(x+2) = (1 + x − 2)/((x+2)(x−2)) = (x−1)/((x+2)(x−2)), pentru orice x real, x ≠ −2, x ≠ 2." },
        { label: "b)", points: 3, answer: "E(x) = (x−1)/((x+2)(x−2)) · x(x+2)(x−2) = x(x−1) = x² − x. E(√2−1) = 4 − 3√2 și E(√2+1) = 2 + √2, deci N = (4 − 3√2) + 3(2 + √2) = 4 + 6 = 10, care este număr natural." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Grafic. Geometrie analitică",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu graficul funcției f(x) = 2 − x.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = 2 − x.",
      rubric: [
        { label: "a)", points: 2, answer: "f(1) = 1 și f(0) = 2, deci f(1)·f(0) = 1·2 = 2." },
        { label: "b)", points: 3, answer: "Graficul intersectează axele în A(2, 0) și B(0, 2). Cum OA = OB = 2, ΔAOB este dreptunghic isoscel ⇒ ∢OBA = 45°. CT ⊥ AB (T pe AB) ⇒ ΔBCT dreptunghic isoscel, de unde d(C, AB) = CT = 3√2 cm (pentru C(0, −4))." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi echilateral. Centru de greutate. Arii",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghi echilateral ABC cu AB = 6 cm; G centrul de greutate; M simetricul lui A față de G.",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC, cu AB = 6 cm. Punctul G este centrul de greutate al triunghiului ABC și punctul M este simetricul punctului A față de punctul G.",
      rubric: [
        { label: "a)", points: 2, answer: "AG = GM și, cum CG = AG/2... mai precis AM = 2·AG, CG = AG/2 ⇒ în triunghiul ACM, CG este mediană egală cu jumătate din AM, deci triunghiul ACM este dreptunghic cu ∢ACM = 90°." },
        { label: "b)", points: 3, answer: "∢BAC = ∢MTC = 60° ⇒ AB ∥ TM și, cum ∢ABM = 90°, ABMT este trapez dreptunghic. AT = TM = 2·TC ⇒ TM = 4 cm, BM = AM/2 = 2√3 cm. Aria(ABMT) = ((6 + 4)·2√3)/2 = 10√3 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrat. Congruență. Inegalități",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Pătrat ABCD cu AB = 8 cm; T pe AD cu ∢ABT = 30°; perpendiculara din A pe BT taie BT în M și DC în S.",
      content: "În figura alăturată este reprezentat pătratul ABCD, cu AB = 8 cm. Punctul T aparține laturii AD, astfel încât măsura unghiului ABT este egală cu 30°. Perpendiculara din punctul A pe dreapta BT intersectează dreptele BT și DC în punctele M, respectiv S.",
      rubric: [
        { label: "a)", points: 2, answer: "∢MAB = 60° ⇒ ∢SAD = 30°. Triunghiurile TBA și SAD sunt congruente (ALU), deci AT = DS." },
        { label: "b)", points: 3, answer: "În ΔAMB dreptunghic cu ∢ABM = 30° ⇒ AM = AB/2 = 4 cm. În ΔAMQ dreptunghic cu ∢MAD = 30° ⇒ MQ = AM/2 = 2 cm (MQ ⊥ AD, Q pe AD), de unde AQ = 2√3 cm, deci DQ = 2(4 − √3) cm. În triunghiul dreptunghic MDQ, DM este ipotenuză, deci DM > DQ = 2(4 − √3) cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cub ABCDA'B'C'D' cu AB = 4 cm; M mijlocul lui AB; P mijlocul lui C'C; O = A'C' ∩ B'D'.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D', cu AB = 4 cm. Punctul M este mijlocul segmentului AB și punctul P este mijlocul segmentului C'C.",
      rubric: [
        { label: "a)", points: 2, answer: "MB = 2 cm. În triunghiul dreptunghic CBM: CM = √(MB² + BC²) = √(2² + 8²)... = √(4 + 16) = 2√5 cm." },
        { label: "b)", points: 3, answer: "SOBM paralelogram (S mijlocul muchiei A'D') ⇒ BO ∥ MS, deci ∢(BO, MP) = ∢(MS, MP). Triunghiurile SAM, MCP și PD'S sunt congruente ⇒ SM = MP = PS, deci triunghiul SMP este echilateral și ∢(MS, MP) = ∢SMP = 60°." },
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
  console.log(`\n=== import-exam-mate-2025-rezerva-02 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
