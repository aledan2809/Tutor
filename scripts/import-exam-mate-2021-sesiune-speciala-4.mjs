#!/usr/bin/env node
/**
 * import-exam-mate-2021-sesiune-speciala-4.mjs — Exam-Bank series 3, 2021 Sesiunea Specială Varianta 4 (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Sesiunea Specială, Varianta 4.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1d 2b 3a 4d 5d 6a · II = 1d 2d 3b 4b 5c 6c
 * Figures: 10 PNG (en-viii-2021-mate-sesiune-speciala-4-s{2,3}-{label}.png) — toate 6 SII + s3-3..6.
 *   finalAnswer: III.1=3, III.3=1 (III.2 mulțime {0,1}; III.4/5 demonstrații; III.6=√3 radical).
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-sesiune-speciala-4-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Sesiunea Specială Varianta 4 (edu.ro)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "sesiune-speciala-4", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Puteri",
      content: "Rezultatul calculului 2⁵ este egal cu:",
      options: [{ key: "a", text: "10" }, { key: "b", text: "16" }, { key: "c", text: "25" }, { key: "d", text: "32" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporții",
      content: "Dacă a/2 = 1,5, atunci numărul a este egal cu:",
      options: [{ key: "a", text: "2,10" }, { key: "b", text: "3" }, { key: "c", text: "3,10" }, { key: "d", text: "0,75" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere opuse",
      content: "Opusul numărului 5 este egal cu:",
      options: [{ key: "a", text: "−5" }, { key: "b", text: "−1/5" }, { key: "c", text: "1/5" }, { key: "d", text: "5" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții zecimale periodice",
      content: "Dintre numerele 0,123; 0,1(23); 0,12(3) și 0,(123), cel mai mare este:",
      options: [{ key: "a", text: "0,123" }, { key: "b", text: "0,(123)" }, { key: "c", text: "0,1(23)" }, { key: "d", text: "0,12(3)" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali",
      content: "Patru elevi, Laura, Petru, Tudor și Sofia, au calculat numărul √(10² − 6²) și au obținut: Laura → 2√2; Petru → 4; Tudor → 3√2; Sofia → 8. Conform tabelului, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Laura" }, { key: "b", text: "Petru" }, { key: "c", text: "Tudor" }, { key: "d", text: "Sofia" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Intervale. Numere naturale",
      content: "Se consideră intervalul I = [−3, 5). Andrei afirmă că: „Intervalul I conține 5 numere naturale.”. Afirmația lui Andrei este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea (toate cu figură) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente coliniare",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare, în această ordine; AB = 2 cm, BC = 4 cm, CD = 1 cm.",
      content: "În figura alăturată sunt reprezentate, în această ordine, punctele coliniare A, B, C și D. Știind că AB = 2 cm, BC = 4 cm și CD = 1 cm, lungimea segmentului AD este egală cu:",
      options: [{ key: "a", text: "2 cm" }, { key: "b", text: "5 cm" }, { key: "c", text: "6 cm" }, { key: "d", text: "7 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri congruente. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Punctele A, O, E coliniare; unghiurile AOB, BOC, COD, DOE congruente; OM bisectoarea ∢AOB, ON bisectoarea ∢DOE.",
      content: "În figura alăturată, punctele A, O și E sunt coliniare și unghiurile AOB, BOC, COD și DOE sunt congruente. Semidreapta OM este bisectoarea unghiului AOB și semidreapta ON este bisectoarea unghiului DOE. Măsura unghiului MON este egală cu:",
      options: [{ key: "a", text: "45°" }, { key: "b", text: "90°" }, { key: "c", text: "120°" }, { key: "d", text: "135°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi echilateral. Centru. Simetrie",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul echilateral ABC; O interior, la 4 cm de fiecare vârf; M mijlocul lui BC; D simetricul lui O față de M.",
      content: "În figura alăturată este reprezentat un triunghi echilateral ABC. Punctul O, din interiorul triunghiului, se află la distanțe egale cu 4 cm de fiecare dintre cele trei vârfuri ale triunghiului. Punctul M este mijlocul segmentului BC și punctul D este simetricul punctului O față de punctul M. Lungimea segmentului OD este egală cu:",
      options: [{ key: "a", text: "2 cm" }, { key: "b", text: "4 cm" }, { key: "c", text: "6 cm" }, { key: "d", text: "8 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Trapez isoscel. Triunghi dreptunghic",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Trapezul isoscel ABCD cu AB ∥ CD; diagonala AC ⊥ BC; AB = 18 cm; ∢ADC = 120°.",
      content: "În figura alăturată este reprezentat trapezul isoscel ABCD, cu AB ∥ CD. Diagonala AC este perpendiculară pe latura BC, AB = 18 cm, iar măsura unghiului ADC este egală cu 120°. Lungimea segmentului BC este egală cu:",
      options: [{ key: "a", text: "6 cm" }, { key: "b", text: "9 cm" }, { key: "c", text: "6√3 cm" }, { key: "d", text: "9√3 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Arce congruente. Arii",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Punctele A, B, C, D pe un cerc cu raza 6 cm; A și D diametral opuse; arcele AB, BC, CD congruente.",
      content: "În figura alăturată, punctele distincte A, B, C și D sunt situate pe un cerc cu raza de 6 cm, astfel încât punctele A și D sunt diametral opuse și arcele AB, BC și CD sunt congruente. Aria triunghiului ABD este egală cu:",
      options: [{ key: "a", text: "6√3 cm²" }, { key: "b", text: "12√3 cm²" }, { key: "c", text: "18√3 cm²" }, { key: "d", text: "36√3 cm²" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Piramidă patrulateră regulată. Arie laterală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Piramida patrulateră regulată VABCD cu muchia laterală VA = 5 dm și muchia bazei AB = 6 dm.",
      content: "În figura alăturată este reprezentată o piramidă patrulateră regulată VABCD, cu muchia laterală VA de 5 dm și muchia bazei AB de 6 dm. Toate fețele laterale ale piramidei se vopsesc. Aria suprafeței vopsite este egală cu:",
      options: [{ key: "a", text: "12 dm²" }, { key: "b", text: "36 dm²" }, { key: "c", text: "48 dm²" }, { key: "d", text: "84 dm²" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Sisteme de ecuații. Probleme",
      finalAnswer: "3",
      content: "Ioana cumpără 3 kg de mere și 2 kg de portocale și plătește 19 lei. Maria cumpără 2 kg de mere și 3 kg de portocale, de aceeași calitate, pentru care plătește 21 de lei.",
      rubric: [
        { label: "a)", points: 2, answer: "5 kg de mere și 5 kg de portocale costă 19 + 21 = 40 de lei; atunci 10 kg de mere și 10 kg de portocale costă 40·2 = 80 de lei și, cum 71 < 80, Mihai nu poate cumpăra 10 kg de mere și 10 kg de portocale cu 71 de lei." },
        { label: "b)", points: 3, answer: "3x + 2y = 19 și 2x + 3y = 21, unde x este prețul unui kg de mere și y prețul unui kg de portocale; din 5x = 15 rezultă x = 3 lei." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Inecuații",
      content: "Se consideră expresia E(x) = (2x/3 + 1/2)² − (x/3 + 5/2)² − x(x/3 + 1), unde x este număr real.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = (4x²/9 + 2x/3 + 1/4) − (x²/9 + 5x/3 + 25/4) − (x²/3 + x) = −2x − 6, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(a) > −10 ⇒ −2a − 6 > −10 ⇒ −2a > −4 ⇒ a < 2; cum a este număr natural, obținem a = 0 sau a = 1." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Aria unui triunghi",
      hasFigure: true, figureUrl: FIG("s3-3"), finalAnswer: "1",
      figureNote: "Sistem de axe ortogonale xOy cu reprezentarea grafică a funcției f(x) = x − √2.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x − √2.",
      rubric: [
        { label: "a)", points: 2, answer: "f(1) = 1 − √2, deci f(1) + √2 = 1 − √2 + √2 = 1." },
        { label: "b)", points: 3, answer: "Graficul intersectează Ox în A(√2, 0) și Oy în B(0, −√2); A(AOB) = (AO·BO)/2 = (√2·√2)/2 = 1." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrate. Ortocentru. Perpendicularitate",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Pătratele ABMN și BCEF cu AB = 3 cm și BC = 2·AB = 6 cm; B pe segmentul AC.",
      content: "În figura alăturată sunt reprezentate pătratele ABMN și BCEF, cu AB = 3 cm și BC = 2·AB. Punctul B aparține segmentului AC.",
      rubric: [
        { label: "a)", points: 2, answer: "P(BCEF) = 4·BC = 8·AB = 24 cm." },
        { label: "b)", points: 3, answer: "FB ⊥ AC, deci FB este înălțime în triunghiul AFC; ∢MAB = ∢EBC = 45° ⇒ AM ∥ BE și, cum BE ⊥ CF, rezultă AM ⊥ CF, deci AM este înălțime în triunghiul AFC; înălțimile triunghiului AFC se intersectează în M, deci CM ⊥ AF." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Linie mijlocie. Paralelism",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Dreptunghiul ABCD cu AB = 6√3 cm, BC = 3√6 cm; M mijlocul lui AB; E pe diagonala BD cu DE = 3√2 cm.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD cu AB = 6√3 cm și BC = 3√6 cm. Punctul M este mijlocul segmentului AB, punctul E aparține diagonalei BD și DE = 3√2 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔABD dreptunghic în A ⇒ BD = √(AB² + AD²) = √(108 + 54) = 9√2 cm." },
        { label: "b)", points: 3, answer: "MB ∥ DC ⇒ ΔFBM ~ ΔFDC ({F} = CM ∩ BD) ⇒ FB/FD = 1/2, deci FB = 3√2 cm; cum EF = BE − BF = 3√2 cm, F este mijlocul lui BE; FM este linie mijlocie în ΔABE ⇒ FM ∥ AE, deci CM ∥ AE." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Distanță punct-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cubul ABCDA'B'C'D' cu AB = 6 cm; O = BC' ∩ B'C; M mijlocul lui AB.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D' cu AB = 6 cm. Intersecția dreptelor BC' și B'C este punctul O și punctul M este mijlocul segmentului AB.",
      rubric: [
        { label: "a)", points: 2, answer: "AB' = B'C = AC = 6√2 cm, deci triunghiul AB'C este echilateral; O este mijlocul lui BC', deci AO este înălțime în triunghiul AB'C, de unde AO = 3√6 cm." },
        { label: "b)", points: 3, answer: "AO ⊥ B'C și BC' ⊥ B'C, AO ∩ BC' = {O} ⇒ B'C ⊥ (ABC'); fie ME ⊥ AO (E pe AO): ME ⊥ B'C și, cum AO ∩ B'C = {O}, ME ⊥ (AB'C), deci d(M, (AB'C)) = ME; ΔAME ~ ΔAOB ⇒ AM/AO = ME/OB, de unde ME = √3 cm." },
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
  console.log(`\n=== import-exam-mate-2021-sesiune-speciala-4 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
