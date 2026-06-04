#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-05.mjs — Exam-Bank, CNCE training Test 5 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 5.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1c 2a 3b 4d 5a 6b · II = 1d 2c 3a 4c 5b 6c
 * Figures: 9 PNG (en-viii-2021-mate-test-05-s{2,3}-{label}.png) — S2-1..6 + S3-4,5,6 (via 4uPDF).
 *   finalAnswer: III.1=108 (singurul scalar calculat — „Determină numărul de pagini").
 *   SKIP: III.2 (inecuație S=[2,∞)), III.3 (a=16/15 / raport 16 dat), III.4 (raport 3),
 *   III.5 (AM=8 dat + inegalitate), III.6 (demonstrații).
 *   NB rubric III.2 = a)3p / b)2p (invers față de tipar).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-05-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 5 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-05", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 2 + 3 · (4 + 5) este egal cu:",
      options: [{ key: "a", text: "19" }, { key: "b", text: "20" }, { key: "c", text: "29" }, { key: "d", text: "45" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte. Calcul algebric",
      content: "Știind că x/2 = y/3, atunci rezultatul calculului 3x − 2y este egal cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "1" }, { key: "c", text: "5" }, { key: "d", text: "12" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Intervale. Numere întregi",
      content: "Suma numerelor întregi negative din intervalul (−5; 4] este egală cu:",
      options: [{ key: "a", text: "−15" }, { key: "b", text: "−10" }, { key: "c", text: "0" }, { key: "d", text: "10" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea fracțiilor",
      content: "Dintre numerele 2018/2019, 2019/2020, 2020/2021 și 2021/2022, cel mai mare este:",
      options: [{ key: "a", text: "2018/2019" }, { key: "b", text: "2019/2020" }, { key: "c", text: "2020/2021" }, { key: "d", text: "2021/2022" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Media geometrică",
      content: "Patru elevi au calculat media geometrică a numerelor 4√2 și 2√2 și au obținut rezultatele înregistrate în tabelul de mai jos:\n• Ana — 4\n• Andrei — 3√2\n• Anca — 8\n• Alin — 16\nDintre cei patru elevi, cel care a calculat corect media geometrică este:",
      options: [{ key: "a", text: "Ana" }, { key: "b", text: "Andrei" }, { key: "c", text: "Anca" }, { key: "d", text: "Alin" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Probleme cu vârste",
      content: "Ana are 14 ani, iar fratele ei are 10 ani. Ana afirmă că: „Peste trei ani, suma dintre vârsta mea și a fratelui meu va fi egală cu 27 de ani”. Afirmația Anei este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea (cu figură) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Linie mijlocie. Proiecții",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Triunghiul ABC dreptunghic în A; D, E, F mijloacele laturilor AB, BC, respectiv AC.",
      content: "În figura alăturată este reprezentat un triunghi ABC dreptunghic în A, iar punctele D, E și F sunt mijloacele laturilor AB, BC, respectiv AC. Proiecția punctului E pe AC este punctul:",
      options: [{ key: "a", text: "A" }, { key: "b", text: "C" }, { key: "c", text: "D" }, { key: "d", text: "F" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte paralele. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Dreptele paralele a și b intersectate de secanta d; sunt marcate un unghi de 35° (la dreapta a) și unghiul (2x + 5)° (la b).",
      content: "În figura alăturată, dreptele paralele a și b sunt intersectate de secanta d, fiind evidențiate măsurile a două unghiuri: de 35° și de (2x + 5)°. Valoarea lui x este de:",
      options: [{ key: "a", text: "15°" }, { key: "b", text: "25°" }, { key: "c", text: "70°" }, { key: "d", text: "75°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Distanța de la un punct la o dreaptă",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC (B jos-stânga, A jos-dreapta, C sus); D pe dreapta BC, piciorul perpendicularei din A.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu ∢ABC = 60° și ∢BAC = 40°. Punctul D aparține dreptei BC, astfel încât distanța dintre punctul A și punctul D să fie minimă. Măsura unghiului DAC este de:",
      options: [{ key: "a", text: "10°" }, { key: "b", text: "30°" }, { key: "c", text: "80°" }, { key: "d", text: "90°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Pătrat. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Pătratul ABCD (A sus-stânga, B sus-dreapta, D jos-stânga, C jos-dreapta); M pe latura DC; trasat triunghiul BMC.",
      content: "În figura alăturată este reprezentată schița unei foi de tablă în formă de pătrat ABCD, cu AB = 2 m. Un tinichigiu vrea să taie din tablă o bucată în forma triunghiului BMC, unde punctul M aparține dreptei DC, astfel încât aria triunghiului BMC să fie un sfert din aria pătratului ABCD. Lungimea segmentului CM este egală cu:",
      options: [{ key: "a", text: "0,25 m" }, { key: "b", text: "0,5 m" }, { key: "c", text: "1 m" }, { key: "d", text: "1,5 m" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Triunghi dreptunghic",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul mare de centru B și cercul mic de centru C (interior), cu A, B, C, D coliniare; E pe cercul mic, cu CE ⊥ AE.",
      content: "În figura alăturată, BD este raza cercului mare de centru B, CD = 2 cm este raza cercului mic de centru C, punctele A, B, C, D sunt coliniare și punctul E aparține cercului mic, astfel încât dreapta CE este perpendiculară pe dreapta AE. Distanța dintre punctele A și E este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "4√2 cm" }, { key: "c", text: "4√3 cm" }, { key: "d", text: "6 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Volum",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cutie în formă de cub (cele 12 muchii), în reprezentare standard. (NB: enunțul oficial numește cubul ABCDEFGH, iar figura folosește etichetarea cu prim — inconsecvență preluată ca atare din sursa CNCE.)",
      content: "În figura alăturată este reprezentată o cutie în formă de cub ABCDEFGH care are suma lungimilor tuturor muchiilor egală cu 60 cm. Volumul cutiei este egal cu:",
      options: [{ key: "a", text: "25 cm³" }, { key: "b", text: "100 cm³" }, { key: "c", text: "125 cm³" }, { key: "d", text: "150 cm³" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Fracții. Probleme",
      finalAnswer: "108",
      content: "Radu a citit în prima zi 1/4 din cartea pe care a primit-o de ziua lui de la Andreea. A doua zi citește 27 de pagini și constată că a citit jumătate din paginile cărții.\na) Este posibil să aibă 100 de pagini cartea pe care a primit-o Radu de ziua lui de la Andreea? Justifică răspunsul dat.\nb) Determină numărul de pagini din cartea lui Radu.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă ar avea 100 de pagini: 1/4 · 100 = 25 de pagini citite în prima zi, deci 25 + 27 = 52 de pagini în primele două zile, rămânând 48. Cum 48 nu reprezintă jumătatea lui 100, nu este posibil ca aceasta să aibă 100 de pagini." },
        { label: "b)", points: 3, answer: "x/4 + 27 = x/2, unde x este numărul de pagini; rezultă 27 = x/2 − x/4 = x/4, deci x = 108 de pagini." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Inecuații",
      content: "Se consideră expresia E(x) = (x − 1)² − (x − 2)² + (1 − x)² − (2 − x)², unde x este număr real.\na) Arată că E(x) = 4x − 6, pentru orice număr real x.\nb) Rezolvă în mulțimea numerelor reale inecuația 2 − E(x) ≤ 0.",
      rubric: [
        { label: "a)", points: 3, answer: "Cum (1 − x)² = (x − 1)² și (2 − x)² = (x − 2)², avem E(x) = 2[(x − 1)² − (x − 2)²] = 2(2x − 3) = 4x − 6, pentru orice număr real x." },
        { label: "b)", points: 2, answer: "2 − E(x) ≤ 0 ⇔ 2 − (4x − 6) ≤ 0 ⇔ −4x + 8 ≤ 0 ⇔ x ≥ 2; mulțimea soluțiilor este S = [2, +∞)." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Operații cu fracții",
      content: "Se consideră numerele reale a = (1/3 + 1/5) : (1/2) și b = (1/2) · (1/3 − 1/5).\na) Arată că a = 16/15.\nb) Arată că numărul a este de 16 ori mai mare decât numărul b.",
      rubric: [
        { label: "a)", points: 2, answer: "a = (1/3 + 1/5) : 1/2 = (8/15) · 2 = 16/15." },
        { label: "b)", points: 3, answer: "b = 1/2 · (1/3 − 1/5) = 1/2 · 2/15 = 1/15; cum a, b > 0 și a = 16/15 = 16 · (1/15) = 16b, rezultă că a este de 16 ori mai mare decât b." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Arii",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Dreptunghiul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta); E mijlocul lui AB, F mijlocul lui CD, M mijlocul segmentului CE.",
      content: "În figura alăturată este reprezentată schița unui teren agricol în formă de dreptunghi ABCD cu AB = 600 m și AD = 400 m. Punctul E este mijlocul laturii AB, punctul F este mijlocul laturii CD și punctul M este mijlocul segmentului CE.\na) Arată că perimetrul dreptunghiului ABCD este egal cu 2000 m.\nb) Arată că aria patrulaterului AEMF este de trei ori mai mare decât aria triunghiului CFM.",
      rubric: [
        { label: "a)", points: 2, answer: "P(ABCD) = 2(AB + AD) = 2(600 + 400) = 2000 m." },
        { label: "b)", points: 3, answer: "AECF este paralelogram, deci A(AEF) = A(CFE); M fiind mijlocul lui CE, A(EMF) = A(CFM) = (1/2)·A(CFE). Cum A(AEMF) = A(AEF) + A(EMF) = 2·A(CFM) + A(CFM), rezultă A(AEMF) = 3·A(CFM)." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Relații metrice",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A; M proiecția lui A pe ipotenuza BC.",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în A, iar punctul M este proiecția punctului A pe BC. Lungimea segmentului BM este de 16 cm, iar lungimea segmentului CM este de 4 cm.\na) Arată că AM = 8 cm.\nb) Demonstrează că perimetrul triunghiului ABC este mai mare decât 44 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔABC dreptunghic în A, AM ⊥ BC ⇒ AM = √(CM · MB) = √(4 · 16) = 8 cm." },
        { label: "b)", points: 3, answer: "BC = BM + MC = 20 cm; AC = √(CM · CB) = 4√5 cm, AB = √(BM · BC) = 8√5 cm; P(ABC) = (12√5 + 20) cm și, cum 12√5 > 24 (⇔ √5 > 2), perimetrul triunghiului ABC este mai mare decât 44 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Prismă. Perpendicularitate și paralelism",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Prisma dreaptă ABCDA′B′C′D′ cu baza pătrat ABCD; O intersecția diagonalelor bazei (AC ∩ BD).",
      content: "În figura alăturată este reprezentată o prismă dreaptă ABCDA′B′C′D′ cu baza pătratul ABCD. Punctul O este intersecția dreptelor AC și BD, AB = 8 cm și AA′ = 8√2 cm.\na) Demonstrează că dreptele A′C și AC′ sunt perpendiculare.\nb) Demonstrează că dreapta OB′ este paralelă cu planul (A′C′D).",
      rubric: [
        { label: "a)", points: 2, answer: "AC = AB√2 = 8√2 cm = AA′; ACC′A′ este dreptunghi cu AC = AA′, deci este pătrat, de unde diagonalele A′C și AC′ sunt perpendiculare." },
        { label: "b)", points: 3, answer: "Fie {O′} = A′C′ ∩ B′D′; B′O′ = DO și B′O′ ∥ DO, deci DOB′O′ este paralelogram ⇒ OB′ ∥ DO′; cum DO′ ⊂ (A′C′D) și OB′ ⊄ (A′C′D), rezultă OB′ ∥ (A′C′D)." },
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
  console.log(`\n=== import-exam-mate-2021-test-05 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
