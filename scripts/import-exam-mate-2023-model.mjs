#!/usr/bin/env node
/**
 * import-exam-mate-2023-model.mjs — Exam-Bank series 3, pair 2023 Model (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2022–2023, Model.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1d 2a 3c 4b 5c 6b · II = 1a 2b 3b 4b 5c 6b
 * Figures: 9 PNG (en-viii-2023-mate-model-s{2,3}-{label}.png) — s2-1..6, s3-4..6.
 *   finalAnswer: III.1=120, III.2=-3, III.3=(2,4). (III.4 45°dat+radical, III.5 demonstrații, III.6 216 dat+perpendicularitate → skip.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2023-mate-model-${s}.png`;

const MATH = {
  source: "EN VIII 2023 Model (edu.ro)",
  examType: "EN_VIII", year: 2023, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "model", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2023/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 64 − 56 : 8 este egal cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "1" }, { key: "c", text: "56" }, { key: "d", text: "57" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte și proporții",
      content: "Știind că a/3 = b/4, atunci rezultatul calculului 4a − 3b este egal cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "1" }, { key: "c", text: "7" }, { key: "d", text: "12" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Suma numerelor întregi din intervalul [−2022, 2022] este egală cu:",
      options: [{ key: "a", text: "−2022" }, { key: "b", text: "−2021" }, { key: "c", text: "0" }, { key: "d", text: "2022" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Media aritmetică",
      content: "În tabelul de mai jos este prezentată situația notelor obținute de elevii claselor a VIII-a dintr-o școală, la un test de matematică: Nota → 5, 6, 7, 8, 9, 10; Numărul elevilor → 6, 9, 12, 15, 12, 6. Media notelor obținute de elevii claselor a VIII-a din această școală la testul de matematică este egală cu:",
      options: [{ key: "a", text: "6,00" }, { key: "b", text: "7,60" }, { key: "c", text: "7,90" }, { key: "d", text: "8,60" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali",
      content: "Patru elevi, Ioana, Mara, Petrică și Ștefan, au calculat produsul numerelor a = |√2 − √3| și b = |√3 + √2|, iar rezultatele obținute sunt prezentate în tabelul de mai jos: Ioana → −1; Mara → 5 − 2√6; Petrică → 1; Ștefan → 5 + 2√6. Conform informațiilor din tabel, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Ioana" }, { key: "b", text: "Mara" }, { key: "c", text: "Petrică" }, { key: "d", text: "Ștefan" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Viteză. Distanță. Timp",
      content: "O mașină se deplasează în intervalul orar 12:56 − 14:26 cu o viteză medie de 80 km/h. Mihai afirmă că, în acest interval de timp, mașina a parcurs o distanță egală cu 200 km. Afirmația lui Mihai este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C coliniare în această ordine pe o dreaptă, cu AB = 7 cm și BC = 9 cm; M mijlocul lui AB, N mijlocul lui BC.",
      content: "În figura alăturată punctele A, B și C sunt coliniare, în această ordine, astfel încât AB = 7 cm și BC = 9 cm. Știind că punctul M este mijlocul segmentului AB, iar punctul N este mijlocul segmentului BC, lungimea segmentului MN este egală cu:",
      options: [{ key: "a", text: "8 cm" }, { key: "b", text: "11,5 cm" }, { key: "c", text: "12,5 cm" }, { key: "d", text: "16 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri opuse la vârf",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Două drepte care se intersectează în O formând unghiurile opuse la vârf AOC și BOD; razele A și B în partea de sus, C și D în partea de jos.",
      content: "În figura alăturată sunt reprezentate unghiurile opuse la vârf AOC și BOD. Măsura unghiului AOB este egală cu 120°. Măsura unghiului BOD este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "120°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Unghi de 60°",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC dreptunghic în A, cu vârful C sus, A jos-stânga și B jos-dreapta.",
      content: "În figura alăturată este reprezentat triunghiul ABC, dreptunghic în A, cu BC = 6 cm și măsura unghiului B este egală cu 60°. Lungimea segmentului AB este egală cu:",
      options: [{ key: "a", text: "2√3 cm" }, { key: "b", text: "3 cm" }, { key: "c", text: "3√2 cm" }, { key: "d", text: "3√3 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelogram. Triunghi isoscel",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Paralelogramul ABCD cu D și C în partea de sus, A și B jos; este trasată diagonala BD.",
      content: "În figura alăturată este reprezentat paralelogramul ABCD, cu AD = BD și cu măsura unghiului DAB este egală cu 45°. Măsura unghiului CBD este egală cu:",
      options: [{ key: "a", text: "135°" }, { key: "b", text: "90°" }, { key: "c", text: "60°" }, { key: "d", text: "45°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghi înscris",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Triunghiul AMB înscris într-un cerc; A sus, B în dreapta, M jos.",
      content: "În figura alăturată este reprezentat triunghiul AMB, cu AB = 8√2 cm, înscris într-un cerc care are raza egală cu 8 cm. Măsura unghiului AMB este egală cu:",
      options: [{ key: "a", text: "15°" }, { key: "b", text: "30°" }, { key: "c", text: "45°" }, { key: "d", text: "60°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Con circular drept. Generatoare",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Con circular drept cu vârful C sus și baza cerc cu diametrul AB și centrul O.",
      content: "În figura alăturată este reprezentat un con circular drept care are secțiunea axială un triunghi echilateral cu înălțimea egală cu 6 cm. Generatoarea conului are lungimea egală cu:",
      options: [{ key: "a", text: "2√3 cm" }, { key: "b", text: "4√3 cm" }, { key: "c", text: "6 cm" }, { key: "d", text: "12 cm" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Procente. Ecuații",
      finalAnswer: "120",
      content: "Un excursionist a parcurs un traseu în trei zile. În prima zi a parcurs 30% din lungimea traseului, în a doua zi o treime din distanța parcursă în prima zi, iar în a treia zi a parcurs restul de 72 km.",
      rubric: [
        { label: "a)", points: 2, answer: "În a doua zi excursionistul a parcurs (1/3)·(30/100)·x = x/10, unde x reprezintă lungimea traseului. Cum x/10 ≠ x/4, nu este posibil ca lungimea parcursă de excursionist în a doua zi să reprezinte o pătrime din lungimea traseului." },
        { label: "b)", points: 3, answer: "(30/100)·x + x/10 + 72 = x ⇒ 4x + 720 = 10x ⇒ x = 120 km." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      finalAnswer: "-3",
      content: "Se consideră expresia E(x) = (2/(x−2) + x/(x+2)) : (x²+4)/(x²−x−2), unde x ∈ ℝ \\ {−2, −1, 2}.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = ((x²+4)/((x−2)(x+2))) · ((x²−x−2)/(x²+4)) = ((x−2)(x+1))/((x−2)(x+2)) = (x+1)/(x+2), pentru orice număr real x ∈ ℝ \\ {−2, −1, 2}." },
        { label: "b)", points: 3, answer: "E(a) = (a+1)/(a+2) = 1 − 1/(a+2). Cum a+2 ∈ ℤ și 1/(a+2) ∈ ℤ ⇒ (a+2) | 1, deci a+2 ∈ {−1, 1}. Rezultă a = −1 (care nu convine, exclus din domeniu) și a = −3 (care convine). Deci a = −3." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcția de gradul I. Simetrie",
      finalAnswer: "(2,4)",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x + 2.",
      rubric: [
        { label: "a)", points: 2, answer: "3·f(x) = −4 − 2x ⇒ 3(x + 2) = −4 − 2x ⇒ 3x + 6 = −4 − 2x ⇒ 5x = −10 ⇒ x = −2." },
        { label: "b)", points: 3, answer: "A(−2, 0) și B(0, 2) sunt punctele de intersecție a graficului funcției f cu axele Ox, respectiv Oy. Punctul C este simetricul lui A față de B, deci B este mijlocul segmentului AC ⇒ C(2, 4)." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrat. Triunghi echilateral. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Pătratul ABCD cu latura AB sus (A stânga, B dreapta) și latura DC jos; triunghiul echilateral ABP cu vârful P deasupra laturii AB; M punct pe AB, {M} = AB ∩ PD.",
      content: "În figura alăturată este reprezentat pătratul ABCD cu AB = 4 cm și triunghiul echilateral ABP.",
      rubric: [
        { label: "a)", points: 2, answer: "∢PAD = 90° + 60° = 150°, AD = AP ⇒ triunghiul APD este isoscel, deci ∢ADP ≡ ∢APD. ∢APD = 15° ⇒ ∢DPB = 60° − 15° = 45°." },
        { label: "b)", points: 3, answer: "În triunghiul echilateral APB, PQ ⊥ AB, Q ∈ AB, deci PQ = 2√3 cm și Q este mijlocul lui AB ⇒ AQ = 2 cm. PQ ∥ AD ⇒ ΔDAM ~ ΔPQM ⇒ AD/PQ = AM/MQ ⇒ AM = 4(2 − √3) cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez. Linie mijlocie. Arie",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Trapezul ABCD cu AB ∥ CD (D și C sus, A și B jos); R mijlocul lui AD, S mijlocul lui AB, T mijlocul lui BC.",
      content: "În figura alăturată este reprezentat trapezul ABCD cu AB ∥ CD, AB = 6 cm și CD = 4 cm. Punctele R, S și T sunt mijloacele laturilor AD, AB, respectiv BC.",
      rubric: [
        { label: "a)", points: 2, answer: "RT este linie mijlocie în trapezul ABCD ⇒ RT = (AB + CD)/2 = (6 + 4)/2 = 5 cm." },
        { label: "b)", points: 3, answer: "Fie DQ ⊥ AB, Q ∈ AB, deci A_ABCD = RT·DQ. A_DRT = (DP·RT)/2 și A_RST = (QP·RT)/2, unde {P} = DQ ∩ RT. A_DRST = A_DRT + A_RST = (DP·RT)/2 + (QP·RT)/2 = (RT·DQ)/2 = A_ABCD/2." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Volum. Perpendicularitate dreaptă-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cubul ABCDA'B'C'D'; O = AC ∩ BD (centrul bazei de jos), O' = BC' ∩ B'C.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D' cu D'C' = 6 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "V = D'C'³ = 6³ = 216 cm³." },
        { label: "b)", points: 3, answer: "OO' este linie mijlocie în triunghiul AB'C ⇒ OO' ∥ AB'. AB' ⊥ A'B, AB' ⊥ A'D', A'B ∩ A'D' = {A'}, deci AB' ⊥ (A'D'C). Cum OO' ∥ AB' și AB' ⊥ (A'D'C) ⇒ OO' ⊥ (A'D'C)." },
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
  console.log(`\n=== import-exam-mate-2023-model (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
