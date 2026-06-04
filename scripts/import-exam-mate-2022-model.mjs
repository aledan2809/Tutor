#!/usr/bin/env node
/**
 * import-exam-mate-2022-model.mjs — Exam-Bank series 3, pair 2022 Model (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2021–2022, Model.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1c 2b 3b 4c 5a 6a · II = 1c 2d 3b 4d 5b 6c
 * Figures: 10 PNG (en-viii-2022-mate-model-s{2,3}-{label}.png) — s2-1..6, s3-3..6.
 *   finalAnswer: III.1=131, III.3=2, III.4=6, III.6=60. (III.2 inegalitate, III.5 radical 50√3 → skip.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2022-mate-model-${s}.png`;

const MATH = {
  source: "EN VIII 2022 Model (edu.ro)",
  examType: "EN_VIII", year: 2022, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "model", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2022/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Împărțire cu rest",
      content: "Restul împărțirii numărului 24 la 10 este egal cu:",
      options: [{ key: "a", text: "1" }, { key: "b", text: "2" }, { key: "c", text: "4" }, { key: "d", text: "6" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "Numărul care reprezintă 15% din 200 este egal cu:",
      options: [{ key: "a", text: "15" }, { key: "b", text: "30" }, { key: "c", text: "150" }, { key: "d", text: "200" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Suma numerelor −5, −4, 4 și 6 este egală cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "1" }, { key: "c", text: "11" }, { key: "d", text: "19" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea numerelor raționale",
      content: "Dintre numerele 9/2 ; 4,(5) ; 81/20 și 4,55 , cel mai mare este:",
      options: [{ key: "a", text: "4,55" }, { key: "b", text: "81/20" }, { key: "c", text: "4,(5)" }, { key: "d", text: "9/2" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Media geometrică",
      content: "Patru elevi, Andreea, Mihaela, Radu și Vlad, calculează media geometrică a numerelor reale a = 3 + 2√2 și b = 3 − 2√2 și obțin rezultatele înregistrate în tabelul următor: Andreea → 1; Mihaela → √6; Radu → 3; Vlad → √17. Conform informațiilor din tabel, dintre cei patru elevi, cel care a calculat corect media geometrică este:",
      options: [{ key: "a", text: "Andreea" }, { key: "b", text: "Mihaela" }, { key: "c", text: "Radu" }, { key: "d", text: "Vlad" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Unități de timp",
      content: "Un spectacol a început la ora 21:45 și s-a finalizat la ora 23:15, în aceeași zi. Marian afirmă că: „Spectacolul are o durată de o oră și jumătate.”. Știind că spectacolul nu a avut pauză, afirmația lui Marian este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D, E coliniare în această ordine pe o dreaptă, cu AB = 1 cm, BC = 2 cm, CD = 3 cm, DE = 6 cm.",
      content: "În figura alăturată, punctele A, B, C, D și E sunt coliniare, în această ordine, astfel încât AB = 1 cm, BC = 2 cm, CD = 3 cm și DE = 6 cm. Mijlocul segmentului AE este punctul:",
      options: [{ key: "a", text: "B" }, { key: "b", text: "C" }, { key: "c", text: "D" }, { key: "d", text: "E" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri opuse la vârf. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiurile MON și POQ opuse la vârf în O; semidreptele OA și OB sunt bisectoarele lor.",
      content: "În figura alăturată, unghiurile MON și POQ sunt opuse la vârf, iar semidreptele OA și OB sunt bisectoarele lor. Măsura unghiului AOB este egală cu:",
      options: [{ key: "a", text: "60°" }, { key: "b", text: "90°" }, { key: "c", text: "120°" }, { key: "d", text: "180°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi isoscel. Distanță",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul isoscel ABC de bază BC, cu vârful A sus; D este mijlocul lui BC.",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC de bază BC. Unghiul A are măsura de 30° și AB = 4 cm. Punctul D este mijlocul segmentului BC. Distanța de la punctul D la dreapta AC este egală cu:",
      options: [{ key: "a", text: "0,5 cm" }, { key: "b", text: "1 cm" }, { key: "c", text: "1,5 cm" }, { key: "d", text: "2 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Romb. Perimetru",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Rombul ABCD cu diagonalele AC (verticală) și BD (orizontală); A sus, C jos, B stânga, D dreapta.",
      content: "În figura alăturată este reprezentat rombul ABCD cu măsura unghiului BAD de 60° și lungimea segmentului BD egală cu 4 cm. Perimetrul rombului ABCD este egal cu:",
      options: [{ key: "a", text: "4√3 cm" }, { key: "b", text: "12 cm" }, { key: "c", text: "8√3 cm" }, { key: "d", text: "16 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghi la centru. Arc",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Triunghiul isoscel ABC de bază BC, înscris în cercul de centru O.",
      content: "Punctele A, B și C sunt vârfurile unui triunghi isoscel de bază BC, înscris în cercul de centru O, iar măsura unghiului ABC este egală cu 70°. Arcul mic BC are măsura egală cu:",
      options: [{ key: "a", text: "140°" }, { key: "b", text: "80°" }, { key: "c", text: "70°" }, { key: "d", text: "40°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelipiped dreptunghic. Volum",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Paralelipipedul dreptunghic ABCDA'B'C'D'.",
      content: "Volumul paralelipipedului dreptunghic ABCDA'B'C'D', cu AB = 5 dm, BC = 6 dm și înălțimea AA' = 4 dm, este egal cu:",
      options: [{ key: "a", text: "30 dm³" }, { key: "b", text: "88 dm³" }, { key: "c", text: "120 dm³" }, { key: "d", text: "148 dm³" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Divizibilitate. Rest comun",
      finalAnswer: "131",
      content: "Radu are o pungă cu bomboane. Dacă împarte bomboanele din pungă în grupe de câte 7, 14, respectiv 21 de bomboane, îi rămân de fiecare dată câte 5 bomboane.",
      rubric: [
        { label: "a)", points: 2, answer: "61 = 21·2 + 19. Cum 19 ≠ 5, deducem că nu este posibil ca Radu să aibă în pungă 61 de bomboane." },
        { label: "b)", points: 3, answer: "n = 7·c₁ + 5, n = 14·c₂ + 5, n = 21·c₃ + 5, unde n este numărul bomboanelor din pungă, iar c₁, c₂, c₃ sunt numere naturale. Cel mai mic multiplu comun al numerelor 7, 14 și 21 este 42, deci n − 5 este multiplu de 42. Cel mai mic număr natural de trei cifre care îndeplinește condițiile este n = 131." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Inegalități",
      content: "Se consideră expresia E(x) = (x + 1)² − (−x − 1)² + x² + 2x + 1, unde x este număr real.",
      rubric: [
        { label: "a)", points: 2, answer: "x² + 2x + 1 = (x + 1)². E(x) = (x + 1)² − (x + 1)² + (x + 1)² = (x + 1)², pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) − x = (x + 1)² − x = x² + x + 1 = (x + 1/2)² + 3/4. Cum (x + 1/2)² ≥ 0, rezultă E(x) − x > 0, deci E(x) > x, pentru orice număr real x." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Arie",
      hasFigure: true, figureUrl: FIG("s3-3"), finalAnswer: "2",
      figureNote: "Sistem de axe ortogonale xOy cu reprezentarea grafică a funcției f(x) = x + 2.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x + 2.",
      rubric: [
        { label: "a)", points: 2, answer: "f(−1) = 1; f(2019) = 2021, deci f(−1)·f(2019) = 1·2021 = 2021." },
        { label: "b)", points: 3, answer: "A(−2, 0) este punctul de intersecție a reprezentării grafice a funcției f cu axa Ox, iar B(0, 2) cu axa Oy. Aria triunghiului AOB = (OA·OB)/2 = (2·2)/2 = 2." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi. Asemănare. Distanță",
      hasFigure: true, figureUrl: FIG("s3-4"), finalAnswer: "6",
      figureNote: "Triunghiul ABC cu AB = 12 cm, BC = 9 cm, AC = 15 cm; D simetricul lui B față de mijlocul lui AC, M mijlocul lui CD, N = BM ∩ AC.",
      content: "În figura alăturată este reprezentat un triunghi ABC cu AB = 12 cm, BC = 9 cm și AC = 15 cm. Punctul D este simetricul punctului B față de mijlocul segmentului AC, punctul M este mijlocul segmentului CD și N este punctul de intersecție a dreptelor BM și AC.",
      rubric: [
        { label: "a)", points: 2, answer: "ABCD este paralelogram, deci AB ∥ CD. ΔABN ~ ΔCMN, deci BN/MN = AB/CM = 2, de unde BN = 2·MN." },
        { label: "b)", points: 3, answer: "Cum 12² + 9² = 15², triunghiul ABC este dreptunghic în B. AN/CN = AB/CM = 2 ⇒ AN/AC = 2/3. Fie T pe AB cu NT ⊥ AB; atunci NT ∥ BC, deci ΔATN ~ ΔABC, de unde NT/BC = 2/3, deci distanța de la N la AB este NT = 6 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Arie patrulater",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A, ∢ACB = 15°, BC = 20 cm; M mijlocul lui BC, N pe BC cu AN ⊥ BC; P, Q simetricele.",
      content: "În figura alăturată este reprezentat triunghiul ABC, dreptunghic în A, cu măsura unghiului ACB de 15° și BC = 20 cm. Punctul M este mijlocul segmentului BC și punctul N aparține dreptei BC astfel încât dreapta AN este perpendiculară pe dreapta BC.",
      rubric: [
        { label: "a)", points: 2, answer: "AM = MC ⇒ ∢AMN = 2·∢ACM = 30°. cos(∢AMN) = MN/AM ⇒ MN = (BC/2)·cos30° = 5√3 cm." },
        { label: "b)", points: 3, answer: "Punctul P este simetricul lui A față de dreapta BC, iar Q este simetricul lui M față de N. AMPQ este paralelogram și AP ⊥ MQ, deci AMPQ este romb. AN = AM/2 = BC/4 = 5 cm. A_AMPQ = (AP·MQ)/2 = (2·AN·2·MN)/2 = 50√3 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă patrulateră. Volum. Unghi diedru",
      hasFigure: true, figureUrl: FIG("s3-6"), finalAnswer: "60",
      figureNote: "Piramida patrulateră VABCD cu baza pătratul ABCD, AB = 8 cm, înălțimea VO = 4√3 cm, O = AC ∩ BD.",
      content: "În figura alăturată este reprezentată o piramidă patrulateră VABCD, cu baza pătratul ABCD, cu AB = 8 cm. Înălțimea VO a piramidei are lungimea egală cu 4√3 cm, unde O este punctul de intersecție a dreptelor AC și BD.",
      rubric: [
        { label: "a)", points: 2, answer: "V = (1/3)·A_ABCD·VO = (1/3)·AB²·VO = (1/3)·64·4√3 = 256√3/3 cm³." },
        { label: "b)", points: 3, answer: "Construim prin V dreapta d, d ∥ AD ∥ BC, deci (VAD) ∩ (VBC) = d. Fie S pe AD cu VS ⊥ AD și R pe BC cu VR ⊥ BC; atunci VS ⊥ d și VR ⊥ d, deci ∢((VAD),(VBC)) = ∢(VS, VR). VR = VS = RS = 8 cm, deci triunghiul VRS este echilateral, de unde ∢SVR = 60°, deci ∢((VAD),(VBC)) = 60°." },
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
  console.log(`\n=== import-exam-mate-2022-model (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
