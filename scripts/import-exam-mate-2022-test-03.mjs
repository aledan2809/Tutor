#!/usr/bin/env node
/**
 * import-exam-mate-2022-test-03.mjs — Exam-Bank, CNCE training Test 3 (Matematică, EN VIII 2021–2022)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2021–2022, Test de antrenament nr. 3. Public.
 *
 * Barem chei: I = 1c 2d 3c 4a 5a 6b · II = 1d 2c 3c 4d 5a 6c
 * NB: SI 1-6 fără figură (6 autoGradable). SII.5 (lungimea cercului) text-only → autoGradable; restul SII
 *     cu figură. SIII.3 (axe goale grafic), 4 (triunghi echilateral), 5 (dreptunghi), 6 (cub) cu figură.
 *     Total figuri = 9 (s2-1,2,3,4,6 + s3-3,4,5,6); autoGradable = 7. Via 4uPDF.
 * finalAnswer: III.1="70" (preț adult), III.5="2,5" (OI), III.6="90" (unghi grade). SKIP: III.2 (demonstrație
 *   multiplu 16), III.3 ([5,∞) interval), III.4 (4√7 radical).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2022-mate-test-03-${s}.png`;

const MATH = {
  source: "EN VIII 2022 Testul 3 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2022, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-03", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2022/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 5·(3 + 2·4) este egal cu:",
      options: [{ key: "a", text: "23" }, { key: "b", text: "40" }, { key: "c", text: "55" }, { key: "d", text: "100" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "Numărul care reprezintă 10% din 300 este egal cu:",
      options: [{ key: "a", text: "3" }, { key: "b", text: "9" }, { key: "c", text: "27" }, { key: "d", text: "30" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Cel mai mic multiplu comun",
      content: "Cel mai mic multiplu comun al numerelor 20 și 24 este egal cu:",
      options: [{ key: "a", text: "4" }, { key: "b", text: "60" }, { key: "c", text: "120" }, { key: "d", text: "480" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea numerelor raționale",
      content: "Cel mai mare număr din mulțimea A = {33/10, 5/2, 3/5, 3} este:",
      options: [{ key: "a", text: "33/10" }, { key: "b", text: "3" }, { key: "c", text: "5/2" }, { key: "d", text: "3/5" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Media aritmetică",
      content: "Media aritmetică a numerelor 4√3, 5√3 și −3√3 este egală cu:",
      options: [{ key: "a", text: "2√3" }, { key: "b", text: "3√3" }, { key: "c", text: "4√3" }, { key: "d", text: "6√6" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Probleme cu vârste",
      content: "Suma dintre vârsta Anei și vârsta lui Matei este de 15 ani. Afirmația „Peste 3 ani suma vârstelor Anei și a lui Matei va fi egală cu 18 ani.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente coliniare congruente",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele coliniare A, B, C, D (în această ordine) pe o dreaptă orizontală, cu AB = BC = CD (segmente congruente).",
      content: "În figura alăturată, A, B, C și D sunt puncte coliniare, în această ordine, astfel încât AB = BC = CD. Valoarea raportului BD/AC este egală cu:",
      options: [{ key: "a", text: "0,25" }, { key: "b", text: "0,5" }, { key: "c", text: "0,75" }, { key: "d", text: "1" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiul AOB de 120° cu vârful O (în dreapta); semidreptele OA (sus), OC și OD în interior, OB (jos); OD este bisectoarea unghiului AOB, iar OC este în interiorul unghiului AOD.",
      content: "În figura alăturată este reprezentat unghiul AOB cu măsura de 120°. Semidreapta OD este bisectoarea unghiului AOB. Semidreapta OC este situată în interiorul unghiului AOD, astfel încât măsura unghiului AOD este de două ori mai mare decât măsura unghiului AOC. Măsura unghiului COB este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "120°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi isoscel. Perimetru",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC cu AB=AC (A sus, B jos-stânga, C jos-dreapta); M mijlocul lui BC, segmentul AM (mediană/înălțime); BC=6 cm, AM=4 cm.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu AB = AC și BC = 6 cm. Punctul M este mijlocul segmentului BC și AM = 4 cm. Perimetrul triunghiului ABC este egal cu:",
      options: [{ key: "a", text: "10 cm" }, { key: "b", text: "12 cm" }, { key: "c", text: "16 cm" }, { key: "d", text: "18 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Dreptunghi. Aria unui triunghi",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Dreptunghiul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta); P pe latura DC cu DP=3·PC; triunghiul PBC evidențiat. Aria dreptunghiului = 24 cm².",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD cu aria de 24 cm². Punctul P aparține laturii CD, astfel încât DP = 3·PC. Aria triunghiului PBC este egală cu:",
      options: [{ key: "a", text: "12 cm²" }, { key: "b", text: "8 cm²" }, { key: "c", text: "6 cm²" }, { key: "d", text: "3 cm²" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Cerc. Lungime și diametru",
      content: "Lungimea unui cerc este egală cu 24π cm. Diametrul cercului este egal cu:",
      options: [{ key: "a", text: "24 cm" }, { key: "b", text: "18 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "6 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Tetraedru regulat. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Tetraedrul regulat VABC (V sus, A jos-stânga, B jos, C jos-dreapta); M mijlocul muchiei AC, N mijlocul muchiei BC.",
      content: "În figura alăturată este reprezentat tetraedrul regulat VABC. Punctele M și N sunt mijloacele muchiilor AC, respectiv BC. Măsura unghiului dreptelor MN și VA este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "90°" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Procente. Ecuații",
      finalAnswer: "70",
      content: "Pentru a viziona un spectacol de teatru împreună cu familia, Ana cumpără trei bilete pentru adulți și șase bilete pentru copii, plătind în total suma de 420 de lei. Prețul unui bilet pentru copii reprezintă 50% din prețul unui bilet pentru adulți.\na) Este posibil ca prețul unui bilet pentru copii să fie 25 de lei? Justifică răspunsul dat.\nb) Determină prețul biletului pentru un adult.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă prețul unui bilet pentru copii este 25 de lei, atunci prețul unui bilet pentru adulți este 50 de lei. Dar 3·50 + 6·25 = 300 de lei; cum 300 ≠ 420, nu este posibil ca prețul unui bilet pentru copii să fie 25 de lei." },
        { label: "b)", points: 3, answer: "Notăm cu x prețul unui bilet pentru adulți, deci prețul unui bilet pentru copii este x/2. Din 3x + 6·(x/2) = 420 rezultă 6x = 420, deci x = 70 de lei (prețul biletului pentru un adult)." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = (x + 2)² − (x − 2)², unde x este număr real.\na) Arată că E(x) = 8x, pentru orice număr real x.\nb) Demonstrează că numărul natural A = E(n²) + E(n) este multiplu al lui 16, pentru orice număr natural n.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = (x+2)² − (x−2)² = (x²+4x+4) − (x²−4x+4) = 8x, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "A = E(n²) + E(n) = 8n² + 8n = 8n(n+1). Produsul n(n+1) este par (numere naturale consecutive), deci 8n(n+1) este multiplu al lui 16, pentru orice număr natural n." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Grafic. Inecuații",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy (gol, pentru reprezentarea graficului funcției f(x)=x−4).",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x − 4.\na) Reprezintă grafic funcția f în sistemul de axe ortogonale xOy din figura alăturată.\nb) Determină mulțimea soluțiilor inecuației 1 − f(a) ≤ f(4), unde a este număr real.",
      rubric: [
        { label: "a)", points: 2, answer: "Se determină două puncte ale graficului, de exemplu A(0, −4) și B(4, 0), apoi se trasează dreapta care le conține (graficul funcției f)." },
        { label: "b)", points: 3, answer: "f(4) = 0. Din 1 − f(a) ≤ f(4) rezultă 1 − (a − 4) ≤ 0, adică 5 − a ≤ 0, deci a ≥ 5. Mulțimea soluțiilor inecuației este [5, ∞)." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi echilateral. Simetrie",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghiul echilateral ABC (A sus-stânga, B jos-stânga, C jos-dreapta) cu AB=12 cm; S mijlocul lui BC, D simetricul lui B față de AC (sus-dreapta), Q intersecția dreptelor DS și AC.",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC cu AB = 12 cm. Punctul S este mijlocul segmentului BC, punctul D este simetricul punctului B față de AC, iar Q este punctul de intersecție a dreptelor DS și AC.\na) Arată că perimetrul triunghiului ABC este egal cu 36 cm.\nb) Determină lungimea segmentului DQ.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiul ABC fiind echilateral, P(ABC) = 3·AB = 3·12 = 36 cm." },
        { label: "b)", points: 3, answer: "AS este mediană în triunghiul echilateral ABC, deci și înălțime, AS = 6√3 cm. Cum D este simetricul lui B față de AC, ABCD este paralelogram (BD ⊥ AC, O = AC ∩ BD mijloc comun), deci AS ⊥ AD și SD = 6√7 cm. Din SC∥AD, ΔQSC ~ ΔQDA cu SC/DA = SQ/QD, se obține DQ = 4√7 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Trigonometrie. Linie mijlocie",
      hasFigure: true, figureUrl: FIG("s3-5"), finalAnswer: "2,5",
      figureNote: "Dreptunghiul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta) cu AB=20 cm, AD=15 cm; diagonalele AC și BD se intersectează în O; E și F pe latura DC (D, E, F, C) cu DE=FC=5 cm; I intersecția dreptelor BE și AF.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD cu AB = 20 cm și AD = 15 cm. Dreptele AC și BD se intersectează în punctul O, iar punctele E și F se află pe latura CD, astfel încât DE = FC = 5 cm.\na) Arată că sinusul unghiului ABD este egal cu 3/5.\nb) Calculează lungimea segmentului OI, unde I este punctul de intersecție a dreptelor BE și AF.",
      rubric: [
        { label: "a)", points: 2, answer: "În triunghiul ABD dreptunghic în A, BD = √(AB² + AD²) = √(400 + 225) = 25 cm. Atunci sin(∢ABD) = AD/BD = 15/25 = 3/5." },
        { label: "b)", points: 3, answer: "DF = EC = 15 cm, deci triunghiurile ADF și BCE sunt dreptunghice isoscele, de unde ∢IFE = ∢IEF = 45° și triunghiul EIF este dreptunghic isoscel. Fie S mijlocul lui CD (și al lui EF); OS este linie mijlocie în triunghiul DBC, OS = BC/2 = 7,5 cm, iar IS este mediană în triunghiul dreptunghic EIF, IS = EF/2 = 5 cm. Cum O, I, S sunt coliniare și OS = OI + IS, obținem OI = 2,5 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s3-6"), finalAnswer: "90",
      figureNote: "Cubul ABCDA'B'C'D' (baza inferioară ABCD, baza superioară A'B'C'D'); diagonala AC' = 6√3 cm; O = AD' ∩ A'D (centrul feței ADD'A').",
      content: "Se consideră cubul ABCDA'B'C'D' cu lungimea diagonalei AC' de 6√3 cm.\na) Arată că aria laterală a cubului ABCDA'B'C'D' este egală cu 144 cm².\nb) Determină măsura unghiului dreptelor B'C și OB, unde {O} = AD' ∩ A'D.",
      rubric: [
        { label: "a)", points: 2, answer: "Diagonala cubului AC' = AB·√3 = 6√3 cm, deci AB = 6 cm. Aria laterală a cubului = 4·AB² = 4·36 = 144 cm²." },
        { label: "b)", points: 3, answer: "Patrulaterul A'B'CD este paralelogram, deci CB'∥DA', de unde ∢(B'C, OB) = ∢(DA', OB) = ∢BOD. Cum BA ⊥ (ADD'A'), AO ⊥ DA' și AO, DA' ⊂ (ADD'A') cu AO ∩ DA' = {O}, rezultă OB ⊥ OD, deci măsura unghiului dreptelor B'C și OB este egală cu 90°." },
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
  console.log(`\n=== import-exam-mate-2022-test-03 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
