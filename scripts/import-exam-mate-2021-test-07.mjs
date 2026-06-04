#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-07.mjs — Exam-Bank, CNCE training Test 7 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 7.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1b 2d 3a 4c 5d 6a · II = 1d 2b 3a 4c 5b 6b
 * NB: SII.6 (acvariu) NU are figură ⇒ autoGradable. Deci 8 figuri (S2-1..5 + S3-4,5,6) și 7 autoGradable.
 * finalAnswer: III.1="0,42" (suma pătratelor, fracție zecimală — find; norm() face ','→'.').
 *   SKIP: III.2 (E≡2 + divizibilitate), III.3 (proof =0), III.4 (romb proof), III.5 (unghi + inegalitate),
 *   III.6 (√6 radical).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-07-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 7 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-07", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Împărțirea cu rest",
      content: "Câtul împărțirii numărului 62 la 12 este numărul:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "5" }, { key: "c", text: "12" }, { key: "d", text: "62" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte",
      content: "Dacă 3a = 2b și b ≠ 0, atunci a/b este egal cu:",
      options: [{ key: "a", text: "3/1" }, { key: "b", text: "2/1" }, { key: "c", text: "3/2" }, { key: "d", text: "2/3" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Modul. Valoare minimă",
      content: "Numărul a este un element din mulțimea {−8, −5, 0, 1}. Cea mai mică valoare pe care o poate avea expresia |a + 3| este egală cu:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "3" }, { key: "c", text: "4" }, { key: "d", text: "5" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Operații cu numere raționale",
      content: "Diferența dintre numerele 3/2 și 0,25, în această ordine, este egală cu:",
      options: [{ key: "a", text: "−1" }, { key: "b", text: "1" }, { key: "c", text: "5/4" }, { key: "d", text: "7/4" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Mulțimi. Intervale",
      content: "Scrisă sub formă de interval, mulțimea A = {x ∈ ℝ | |x| ≤ 2} este egală cu:",
      options: [{ key: "a", text: "[2, +∞)" }, { key: "b", text: "(−∞, 2]" }, { key: "c", text: "(−∞, −2]" }, { key: "d", text: "[−2, 2]" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea radicalilor",
      content: "Andra, Sorin, Teo și Bogdan aleg câte un număr real, alegerile fiind evidențiate în tabelul de mai jos:\n• Andra — √7\n• Sorin — √5\n• Teo — √8\n• Bogdan — √3\nToți cei care au ales număr mai mare decât 2 sunt:",
      options: [{ key: "a", text: "Andra, Sorin și Teo" }, { key: "b", text: "Sorin, Teo și Bogdan" }, { key: "c", text: "Andra, Sorin și Bogdan" }, { key: "d", text: "Andra, Teo și Bogdan" }], correctAnswer: "a" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Simetric",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Patru puncte coliniare distincte A, B, C, D (în această ordine) pe o dreaptă orizontală.",
      content: "În figura alăturată sunt reprezentate punctele coliniare, distincte, A, B, C și D, în această ordine. Punctul D este simetricul punctului A față de punctul C, AB = 2 cm și BC = 3 cm. Lungimea segmentului AD este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "5 cm" }, { key: "c", text: "8 cm" }, { key: "d", text: "10 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Bisectoare. Unghiuri adiacente",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Semidreptele cu originea în O: OA, OB, OC și bisectoarele OM (a unghiului AOB) și ON (a unghiului BOC).",
      content: "În figura alăturată, semidreptele OM și ON sunt bisectoarele unghiurilor adiacente AOB, respectiv BOC, iar suma măsurilor unghiurilor AOB și BOC este egală cu 160°. Măsura unghiului MON este egală cu:",
      options: [{ key: "a", text: "40°" }, { key: "b", text: "80°" }, { key: "c", text: "90°" }, { key: "d", text: "100°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc circumscris. Unghi la centru",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC înscris în cercul de centru O; razele OA, OB, OC trasate.",
      content: "În figura alăturată, punctul O este centrul cercului circumscris triunghiului ABC, măsura unghiului AOB este de 140° și măsura unghiului BOC este de 120°. Măsura unghiului ABC este:",
      options: [{ key: "a", text: "50°" }, { key: "b", text: "60°" }, { key: "c", text: "70°" }, { key: "d", text: "80°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Trapez isoscel. Diagonale",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Trapezul isoscel ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta) cu AB ∥ CD; diagonalele AC și BD trasate.",
      content: "Trapezul isoscel ABCD din figura alăturată reprezintă schița unui parc, AB ∥ CD, AB = 2,5 km, BD = 2 km și BC = 1,5 km. Segmentele AD, BC, AC, BD și AB reprezintă piste pentru biciclete. Tudor pornește din punctul A și parcurge, o singură dată, traseul format din segmentele AB, BC și CA, ajungând, la final, tot în punctul A. Lungimea traseului parcurs de Tudor este egală cu:",
      options: [{ key: "a", text: "4 km" }, { key: "b", text: "5,5 km" }, { key: "c", text: "6 km" }, { key: "d", text: "6,5 km" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghiuri înscrise",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu punctele A, B, C, D pe cerc; A și D de aceeași parte a dreptei BC; trasate unghiurile BAC și BDC.",
      content: "În figura alăturată, punctele distincte A, B, C și D aparțin cercului de centru O, astfel încât punctele A și D sunt de aceeași parte a dreptei BC. Unghiul BAC are măsura de 60°. Măsura unghiului BDC este de:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "120°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Volum. Cub",
      content: "Un acvariu este plin cu apă. În acvariu se scufundă complet 8 cuburi de piatră cu muchia de 0,5 dm. Din acvariu se varsă o cantitate de apă egală cu:",
      options: [{ key: "a", text: "0,5 litri" }, { key: "b", text: "1 litru" }, { key: "c", text: "1,25 litri" }, { key: "d", text: "8 litri" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Medii. Sistem",
      finalAnswer: "0,42",
      content: "Se consideră numerele reale a, b și c astfel încât suma lor este egală cu 1, iar media aritmetică a numerelor b și c este egală cu 0,25.\na) Arată că numărul a este egal cu suma dintre b și c.\nb) Știind, în plus, că media geometrică a lui a și 5b este 1, determină suma pătratelor numerelor a, b și c, exprimând rezultatul sub formă de fracție zecimală.",
      rubric: [
        { label: "a)", points: 2, answer: "Media aritmetică a lui b și c este 0,25, deci b + c = 0,5; cum a + b + c = 1, rezultă a = 1 − 0,5 = 0,5 = b + c." },
        { label: "b)", points: 3, answer: "Media geometrică a lui a și 5b este 1, deci √(a · 5b) = 1 ⇒ 5ab = 1 ⇒ ab = 0,2; cum a = 0,5, rezultă b = 0,4 și c = 0,5 − 0,4 = 0,1. Atunci a² + b² + c² = 0,5² + 0,4² + 0,1² = 0,25 + 0,16 + 0,01 = 0,42." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = (x/√2 − √2)² − x(x/2 − √2) − √2(1 − √2)x, unde x este număr real.\na) Arată că E(0) = 2.\nb) Arată că numărul N = E(n) + 2 · E(2n) + 1485 este divizibil cu 7, pentru orice număr întreg n.",
      rubric: [
        { label: "a)", points: 2, answer: "E(0) = (0/√2 − √2)² − 0 · (0/2 − √2) − √2(1 − √2) · 0 = (−√2)² = 2." },
        { label: "b)", points: 3, answer: "E(x) = (x²/2 − 2x + 2) − (x²/2 − √2·x) − (√2 − 2)x = (x² − 4x + 4)/2 − x²/2 + 2x = 2, pentru orice număr real x. Atunci N = E(n) + 2·E(2n) + 1485 = 2 + 2·2 + 1485 = 1491 și, cum 1491 = 7 · 213, N este divizibil cu 7, oricare ar fi numărul întreg n." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Operații cu fracții și puteri",
      content: "Se consideră numerele x = (1/2 + 1/3 − 1/6) · (3/2) și y = 16² : (2²)³ : 2.\na) Arată că x = 1.\nb) Arată că (x − y)²⁰²² + (x − y)²⁰²¹ = 0.",
      rubric: [
        { label: "a)", points: 2, answer: "x = (3 + 2 − 1)/6 · 3/2 = (4/6) · (3/2) = 1." },
        { label: "b)", points: 3, answer: "y = 16² : (2²)³ : 2 = 2⁸ : 2⁶ : 2 = 2, deci x − y = 1 − 2 = −1; (x − y)²⁰²² + (x − y)²⁰²¹ = (−1)²⁰²² + (−1)²⁰²¹ = 1 − 1 = 0." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Romb",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Dreptunghiul ABCD (A sus-stânga, B sus-dreapta, D jos-stânga, C jos) cu M pe latura CD și E pe dreapta CD (în prelungire, dincolo de C); bisectoarea unghiului BAM trasată.",
      content: "În figura alăturată este reprezentat un dreptunghi ABCD cu AB = 14 cm și AD = 10 cm. Punctul M este situat pe latura CD astfel încât AM = AB. Bisectoarea unghiului BAM intersectează dreapta CD în punctul E.\na) Arată că aria dreptunghiului ABCD este egală cu 140 cm².\nb) Demonstrează că patrulaterul AMEB este romb.",
      rubric: [
        { label: "a)", points: 2, answer: "A(ABCD) = AB · BC = 14 · 10 = 140 cm² (BC = AD = 10 cm)." },
        { label: "b)", points: 3, answer: "ME ∥ AB ⇒ ∢MEA ≡ ∢BAE (alterne interne); cum ∢BAE ≡ ∢MAE (AE bisectoare), obținem ∢MEA ≡ ∢MAE, deci triunghiul MEA este isoscel ⇒ ME = AM. Cum AM = AB și ME ∥ AB, patrulaterul AMEB are laturi opuse paralele și egale (AM = AB = ME), deci este romb." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Trigonometrie",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A (C sus-stânga, A jos-stânga, B jos-dreapta); M mijlocul ipotenuzei BC.",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în A. Punctul M este mijlocul ipotenuzei BC, AM = 6 cm și cos C = 1/2.\na) Determină măsura unghiului ABC.\nb) Arată că suma distanțelor de la vârfurile triunghiului ABC la laturile opuse acestora este mai mare decât 21.",
      rubric: [
        { label: "a)", points: 2, answer: "cos C = 1/2 ⇒ ∢C = 60°; triunghiul ABC este dreptunghic în A, deci ∢ABC = 90° − 60° = 30°." },
        { label: "b)", points: 3, answer: "BC = 2 · AM = 12 cm; CA = 6 cm, BA = 6√3 cm și AD = (AB · AC)/BC = 3√3 cm sunt distanțele de la vârfurile B, C, respectiv A la laturile opuse. Suma este BA + CA + AD = 6√3 + 6 + 3√3 = 6 + 9√3 = 6 + √243 > 6 + √225 = 6 + 15 = 21, deci suma distanțelor este mai mare decât 21." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă patrulateră regulată. Distanțe",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Piramida patrulateră regulată VABCD (vârf V, bază pătrată ABCD); O centrul bazei, M mijlocul muchiei BC.",
      content: "În figura alăturată este reprezentată o piramidă patrulateră regulată VABCD cu baza ABCD, AB = VA = 6 cm. Punctul M este mijlocul muchiei BC.\na) Arată că apotema piramidei VABCD are lungimea de 3√3 cm.\nb) Calculează distanța de la punctul M la planul (VAB).",
      rubric: [
        { label: "a)", points: 2, answer: "VM este mediană în triunghiul VBC echilateral (VB = VC = BC = 6 cm), deci este și înălțime; VM = (6√3)/2 = 3√3 cm, adică apotema piramidei are lungimea 3√3 cm." },
        { label: "b)", points: 3, answer: "OM ∥ AB și AB ⊂ (VAB), deci OM ∥ (VAB) ⇒ d(M, (VAB)) = d(O, (VAB)). Fie E mijlocul lui AB; AB ⊥ OE și AB ⊥ VE ⇒ AB ⊥ (VOE); fie OQ ⊥ VE (Q ∈ VE) ⇒ OQ ⊥ (VAB), deci d(O, (VAB)) = OQ. În triunghiul VOE dreptunghic în O, VO = 3√2 cm, VE = 3√3 cm și OQ = (VO · OE)/VE = √6 cm, deci d(M, (VAB)) = √6 cm." },
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
  console.log(`\n=== import-exam-mate-2021-test-07 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
