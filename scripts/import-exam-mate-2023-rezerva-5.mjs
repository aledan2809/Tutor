#!/usr/bin/env node
/**
 * import-exam-mate-2023-rezerva-5.mjs — Exam-Bank series 3, pair 2023 Rezervă Varianta 5 (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2022–2023, Rezervă (Examen), Varianta 5.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1c 2c 3a 4b 5c 6a · II = 1d 2c 3d 4b 5c 6d
 * Figures: 10 PNG (en-viii-2023-mate-rezerva-5-{label}.png) — s2-1..6, s3-3 (grafic), s3-4..6.
 *   finalAnswer: III.1=16, III.4=75. (III.2 demonstrație N=n/2, III.3 radical 3√10/10, III.5 demonstrații+inegalitate, III.6 demonstrații → skip.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2023-mate-rezerva-5-${s}.png`;

const MATH = {
  source: "EN VIII 2023 Rezervă Varianta 5 (edu.ro)",
  examType: "EN_VIII", year: 2023, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "rezerva-5", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2023/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 2 + 3·5 este egal cu:",
      options: [{ key: "a", text: "1" }, { key: "b", text: "10" }, { key: "c", text: "17" }, { key: "d", text: "25" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporții",
      content: "Dacă 1/2 = a/3, atunci numărul a este egal cu:",
      options: [{ key: "a", text: "2/3" }, { key: "b", text: "1" }, { key: "c", text: "3/2" }, { key: "d", text: "6" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Înmulțirea numerelor întregi",
      content: "Produsul numerelor −2 și 7 este egal cu:",
      options: [{ key: "a", text: "−14" }, { key: "b", text: "−5" }, { key: "c", text: "5" }, { key: "d", text: "14" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții zecimale. Fracție ordinară",
      content: "Scris sub formă de fracție ordinară, numărul 2,3 este egal cu:",
      options: [{ key: "a", text: "23/9" }, { key: "b", text: "23/10" }, { key: "c", text: "2/3" }, { key: "d", text: "23/100" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Citirea tabelelor de date",
      content: "În tabelul de mai jos sunt prezentate informații referitoare la rezultatele obținute de elevii unei clase la un test de matematică: Nota → 4, 5, 6, 7, 8, 9, 10; Număr de elevi → 2, 1, 3, 8, 6, 4, 1. Conform informațiilor din tabel, numărul de elevi care au obținut note mai mari sau egale cu 8, la acest test, este egal cu:",
      options: [{ key: "a", text: "5" }, { key: "b", text: "6" }, { key: "c", text: "11" }, { key: "d", text: "14" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea numerelor reale",
      content: "Se consideră numerele reale a = 2√3 și b = 3√2. Radu afirmă că: „Numărul a este mai mic decât numărul b.” Afirmația lui Radu este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Simetricul unui punct față de un punct",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Pe o rețea pătrățică: punctele A, E, C coliniare pe o orizontală (A stânga, E mijloc, C dreapta); D deasupra lui E și B dedesubtul lui E.",
      content: "În figura alăturată sunt reprezentate punctele A, B, C, D și E. Simetricul punctului B față de punctul E este punctul:",
      options: [{ key: "a", text: "A" }, { key: "b", text: "B" }, { key: "c", text: "C" }, { key: "d", text: "D" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte paralele. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Dreptele paralele AB (sus, B stânga, A dreapta) și CD (jos, C stânga, D dreapta); secanta BC; ∢BCD = 45°, cu A și D de aceeași parte a dreptei BC.",
      content: "În figura alăturată sunt reprezentate dreptele paralele AB și CD, cu punctele A și D de aceeași parte a dreptei BC. Măsura unghiului BCD este egală cu 45°. Măsura unghiului ABC este egală cu:",
      options: [{ key: "a", text: "45°" }, { key: "b", text: "75°" }, { key: "c", text: "135°" }, { key: "d", text: "145°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi echilateral. Distanță. Apotemă",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul echilateral ABC cu A sus, B jos-stânga, C jos-dreapta; punctul M în interior, egal depărtat de cele trei laturi.",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC, cu lungimea laturii de 12 cm. Punctul M se află în interiorul triunghiului ABC, la distanțe egale de laturile triunghiului. Distanța de la punctul M la dreapta BC este egală cu:",
      options: [{ key: "a", text: "4√3 cm" }, { key: "b", text: "6 cm" }, { key: "c", text: "4 cm" }, { key: "d", text: "2√3 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Trapez. Linie mijlocie",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Trapezul ABCD cu D și C sus (latura mică CD) și A, B jos (latura mare AB), AB ∥ CD.",
      content: "În figura alăturată este reprezentat trapezul ABCD cu AB ∥ CD, CD = 20 cm și AB = 4·CD. Lungimea liniei mijlocii a acestui trapez este egală cu:",
      options: [{ key: "a", text: "30 cm" }, { key: "b", text: "50 cm" }, { key: "c", text: "80 cm" }, { key: "d", text: "100 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghi la centru. Triunghi isoscel",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu punctele A (sus) și B (stânga) pe cerc; razele OA și OB și coarda AB trasate.",
      content: "În figura alăturată, punctele A și B aparțin cercului de centru O. Măsura arcului mic AB este egală cu 46°. Măsura unghiului BAO este egală cu:",
      options: [{ key: "a", text: "23°" }, { key: "b", text: "46°" }, { key: "c", text: "67°" }, { key: "d", text: "134°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Tetraedru regulat. Muchii",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Tetraedru regulat ABCD cu vârful A sus și baza triunghiul BCD (B stânga, C jos, D dreapta).",
      content: "În figura alăturată este reprezentat un tetraedru regulat ABCD cu AB = 6 cm. Suma lungimilor tuturor muchiilor acestui tetraedru este egală cu:",
      options: [{ key: "a", text: "18 cm" }, { key: "b", text: "24 cm" }, { key: "c", text: "30 cm" }, { key: "d", text: "36 cm" }], correctAnswer: "d" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Sisteme de ecuații",
      finalAnswer: "16",
      content: "La ora de geometrie, fiecare dintre cei 25 de elevi ai unei clase a desenat pe caiet fie un triunghi, fie un patrulater.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiurile desenate de cei 7 elevi ar avea 7·3 = 21 de laturi, iar cele (25 − 7) = 18 patrulatere ar avea 18·4 = 72 de laturi. Cum 72 + 21 = 93 ≠ 90, nu este posibil ca exact 7 elevi să deseneze câte un triunghi." },
        { label: "b)", points: 3, answer: "a + b = 25, unde a este numărul de elevi care au desenat câte un triunghi și b numărul celor care au desenat câte un patrulater. 3a + 4b = 91 ⇒ b = 16." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = (1/x + 2/(x+1) − 3/(x+2)) : (2x+1)/(x²+3x+2), unde x este număr real, x ≠ 0, x ≠ −1, x ≠ −2 și x ≠ −1/2.",
      rubric: [
        { label: "a)", points: 2, answer: "(x+1)(x+2) = x² + 2x + x + 2 = x² + 3x + 2, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = ((x²+3x+2 + 2x²+4x − 3x² − 3x)/(x(x+1)(x+2))) : ((2x+1)/((x+1)(x+2))) = (2(2x+1)/(x(x+1)(x+2))) · ((x+1)(x+2)/(2x+1)) = 2/x, unde x ≠ 0, x ≠ −1, x ≠ −2, x ≠ −1/2. Dacă n este număr natural par, nenul, atunci N = 1/E(n) = n/2 este natural." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcția de gradul I. Distanță",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu reprezentarea grafică a funcției f(x) = x/3 − 1 (dreaptă ascendentă care taie Oy sub origine).",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x/3 − 1.",
      rubric: [
        { label: "a)", points: 2, answer: "f(3) = 0; f(9) = 2 ⇒ f(3) + f(9) = 0 + 2 = 2." },
        { label: "b)", points: 3, answer: "M(3, 0) și N(0, −1) sunt punctele de intersecție a graficului cu axele Ox, respectiv Oy. Triunghiul MON este dreptunghic în O, deci MN = √10. Fie OP ⊥ MN, P ∈ MN; OP = (OM·ON)/MN = 3√10/10." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi echilateral. Asemănare. Raport de arii",
      hasFigure: true, figureUrl: FIG("s3-4"), finalAnswer: "75",
      figureNote: "Triunghiurile echilaterale ABC (mare, vârf A sus) și CDE (mic, vârf E sus) cu B, C, D coliniare în această ordine pe o orizontală; M mijlocul lui AB, N mijlocul lui DE.",
      content: "În figura alăturată sunt reprezentate triunghiurile echilaterale ABC și CDE, cu AB = 8 cm, CD = 4 cm, iar punctele B, C și D sunt coliniare, în această ordine. Punctele M și N sunt mijloacele segmentelor AB, respectiv DE.",
      rubric: [
        { label: "a)", points: 2, answer: "CM este înălțime în triunghiul echilateral ABC ⇒ CM = 4√3 cm. CN este înălțime în triunghiul echilateral CDE ⇒ CN = 2√3 cm, deci CM = 2·CN." },
        { label: "b)", points: 3, answer: "CM și CN sunt bisectoare în triunghiurile echilaterale ABC, respectiv CDE ⇒ ∢BCM = ∢DCN = 30°, de unde ∢MCN = 120°. ∢ACD = 120°, deci ∢MCN ≡ ∢ACD și, cum CM/AC = CN/CD = √3/2 ⇒ ΔMCN ~ ΔACD. A_MCN/A_ACD = 3/4 = 75/100 = 75% ⇒ p = 75." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi isoscel. Distanță punct-dreaptă",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul isoscel ABC cu AB = AC, vârful A spre interior, B jos-stânga, C jos-dreapta; M mijlocul lui BC; S simetricul lui M față de A (deasupra lui A).",
      content: "În figura alăturată este reprezentat triunghiul ABC, cu AB = AC = 10 cm și ∢BAC = 120°. Punctul M este mijlocul segmentului BC și punctul S este simetricul punctului M față de punctul A.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiul ABC este isoscel, AM mediană ⇒ AM este înălțime și bisectoare. Triunghiul AMC dreptunghic în M, sin(∢CAM) = CM/AC ⇒ CM = 5√3 cm, deci BC = 10√3 cm." },
        { label: "b)", points: 3, answer: "Triunghiul SMC dreptunghic în M, SC² = MC² + MS² ⇒ SC = 5√7 cm. Fie MT ⊥ CS, T ∈ SC; d(M, SC) = MT = (SM·MC)/SC = 10√21/7 cm. Cum 10√21/7 < 7 ⇔ 10√21 < 49 ⇔ 2100 < 2401, obținem MT < 7 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Paralelipiped dreptunghic. Dreaptă paralelă cu plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Paralelipipedul dreptunghic ABCDA'B'C'D' cu baza ABCD jos și A'B'C'D' sus; M mijlocul muchiei BC.",
      content: "În figura alăturată este reprezentat paralelipipedul dreptunghic ABCDA'B'C'D', cu AB = 2√3 cm, BC = 2 cm și AA' = 4 cm. Punctul M este mijlocul segmentului BC.",
      rubric: [
        { label: "a)", points: 2, answer: "V = AB·BC·AA' = 2√3·2·4 = 16√3 cm³." },
        { label: "b)", points: 3, answer: "ABB'A' este dreptunghi, A'B ∩ AB' = {O} ⇒ O este mijlocul segmentului A'B. În triunghiul A'BC, OM este linie mijlocie ⇒ OM ∥ A'C. Cum OM ⊂ (MAB') ⇒ A'C ∥ (MAB')." },
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
  console.log(`\n=== import-exam-mate-2023-rezerva-5 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
