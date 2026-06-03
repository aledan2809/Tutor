#!/usr/bin/env node
/**
 * import-exam-mate-2021-examen-3.mjs — Exam-Bank series 3, pair 2021 Examen Varianta 3 (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Varianta 3 (sesiunea iunie).
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1d 2d 3a 4a 5d 6a · II = 1a 2a 3c 4b 5b 6c
 * Figures: 10 PNG (en-viii-2021-mate-examen-3-s{2,3}-{label}.png) — toate 6 SII + s3-3..6.
 *   finalAnswer: III.1=12, III.4=1, III.6=3 (III.3=2√2 radical; III.2/5 demonstrații).
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-examen-3-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Examen Varianta 3 (edu.ro)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "examen-3", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Divizibilitate",
      content: "Dintre numerele 15, 17, 25 și 30, numărul divizibil cu 10 este:",
      options: [{ key: "a", text: "15" }, { key: "b", text: "17" }, { key: "c", text: "25" }, { key: "d", text: "30" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "Un obiect costă 100 de lei. După o scumpire cu 10%, noul preț al obiectului este egal cu:",
      options: [{ key: "a", text: "10 lei" }, { key: "b", text: "90 de lei" }, { key: "c", text: "100 de lei" }, { key: "d", text: "110 lei" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Temperaturile aerului măsurate de Maria, într-o zi, la ora 8:00 și la ora 12:00, sunt înregistrate în tabel: ora 8:00 → −3°C; ora 12:00 → 5°C. Conform informațiilor din tabel, temperatura măsurată la ora 12:00 este mai mare decât temperatura măsurată la ora 8:00 cu:",
      options: [{ key: "a", text: "8°C" }, { key: "b", text: "2°C" }, { key: "c", text: "−2°C" }, { key: "d", text: "−8°C" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții subunitare",
      content: "Fracția subunitară din mulțimea A = {44/10, 5/4, 4/5, 4} este:",
      options: [{ key: "a", text: "4/5" }, { key: "b", text: "5/4" }, { key: "c", text: "4" }, { key: "d", text: "44/10" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali",
      content: "Rezultatul calculului 2√2 − 6√2 + 3√2 este egal cu:",
      options: [{ key: "a", text: "11√2" }, { key: "b", text: "−4√2" }, { key: "c", text: "−√6" }, { key: "d", text: "−√2" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Probleme. Înmulțire",
      content: "Bunica lui Andrei are în curte 10 găini și de două ori mai multe rațe. Andrei afirmă că: „Bunica are în curte 10 găini și 20 de rațe.”. Afirmația lui Andrei este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea (toate cu figură) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare; B mijlocul lui AC; C mijlocul lui AD.",
      content: "În figura alăturată sunt reprezentate punctele distincte A, B, C și D. Punctul B este mijlocul segmentului AC și punctul C este mijlocul segmentului AD. Valoarea raportului BD/AB este egală cu:",
      options: [{ key: "a", text: "3" }, { key: "b", text: "2" }, { key: "c", text: "0,75" }, { key: "d", text: "0,50" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri adiacente. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiurile AOB și BOC adiacente suplementare; OD bisectoarea unghiului AOB; ∢BOC = 40°.",
      content: "În figura alăturată sunt reprezentate unghiurile AOB și BOC, adiacente suplementare, semidreapta OD este bisectoarea unghiului AOB și măsura unghiului BOC este de 40°. Măsura unghiului BOD este egală cu:",
      options: [{ key: "a", text: "70°" }, { key: "b", text: "60°" }, { key: "c", text: "40°" }, { key: "d", text: "30°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Teorema lui Pitagora",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC dreptunghic în A, AB = 4 cm, AC = 6 cm; M mijlocul laturii AC.",
      content: "În figura alăturată este reprezentat triunghiul ABC, dreptunghic în A, cu AB = 4 cm și AC = 6 cm. Punctul M este mijlocul laturii AC. Lungimea segmentului BM este egală cu:",
      options: [{ key: "a", text: "3 cm" }, { key: "b", text: "4 cm" }, { key: "c", text: "5 cm" }, { key: "d", text: "6 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Dreptunghi. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Dreptunghiul ABCD cu AB = 6 cm, BC = 3 cm; bisectoarea unghiului BAD taie DC în P.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD, cu AB = 6 cm și BC = 3 cm. Bisectoarea unghiului BAD intersectează latura DC în punctul P. Măsura unghiului APB este egală cu:",
      options: [{ key: "a", text: "135°" }, { key: "b", text: "90°" }, { key: "c", text: "60°" }, { key: "d", text: "45°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Diametre perpendiculare",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O și rază 2 cm; AB și CD sunt diametre perpendiculare.",
      content: "În figura alăturată este reprezentat cercul de centru O și raza de 2 cm, unde AB și CD sunt diametre perpendiculare. Distanța de la punctul C la dreapta AD este egală cu:",
      options: [{ key: "a", text: "2 cm" }, { key: "b", text: "2√2 cm" }, { key: "c", text: "2√3 cm" }, { key: "d", text: "4 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Piramidă patrulateră regulată. Arie laterală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Piramida patrulateră regulată VABCD cu baza ABCD, VA = AB = 4 cm.",
      content: "În figura alăturată este reprezentată o piramidă patrulateră regulată VABCD, cu baza ABCD și VA = AB = 4 cm. Aria laterală a piramidei VABCD este egală cu:",
      options: [{ key: "a", text: "16 cm²" }, { key: "b", text: "16√2 cm²" }, { key: "c", text: "16√3 cm²" }, { key: "d", text: "32 cm²" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Procente. Probleme",
      finalAnswer: "12",
      content: "Un turist a parcurs un traseu în trei zile. În a doua zi a parcurs cu 6 km mai puțin decât în prima zi, iar în a treia zi 50% din distanța parcursă în primele două zile.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă distanța parcursă în primele două zile ar reprezenta 50% din lungimea întregului traseu, atunci în a treia zi turistul ar parcurge 50% din 50%, adică 25% din lungimea întregului traseu; deci nu este posibil ca distanța din primele două zile să reprezinte 50% din întregul traseu." },
        { label: "b)", points: 3, answer: "În primele două zile turistul a parcurs 2·9 = 18 km. Din x + (x − 6) = 18, unde x este distanța parcursă în prima zi, rezultă x = 12 km." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = (2x − 1)² − (2x − 4)(x + 2) + (x + 3)², unde x este număr real.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = 4x² − 4x + 1 − (2x² − 8) + x² + 6x + 9 = 3x² + 2x + 18, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "A = E(n) + n = 3n² + 3n + 18 = 3(n² + n + 6); cum n² + n + 6 = n(n + 1) + 6 este număr par pentru orice n natural, A este multiplu de 6." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Distanță punct-dreaptă",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu reprezentarea grafică a funcției f(x) = x − 2.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x − 2.",
      rubric: [
        { label: "a)", points: 2, answer: "f(3) = 1, f(−3) = −5, deci f(3) − f(−3) = 1 − (−5) = 6." },
        { label: "b)", points: 3, answer: "Graficul intersectează axele în A(2, 0) și B(0, −2). A(ABC) = (AC·OB)/2 = (d(C, AB)·AB)/2 și, cum AB = 2√2, obținem d(C, AB) = (4·2)/(2·2√2) = 2√2." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi echilateral. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-4"), finalAnswer: "1",
      figureNote: "Triunghiul echilateral ABC cu AB = 3 cm și înălțimea AD (D pe BC); M pe AB cu AM = 1 cm; paralela prin M la AC taie AD în Q și BC în P.",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC, cu AB = 3 cm și înălțimea AD, unde punctul D se află pe latura BC. Punctul M aparține laturii AB, astfel încât AM = 1 cm. Paralela prin punctul M la dreapta AC intersectează dreapta AD în punctul Q și dreapta BC în punctul P.",
      rubric: [
        { label: "a)", points: 2, answer: "MP ∥ AC, deci ΔBMP este echilateral; BM = 2 cm, deci P(BMP) = 3·BM = 6 cm." },
        { label: "b)", points: 3, answer: "AD este mediană în triunghiul echilateral ABC, deci BD = 1,5 cm; triunghiul DPQ este dreptunghic în D, ∢PQD = 30°, deci PQ = 2·DP; DP = 0,5 cm, de unde PQ = 1 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez isoscel. Mediatoare. Perpendicularitate",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Trapezul isoscel ABCD cu AB ∥ CD, ∢ADC = 120°, AD = DC = 6 cm; MP mediatoarea lui BC (M pe AB, P pe BC).",
      content: "Se consideră trapezul isoscel ABCD, cu AB ∥ CD, măsura unghiului ADC egală cu 120° și AD = DC = 6 cm. Dreapta MP este mediatoarea segmentului BC, unde punctul M aparține dreptei AB și punctul P aparține dreptei BC.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie DE ⊥ AB (E ∈ AB) și CF ⊥ AB (F ∈ AB): AE = BF = 3 cm; DCFE este dreptunghi, deci EF = DC = 6 cm, de unde AB = 12 cm." },
        { label: "b)", points: 3, answer: "MB = MC și ∢MBC = 60°, deci ΔMBC este echilateral ⇒ ∢BMP = 30° și MB = 6 cm; triunghiul AMD este echilateral, deci ∢AMD = 60°; atunci ∢DMP = 180° − (60° + 30°) = 90°, deci DM ⊥ MP." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Volum. Distanță punct-plan",
      hasFigure: true, figureUrl: FIG("s3-6"), finalAnswer: "3",
      figureNote: "Cubul ABCDA'B'C'D' cu AB = 6√2 cm; O = AD' ∩ A'D (centrul feței ADD'A').",
      content: "Se consideră cubul ABCDA'B'C'D', cu AB = 6√2 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "V = AB³ = (6√2)³ = 432√2 cm³." },
        { label: "b)", points: 3, answer: "Fie {Q} = AC ∩ BD: OM ∥ AQ (M mijlocul lui D'Q). AQ ⊥ BD și AQ ⊥ DD', iar {D} = DD' ∩ BD ⇒ AQ ⊥ (BDD') ⇒ OM ⊥ (BDD'), deci d(O, (BDD')) = OM = AQ/2 = (6√2·√2)/4 = 3 cm." },
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
  console.log(`\n=== import-exam-mate-2021-examen-3 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
