#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-08.mjs — Exam-Bank, CNCE training Test 8 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 8.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1c 2b 3c 4b 5a 6a · II = 1a 2d 3b 4b 5d 6d
 * Figures: 9 PNG (S2-1..6 + S3-4,5,6) via 4uPDF. 6 autoGradable (SI).
 * finalAnswer: III.1="2" (m, pătrat perfect — find).
 *   SKIP: III.2 (E≡(x+1)² + produs 0), III.3 (graf + perpendicularitate), III.4 (EN=9 dat + centroid),
 *   III.5 (72√3 + 6√3 radicali), III.6 (sin = 4/5 fracție).
 *   NB rubric III.2 = a)3p / b)2p.
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-08-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 8 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-08", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 20 − 20 : 4 este egal cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "4" }, { key: "c", text: "15" }, { key: "d", text: "20" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Procente. Ecuații",
      content: "Dacă (30/100) · x = 3, atunci x este egal cu:",
      options: [{ key: "a", text: "0,9" }, { key: "b", text: "10" }, { key: "c", text: "30" }, { key: "d", text: "100" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Mulțimi. Elemente extreme",
      content: "Suma dintre cel mai mare element și cel mai mic element ale mulțimii A = {−5; −4; −2; 0; 8; 9; 12} este egală cu:",
      options: [{ key: "a", text: "−17" }, { key: "b", text: "−7" }, { key: "c", text: "7" }, { key: "d", text: "17" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea numerelor zecimale",
      content: "Dintre numerele 18,09; 18,1; 18,099 și 18,0999, cel mai mare este:",
      options: [{ key: "a", text: "18,09" }, { key: "b", text: "18,1" }, { key: "c", text: "18,099" }, { key: "d", text: "18,0999" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Mulțimi. Modul",
      content: "Se consideră mulțimea B = {x ∈ ℕ | |x − 2| ≤ 1}. Dintre următoarele mulțimi, cea care reprezintă scrierea mulțimii B prin enumerarea elementelor sale este:",
      options: [{ key: "a", text: "{1, 2, 3}" }, { key: "b", text: "{0, 1, 2, 3}" }, { key: "c", text: "{0, 1, 2}" }, { key: "d", text: "{1, 2}" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Probleme practice. Timp",
      content: "Pentru a organiza festivitățile pentru ziua școlii, se hotărăște ca orele de curs să dureze câte 40 de minute, iar pauzele dintre ore câte 5 minute. Programul începe la ora 8,00, iar clasa a VIII-a are șase ore de curs. Astfel, afirmația „Elevii clasei a VIII-a vor termina cele șase ore de curs la ora 12 și 25 de minute.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Cinci puncte coliniare A, B, C, D, E (în această ordine) pe o dreaptă orizontală.",
      content: "În figura alăturată sunt reprezentate punctele A, B, C, D și E, care sunt coliniare în această ordine, astfel încât AB = 1 cm, BC = 2 cm, CD = 3 cm și DE = 4 cm. Punctul C este mijlocul segmentului:",
      options: [{ key: "a", text: "AD" }, { key: "b", text: "AE" }, { key: "c", text: "BD" }, { key: "d", text: "BE" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri în jurul unui punct. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Trei semidrepte OA, OB, OC în jurul punctului O (unghiuri egale) și semidreapta OD, bisectoarea unghiului AOB.",
      content: "În figura alăturată, unghiurile AOB, BOC și COA, formate în jurul punctului O, au măsurile egale, iar semidreapta OD este bisectoarea unghiului AOB. Măsura unghiului COD este egală cu:",
      options: [{ key: "a", text: "60°" }, { key: "b", text: "90°" }, { key: "c", text: "120°" }, { key: "d", text: "180°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi isoscel. Arie",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul isoscel ABC cu baza BC (A sus, B jos-stânga, C jos-dreapta); D mijlocul lui BC, AD înălțime.",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC cu baza BC. Punctul D este mijlocul segmentului BC, AD = 3 cm și BD = 4 cm. Aria triunghiului ABC este egală cu:",
      options: [{ key: "a", text: "6 cm²" }, { key: "b", text: "12 cm²" }, { key: "c", text: "24 cm²" }, { key: "d", text: "30 cm²" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Trapez. Linia mijlocie",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Trapezul dreptunghic ABCD (D sus-stânga, C sus, A jos-stânga, B jos-dreapta) cu AD ⊥ AB și AB ∥ CD; linia mijlocie trasată.",
      content: "În figura alăturată este reprezentat un trapez dreptunghic ABCD cu AD ⊥ AB, AB ∥ CD, AB = 160 cm și CD = 100 cm. Linia mijlocie a trapezului are lungimea egală cu:",
      options: [{ key: "a", text: "100 cm" }, { key: "b", text: "130 cm" }, { key: "c", text: "160 cm" }, { key: "d", text: "260 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Arc. Arie",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu diametrele AB și CD; A, C sus, D, B jos; arcul mic AC și coarda AC marcate.",
      content: "În figura alăturată, AB și CD sunt diametre în cercul de centru O, măsura arcului mic AC este de 60°, iar lungimea coardei AC este egală cu 6 cm. Aria cercului de centru O și rază OA este egală cu:",
      options: [{ key: "a", text: "6π cm²" }, { key: "b", text: "16π cm²" }, { key: "c", text: "18π cm²" }, { key: "d", text: "36π cm²" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cubul ABCDA′B′C′D′ (A′B′C′D′ sus, ABCD jos); diagonalele B′D′ (fața de sus) și AC (fața de jos) trasate.",
      content: "În figura alăturată este reprezentat un cub ABCDA′B′C′D′. Măsura unghiului dreptelor B′D′ și AC este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "90°" }], correctAnswer: "d" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Ecuații. Pătrate perfecte",
      finalAnswer: "2",
      content: "Dublul unui număr întreg n este cu 6 mai mare decât jumătatea acestui număr.\na) Este posibil ca n să fie egal cu 8? Justifică răspunsul dat.\nb) Determină numărul natural m al cărui pătrat este n.",
      rubric: [
        { label: "a)", points: 2, answer: "Dublul lui 8 este 16, iar jumătatea lui 8 este 4; cum 4 + 6 = 10 ≠ 16, nu este posibil ca n să fie egal cu 8." },
        { label: "b)", points: 3, answer: "2n = n/2 + 6 ⇒ (3/2)n = 6 ⇒ n = 4, de unde m² = 4; cum m ∈ ℕ, convine m = 2." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Formule de calcul",
      content: "Se consideră expresia E(x) = 2(x + 3)² − (2 + x)(x − 2) − 2(5x + 7) − 7, unde x este număr real.\na) Arată că E(√3 − 1) = 3.\nb) Demonstrează că E(−1) · E(0) · E(1) · E(2) · ... · E(2021) = 0.",
      rubric: [
        { label: "a)", points: 3, answer: "E(x) = 2x² + 12x + 18 − (x² − 4) − (10x + 14) − 7 = x² + 2x + 1 = (x + 1)², pentru orice număr real x; deci E(√3 − 1) = (√3 − 1 + 1)² = (√3)² = 3." },
        { label: "b)", points: 2, answer: "E(−1) = (−1 + 1)² = 0; produsul E(−1) · E(0) · E(1) · ... · E(2021) conține factorul E(−1) = 0, deci produsul este egal cu 0." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Geometrie analitică",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x − 3.\na) Arată că punctul A(√3 + 3/2, √3 − 3/2) aparține reprezentării geometrice a graficului funcției f în sistemul de coordonate xOy.\nb) Demonstrează că dreapta ce trece prin originea sistemului de coordonate xOy și prin mijlocul segmentului cu capetele în punctele de intersecție ale reprezentării geometrice a graficului funcției f cu axele de coordonate este perpendiculară pe acest segment.",
      rubric: [
        { label: "a)", points: 2, answer: "f(√3 + 3/2) = √3 + 3/2 − 3 = √3 − 3/2, care este ordonata punctului A, deci A aparține reprezentării geometrice a graficului funcției f." },
        { label: "b)", points: 3, answer: "Graficul intersectează axa Ox în punctul (3, 0) și axa Oy în punctul (0, −3), aflate la distanța 3 de origine; triunghiul format de origine și aceste două puncte este dreptunghic isoscel cu ipotenuza pe segmentul lor, iar mediana din origine corespunzătoare ipotenuzei este și înălțime, deci dreapta prin origine și mijlocul segmentului este perpendiculară pe acest segment." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez isoscel. Centru de greutate",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Trapezul isoscel ABCD (D, C sus, A, B jos) cu AB ∥ CD; dreptele AD și BC se intersectează în E (sus); M, N pe AB cu DM ⊥ AB și EN ⊥ AB.",
      content: "În figura alăturată este reprezentat trapezul isoscel ABCD cu AB ∥ CD, AB = 24 cm, CD = 8 cm și AD = 10 cm. Dreptele AD și BC se intersectează în punctul E, iar punctele M și N sunt situate pe dreapta AB astfel încât DM ⊥ AB și EN ⊥ AB.\na) Arată că segmentul EN este de lungime 9 cm.\nb) Știind că G este punctul de intersecție a dreptelor EN și MC, demonstrează că G este centrul de greutate al triunghiului ABE.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiul AEB este isoscel cu EN ⊥ AB, deci EN este mediană și AN = AB/2 = 12 cm. În triunghiul AMD dreptunghic în M, AM = (AB − DC)/2 = 8 cm, deci DM = √(AD² − AM²) = 6 cm. Din ΔAMD ~ ΔANE rezultă DM/EN = AM/AN, de unde EN = 9 cm." },
        { label: "b)", points: 3, answer: "Fie {T} = EN ∩ DC; din ΔMNG ≡ ΔCTG și TN = DM = 6 cm rezultă GN = DM/2 = 3 cm. EN este înălțime (deci și mediană) în triunghiul isoscel AEB de bază AB, iar EN = 3 · GN, deci G este centrul de greutate al triunghiului AEB." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Trigonometrie",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A (A jos-stânga, B jos-dreapta, C sus-stânga); D simetricul lui A față de C (D deasupra lui C).",
      content: "În figura alăturată este reprezentat triunghiul ABC, dreptunghic în A, în care măsura unghiului B este de 30° și AC = 12 cm. Punctul D este simetricul punctului A față de punctul C.\na) Arată că aria triunghiului ABC este egală cu 72√3 cm².\nb) Calculează distanța de la punctul D la dreapta BC.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔABC dreptunghic în A cu ∢B = 30°, deci BC = 2 · AC = 24 cm și AB = √(BC² − AC²) = 12√3 cm; A(ABC) = (AB · AC)/2 = (12√3 · 12)/2 = 72√3 cm²." },
        { label: "b)", points: 3, answer: "∢ACB = 60°; cum ∢ACB ≡ ∢DCP (P piciorul perpendicularei din D pe BC), ∢DCP = 60°; DC = AC = 12 cm (D simetricul lui A față de C). În triunghiul DPC dreptunghic în P, sin C = DP/DC, de unde DP = 12 · sin 60° = 6√3 cm, deci distanța de la D la dreapta BC este 6√3 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Prismă. Unghi diedru",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Prisma dreaptă ABCA′B′C′ cu baza triunghi echilateral ABC (A′B′C′ sus, ABC jos); M mijlocul segmentului A′B.",
      content: "În figura alăturată este reprezentată o prismă dreaptă ABCA′B′C′ cu baza triunghiul echilateral ABC, AB = 12 cm, AA′ = 12√3 cm și punctul M este mijlocul segmentului A′B.\na) Arată că suma lungimilor tuturor muchiilor prismei date este egală cu 36(2 + √3) cm.\nb) Determină sinusul unghiului dintre planele (MBC) și (MB′C′).",
      rubric: [
        { label: "a)", points: 2, answer: "Suma lungimilor tuturor muchiilor este S = 6 · AB + 3 · AA′ = 6 · 12 + 3 · 12√3 = 72 + 36√3 = 36(2 + √3) cm." },
        { label: "b)", points: 3, answer: "Muchia comună a planelor (MBC) și (MB′C′) este paralelă cu BC și B′C′; fie Q mijlocul lui BC. Analizând triunghiul dreptunghic A′AQ (AQ = (AB√3)/2 = 6√3, AA′ = 12√3) și înălțimea AS din A pe A′Q, se obține că sinusul unghiului dintre cele două plane este AS/AP = 4/5." },
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
  console.log(`\n=== import-exam-mate-2021-test-08 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
