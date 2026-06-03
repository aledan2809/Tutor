#!/usr/bin/env node
/**
 * import-exam-mate-2024-examen-07.mjs — Exam-Bank series 2, pair 2024 Examen Varianta 7 (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2023–2024, Varianta 7.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1b 2c 3d 4c 5c 6a · II = 1b 2c 3c 4d 5a 6b
 * Figures: 10 PNG (en-viii-2024-mate-examen-07-s{2,3}-{label}.png). finalAnswer: III.1=13.
 *   (I.6 = ecuație, fără figură. III.2 n∈{−1,3}, III.3/5/6 radicali — fără finalAnswer scalar.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2024-mate-examen-07-${s}.png`;

const MATH = {
  source: "EN VIII 2024 Examen, Varianta 7 (edu.ro)",
  examType: "EN_VIII", year: 2024, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "examen-07", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2024/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 8 + 14 : 2 este egal cu:",
      options: [{ key: "a", text: "22" }, { key: "b", text: "15" }, { key: "c", text: "11" }, { key: "d", text: "6" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "Un album costă 200 de lei. După o reducere cu 20%, prețul albumului este egal cu:",
      options: [{ key: "a", text: "20 de lei" }, { key: "b", text: "40 de lei" }, { key: "c", text: "160 de lei" }, { key: "d", text: "180 de lei" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Intervale",
      content: "Se consideră intervalele de numere reale I = (−∞, 6] și J = (4, +∞). Intersecția intervalelor I și J este intervalul:",
      options: [{ key: "a", text: "(−∞, 4]" }, { key: "b", text: "[4, 6)" }, { key: "c", text: "(6, +∞)" }, { key: "d", text: "(4, 6]" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții zecimale periodice",
      content: "Cel mai mare număr din mulțimea A = {5,(024); 5,(24); 5,2(4); 5,24} este:",
      options: [{ key: "a", text: "5,(024)" }, { key: "b", text: "5,(24)" }, { key: "c", text: "5,2(4)" }, { key: "d", text: "5,24" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Module. Sume",
      content: "Patru elevi, Alin, Ioana, Dana și Vlad, calculează suma numerelor reale a și b pentru care |a + 3| + |b − 4| = 0. Răspunsurile date: Alin → −7; Ioana → −1; Dana → 1; Vlad → 7. Rezultatul corect a fost obținut de către:",
      options: [{ key: "a", text: "Alin" }, { key: "b", text: "Ioana" }, { key: "c", text: "Dana" }, { key: "d", text: "Vlad" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Ecuații",
      content: "Afirmația: „Numărul 1 este soluția ecuației 2x + 3 = 4x + 1.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea (figuri) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare, în această ordine; BC = 4 cm, AD = 4·BC, AB = CD.",
      content: "În figura alăturată punctele A, B, C și D sunt coliniare, în această ordine, astfel încât BC = 4 cm, AD = 4·BC și AB = CD. Lungimea segmentului AB este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "6 cm" }, { key: "c", text: "8 cm" }, { key: "d", text: "12 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi isoscel. Unghi exterior",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Triunghi isoscel ABC (AB = AC), ∢C = 40°; B, A, D coliniare, în această ordine.",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC, cu AB = AC și măsura unghiului C egală cu 40°. Punctele B, A și D sunt coliniare, în această ordine. Măsura unghiului CAD este egală cu:",
      options: [{ key: "a", text: "40°" }, { key: "b", text: "60°" }, { key: "c", text: "80°" }, { key: "d", text: "100°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelogram. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi ABC cu ∢A = 43°, ∢C = 51°; M, N, P pe AC, AB, BC cu MN ∥ BC și MP ∥ AB.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu măsura unghiului A egală cu 43° și măsura unghiului C egală cu 51°. Punctele M, N și P aparțin laturilor AC, AB respectiv BC, astfel încât dreapta MN este paralelă cu dreapta BC și dreapta MP este paralelă cu dreapta AB. Măsura unghiului NMP este egală cu:",
      options: [{ key: "a", text: "43°" }, { key: "b", text: "51°" }, { key: "c", text: "86°" }, { key: "d", text: "94°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelogram. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Paralelogram ABCD; M mijlocul lui AB; Aria(ACM) = 10 cm².",
      content: "În figura alăturată este reprezentat paralelogramul ABCD. Punctul M este mijlocul segmentului AB și aria triunghiului ACM este egală cu 10 cm². Aria paralelogramului ABCD este egală cu:",
      options: [{ key: "a", text: "10 cm²" }, { key: "b", text: "20 cm²" }, { key: "c", text: "30 cm²" }, { key: "d", text: "40 cm²" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Coardă",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cerc de centru O, rază 6 cm; A, B, C pe cerc; AC diametru; ∢BAC = 30°.",
      content: "În figura alăturată este reprezentat cercul cu centrul în punctul O și raza egală cu 6 cm. Punctele A, B și C aparțin cercului, AC este diametru și măsura unghiului BAC este egală cu 30°. Lungimea coardei BC este egală cu:",
      options: [{ key: "a", text: "6 cm" }, { key: "b", text: "6√3 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "8√3 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cub ABCDA'B'C'D'.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D'. Unghiul dreptelor AC și AD' are măsura egală cu:",
      options: [{ key: "a", text: "45°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "120°" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Numere naturale",
      finalAnswer: "13",
      content: "Dacă elevii unei clase se așază câte 2 în fiecare bancă din laboratorul de fizică, atunci rămân 3 elevi în picioare. Dacă elevii se așază câte 4 în bancă, atunci rămân 5 bănci libere și o bancă în care stă un singur elev.",
      rubric: [
        { label: "a)", points: 2, answer: "30 − 3 = 27 de elevi ar trebui așezați câte doi în fiecare bancă; cum 27 este număr impar, nu pot fi 30 de elevi." },
        { label: "b)", points: 3, answer: "a = 2b + 3 (a = numărul elevilor, b = numărul băncilor) și a = 4(b − 6) + 1. Din 2b + 3 = 4(b − 6) + 1 ⇒ b = 13." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = (1/(x²−3x+2) + 1/(x−1))·(x²−4), unde x este număr real, x ≠ 1 și x ≠ 2.",
      rubric: [
        { label: "a)", points: 2, answer: "x² − 3x + 2 = x² − 2x − x + 2 = x(x−2) − (x−2) = (x−2)(x−1), pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = (1/((x−1)(x−2)) + 1/(x−1))·(x²−4) = ((x−1)/((x−1)(x−2)))·(x−2)(x+2) = x + 2. N = 5/E(n) = 5/(n+2) este număr natural ⇒ n + 2 ∈ {1, 5}, de unde n = −1 și n = 3." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Grafic. Geometrie analitică",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu graficul funcției f(x) = 2x − 1.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = 2x − 1.",
      rubric: [
        { label: "a)", points: 2, answer: "f(0) = −1 și f(1) = 1, de unde f(0) + f(1) = 0." },
        { label: "b)", points: 3, answer: "Graficul intersectează axele în A(1/2, 0) și B(0, −1). Triunghiul AOB dreptunghic în O ⇒ AB = √5/2. CD ⊥ AB (D pe AB) și, cum AC = 1, d(C, AB) = CD = (AC·OB)/AB = 2√5/5 (pentru C(−1/2, 0))." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi isoscel. Înălțimi. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghi isoscel ABC (AB = AC); înălțimea din A taie BC în D, AD = BC; înălțimea din B taie AC în E; H = AD ∩ BE.",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC cu AB = AC. Înălțimea din vârful A intersectează latura BC în punctul D și AD = BC. Înălțimea din vârful B intersectează latura AC în punctul E. Înălțimile AD și BE se intersectează în punctul H.",
      rubric: [
        { label: "a)", points: 2, answer: "∢DAC + ∢ACB = 90° și ∢ACB + ∢EBC = 90°, de unde rezultă ∢DAC = ∢EBC." },
        { label: "b)", points: 3, answer: "ΔABC isoscel și AD ⊥ BC ⇒ BD = DC = BC/2 = AD/2. ∢HBD = ∢DAC și ∢BDH = ∢ADC = 90° ⇒ ΔBHD ∼ ΔACD ⇒ HD/DC = BD/AD. Din HD/(AD/2) = (AD/2)/AD ⇒ HD = AD/4, deci AH = 3·AD/4, adică AH = 3·HD." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Cerc. Arii",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Cerc de centru O, CD diametru; B pe cerc cu BO ⊥ CD; M pe arcul mic BC; N = DM ∩ BO, DN = 2·MN, MN = 4 cm.",
      content: "În figura alăturată este reprezentat cercul de centru O, în care CD este diametru. Punctul B aparține cercului astfel încât dreptele BO și CD sunt perpendiculare. Punctul M aparține arcului mic BC, dreptele DM și BO se intersectează în punctul N, DN = 2·MN și MN = 4 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "CD este diametru, deci arcul CD = 180°, de unde ∢CMD = (1/2)·arcul CD = 90°." },
        { label: "b)", points: 3, answer: "cos(∢NDO) = OD/ND, cos(∢MDC) = MD/CD, deci OD/ND = MD/CD. Cu ND = 8 cm și MD = 12 cm: 12/8 = OD/(2·OD)... ⇒ OD = 4√3 cm. ON = √(DN² − OD²) = 4 cm, deci Aria(DON) = (ON·OD)/2 = 8√3 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Prismă. Distanță punct-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Prismă dreaptă ABCA'B'C' cu baza triunghi echilateral ABC; AB = 12 cm, AA' = 3√3 cm; M mijlocul lui AB.",
      content: "În figura alăturată este reprezentată prisma dreaptă ABCA'B'C' cu baza triunghiul echilateral ABC, AB = 12 cm și AA' = 3√3 cm. Punctul M este mijlocul segmentului AB.",
      rubric: [
        { label: "a)", points: 2, answer: "Aria(ABB'A') = AB·AA' = 36√3 cm², deci aria laterală = 3·36√3 = 108√3 cm²." },
        { label: "b)", points: 3, answer: "A'C = B'C ⇒ CN ⊥ A'B' (N mijlocul lui A'B') și MN ⊥ A'B' ⇒ A'B' ⊥ (CMN). MP ⊥ CN (P pe CN) ⇒ MP ⊥ (A'B'C), deci d(M, (A'B'C)) = MP. În ΔMNC dreptunghic în M: MN = 3√3 cm, CM = 6√3 cm ⇒ CN = 3√15 cm, de unde MP = 6√15/5 cm." },
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
  console.log(`\n=== import-exam-mate-2024-examen-07 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
