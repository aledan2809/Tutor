#!/usr/bin/env node
/**
 * import-exam-mate-2025-sesiune-speciala-03.mjs — Exam-Bank series 2, pair 2025 Sesiunea Specială V3 (Mate)
 *
 * SOURCE: Ministerul Educației și Cercetării / CNCCE — EN VIII, 2024–2025, Sesiunea Specială, Varianta 3.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1b 2d 3b 4c 5c 6a · II = 1b 2c 3b 4a 5c 6b
 * Figures: 10 PNG (en-viii-2025-mate-sesiune-speciala-03-s{2,3}-{label}.png). finalAnswer: III.1=46, III.2=5, III.4=3.
 *   (I.6 = viteză/distanță, fără figură.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2025-mate-sesiune-speciala-03-${s}.png`;

const MATH = {
  source: "EN VIII 2025 Sesiunea Specială, Varianta 3 (edu.ro)",
  examType: "EN_VIII", year: 2025, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "sesiune-speciala-03", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNCCE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 25 − 5 · 3 este egal cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "10" }, { key: "c", text: "60" }, { key: "d", text: "90" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "Din cei 400 de pomi fructiferi ai unei livezi, 50% sunt pruni. Numărul prunilor din livadă este egal cu:",
      options: [{ key: "a", text: "40" }, { key: "b", text: "50" }, { key: "c", text: "100" }, { key: "d", text: "200" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Intervale. Numere întregi",
      content: "Cel mai mic număr întreg din intervalul (−3, 5] este egal cu:",
      options: [{ key: "a", text: "−3" }, { key: "b", text: "−2" }, { key: "c", text: "0" }, { key: "d", text: "5" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Inecuații",
      content: "Mulțimea soluțiilor reale ale inecuației 3x − 1 ≥ 5 este:",
      options: [{ key: "a", text: "(−∞, 2]" }, { key: "b", text: "(−∞, 4/3]" }, { key: "c", text: "[2, +∞)" }, { key: "d", text: "[4/3, +∞)" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Produs",
      content: "Patru elevi, Ioana, Mara, Petrică și Ștefan, calculează produsul numerelor a = √3 + √2 și b = √3 − √2. Rezultatele obținute: Ioana → 7; Mara → 5; Petrică → 1; Ștefan → −1. Conform informațiilor din tabel, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Ioana" }, { key: "b", text: "Mara" }, { key: "c", text: "Petrică" }, { key: "d", text: "Ștefan" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Viteză. Distanță",
      content: "O mașină se deplasează în intervalul orar 12:00 − 14:00 cu o viteză medie de 80 km/h. Mihai afirmă că: „În acest interval de timp, mașina a parcurs o distanță egală cu 160 km.”. Afirmația lui Mihai este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea (figuri) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C coliniare, în această ordine; AC = 16 cm; M mijlocul lui AB, N mijlocul lui BC.",
      content: "În figura alăturată punctele A, B și C sunt coliniare, în această ordine, astfel încât AC = 16 cm. Știind că punctul M este mijlocul segmentului AB, iar punctul N este mijlocul segmentului BC, lungimea segmentului MN este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "8 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "16 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte perpendiculare. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Dreptele perpendiculare AB și CD se intersectează în O; OM bisectoarea unghiului BOC.",
      content: "În figura alăturată sunt reprezentate dreptele perpendiculare AB și CD. Punctul O este intersecția celor două drepte și semidreapta OM este bisectoarea unghiului BOC. Măsura unghiului AOM este egală cu:",
      options: [{ key: "a", text: "45°" }, { key: "b", text: "125°" }, { key: "c", text: "135°" }, { key: "d", text: "180°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi echilateral. Distanță",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi echilateral ABC cu BC = 4 cm; P mijlocul lui AB.",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC, cu BC = 4 cm. Punctul P este mijlocul segmentului AB. Distanța de la punctul P la dreapta AC este egală cu:",
      options: [{ key: "a", text: "1 cm" }, { key: "b", text: "√3 cm" }, { key: "c", text: "2 cm" }, { key: "d", text: "√5 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelogram. Raport de arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Paralelogram ABCD; O mijlocul diagonalei AC; S mijlocul laturii BC.",
      content: "În figura alăturată este reprezentat paralelogramul ABCD. Punctul O este mijlocul diagonalei AC, iar punctul S este mijlocul laturii BC. Raportul dintre aria triunghiului COS și aria paralelogramului ABCD este egal cu:",
      options: [{ key: "a", text: "1/8" }, { key: "b", text: "1/4" }, { key: "c", text: "4" }, { key: "d", text: "8" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Lungime",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cerc de centru O, diametru AB = 50 cm.",
      content: "În figura alăturată este reprezentat cercul de centru O și diametru AB = 50 cm. Lungimea acestui cerc este egală cu:",
      options: [{ key: "a", text: "2500π cm" }, { key: "b", text: "100π cm" }, { key: "c", text: "50π cm" }, { key: "d", text: "25π cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Prismă. Arie laterală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Prismă dreaptă ABCA'B'C' cu baza triunghi echilateral ABC; AB = AA' = 6 cm.",
      content: "În figura alăturată este reprezentată o prismă dreaptă ABCA'B'C', cu baza triunghiul echilateral ABC. Dacă AB = AA' = 6 cm, atunci aria laterală a prismei este egală cu:",
      options: [{ key: "a", text: "216 cm²" }, { key: "b", text: "108 cm²" }, { key: "c", text: "54√3 cm²" }, { key: "d", text: "18√3 cm²" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Numere naturale",
      finalAnswer: "46",
      content: "Doi copii, Alin și Ioana, au fiecare câte un coș cu alune. Dacă Alin ar primi de la Ioana 4 alune, atunci Ioana ar avea de 3 ori mai multe alune decât Alin.",
      rubric: [
        { label: "a)", points: 2, answer: "3(A + 4) = 45 − 4 (A = numărul alunelor lui Alin) ⇒ A + 4 = 41/3, care nu este număr natural, deci nu este posibil ca Ioana să aibă în coș exact 45 de alune." },
        { label: "b)", points: 3, answer: "3(A + 4) = I − 4 și 6(A − 2) = I + 2 (I = numărul alunelor Ioanei). Rezolvând sistemul: I = 46, deci Ioana are în coș 46 de alune." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Expresii raționale",
      finalAnswer: "5",
      content: "Se consideră expresia E(x) = ((x+3)/(x−1) + 4x/(x²+2x−3)) : (x+9)/(x−1), unde x este număr real, x ≠ −9, x ≠ −3 și x ≠ 1.",
      rubric: [
        { label: "a)", points: 2, answer: "x² + 2x − 3 = x² − x + 3x − 3 = x(x−1) + 3(x−1) = (x−1)(x+3), pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = ((x+3)(x+3) + 4x)/((x−1)(x+3)) · (x−1)/(x+9) = (x²+10x+9)/((x+3)(x+9)) = (x+1)/(x+3). E(3)·E(4)·E(5)·E(6) = 5/18, de unde T = √(90·5/18) = √25 = 5, deci numărul T este natural." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Grafic. Mediană",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu graficul funcției f(x) = (1/2)x − 2.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = (1/2)·x − 2.",
      rubric: [
        { label: "a)", points: 2, answer: "f(4) = 0, deci f(4)·f(6) = 0·f(6) = 0." },
        { label: "b)", points: 3, answer: "Graficul intersectează axele în A(4, 0) și B(0, −2). Pentru C(0, 3): mediana din C cade pe mijlocul lui AB. AC = √(AO² + OC²) = 5, BC = 5, AB = √(AO² + BO²) = 2√5. În triunghiul isoscel ACB, CD (mediana din C) este și înălțime ⇒ CD ⊥ AB, de unde CD = 2√5." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Ortocentru. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-4"),
      finalAnswer: "3",
      figureNote: "Triunghi ABC cu AC = 9 cm; H ortocentrul; M proiecția lui H pe AC; HM = 2 cm.",
      content: "În figura alăturată este reprezentat triunghiul ABC, cu AC = 9 cm. Punctul H este ortocentrul triunghiului ABC, punctul M este proiecția punctului H pe dreapta AC și HM = 2 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "Aria(AHC) = (HM·AC)/2 = (2·9)/2 = 9 cm²." },
        { label: "b)", points: 3, answer: "ΔAHM ∼ ΔACD (D = AH ∩ BC) ⇒ AH/AC = HM/CD. Cum AH = 2·CD: (2·CD)/9 = 2/CD ⇒ CD² = 9 ⇒ CD = 3 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrat. Triunghi dreptunghic isoscel",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Pătrat ABCD și triunghi dreptunghic isoscel BCQ (QB = QC), Q în exteriorul pătratului.",
      content: "În figura alăturată este reprezentat pătratul ABCD și triunghiul dreptunghic isoscel BCQ, cu QB = QC, unde punctul Q este situat în exteriorul pătratului.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔABC dreptunghic isoscel ⇒ ∢ACB = 45°. ΔBCQ dreptunghic isoscel ⇒ ∢BCQ = 45°, deci ∢ACQ = ∢ACB + ∢BCQ = 90°." },
        { label: "b)", points: 3, answer: "∢DOC = ∢OCQ = 90° ⇒ DO ∥ CQ (O = AC ∩ BD). ΔOCB ≡ ΔQCB ⇒ CO = CQ și CO = DO, deci DO = CQ; cum DO ∥ CQ, DOQC este paralelogram. OT = TC = CO/2, deci AT = AO + OT = CO + CO/2 = 3·(CO/2) = 3·TC." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Secțiuni",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cub ABCDA'B'C'D' cu AB = 6 cm; N mijlocul lui BB', M mijlocul lui CC'; P = AN ∩ (A'B'C'), Q = D'M ∩ (ABC).",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D', cu AB = 6 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "Volumul cubului = AB³ = 6³ = 216 cm³." },
        { label: "b)", points: 3, answer: "P = AN ∩ A'B' și Q = D'M ∩ DC. ΔABN ≡ ΔPB'N ⇒ AB = PB' și ΔD'C'M ≡ ΔQCM ⇒ D'C' = QC. PB' = QC și PB' ∥ QC ⇒ CQPB' este paralelogram, deci PQ = B'C = 6√2 cm." },
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
    console.log(`  ${tag.padEnd(28)} items=${p.items.length} pts=${sum}(+${p.officeBonus}=${sum + p.officeBonus}) autoGradable=${p.items.filter((i) => i.autoGradable).length} figures=${p.items.filter((i) => i.hasFigure).length}`);
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
  console.log(`\n=== import-exam-mate-2025-sesiune-speciala-03 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
