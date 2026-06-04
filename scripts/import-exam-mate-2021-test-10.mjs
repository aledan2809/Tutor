#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-10.mjs — Exam-Bank, CNCE training Test 10 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 10.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1b 2b 3d 4c 5a 6c · II = 1d 2c 3b 4b 5a 6b
 * NB: SI.6 (orar) = listă text, fără figură. SII.6 (robinet) fără figură. Deci 8 figuri
 *     (S2-1..5 + S3-4,5,6) și 7 autoGradable (SI 1-6 + SII.6). Via 4uPDF.
 * finalAnswer: III.1="65" (ab divizibil cu 5, A pătrat — find).
 *   SKIP: III.2 (identități), III.3 (b multi-valoare M(0,9)/(0,−1)), III.4 (2√13 + raport),
 *   III.5 (4√3 radical + inegalitate), III.6 (radicali).
 * NB: baremul oficial 5b tipărește „A(ABC)=32√3" apoi folosește 16√3 (eroare aritmetică în sursă);
 *     rubricul folosește valoarea corectă 16√3 (aria triunghiului echilateral cu latura 8).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-10-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 10 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-10", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Mulțimi. Sume",
      content: "Suma a două elemente ale mulțimii {1, 2, 3, 4} poate fi egală cu:",
      options: [{ key: "a", text: "1" }, { key: "b", text: "3" }, { key: "c", text: "8" }, { key: "d", text: "9" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Procente. Interpretarea datelor",
      content: "În tabelul de mai jos sunt prezentate cantitățile de fructe existente într-un magazin la începutul programului unei zile și procentul de vânzări din ziua respectivă:\n• Mere — 200 kg, vândute 20%\n• Pere — 150 kg, vândute 40%\n• Banane — 100 kg, vândute 50%\n• Cireșe — 180 kg, vândute 20%\nCea mai mare cantitate de fructe, vândută în ziua respectivă, a fost de:",
      options: [{ key: "a", text: "mere" }, { key: "b", text: "pere" }, { key: "c", text: "banane" }, { key: "d", text: "cireșe" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi. Comparare",
      content: "Dintre numerele −2, 2, −4 și 4, mai mic decât −3 este numărul:",
      options: [{ key: "a", text: "4" }, { key: "b", text: "2" }, { key: "c", text: "−2" }, { key: "d", text: "−4" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții zecimale periodice",
      content: "Scrierea fracției zecimale 1,(3) sub formă de fracție ordinară este:",
      options: [{ key: "a", text: "13/10" }, { key: "b", text: "2/15" }, { key: "c", text: "4/3" }, { key: "d", text: "13/90" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Formule de calcul. Radicali",
      content: "Patru elevi efectuează calculul (√2 + 1)² − (√2 − 1)² și obțin rezultatele:\n• Mircea — 4√2\n• Alina — 0\n• Nicolae — 3\n• Diana — 2√2\nDintre cei patru elevi, cel care a efectuat corect calculul este:",
      options: [{ key: "a", text: "Mircea" }, { key: "b", text: "Alina" }, { key: "c", text: "Nicolae" }, { key: "d", text: "Diana" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Probleme practice. Timp",
      content: "Orarul unui elev de clasa a VIII-a, pentru ziua de vineri, are următoarea succesiune de ore: Educație muzicală, Istorie, Fizică, Matematică, Biologie. Știind că orele încep la 9:00, că durata unei ore de curs este de 50 de minute, iar pauza este de 10 minute, la cât începe ora de matematică?",
      options: [{ key: "a", text: "10:00" }, { key: "b", text: "11:00" }, { key: "c", text: "12:00" }, { key: "d", text: "13:00" }], correctAnswer: "c" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Simetric față de o axă",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Sistem de axe ortogonale xOy cu punctul A(1, 2) marcat.",
      content: "În figura alăturată este reprezentat punctul A(1, 2) într-un sistem de axe ortogonale xOy. Coordonatele simetricului punctului A față de axa Oy sunt:",
      options: [{ key: "a", text: "(1, 0)" }, { key: "b", text: "(3, 2)" }, { key: "c", text: "(−1, −2)" }, { key: "d", text: "(−1, 2)" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte paralele. Triunghi",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Dreptele paralele AB (sus) și CD (jos); segmentele AD și BC se intersectează în O; unghiurile BAD = 71° (la A) și BCD = 36° (la C) marcate.",
      content: "În figura alăturată, dreptele AB și CD sunt paralele. Măsura unghiului BAD este egală cu 71°, iar măsura unghiului BCD este egală cu 36°. Știind că segmentele AD și BC se intersectează în punctul O, atunci măsura unghiului AOB este egală cu:",
      options: [{ key: "a", text: "144°" }, { key: "b", text: "107°" }, { key: "c", text: "73°" }, { key: "d", text: "36°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC dreptunghic în A (A sus, B jos-stânga, C jos-dreapta); M mijlocul lui AC, P pe ipotenuza BC.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu măsura unghiului BAC de 90°, AC = 8 cm și BC = 10 cm. Știind că punctul M este mijlocul laturii AC și punctul P este situat pe ipotenuza BC, astfel încât PC = 4 cm, atunci măsura unghiului APM este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "75°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Dreptunghi. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Dreptunghiul ABCD (A sus-stânga, B sus-dreapta, C jos-dreapta, D jos-stânga); M mijlocul lui AB, P mijlocul lui BC; triunghiul DMP trasat.",
      content: "În figura alăturată este reprezentat un dreptunghi ABCD și punctele M și P mijloacele laturilor AB, respectiv BC. Raportul dintre aria triunghiului DMP și aria dreptunghiului ABCD este egal cu:",
      options: [{ key: "a", text: "1/4" }, { key: "b", text: "3/8" }, { key: "c", text: "1/2" }, { key: "d", text: "3/4" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Distanțe",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu punctele A, B, C pe cerc și AB ⊥ BC.",
      content: "Punctele A, B și C sunt situate pe un cerc de centru O, astfel încât AB ⊥ BC, AB = 6 cm și BC = 8 cm. Suma distanțelor de la punctul O la dreptele AB și BC este egală cu:",
      options: [{ key: "a", text: "7 cm" }, { key: "b", text: "10 cm" }, { key: "c", text: "14 cm" }, { key: "d", text: "24 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Volum. Debit",
      content: "Un robinet deschis poate umple un bazin în formă de paralelipiped dreptunghic, cu dimensiunile de 5 m, 3 m și 2 m, în 20 de ore. În câte ore poate umple același robinet un bazin în formă de cub cu latura de 3 m?",
      options: [{ key: "a", text: "20 de ore" }, { key: "b", text: "18 ore" }, { key: "c", text: "12 ore" }, { key: "d", text: "6 ore" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Numere scrise în baza 10. Pătrate perfecte",
      finalAnswer: "65",
      content: "Se consideră numărul natural A = ab + ba, unde a și b sunt cifre distincte, iar ab și ba reprezintă numere de două cifre formate cu cifrele a și b.\na) Este posibil ca numărul A să fie egal cu 198? Justifică răspunsul dat.\nb) Determină numărul natural ab, știind că ab este divizibil cu 5 și A este pătratul unui număr natural.",
      rubric: [
        { label: "a)", points: 2, answer: "A = ab + ba = 11(a + b); dacă A = 198, atunci 11(a + b) = 198, deci a + b = 18, ceea ce impune a = b = 9. Cum a și b trebuie să fie cifre distincte, nu este posibil ca A să fie egal cu 198." },
        { label: "b)", points: 3, answer: "A = 11(a + b) este pătrat perfect, deci 11 | a + b, de unde a + b = 11 (a, b cifre). Cum ab este divizibil cu 5, b ∈ {0, 5}: pentru b = 0 rezultă a = 11 (imposibil), iar pentru b = 5 rezultă a = 6. Deci numărul căutat ab este 65 (iar A = 121 = 11²)." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Formule",
      content: "Se consideră expresia E(x) = (x − 1)² + (x + 4)(x − 3) − 2(x² − 4), unde x este număr real.\na) Arată că x² + x − 12 = (x + 4)(x − 3), pentru orice număr real x.\nb) Demonstrează că E(x) = −x − 3, pentru orice număr real x.",
      rubric: [
        { label: "a)", points: 2, answer: "(x + 4)(x − 3) = x² − 3x + 4x − 12 = x² + x − 12, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = (x² − 2x + 1) + (x² + x − 12) − 2(x² − 4) = x² − 2x + 1 + x² + x − 12 − 2x² + 8 = −x − 3, pentru orice număr real x." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Distanțe",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = (4/3)x + 4.\na) Calculează f(0) + f(−3).\nb) Știind că A și B sunt punctele de intersecție a reprezentării grafice a funcției f cu axele Ox, respectiv Oy ale sistemului de axe ortogonale xOy, determină coordonatele punctelor M, situate pe axa Oy, astfel încât segmentele AB și BM să aibă aceeași lungime.",
      rubric: [
        { label: "a)", points: 2, answer: "f(0) = 4 și f(−3) = (4/3)·(−3) + 4 = −4 + 4 = 0, deci f(0) + f(−3) = 4." },
        { label: "b)", points: 3, answer: "A(−3, 0) și B(0, 4), deci AB = √(3² + 4²) = 5. Pentru M(0, m) de pe Oy cu BM = AB = 5, avem |m − 4| = 5, de unde m = 9 sau m = −1; deci M(0, 9) sau M(0, −1)." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrat. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Pătratul AMPQ (A sus-stânga, M sus, Q stânga, P interior) cu AM = 2 cm; B pe dreapta AM (M mijlocul lui AB), C pe dreapta AQ (CQ = 2·AQ); S, T pe BC.",
      content: "În figura alăturată este reprezentat un pătrat AMPQ cu AM = 2 cm. Punctul B se află pe dreapta AM, astfel încât M este mijlocul segmentului AB, iar punctul C este situat pe dreapta AQ, astfel încât Q aparține segmentului AC și CQ = 2 · AQ.\na) Arată că BC = 2√13 cm.\nb) Știind că MP ∩ BC = {S} și QP ∩ BC = {T}, demonstrează că ST/BC = 1/6.",
      rubric: [
        { label: "a)", points: 2, answer: "AB = 2·AM = 4 cm și AC = 3·AQ = 6 cm (AQ = AM = 2 cm, CQ = 2·AQ = 4 cm). Triunghiul ABC este dreptunghic în A, deci BC = √(AB² + AC²) = √(16 + 36) = √52 = 2√13 cm." },
        { label: "b)", points: 3, answer: "MS este linie mijlocie în triunghiul ABC, deci SC = BC/2. Cum QT ∥ AB, CT/BC = CQ/CA = 4/6 = 2/3, deci CT = (2/3)·BC. Atunci ST = CT − SC = (2/3 − 1/2)·BC = (1/6)·BC, deci ST/BC = 1/6." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi echilateral. Inegalități",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul echilateral ABC (A sus, B jos-stânga, C jos-dreapta); M pe latura BC, aproape de C (MC = 2 cm).",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC cu AB = 8 cm. Punctul M se află pe latura BC astfel încât MC = 2 cm.\na) Arată că aria triunghiului AMC este egală cu 4√3 cm².\nb) Arată că suma distanțelor de la punctele B și C la dreapta AM este mai mare decât 4√3 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie AD ⊥ BC, D ∈ BC; cum triunghiul ABC este echilateral, AD = (AB√3)/2 = 4√3 cm; A(AMC) = (MC · AD)/2 = (2 · 4√3)/2 = 4√3 cm²." },
        { label: "b)", points: 3, answer: "A(ABC) = (AB²√3)/4 = 16√3 cm²; A(ABC) = A(ABM) + A(ACM) = (AM/2)·(d(B, AM) + d(C, AM)), deci d(B, AM) + d(C, AM) = 2·A(ABC)/AM = 32√3/AM. Cum AM < 8 cm, rezultă 32√3/AM > 32√3/8 = 4√3, deci suma distanțelor este mai mare decât 4√3 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă patrulateră regulată. Unghi diedru",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Piramida patrulateră regulată VABCD (vârf V, bază pătrată ABCD); M mijlocul muchiei VB; O centrul bazei (AC ∩ BD).",
      content: "În figura alăturată este reprezentată o piramidă patrulateră regulată VABCD cu VA = AB = 6 cm, punctul M mijlocul muchiei VB și AC ∩ BD = {O}.\na) Arată că perimetrul triunghiului AMC este egal cu 6(√3 + √2) cm.\nb) Determină tangenta unghiului dintre planele (VAB) și (VBD).",
      rubric: [
        { label: "a)", points: 2, answer: "AM și CM sunt mediane în triunghiurile echilaterale congruente VAB și VBC (laturi de 6 cm), deci AM = CM = (6√3)/2 = 3√3 cm. Cum AC = AB√2 = 6√2 cm, perimetrul triunghiului AMC este AM + CM + AC = 3√3 + 3√3 + 6√2 = 6(√3 + √2) cm." },
        { label: "b)", points: 3, answer: "OM este mediana corespunzătoare ipotenuzei în triunghiul dreptunghic isoscel VOB, deci OM ⊥ VB. Cum (VAB) ∩ (VBD) = VB, AM ⊥ VB și OM ⊥ VB, unghiul dintre plane este ∢AMO. AO ⊥ (VBD), deci AO ⊥ OM și tg(∢AMO) = AO/OM = (3√2)/3 = √2." },
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
  console.log(`\n=== import-exam-mate-2021-test-10 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
