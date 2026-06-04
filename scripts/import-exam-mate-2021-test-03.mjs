#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-03.mjs — Exam-Bank, CNCE training Test 3 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 3.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1a 2a 3d 4d 5b 6b · II = 1a 2a 3c 4d 5a 6d
 * Figures: 9 PNG (en-viii-2021-mate-test-03-s{2,3}-{label}.png) — S2-1..6 + S3-4,5,6.
 *   Rendered via the 4uPDF backend /api/extract-region (Pro hi-DPI region render).
 *   finalAnswer: III.1=144, III.3=5, III.6=12 (III.2/III.5 demonstrații, III.4 radical 18√3
 *   → fără finalAnswer per policy: doar scalari curați).
 *
 * NB barem/subiect point-label discrepancy on III.1: subiectul tipărește (3p) a) / (2p) b),
 *   dar baremul punctează a)=2p / b)=3p. Rubricul urmează BAREMUL (autoritatea de notare).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-03-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 3 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-03", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I (6 × MCQ ×5p, fără figură) ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Divizibilitate",
      content: "Dintre numerele 12, 13, 14 și 15, numărul divizibil cu 6 este:",
      options: [{ key: "a", text: "12" }, { key: "b", text: "13" }, { key: "c", text: "14" }, { key: "d", text: "15" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte și proporții",
      content: "Dacă a/4 = 5/b, b ≠ 0, atunci valoarea produsului a · b este:",
      options: [{ key: "a", text: "20" }, { key: "b", text: "9" }, { key: "c", text: "5/4" }, { key: "d", text: "4/5" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Luni, temperatura înregistrată la ora 10 la o stație meteo a fost de −3°C, iar marți, la aceeași oră, au fost înregistrate 3°C. Temperatura înregistrată marți este mai mare decât temperatura înregistrată luni cu:",
      options: [{ key: "a", text: "−3°C" }, { key: "b", text: "0°C" }, { key: "c", text: "3°C" }, { key: "d", text: "6°C" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea fracțiilor",
      content: "Dintre numerele 1/2, 2/3, 3/4 și 4/5, cel mai mare este:",
      options: [{ key: "a", text: "1/2" }, { key: "b", text: "2/3" }, { key: "c", text: "3/4" }, { key: "d", text: "4/5" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Operații cu radicali",
      content: "Patru elevi — Lara, Patrick, Tudor și Sofia — au calculat produsul numerelor (−4√2) și (8√2). Rezultatele obținute sunt prezentate în tabelul de mai jos:\n• Lara — −128\n• Patrick — −64\n• Tudor — 64\n• Sofia — 128\nDintre cei patru elevi, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Lara" }, { key: "b", text: "Patrick" }, { key: "c", text: "Tudor" }, { key: "d", text: "Sofia" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Intervale de numere reale",
      content: "Se consideră intervalele A = (−1, 5) și B = [2, 9]. Un număr care aparține mulțimii A ∩ B este:",
      options: [{ key: "a", text: "−1" }, { key: "b", text: "2" }, { key: "c", text: "5" }, { key: "d", text: "9" }], correctAnswer: "b" },
    // ── Subiectul al II-lea (6 × MCQ ×5p, cu figură) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Geometrie analitică. Mediatoarea",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Sistem de axe ortogonale xOy; punctele A(1,1) și B(1,3) marcate, B deasupra lui A pe verticala x = 1.",
      content: "Se consideră punctele A(1,1) și B(1,3), reprezentate într-un sistem de axe ortogonale xOy. Coordonatele punctului de intersecție a mediatoarei segmentului AB cu axa Oy sunt:",
      options: [{ key: "a", text: "(0, 2)" }, { key: "b", text: "(2, 0)" }, { key: "c", text: "(1, 2)" }, { key: "d", text: "(2, 1)" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri opuse la vârf. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Două drepte care se intersectează în O, formând unghiurile opuse la vârf AOB (sus) și COD (jos); A, B sus, C, D jos.",
      content: "În figura alăturată, unghiurile AOB și COD sunt opuse la vârf. Măsura unghiului format de bisectoarele unghiurilor AOC și BOD este egală cu:",
      options: [{ key: "a", text: "180°" }, { key: "b", text: "90°" }, { key: "c", text: "89°" }, { key: "d", text: "0°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Centrul de greutate",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul dreptunghic ABC cu unghiul drept în A (A sus), B stânga-jos, C dreapta-jos; G centrul de greutate marcat în interior.",
      content: "Se consideră triunghiul dreptunghic ABC și punctul G, centrul de greutate al triunghiului. Dacă lungimea ipotenuzei BC este de 12 cm, atunci lungimea segmentului AG este egală cu:",
      options: [{ key: "a", text: "2 cm" }, { key: "b", text: "3 cm" }, { key: "c", text: "4 cm" }, { key: "d", text: "6 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Pătrat. Triunghi dreptunghic",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Pătratul ABCD (A sus-stânga, B sus-dreapta, D jos-stânga, C jos-mijloc) cu D, C, M coliniare pe orizontală; BD și BM trasate, perpendiculare.",
      content: "În figura alăturată este reprezentat un pătrat ABCD, cu AB = 6 cm. Dacă dreptele BD și BM sunt perpendiculare și punctele D, C și M sunt coliniare, atunci lungimea segmentului DM este egală cu:",
      options: [{ key: "a", text: "6 cm" }, { key: "b", text: "8 cm" }, { key: "c", text: "10 cm" }, { key: "d", text: "12 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghi înscris",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu diametrele AB și CD; A sus-stânga, C sus-dreapta, D jos-stânga, B jos-dreapta; arcul mic BD are 60°.",
      content: "În figura alăturată, AB și CD sunt diametre în cercul de centru O, iar măsura arcului mic BD este de 60°. Măsura unghiului CDA este de:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "120°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Arie totală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cubul ABCDEFGH în reprezentare standard (EFGH sus, ABCD jos); diagonala bazei EG trasată.",
      content: "În figura alăturată este reprezentat cubul ABCDEFGH. Diagonala bazei EG are lungimea egală cu 4√2 cm. Aria totală a cubului este egală cu:",
      options: [{ key: "a", text: "32 cm²" }, { key: "b", text: "48 cm²" }, { key: "c", text: "64 cm²" }, { key: "d", text: "96 cm²" }], correctAnswer: "d" },
    // ── Subiectul al III-lea (6 × OPEN ×5p) ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Fracții. Probleme practice",
      finalAnswer: "144",
      content: "Dina are o sumă de bani. În prima zi cheltuiește 3/4 din sumă, iar în a doua zi 1/3 din rest, adică 12 lei.\na) Ce sumă de bani mai are Dina după cele două zile?\nb) Determină suma de bani avută inițial de Dina.",
      rubric: [
        { label: "a)", points: 2, answer: "După prima zi rămâne 1/4 din sumă (restul). În a doua zi cheltuiește 1/3 din rest, deci suma rămasă reprezintă 2/3 din rest. Cum 1/3 din rest înseamnă 12 lei, suma rămasă este 2 · 12 = 24 lei." },
        { label: "b)", points: 3, answer: "Dacă x este suma inițială, atunci x = 3/4 · x + 36 (restul după prima zi este 3 · 12 = 36 lei); rezultă 1/4 · x = 36, deci x = 144 lei." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Formule de calcul",
      content: "Se consideră expresia E(x) = (3x − 1)² − 7(x + 1)(x − 2) − (x + 3)², unde x este număr real.\na) Arată că (x + 1)(x − 2) = x² − x − 2, pentru orice număr real x.\nb) Demonstrează că E(x) = (x − 2)(x − 3), pentru orice număr real x.",
      rubric: [
        { label: "a)", points: 2, answer: "(x + 1)(x − 2) = x² − 2x + x − 2 = x² − x − 2, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = 9x² − 6x + 1 − 7(x² − x − 2) − (x² + 6x + 9) = x² − 5x + 6 = x² − 2x − 3x + 6 = x(x − 2) − 3(x − 2) = (x − 2)(x − 3), pentru orice număr real x." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Radicali. Puteri",
      finalAnswer: "5",
      content: "Se consideră numerele reale x = (2/√12 + 9/√27 + 6/√108) · (1/√3)⁻¹ și y = (5⁶)³ · 25³ : 125⁸.\na) Arată că x = 5.\nb) Arată că produsul numerelor x și y este un număr natural prim.",
      rubric: [
        { label: "a)", points: 2, answer: "x = (2/(2√3) + 9/(3√3) + 6/(6√3)) · √3 = (1/√3 + 3/√3 + 1/√3) · √3 = (5/√3) · √3 = 5." },
        { label: "b)", points: 3, answer: "y = 5¹⁸ · (5²)³ : (5³)⁸ = 5^(18 + 6 − 24) = 5⁰ = 1; P = x · y = 5 · 1 = 5, care este număr natural prim." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Romb. Triunghi echilateral",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Rombul ABCD (A sus-stânga, D sus-dreapta, B jos-stânga, C jos), cu diagonalele AC și BD trasate.",
      content: "Se consideră rombul ABCD, cu AB = 18 cm și ∢ABC = 60°.\na) Arată că perimetrul rombului ABCD este egal cu 72 cm.\nb) Arată că lungimea diagonalei BD este egală cu 18√3 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "P(ABCD) = 4 · AB = 4 · 18 = 72 cm." },
        { label: "b)", points: 3, answer: "ABCD este romb, {O} = AC ∩ BD ⇒ BO ⊥ AC; triunghiul ABC este echilateral (AB = BC și ∢ABC = 60°), iar BO este înălțime ⇒ BO = 9√3 cm; O este mijlocul segmentului BD ⇒ BD = 2 · BO = 18√3 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Coliniaritate",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Dreptunghiul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta); E mijlocul laturii BC (pe latura din dreapta), F pe segmentul AE; trasate AE și BD.",
      content: "Se consideră dreptunghiul ABCD cu AB = 10√2 cm și BC = 20 cm. Punctul E este mijlocul laturii BC și punctul F este situat pe segmentul AE, astfel încât BF ⊥ AE.\na) Arată că aria dreptunghiului ABCD este egală cu 200√2 cm².\nb) Demonstrați că punctele B, F și D sunt coliniare.",
      rubric: [
        { label: "a)", points: 2, answer: "A(ABCD) = AB · BC = 10√2 · 20 = 200√2 cm²." },
        { label: "b)", points: 3, answer: "BE = BC/2 = 10 cm; ΔABE dreptunghic în B ⇒ AE = √(AB² + BE²) = √(200 + 100) = 10√3 cm; din BF ⊥ AE, BE² = EF · AE ⇒ EF = 10√3/3 cm = (1/3) · AE, deci F este centrul de greutate al triunghiului ABC; BO este mediană în triunghiul ABC, unde {O} = AC ∩ BD, deci F ∈ BO, de unde rezultă că punctele B, F și D sunt coliniare." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Paralelipiped dreptunghic. Distanțe",
      hasFigure: true, figureUrl: FIG("s3-6"),
      finalAnswer: "12",
      content: "În figura alăturată este reprezentat paralelipipedul dreptunghic ABCDA′B′C′D′ cu AB = 12 cm, BC = 6 cm și AA′ = 6√2 cm. Punctul M este mijlocul muchiei CD.\na) Arată că aria triunghiului AMB este egală cu 36 cm².\nb) Determină distanța de la punctul A′ la dreapta MB.",
      figureNote: "Paralelipipedul dreptunghic ABCDA′B′C′D′ (A′B′C′D′ sus, ABCD jos); M mijlocul muchiei CD; trasate AM și MB.",
      rubric: [
        { label: "a)", points: 2, answer: "d(M, AB) = BC = 6 cm; A(AMB) = (AB · d(M, AB)) / 2 = (12 · 6) / 2 = 36 cm²." },
        { label: "b)", points: 3, answer: "AM = MB = 6√2 cm și AB = 12 cm ⇒ AM² + MB² = AB², deci ΔAMB este dreptunghic în M și BM ⊥ MA; AA′ ⊥ (ABC) ⇒ AA′ ⊥ MB, dar cum AA′, AM ⊂ (AA′M) și AA′ ∩ AM = {A} ⇒ MB ⊥ (AA′M) ⇒ MB ⊥ A′M; d(A′, MB) = A′M = √(AA′² + AM²) = √(72 + 72) = 12 cm." },
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
  console.log(`\n=== import-exam-mate-2021-test-03 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
