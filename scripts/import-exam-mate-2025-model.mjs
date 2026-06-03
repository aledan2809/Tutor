#!/usr/bin/env node
/**
 * import-exam-mate-2025-model.mjs — Exam-Bank series 2, pair 2025 Model (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2024–2025, Model.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1b 2b 3d 4c 5b 6b · II = 1c 2a 3c 4b 5d 6d
 * Figures: 10 PNG (en-viii-2025-mate-model-s{2,3}-{label}.png). finalAnswer: III.1=50, III.2=4, III.3=18.
 *   (I.6 = comparare numere reale, fără figură.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2025-mate-model-${s}.png`;

const MATH = {
  source: "EN VIII 2025 Model (edu.ro)",
  examType: "EN_VIII", year: 2025, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "model", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului (40 + 2 · 5) : 5 este:",
      options: [{ key: "a", text: "6" }, { key: "b", text: "10" }, { key: "c", text: "38" }, { key: "d", text: "42" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporții",
      content: "Dacă x/9 = 2/3, atunci numărul x este egal cu:",
      options: [{ key: "a", text: "27/2" }, { key: "b", text: "6" }, { key: "c", text: "2" }, { key: "d", text: "1/6" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Mulțimi",
      content: "Se consideră mulțimile A = {0, 1, 2, 3, 4, 5} și B = {2, 4, 6, 8}. Reuniunea mulțimilor A și B este mulțimea:",
      options: [{ key: "a", text: "{2, 4}" }, { key: "b", text: "{0, 1, 3, 5}" }, { key: "c", text: "{1, 2, 3, 4, 5, 6, 8}" }, { key: "d", text: "{0, 1, 2, 3, 4, 5, 6, 8}" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții zecimale",
      content: "Scrierea sub formă de fracție zecimală a fracției 5/6 este:",
      options: [{ key: "a", text: "0,8" }, { key: "b", text: "0,83" }, { key: "c", text: "0,8(3)" }, { key: "d", text: "0,(83)" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Media aritmetică",
      content: "Patru elevi, Alina, Bogdan, Corina și Dan, au calculat media aritmetică a numerelor a = √(3² + 4²) și b = 45. Răspunsurile date: Alina → 15; Bogdan → 25; Corina → 26; Dan → 50. Rezultatul corect a fost obținut de către:",
      options: [{ key: "a", text: "Alina" }, { key: "b", text: "Bogdan" }, { key: "c", text: "Corina" }, { key: "d", text: "Dan" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Comparare",
      content: "Se consideră numărul real a = 11 − 5√5. Enunțul „Numărul real a este pozitiv.” este:",
      options: [{ key: "a", text: "adevărat" }, { key: "b", text: "fals" }], correctAnswer: "b" },
    // ── Subiectul al II-lea (figuri) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare, în această ordine; AC = 2·AB, AD = 2·AC; M mijlocul lui AB.",
      content: "În figura alăturată punctele A, B, C și D sunt coliniare, în această ordine, astfel încât AC = 2·AB și AD = 2·AC. Punctul M este mijlocul segmentului AB și AM = 2 cm. Lungimea segmentului MD este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "6 cm" }, { key: "c", text: "14 cm" }, { key: "d", text: "16 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Punctele A, O, D coliniare; unghiul BOC drept; ∢AOC = 30°.",
      content: "În figura alăturată punctele A, O și D sunt coliniare, unghiul BOC este drept, iar măsura unghiului AOC este egală cu 30°. Măsura unghiului BOD este egală cu:",
      options: [{ key: "a", text: "120°" }, { key: "b", text: "130°" }, { key: "c", text: "150°" }, { key: "d", text: "180°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi ABC dreptunghic în A, ∢ACB = 60°; CM bisectoarea unghiului ACB; CM = 8 cm.",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în A, cu măsura unghiului ACB egală cu 60°. Semidreapta CM este bisectoarea unghiului ACB și CM = 8 cm. Lungimea laturii AB este egală cu:",
      options: [{ key: "a", text: "4√3 cm" }, { key: "b", text: "8 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "8√3 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic isoscel. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Patrulater ABCD; triunghiurile ADC și ABC dreptunghice isoscele cu AD = CD și AC = BC.",
      content: "În figura alăturată este reprezentat patrulaterul ABCD. Triunghiurile ADC și ABC sunt dreptunghice isoscele, cu AD = CD și AC = BC. Aria triunghiului ABC este egală cu 288 cm². Aria triunghiului ADC este egală cu:",
      options: [{ key: "a", text: "72 cm²" }, { key: "b", text: "144 cm²" }, { key: "c", text: "288 cm²" }, { key: "d", text: "576 cm²" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Coarde paralele",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cerc de centru O; A, B, C, D pe cerc; O pe segmentul AB; AB ∥ CD; arcul mic BD = 40°.",
      content: "În figura alăturată este reprezentat cercul cu centrul în punctul O. Punctele A, B, C și D aparțin cercului, punctul O aparține segmentului AB și dreptele AB și CD sunt paralele. Dacă măsura arcului mic BD este egală cu 40°, atunci măsura unghiului COD este egală cu:",
      options: [{ key: "a", text: "40°" }, { key: "b", text: "60°" }, { key: "c", text: "80°" }, { key: "d", text: "100°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Tetraedru regulat. Arie totală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Tetraedru regulat ABCD cu AB = 4 cm.",
      content: "În figura alăturată este reprezentat tetraedrul regulat ABCD. Dacă AB = 4 cm, atunci aria totală a tetraedrului ABCD este egală cu:",
      options: [{ key: "a", text: "4√3 cm²" }, { key: "b", text: "8√3 cm²" }, { key: "c", text: "24 cm²" }, { key: "d", text: "16√3 cm²" }], correctAnswer: "d" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Procente. Probleme",
      finalAnswer: "50",
      content: "O echipă de muncitori a construit o pistă pentru biciclete în 3 zile. În prima zi a construit 30% din lungimea pistei, în a doua zi 60% din ce a rămas și în ultima zi cu 7 km mai puțin decât în a doua zi.",
      rubric: [
        { label: "a)", points: 2, answer: "În prima zi se construiește (30/100)·x (x = lungimea pistei). În a doua zi (60/100)·(70/100)·x = (42/100)·x; cum (42/100)·x > (30/100)·x, în a doua zi echipa a construit mai mult decât în prima zi." },
        { label: "b)", points: 3, answer: "În a treia zi: (42/100)·x − 7. Din (30/100)·x + (42/100)·x + (42/100)·x − 7 = x ⇒ 14x = 700 ⇒ x = 50 km." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Expresii raționale",
      finalAnswer: "4",
      content: "Se consideră expresia E(x) = ((x+4)/(x−3) − (x−3)/(x+4) + 49/(x²+x−12)) : 7/(x−3), unde x este număr real, x ≠ −4 și x ≠ 3.",
      rubric: [
        { label: "a)", points: 2, answer: "x² + x − 12 = x² − 3x + 4x − 12 = x(x−3) + 4(x−3) = (x−3)(x+4), pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = ((x+4)² − (x−3)² + 49)/((x−3)(x+4)) · (x−3)/7 = (14x + 56)/(7(x+4)) = 2, pentru orice x real, x ≠ −4, x ≠ 3. Atunci N = √(E(2)+E(4)+…+E(16)) = √(2·8) = √16 = 4, care este număr natural." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Grafic",
      hasFigure: true, figureUrl: FIG("s3-3"),
      finalAnswer: "18",
      figureNote: "Sistem de axe ortogonale xOy cu graficul funcției f(x) = 2x − 6.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = 2x − 6.",
      rubric: [
        { label: "a)", points: 2, answer: "f(3) = 0, deci f(3)·f(2025) = 0·f(2025) = 0." },
        { label: "b)", points: 3, answer: "Graficul intersectează axele în A(3, 0) și B(0, −6). M este simetricul lui A față de O ⇒ AM = 2·AO = 6. Aria(ABM) = (AM·OB)/2 = (6·6)/2 = 18." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Bisectoare. Centru de greutate",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Dreptunghi ABCD cu AB = 12 cm, BC = 6 cm; bisectoarea unghiului BCD taie AB în E și diagonala BD în F.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD, cu AB = 12 cm și BC = 6 cm. Bisectoarea unghiului BCD intersectează latura AB în punctul E și diagonala BD în punctul F.",
      rubric: [
        { label: "a)", points: 2, answer: "P(ABCD) = 2(AB + BC) = 2(12 + 6) = 36 cm." },
        { label: "b)", points: 3, answer: "CE bisectoarea unghiului BCD ⇒ ∢BCE = 45° ⇒ triunghiul BCE dreptunghic isoscel ⇒ BE = BC = 6 cm = AE. {O} = AC ∩ BD (O mijlocul lui AC), {F} = BO ∩ CE ⇒ F este centrul de greutate al triunghiului ABC. {M} = AF ∩ BC (M mijlocul lui BC) ⇒ AM = √(AB² + BM²) = 3√17 cm; cum AF = (2/3)·AM, obținem AF = 2√17 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi echilateral. Coliniaritate",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghi echilateral ABC cu AB = 6 cm; B, C, M coliniare cu C mijlocul lui BM; N proiecția lui M pe AC; BC mediatoarea lui AP.",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC cu AB = 6 cm. Punctele B, C și M sunt coliniare și punctul C este mijlocul segmentului BM. Punctul N este proiecția punctului M pe dreapta AC, iar dreapta BC este mediatoarea segmentului AP.",
      rubric: [
        { label: "a)", points: 2, answer: "CM = 6 cm și ∢ACB = ∢MCN = 60°; ∢CMN = 30°, de unde CN = CM/2 = 3 cm." },
        { label: "b)", points: 3, answer: "{Q} = AP ∩ BC; cum CQ este mediatoarea lui AP, CP = CA și ∢PCQ = ∢ACQ = 60°. ∢NCP = 180° − ∢PCQ − ∢ACQ = 60°, deci ∢NCP = ∢NCM și, cum CP = CM, ΔCPN ≡ ΔCMN ⇒ ∢CNP = ∢CNM = 90°. ∢MNP = ∢CNM + ∢CNP = 180°, deci punctele M, N și P sunt coliniare." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Distanță punct-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cub ABCDEFGH cu AB = 6 cm; M, N mijloacele muchiilor AE, respectiv DH.",
      content: "În figura alăturată este reprezentat cubul ABCDEFGH cu AB = 6 cm. Punctele M și N sunt mijloacele muchiilor AE și DH.",
      rubric: [
        { label: "a)", points: 2, answer: "Volumul cubului = AB³ = 6³ = 216 cm³." },
        { label: "b)", points: 3, answer: "Q mijlocul lui GC ⇒ HQ ∥ NC, NC ⊂ (MNC) ⇒ HQ ∥ (MNC), deci d(H, (MNC)) = d(Q, (MNC)). QR ⊥ NC (R pe NC); MN ∥ BC și BC ⊥ (DCG) ⇒ MN ⊥ (DCG) ⇒ MN ⊥ QR; cum MN ∩ CN = {N}, QR ⊥ (MNC), deci d(Q, (MNC)) = QR. În ΔNQC dreptunghic în Q: QR = (NQ·QC)/NC = 6√5/5 cm." },
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
  console.log(`\n=== import-exam-mate-2025-model (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
