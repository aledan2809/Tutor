#!/usr/bin/env node
/**
 * import-exam-mate-2022-test-02.mjs — Exam-Bank, CNCE training Test 2 (Matematică, EN VIII 2021–2022)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2021–2022, Test de antrenament nr. 2.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1b 2a 3c 4d 5b 6b · II = 1d 2c 3a 4c 5a 6d
 * NB: SI 1-6 text/tabele fără figură → 6 autoGradable. SII 1-6 toate cu figură. SIII.3 (grafic),
 *     4 (dreptunghi), 5 (triunghi), 6 (piramidă) cu figură. Deci 10 figuri (s2-1..6 + s3-3,4,5,6). Via 4uPDF.
 * finalAnswer: III.1="92" (n max 2 cifre), III.6="18/5" (d(Q,(VAD))). SKIP: III.2 (a∈{0,1} multi-valoare),
 *   III.3 (4√5/5 radical), III.4 (√73/6 radical), III.5 (demonstrație inegalitate).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2022-mate-test-02-${s}.png`;

const MATH = {
  source: "EN VIII 2022 Testul 2 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2022, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-02", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2022/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Împărțirea cu rest",
      content: "Câtul împărțirii cu rest a numărului natural 35 la numărul natural 15 este egal cu:",
      options: [{ key: "a", text: "1" }, { key: "b", text: "2" }, { key: "c", text: "3" }, { key: "d", text: "5" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Fracție dintr-un număr",
      content: "Numărul care reprezintă 1/4 din 60 este egal cu:",
      options: [{ key: "a", text: "15" }, { key: "b", text: "60" }, { key: "c", text: "120" }, { key: "d", text: "240" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi. Intervale",
      content: "Suma numerelor întregi negative din intervalul (−4; 5] este egală cu:",
      options: [{ key: "a", text: "9" }, { key: "b", text: "5" }, { key: "c", text: "−6" }, { key: "d", text: "−10" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Ordonarea numerelor reale",
      content: "Dintre următoarele seturi de numere, cel scris în ordine crescătoare este:",
      options: [{ key: "a", text: "8,(5); 8,55; 17/2; 161/20" }, { key: "b", text: "8,55; 8,(5); 17/2; 161/20" }, { key: "c", text: "161/20; 8,(5); 8,55; 17/2" }, { key: "d", text: "161/20; 17/2; 8,55; 8,(5)" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Produsul a doi conjugați",
      content: "Patru elevi, Aurel, Călin, Dragoș și Victor, calculează produsul numerelor reale a = 2√7 − 5 și b = 2√7 + 5 și obțin rezultatele înregistrate în tabelul următor:\n\nDragoș | Călin | Aurel | Victor\n√3 | 3 | 2√7 | 9\n\nConform informațiilor din tabel, dintre cei patru elevi, cel care a calculat corect produsul numerelor este:",
      options: [{ key: "a", text: "Dragoș" }, { key: "b", text: "Călin" }, { key: "c", text: "Aurel" }, { key: "d", text: "Victor" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Viteză, distanță, timp",
      content: "Un pieton se deplasează cu viteza de 6 km pe oră. Afirmația: „Pietonul, păstrând constantă viteza de deplasare, a parcurs 10 km în 60 de minute.”, este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente coliniare",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele coliniare A, B, C, D, E (în această ordine) pe o dreaptă orizontală; AB=2 cm, BD=7 cm, CD=4 cm, CE=9 cm.",
      content: "În figura alăturată, punctele A, B, C, D și E sunt coliniare, în această ordine, astfel încât AB = 2 cm, BD = 7 cm, CD = 4 cm și CE = 9 cm. Lungimea segmentului AE este egală cu:",
      options: [{ key: "a", text: "5 cm" }, { key: "b", text: "9 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "14 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte paralele tăiate de secantă",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Dreptele paralele a (sus) și b (jos) intersectate de secanta d; unghiul 2x+35° la intersecția superioară, unghiul 55° la intersecția inferioară (unghiuri interne de aceeași parte a secantei).",
      content: "În figura alăturată, dreptele paralele a și b sunt intersectate de secanta d, fiind evidențiate măsurile a două unghiuri de 55° și respectiv 2x + 35°. Valoarea lui x este de:",
      options: [{ key: "a", text: "10°" }, { key: "b", text: "20°" }, { key: "c", text: "45°" }, { key: "d", text: "50°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi isoscel. Arie",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul isoscel ABC de bază BC (A sus, B jos-stânga, C jos-dreapta); ∢B=75°, AB=4 cm.",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC de bază BC. Unghiul B are măsura de 75° și AB = 4 cm. Aria triunghiului ABC este egală cu:",
      options: [{ key: "a", text: "4 cm²" }, { key: "b", text: "4√3 cm²" }, { key: "c", text: "8 cm²" }, { key: "d", text: "16 cm²" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Romb. Perimetrul unui triunghi",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Rombul ABCD (A sus, B stânga, C jos, D dreapta) cu diagonala BD orizontală; ∢ABC=120°, BD=4 cm.",
      content: "În figura alăturată este reprezentat rombul ABCD cu măsura unghiului ABC de 120° și lungimea segmentului BD egală cu 4 cm. Perimetrul triunghiului ABD este egal cu:",
      options: [{ key: "a", text: "16 cm" }, { key: "b", text: "8√3 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "4√3 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi înscris în cerc. Unghi la centru",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu triunghiul isoscel ABC de bază BC înscris (A sus, B jos-stânga, C jos-dreapta); ∢AOC=140°.",
      content: "În figura alăturată, punctele A, B și C sunt vârfurile unui triunghi isoscel de bază BC, înscris în cercul de centru O, iar măsura unghiului AOC este egală cu 140°. Măsura unghiului BAC este egală cu:",
      options: [{ key: "a", text: "40°" }, { key: "b", text: "70°" }, { key: "c", text: "80°" }, { key: "d", text: "140°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelipiped dreptunghic. Diagonala",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Paralelipipedul dreptunghic ABCDA'B'C'D' (baza inferioară ABCD, baza superioară A'B'C'D'); AB=4 dm, BC=3 dm, AA'=5 dm.",
      content: "Diagonala paralelipipedului dreptunghic ABCDA'B'C'D', cu AB = 4 dm, BC = 3 dm și înălțimea AA' = 5 dm, este egală cu:",
      options: [{ key: "a", text: "5 dm" }, { key: "b", text: "√34 dm" }, { key: "c", text: "√41 dm" }, { key: "d", text: "5√2 dm" }], correctAnswer: "d" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Împărțire cu rest. Multiplu comun",
      finalAnswer: "92",
      content: "Ionel împarte pe rând numărul natural n la 3, 9 respectiv 15 și obține de fiecare dată restul 2.\na) Este posibil ca numărul natural n să fie egal cu 38? Justifică răspunsul dat.\nb) Determină cel mai mare număr natural n de două cifre, care îndeplinește condițiile din enunț.",
      rubric: [
        { label: "a)", points: 2, answer: "38 = 15·2 + 8, iar restul împărțirii lui 38 la 15 este 8. Cum 8 ≠ 2, deducem că nu este posibil ca numărul natural n să fie egal cu 38." },
        { label: "b)", points: 3, answer: "Din condiții, n = 3·c₁ + 2 = 9·c₂ + 2 = 15·c₃ + 2 (c₁, c₂, c₃ numere naturale), deci n − 2 este multiplu comun al numerelor 3, 9 și 15. Cel mai mic multiplu comun al lor este 45, deci n − 2 este multiplu de 45. Cel mai mare n de două cifre se obține pentru n − 2 = 90, deci n = 92." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Inecuații",
      content: "Se consideră expresia E(x) = (2x + 1)² + (2x − 1)² − 4(2x² + 3x), unde x este număr real.\na) Arată că E(x) = 2 − 12x, pentru orice număr real x.\nb) Determină numerele naturale a pentru care −10a + 2 − E(a) ≤ 2√3.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = (2x+1)² + (2x−1)² − 4(2x²+3x) = (4x²+4x+1) + (4x²−4x+1) − (8x²+12x) = 2 − 12x, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(a) = 2 − 12a, deci −10a + 2 − E(a) = −10a + 2 − (2 − 12a) = 2a. Din 2a ≤ 2√3 rezultă a ≤ √3 și, cum a este număr natural, obținem a = 0 sau a = 1." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Distanța de la origine la grafic",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistemul de axe ortogonale xOy cu graficul funcției f(x)=2x+4 (dreaptă crescătoare care intersectează axa Ox în A(−2,0) și axa Oy în B(0,4)).",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = 2x + 4.\na) Arată că f(−1/2) − f(1/2) = −2.\nb) Calculează distanța de la originea O(0,0) a sistemului de axe ortogonale xOy la reprezentarea grafică a funcției f.",
      rubric: [
        { label: "a)", points: 2, answer: "f(−1/2) = 2·(−1/2) + 4 = 3 și f(1/2) = 2·(1/2) + 4 = 5, deci f(−1/2) − f(1/2) = 3 − 5 = −2." },
        { label: "b)", points: 3, answer: "Graficul funcției f intersectează axele Ox și Oy în A(−2,0), respectiv B(0,4). AB = √(2² + 4²) = 2√5, deci distanța de la O la dreapta AB este d(O, AB) = (OA·OB)/AB = (2·4)/(2√5) = 4√5/5." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Centru de greutate",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Dreptunghiul ABCD (A sus-stânga, D sus-dreapta, B jos-stânga, C jos-dreapta) cu AB=4 cm, BC=3 cm; E mijlocul lui CD (latura dreaptă), F intersecția dreptelor BE și AC, P pe latura BC.",
      content: "În figura alăturată este reprezentat un dreptunghi ABCD cu AB = 4 cm și BC = 3 cm. Punctul E este mijlocul segmentului CD și F este punctul de intersecție a dreptelor BE și AC.\na) Arată că BE = √13 cm.\nb) Determină lungimea segmentului FP, unde P este punctul de intersecție a dreptelor DF și BC.",
      rubric: [
        { label: "a)", points: 2, answer: "E este mijlocul segmentului CD, deci CE = CD/2 = 2 cm. Triunghiul BCE este dreptunghic în C, deci BE = √(BC² + CE²) = √(9 + 4) = √13 cm." },
        { label: "b)", points: 3, answer: "ΔABF ~ ΔCEF cu BF/EF = AB/CE = 2, deci F este centrul de greutate al triunghiului BCD. Triunghiul PCD este dreptunghic în D, DP = √(DC² + CP²) = √73/2 cm. FP = (1/3)·DP = √73/6 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Distanțe la o dreaptă",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A (C sus, A jos-stânga, B jos-dreapta); M pe latura AB cu MB=2 cm; AC=8 cm, BC=10 cm.",
      content: "În figura alăturată este reprezentat triunghiul ABC, dreptunghic în A, în care AC = 8 cm și BC = 10 cm. Punctul M se află pe latura AB astfel încât MB = 2 cm.\na) Arată că AM = 4 cm.\nb) Arată că suma distanțelor de la punctele A și B la dreapta CM este mai mare decât 16/3 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiul ABC este dreptunghic în A, deci AB = √(BC² − AC²) = √(100 − 64) = 6 cm. Atunci AM = AB − MB = 6 − 2 = 4 cm." },
        { label: "b)", points: 3, answer: "Triunghiul AMC este dreptunghic în A, deci CM = √(AC² + AM²) = √(64 + 16) = 4√5 cm. A(ABC) = A(AMC) + A(MBC) = (CM/2)·(d(A,CM) + d(B,CM)) = 24 cm², deci d(A,CM) + d(B,CM) = 48/CM = 48/(4√5) = 12/√5. Cum CM = 4√5 = √80 < √81 = 9, rezultă 48/CM > 48/9 = 16/3, deci suma distanțelor este mai mare decât 16/3 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă patrulateră. Distanță punct-plan",
      hasFigure: true, figureUrl: FIG("s3-6"), finalAnswer: "18/5",
      figureNote: "Piramida patrulateră VABCD cu baza pătratul ABCD (A față-stânga, B față-dreapta, C dreapta, D stânga), V vârful; O intersecția diagonalelor AC și BD; AB=6 cm, VO=4 cm.",
      content: "În figura alăturată este reprezentată o piramidă patrulateră VABCD cu baza pătratul ABCD, AB = 6 cm. Înălțimea VO a piramidei are lungimea egală cu 4 cm, unde O este punctul de intersecție a dreptelor AC și BD.\na) Arată că aria laterală a piramidei VABCD este egală cu 60 cm².\nb) Calculează distanța de la punctul Q la planul (VAD), unde Q este mijlocul segmentului OC.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie M mijlocul segmentului AD; OM = AB/2 = 3 cm. Triunghiul VOM este dreptunghic în O, deci apotema VM = √(OM² + VO²) = √(9 + 16) = 5 cm. Aria laterală = (P_bază · VM)/2 = (24 · 5)/2 = 60 cm²." },
        { label: "b)", points: 3, answer: "OS ⊥ VM (S ∈ VM); cum VM ⊥ AD și OM ⊥ AD cu VM ∩ OM = {M}, rezultă AD ⊥ (VOM), deci OS ⊥ AD și, cum VM, AD ⊂ (VAD), OS ⊥ (VAD). Fie QT ⊥ (VAD), T ∈ (VAD); atunci A, S, T coliniare și OS∥QT. Din ΔAOS ~ ΔAQT, OS/QT = AO/AQ = 2/3, iar OS = (VO·OM)/VM = (4·3)/5 = 12/5 cm, deci QT = (3/2)·OS = 18/5 cm = d(Q, (VAD))." },
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
  console.log(`\n=== import-exam-mate-2022-test-02 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
