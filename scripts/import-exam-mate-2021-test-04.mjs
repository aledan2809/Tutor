#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-04.mjs — Exam-Bank, CNCE training Test 4 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 4.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1b 2c 3d 4d 5d 6b · II = 1b 2d 3b 4d 5c 6b
 * Figures: 9 PNG (en-viii-2021-mate-test-04-s{2,3}-{label}.png) — S2-1..6 + S3-4,5,6.
 *   Rendered via the 4uPDF backend /api/extract-region (Pro hi-DPI region render).
 *   finalAnswer: III.3=2, III.4=4 (doar rezultate calculate de elev: N=|y−x|=2, PC=4).
 *   SKIP: III.1 (n=31 tipărit în enunț — „arată că … este 31"), III.5 (4cm tipărit — „demonstrează că … = 4cm"),
 *   III.2 (demonstrație multiplu de 5, fără scalar), III.6 (24/5 — fracție pe care norm() nu o poate
 *   potrivi cu „4,8"). Policy: finalAnswer doar pentru scalari curați CALCULAȚI (nu valori date în enunț).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-04-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 4 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-04", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I (6 × MCQ ×5p, fără figură) ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Numere prime",
      content: "Dintre numerele 0, 2, 4 și 15, numărul prim este:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "2" }, { key: "c", text: "4" }, { key: "d", text: "15" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Interpretarea datelor. Fracții",
      content: "În tabelul de mai jos este prezentat numărul manualelor de matematică pentru gimnaziu, pe an de studiu, din biblioteca unei școli:\n• Mate_V — 280\n• Mate_VI — 200\n• Mate_VII — 250\n• Mate_VIII — 270\nTipul manualului care reprezintă un sfert din totalul manualelor de matematică pentru gimnaziu din biblioteca școlii este:",
      options: [{ key: "a", text: "Mate_V" }, { key: "b", text: "Mate_VI" }, { key: "c", text: "Mate_VII" }, { key: "d", text: "Mate_VIII" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "După o scumpire cu 20%, prețul unui produs a crescut cu 12 lei. Prețul inițial al produsului este:",
      options: [{ key: "a", text: "240 lei" }, { key: "b", text: "120 lei" }, { key: "c", text: "72 lei" }, { key: "d", text: "60 lei" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea puterilor",
      content: "Dintre numerele 1/2⁴, 1/2⁷, 1/2³ și 1/2⁸, cel mai mare este:",
      options: [{ key: "a", text: "1/2⁸" }, { key: "b", text: "1/2⁷" }, { key: "c", text: "1/2⁴" }, { key: "d", text: "1/2³" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Formule de calcul. Diferența de pătrate",
      content: "Patru elevi, Cătălin, Nicolae, Anastasia și Ana, au calculat suma numerelor a și b, știind că a² − b² = 12 și a − b = 4. Rezultatele obținute sunt prezentate în tabelul de mai jos:\n• Cătălin — 48\n• Nicolae — 16\n• Anastasia — 4\n• Ana — 3\nDintre cei patru elevi, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Cătălin" }, { key: "b", text: "Nicolae" }, { key: "c", text: "Anastasia" }, { key: "d", text: "Ana" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Intervale. Numere întregi",
      content: "Suma numerelor întregi din intervalul [−2, 3] este egală cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "3" }, { key: "c", text: "5" }, { key: "d", text: "9" }], correctAnswer: "b" },
    // ── Subiectul al II-lea (6 × MCQ ×5p, cu figură) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Patru puncte coliniare A, B, C, D (în această ordine) pe o dreaptă orizontală.",
      content: "În figura alăturată, punctele A, B, C și D, în această ordine, sunt coliniare. Dacă punctul B este mijlocul segmentului AC, punctul C este mijlocul segmentului AD și BC = 3 cm, atunci lungimea segmentului AD este egală cu:",
      options: [{ key: "a", text: "15 cm" }, { key: "b", text: "12 cm" }, { key: "c", text: "6 cm" }, { key: "d", text: "3 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri în jurul unui punct",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Trei semidrepte cu originea în O (către A sus, B dreapta-jos, C stânga-jos), formând unghiurile AOB, BOC și COA în jurul punctului O.",
      content: "În figura alăturată, unghiurile AOB, BOC și COA sunt unghiuri în jurul punctului O, măsura unghiului AOB este de 120° și măsura unghiului BOC este de 130°. Măsura unghiului AOC este de:",
      options: [{ key: "a", text: "140°" }, { key: "b", text: "130°" }, { key: "c", text: "120°" }, { key: "d", text: "110°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Mediana ipotenuzei",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul dreptunghic ABC (unghi drept în A, sus), B jos-stânga, C jos-dreapta; M mijlocul ipotenuzei BC.",
      content: "Se consideră triunghiul dreptunghic ABC, punctul M este mijlocul ipotenuzei BC, AB = 4 cm și măsura unghiului ACB este de 30°. Lungimea segmentului AM este egală cu:",
      options: [{ key: "a", text: "2 cm" }, { key: "b", text: "4 cm" }, { key: "c", text: "8 cm" }, { key: "d", text: "12 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelogram. Diagonale",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Paralelogramul ABCD (A sus-stânga, B sus-dreapta, D jos-stânga, C jos-dreapta) cu diagonalele AC și BD care se intersectează în O.",
      content: "În figura alăturată este reprezentat un paralelogram ABCD, punctul O este punctul de intersecție a dreptelor AC și BD, iar AO + DO = 8 cm. Suma lungimilor segmentelor AC și BD este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "8 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "16 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Lungimea cercului",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu diametrul orizontal AB (A stânga, B dreapta).",
      content: "În figura alăturată, AB este diametru în cercul de centru O, AB = 8 cm. Lungimea cercului este egală cu:",
      options: [{ key: "a", text: "64π cm" }, { key: "b", text: "16π cm" }, { key: "c", text: "8π cm" }, { key: "d", text: "4π cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cubul ABCDA′B′C′D′ (A′B′C′D′ sus, ABCD jos); trasate dreptele BC′ și DD′.",
      content: "În figura alăturată este reprezentat cubul ABCDA′B′C′D′. Măsura unghiului dintre dreptele BC′ și DD′ este de:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "90°" }], correctAnswer: "b" },
    // ── Subiectul al III-lea (6 × OPEN ×5p) ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Teorema împărțirii cu rest. C.m.m.m.c.",
      content: "Împărțind, pe rând, numărul natural n la 12 și la 18, se obțin resturile 7, respectiv 13.\na) Numărul natural n poate fi egal cu 103? Justifică răspunsul dat.\nb) Arată că cel mai mic număr natural n cu această proprietate este 31.",
      rubric: [
        { label: "a)", points: 2, answer: "Împărțind 103 la 12 se obține câtul 8 și restul 7; împărțind 103 la 18 se obține câtul 5 și restul 13. Deci n poate fi egal cu 103." },
        { label: "b)", points: 3, answer: "n = 12c₁ + 7 ⇒ n + 5 = 12(c₁ + 1), deci 12 | n + 5; analog n = 18c₂ + 13 ⇒ 18 | n + 5. Astfel n + 5 este multiplu comun al lui 12 și 18; cel mai mic n se obține pentru n + 5 = c.m.m.m.c.(12, 18) = 36, deci n = 31." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = (3x + 4)² − (2x + 1)², unde x este număr real.\na) Arată că E(1) + E(−1) = 40.\nb) Demonstrează că E(n) este multiplu al lui 5, pentru orice număr natural n.",
      rubric: [
        { label: "a)", points: 2, answer: "E(1) = 7² − 3² = 49 − 9 = 40 și E(−1) = 1² − (−1)² = 1 − 1 = 0; deci E(1) + E(−1) = 40 + 0 = 40." },
        { label: "b)", points: 3, answer: "E(n) = (3n + 4)² − (2n + 1)² = (3n + 4 − 2n − 1)(3n + 4 + 2n + 1) = (n + 3)(5n + 5) = 5(n + 3)(n + 1), care este multiplu al lui 5 pentru orice număr natural n." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Radicali. Operații",
      finalAnswer: "2",
      content: "Se consideră numerele reale x = (8/√18 + 6/√2) · (√2/13) și y = (5/√147 − 1/√3) : (√3/14).\na) Arată că x = 2/3.\nb) Arată că numărul N = |y − x| este natural.",
      rubric: [
        { label: "a)", points: 2, answer: "x = (8/(3√2) + 6/√2) · √2/13 = (8/(3√2) + 18/(3√2)) · √2/13 = (26/(3√2)) · √2/13 = 26/(3 · 13) = 2/3." },
        { label: "b)", points: 3, answer: "y = (5/(7√3) − 1/√3) : √3/14 = (5/(7√3) − 7/(7√3)) · 14/√3 = (−2/(7√3)) · 14/√3 = −28/21 = −4/3; N = |y − x| = |−4/3 − 2/3| = |−6/3| = 2, care este număr natural." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Centru de greutate. Teorema fundamentală a asemănării",
      hasFigure: true, figureUrl: FIG("s3-4"),
      finalAnswer: "4",
      content: "În figura alăturată este reprezentat un triunghi ABC. Punctul G este centrul de greutate al triunghiului ABC, MP ∥ BC, G ∈ MP, M ∈ AB și P ∈ AC.\na) Arată că AM/AB = 2/3.\nb) Dacă AC = 12 cm, atunci determină lungimea segmentului PC.",
      figureNote: "Triunghiul ABC (A sus, B jos-stânga, C jos-dreapta); G centrul de greutate; segmentul MP ∥ BC, cu M pe AB, P pe AC și G pe MP.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie {T} = AG ∩ BC; G centru de greutate ⇒ AG/AT = 2/3. Cum MP ∥ BC, din asemănare AM/AB = AG/AT = 2/3." },
        { label: "b)", points: 3, answer: "MP ∥ BC ⇒ AP/AC = AM/AB = 2/3 ⇒ AP = 2/3 · 12 = 8 cm; PC = AC − AP = 12 − 8 = 4 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrat. Triunghi echilateral",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Pătratul ABCD (A sus-stânga, B sus-dreapta, D jos-stânga, C jos-dreapta) și triunghiul echilateral BCE construit în exterior, cu vârful E spre dreapta.",
      content: "În figura alăturată sunt reprezentate pătratul ABCD cu AB = 4√2 cm și triunghiul echilateral BCE.\na) Arată că măsura unghiului CDE este egală cu 15°.\nb) Demonstrează că distanța de la punctul B la dreapta DE este egală cu 4 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "∢DCE = ∢DCB + ∢BCE = 90° + 60° = 150°; DC = BC = CE ⇒ triunghiul DCE este isoscel ⇒ ∢CDE = (180° − 150°) : 2 = 15°." },
        { label: "b)", points: 3, answer: "∢DEC = ∢CDE = 15° ⇒ ∢BED = ∢BEC − ∢DEC = 60° − 15° = 45°. Fie M piciorul perpendicularei din B pe DE (BM ⊥ DE, M ∈ DE), deci d(B, DE) = BM. Triunghiul BME este dreptunghic isoscel ⇒ BM² + ME² = BE² și BM = ME ⇒ 2BM² = BE² = (4√2)² = 32 ⇒ BM = 4 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă patrulateră regulată. Distanțe",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Piramida patrulateră regulată VABCD (vârf V sus, baza pătrată ABCD); O centrul bazei (AC ∩ BD); M mijlocul muchiei VD.",
      content: "În figura alăturată este reprezentată o piramidă patrulateră regulată VABCD cu baza ABCD, AB = 12 cm și VA = 2√34 cm. Punctul O este intersecția dreptelor AC și BD, iar punctul M este mijlocul muchiei VD.\na) Arată că dreapta OM este paralelă cu planul (VBC).\nb) Determină distanța de la punctul M la planul (VBC).",
      rubric: [
        { label: "a)", points: 2, answer: "În triunghiul VDB, OM este linie mijlocie (O mijlocul lui BD, M mijlocul lui VD) ⇒ OM ∥ VB; cum VB ⊂ (VBC) și OM ⊄ (VBC) ⇒ OM ∥ (VBC)." },
        { label: "b)", points: 3, answer: "OM ∥ (VBC) ⇒ d(M, (VBC)) = d(O, (VBC)). Fie P mijlocul lui BC; OP ⊥ BC și VP ⊥ BC ⇒ BC ⊥ (VOP); fie OS ⊥ VP (S ∈ VP) ⇒ OS ⊥ (VBC), deci d(O, (VBC)) = OS. În triunghiul VPB dreptunghic în P, VP = √(VB² − BP²) = √(136 − 36) = 10 cm; în triunghiul VOP dreptunghic în O, VO = √(136 − 72) = 8 cm și OP = 6 cm ⇒ OS = (VO · OP)/VP = (8 · 6)/10 = 24/5 cm. Distanța de la M la planul (VBC) este 24/5 cm." },
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
  console.log(`\n=== import-exam-mate-2021-test-04 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
