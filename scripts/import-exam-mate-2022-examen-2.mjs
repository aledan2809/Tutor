#!/usr/bin/env node
/**
 * import-exam-mate-2022-examen-2.mjs — Exam-Bank series 3, pair 2022 Examen Varianta 2 (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2021–2022, Examen sesiune iunie, Varianta 2.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1d 2d 3a 4b 5c 6a · II = 1d 2b 3d 4b 5a 6b
 * Figures: 10 PNG (en-viii-2022-mate-examen-2-s{2,3}-{label}.png) — s2-1..6, s3-3..6.
 *   finalAnswer: III.1=151, III.3=1/4. (III.2 interval; III.4 demonstrație; III.5/6 radicali → skip.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2022-mate-examen-2-${s}.png`;

const MATH = {
  source: "EN VIII 2022 Examen Varianta 2 (edu.ro)",
  examType: "EN_VIII", year: 2022, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "examen-2", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2022/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 10 + 10 : 10 este egal cu:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "9" }, { key: "c", text: "10" }, { key: "d", text: "11" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporții",
      content: "Dacă b ≠ 0 și a/2 = 10/b, atunci a·b este egal cu:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "5" }, { key: "c", text: "10" }, { key: "d", text: "20" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere opuse",
      content: "Opusul numărului 5 este:",
      options: [{ key: "a", text: "−5" }, { key: "b", text: "−1/5" }, { key: "c", text: "1/5" }, { key: "d", text: "5" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții zecimale. Fracție ordinară",
      content: "Transformând numărul 1,3 în fracție ordinară se obține:",
      options: [{ key: "a", text: "1/3" }, { key: "b", text: "13/10" }, { key: "c", text: "4/3" }, { key: "d", text: "13/9" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Produs",
      content: "Patru elevi, Ana, George, Radu și Elena, au calculat produsul numerelor x = 2√2 și y = 1/(2√2), iar rezultatele obținute sunt: Ana → 4√2; George → √2; Radu → 1; Elena → 8. Conform informațiilor din tabel, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Ana" }, { key: "b", text: "George" }, { key: "c", text: "Radu" }, { key: "d", text: "Elena" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Probleme cu vârste",
      content: "Andrei are 28 de ani, iar Cătălina are 13 ani. Andrei afirmă: „Peste doi ani voi avea dublul vârstei pe care o va avea Cătălina.”. Afirmația lui Andrei este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele C, A, B, D coliniare; AB = 10 cm; A mijlocul lui CB, B mijlocul lui CD.",
      content: "În figura alăturată este reprezentat segmentul AB cu lungimea de 10 cm. Punctul A este mijlocul segmentului CB, iar punctul B este mijlocul segmentului CD. Lungimea segmentului CD este egală cu:",
      options: [{ key: "a", text: "10 cm" }, { key: "b", text: "20 cm" }, { key: "c", text: "30 cm" }, { key: "d", text: "40 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri opuse la vârf",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiurile opuse la vârf AOC și BOD; ∢AOC = 60°.",
      content: "În figura alăturată sunt reprezentate unghiurile opuse la vârf AOC și BOD. Măsura unghiului AOC este egală cu 60°. Măsura unghiului BOD este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "120°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Romb. Diagonale",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Rombul ABCD cu AB = BD = 12 cm; M mijlocul lui CD; G = BM ∩ AC.",
      content: "În figura alăturată este reprezentat rombul ABCD cu AB = BD = 12 cm. Punctul M este mijlocul segmentului CD și dreapta BM intersectează dreapta AC în punctul G. Lungimea segmentului AG este egală cu:",
      options: [{ key: "a", text: "12√3 cm" }, { key: "b", text: "10√3 cm" }, { key: "c", text: "9√3 cm" }, { key: "d", text: "8√3 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Trapez dreptunghic. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Trapezul ABCD cu bazele AB și CD, ∢BAD = 90°, AD = DC = 5 cm, AB = 10 cm.",
      content: "În figura alăturată este reprezentat trapezul ABCD cu bazele AB și CD, în care măsura unghiului BAD este egală cu 90°, AD = DC = 5 cm și AB = 10 cm. Măsura unghiului ABC este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "90°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghi înscris",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O și diametru BC = 10 cm; A pe cerc, arcul mic AC de 120°.",
      content: "În figura alăturată este reprezentat cercul de centru O și diametru BC = 10 cm. Punctul A aparține cercului astfel încât măsura arcului mic AC este de 120°. Lungimea segmentului AB este egală cu:",
      options: [{ key: "a", text: "5 cm" }, { key: "b", text: "5√2 cm" }, { key: "c", text: "5√3 cm" }, { key: "d", text: "10 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelipiped dreptunghic. Diagonală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Paralelipipedul dreptunghic ABCDEFGH cu AB = 4 cm, BC = 3 cm, AE = 12 cm.",
      content: "În figura alăturată este reprezentat paralelipipedul dreptunghic ABCDEFGH cu AB = 4 cm, BC = 3 cm și AE = 12 cm. Lungimea diagonalei AG a paralelipipedului este egală cu:",
      options: [{ key: "a", text: "5 cm" }, { key: "b", text: "13 cm" }, { key: "c", text: "14 cm" }, { key: "d", text: "19 cm" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Sistem de ecuații",
      finalAnswer: "151",
      content: "Ana, Maria și Vlad au în total 396 de timbre. Ana are cu 25 de timbre mai multe decât Maria și cu 16 timbre mai puține decât Vlad.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă Ana ar avea 132 de timbre, atunci Maria ar avea 132 − 25 = 107 timbre și Vlad ar avea 132 + 16 = 148 de timbre. Deoarece 132 + 107 + 148 = 387 ≠ 396, deducem că nu este posibil ca Ana să aibă 132 de timbre." },
        { label: "b)", points: 3, answer: "Fie x numărul de timbre pe care le are Vlad; atunci Ana are x − 16, iar Maria are x − 41. Din x + (x − 16) + (x − 41) = 396 rezultă x = 151. Deci Vlad are 151 de timbre." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Inecuații",
      content: "Se consideră expresia E(x) = (x + 1)² + 2(x − 1)² − 3(x² − 1), unde x este număr real.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = x² + 2x + 1 + 2(x² − 2x + 1) − 3x² + 3 = x² + 2x + 1 + 2x² − 4x + 2 − 3x² + 3 = 6 − 2x, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) < x ⇔ 6 − 2x < x ⇔ 3x > 6 ⇔ x > 2, deci mulțimea cerută este (2, +∞)." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Arie",
      hasFigure: true, figureUrl: FIG("s3-3"), finalAnswer: "1/4",
      figureNote: "Sistem de axe ortogonale xOy cu reprezentarea grafică a funcției f(x) = x − 1; A pe Ox, B pe Oy, C mijlocul lui AB.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x − 1.",
      rubric: [
        { label: "a)", points: 2, answer: "f(0) = −1; f(1) = 0, deci f(0) + f(1) = −1." },
        { label: "b)", points: 3, answer: "A(1, 0) și B(0, −1) sunt punctele de intersecție a graficului funcției f cu axele Ox, respectiv Oy. A_AOB = (OA·OB)/2 = 1/2. Cum C este mijlocul segmentului AB, A_BOC = A_AOB/2 = 1/4 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghiuri asemenea. Arie",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Punctele A, B, C, D, E cu AB = 4 cm, AC = 8 cm, AD = 10 cm, AE = 20 cm; ∢BAC = ∢DAE și ∢CAD = 30°.",
      content: "În figura alăturată sunt reprezentate punctele A, B, C, D și E astfel încât AB = 4 cm, AC = 8 cm, AD = 10 cm și AE = 20 cm. Măsura unghiului BAC este egală cu măsura unghiului DAE și ∢CAD = 30°.",
      rubric: [
        { label: "a)", points: 2, answer: "∢CAD = 30°, deci d(C, AD) = AC/2 = 4 cm. A_CAD = (AD · d(C, AD))/2 = (10·4)/2 = 20 cm²." },
        { label: "b)", points: 3, answer: "∢BAD = ∢BAC + ∢CAD și ∢CAE = ∢CAD + ∢DAE; cum ∢BAC = ∢DAE, rezultă ∢BAD = ∢CAE. Cum AB/AC = AD/AE = 1/2 și ∢BAD = ∢CAE, obținem ΔBAD ~ ΔCAE, deci BD/CE = 1/2, de unde CE = 2·BD." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez dreptunghic. Centru de greutate",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Trapezul dreptunghic ABCD cu AB ∥ CD, ∢ABC = 45°, AD = CD = 10 cm; DR ∥ BC taie AB în R; T = AD ∩ BC; O = TR ∩ AC.",
      content: "În figura alăturată este reprezentat trapezul dreptunghic ABCD cu AB ∥ CD, ∢ABC = 45° și AD = CD = 10 cm. Paralela prin D la dreapta BC intersectează dreapta AB în punctul R. Dreptele AD și BC se intersectează în punctul T și O este punctul de intersecție a dreptelor TR și AC.",
      rubric: [
        { label: "a)", points: 2, answer: "CD ∥ AB și DR ∥ CB ⇒ BCDR este paralelogram ⇒ BR = CD = 10 cm. ∢DAR = 90°, ∢ARD = 45° ⇒ triunghiul ADR este dreptunghic isoscel cu AD = AR = 10 cm ⇒ AR = RB, deci R este mijlocul segmentului AB." },
        { label: "b)", points: 3, answer: "CD ∥ AB și CD = AB/2 ⇒ CD este linie mijlocie în triunghiul TAB, deci C este mijlocul lui TB și D este mijlocul lui TA. Triunghiul TAR dreptunghic în A ⇒ TR = √(20² + 10²) = 10√5 cm. Punctul O este centrul de greutate al triunghiului TAB, deci TO = (2/3)·TR = 20√5/3 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Prismă dreaptă. Volum. Distanță la plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Prisma dreaptă ABCDEF cu baza triunghiul echilateral ABC și AB = AD = 10 cm; M mijlocul lui AB.",
      content: "În figura alăturată este reprezentată prisma dreaptă ABCDEF cu baza triunghiul echilateral ABC și AB = AD = 10 cm. Punctul M este mijlocul segmentului AB.",
      rubric: [
        { label: "a)", points: 2, answer: "A_ABC = 25√3 cm² (aria triunghiului echilateral cu latura 10 cm). V_ABCDEF = A_ABC · AD = 25√3 · 10 = 250√3 cm³." },
        { label: "b)", points: 3, answer: "BP ⊥ EM, unde P ∈ EM. Cum CM ⊥ AB și CM ⊥ AD cu AB ∩ AD = {A}, rezultă CM ⊥ (BAD), deci BP ⊥ CM; cum CM ∩ EM = {M}, obținem BP ⊥ (EMC). Atunci d(B, (EMC)) = BP = (MB · BE)/EM = 2√5 cm." },
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
  console.log(`\n=== import-exam-mate-2022-examen-2 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
