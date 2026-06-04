#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-02.mjs — Exam-Bank, CNCE training Test 2 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 2.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1d 2c 3c 4d 5c 6b · II = 1c 2d 3b 4c 5c 6a
 * Figures: 7 PNG (en-viii-2021-mate-test-02-s{2,3}-{label}.png) — S2-1,2,3,4 + S3-4,5,6.
 *   (S2-5 cerc / S2-6 paralelipiped = fără figură, autoGradable.)
 *   finalAnswer: III.1=10, III.2=-2, III.3=10 (III.4=5000/3 fracție, III.5 radical+demonstrație,
 *   III.6 unghi → fără finalAnswer per policy).
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-02-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 2 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-02", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I (6 × MCQ ×5p, fără figură) ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Divizori",
      content: "Suma divizorilor naturali ai lui 10 este numărul:",
      options: [{ key: "a", text: "7" }, { key: "b", text: "8" }, { key: "c", text: "10" }, { key: "d", text: "18" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte",
      content: "În tabelul următor este prezentată situația cheltuielilor și a veniturilor unei societăți comerciale:\n• 2017 — Cheltuieli 90000 lei, Venituri 110000 lei\n• 2018 — Cheltuieli 150000 lei, Venituri 250000 lei\n• 2019 — Cheltuieli 150000 lei, Venituri 180000 lei\n• 2020 — Cheltuieli 190000 lei, Venituri 200000 lei\nRaportul dintre cheltuielile și veniturile înregistrate de către societatea comercială este egal cu 5/6 în anul:",
      options: [{ key: "a", text: "2017" }, { key: "b", text: "2018" }, { key: "c", text: "2019" }, { key: "d", text: "2020" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 5 − (2 · 3 − 7) − 6 este numărul:",
      options: [{ key: "a", text: "−4" }, { key: "b", text: "−2" }, { key: "c", text: "0" }, { key: "d", text: "1" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "Într-un depozit sunt 2700 kg de fructe: mere, pere, gutui și struguri, după cum este prezentat în tabelul următor:\n• mere — 900 kg\n• pere — 500 kg\n• gutui — 490 kg\n• struguri — 810 kg\nDintre fructele de mai sus, categoria care reprezintă 30% din cantitatea de fructe din acest depozit este:",
      options: [{ key: "a", text: "mere" }, { key: "b", text: "pere" }, { key: "c", text: "gutui" }, { key: "d", text: "struguri" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali",
      content: "Dacă a = √(10² − 8²), atunci a este egal cu:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "4" }, { key: "c", text: "6" }, { key: "d", text: "36" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Viteză. Mișcare rectilinie",
      content: "Un biciclist se deplasează cu viteza de 40 km pe oră. Alexandru afirmă că biciclistul, păstrând viteza de deplasare, a parcurs 60 km în 60 de minute. Afirmația lui Alexandru este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea (6 × MCQ ×5p) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare, în această ordine, cu AB = 1 cm, BC = 2 cm, CD = 3 cm.",
      content: "În figura alăturată sunt reprezentate punctele A, B, C și D astfel încât AB = 1 cm, BC = 2 cm și CD = 3 cm. Dintre aceste puncte, cel care reprezintă mijlocul unui segment din figură, este punctul:",
      options: [{ key: "a", text: "A" }, { key: "b", text: "B" }, { key: "c", text: "C" }, { key: "d", text: "D" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri adiacente suplementare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Două unghiuri adiacente suplementare cu vârful pe dreapta AC (în B); latura comună BD; unghiul ascuțit are măsura 70°.",
      content: "În figura alăturată sunt reprezentate două unghiuri adiacente suplementare astfel încât măsura unghiului ascuțit să fie 70°. Care dintre următoarele valori reprezintă măsura celuilalt unghi?",
      options: [{ key: "a", text: "20°" }, { key: "b", text: "35°" }, { key: "c", text: "70°" }, { key: "d", text: "110°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Distanță punct–dreaptă",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC cu ∢BAC = 90° (A sus), B stânga, C dreapta; M pe BC între B și C.",
      content: "În grădina casei Teodorei există patru tufe de trandafiri poziționate pe figura alăturată în punctele A, B, C și M. Măsura unghiului BAC este de 90°, punctul M aparține lui BC, AM ≡ MC, ∢MAC = 30° și BM = 6 m. Teodora vrea să amenajeze o alee din punctul M care să fie perpendiculară pe latura AC a grădinii. Aleea amenajată de Teodora de la punctul M la latura AC are o lungime egală cu:",
      options: [{ key: "a", text: "2 m" }, { key: "b", text: "3 m" }, { key: "c", text: "4 m" }, { key: "d", text: "6 m" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Arii. Trapez dreptunghic",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Trapezul dreptunghic ABCD: D sus-stânga, C sus, A jos-stânga, B jos-dreapta; M mijlocul lui AD (pe latura din stânga); trasate triunghiurile ABM, BMC, CMD.",
      content: "Figura alăturată reprezintă schița unui teren în formă de trapez dreptunghic ABCD cu baza mare AB = 120 m, baza mică CD = 40 m și înălțimea AD = 60 m. Terenul este împărțit în trei parcele pe care s-au plantat lalele, zambile și narcise. Cele trei parcele sunt ABM, BMC și CMD, unde M este mijlocul segmentului AD. Precizăm că lalelele s-au plantat pe suprafața triunghiului ABM, zambilele pe suprafața triunghiului BMC, iar narcisele pe suprafața triunghiului CMD. Aria suprafeței pe care s-au plantat zambilele este:",
      options: [{ key: "a", text: "600 m²" }, { key: "b", text: "1800 m²" }, { key: "c", text: "2400 m²" }, { key: "d", text: "4800 m²" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Cerc. Unghi înscris",
      content: "Triunghiul ABC este înscris în cercul de centru O și rază 6 cm. Știind că latura BC a triunghiului ABC are 12 cm, atunci măsura unghiului BAC este:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "150°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Paralelipiped dreptunghic. Volum",
      content: "O față a unui dulap în formă de paralelipiped dreptunghic are dimensiunile de 2 m și 0,5 m. Suma lungimilor tuturor muchiilor paralelipipedului este de 14 m. Volumul dulapului este egal cu:",
      options: [{ key: "a", text: "1 m³" }, { key: "b", text: "4 m³" }, { key: "c", text: "14 m³" }, { key: "d", text: "16,5 m³" }], correctAnswer: "a" },
    // ── Subiectul al III-lea (6 × OPEN ×5p) ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Sisteme de ecuații. Probleme",
      finalAnswer: "10",
      content: "Într-un bloc sunt 40 de apartamente cu câte două, respectiv trei camere. În aceste apartamente sunt în total 90 de camere.\na) Este posibil ca în bloc să fie 31 de apartamente cu trei camere? Justifică răspunsul dat.\nb) Determină câte apartamente cu trei camere sunt în acest bloc.",
      rubric: [
        { label: "a)", points: 2, answer: "În 31 de apartamente cu trei camere ar fi 3 · 31 = 93 de camere; cum numărul total de camere din bloc este 90, nu este posibil (93 > 90)." },
        { label: "b)", points: 3, answer: "x + y = 40 și 3x + 2y = 90, unde x este numărul apartamentelor cu trei camere și y al celor cu două camere; rezultă x = 10 apartamente cu trei camere." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Formule de calcul",
      finalAnswer: "-2",
      content: "Se consideră expresia E(x) = (x + 3)² − 2(x² + 3x) + (x + 1)², unde x este număr real.\na) Arată că E(x) = 2x + 10, pentru orice x număr real.\nb) Determină numărul întreg a pentru care E(a − 2) + a = 0.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = x² + 6x + 9 − 2x² − 6x + x² + 2x + 1 = 2x + 10, pentru orice x număr real." },
        { label: "b)", points: 3, answer: "E(a − 2) = 2(a − 2) + 10 = 2a + 6; din E(a − 2) + a = 0 rezultă 3a + 6 = 0, deci a = −2 ∈ ℤ." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Radicali. Media geometrică",
      finalAnswer: "10",
      content: "Fie numerele a = √175 − √98 − √63 + 3√50 și b = √28 − √112 + √162 + √2 − √8.\na) Arată că a = 2√7 + 8√2.\nb) Calculează media geometrică a numerelor a și b.",
      rubric: [
        { label: "a)", points: 2, answer: "a = 5√7 − 7√2 − 3√7 + 15√2 = 2√7 + 8√2." },
        { label: "b)", points: 3, answer: "b = 2√7 − 4√7 + 9√2 + √2 − 2√2 = −2√7 + 8√2; a · b = (8√2 + 2√7)(8√2 − 2√7) = 128 − 28 = 100, deci media geometrică = √(a · b) = √100 = 10." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez dreptunghic. Diagonale perpendiculare",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Trapezul dreptunghic ABCD: D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta; diagonalele AC și BD se intersectează perpendicular în O.",
      content: "În figura alăturată este reprezentat un trapez dreptunghic ABCD cu AB ∥ CD, ∢DAB = 90°, AD = 40 cm și CD = 30 cm. Diagonalele trapezului sunt perpendiculare și O este punctul lor de intersecție.\na) Arată că perimetrul triunghiului ADC este egal cu 120 cm.\nb) Calculează aria trapezului ABCD.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔADC dreptunghic în D, deci AC² = AD² + DC², de unde AC = 50 cm; P(ADC) = AD + DC + AC = 40 + 30 + 50 = 120 cm." },
        { label: "b)", points: 3, answer: "DO = AD · DC / AC = 24 cm; în ΔADB dreptunghic în A, AD² = DO · DB ⇒ DB = 200/3 cm; A(ABCD) = DB · AC / 2 = (200/3 · 50) / 2 = 5000/3 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Trigonometrie",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A; B sus-dreapta, C jos-dreapta, E stânga (pe dreapta AC), A între E și C, D piciorul perpendicularei din A pe BC.",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în A, ∢ABC = 30°. Perpendiculara din A pe BC intersectează dreapta BC în punctul D, AD = 2√3 cm. Paralela prin B la AD intersectează dreapta AC în punctul E.\na) Demonstrează că BE = 8√3 cm.\nb) Demonstrează că perimetrul triunghiului BCE este mai mic decât 38 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔABD dreptunghic în D, ∢ABD = 30° ⇒ AB = 4√3 cm; ΔABE dreptunghic în A, ∢BEA = 30° ⇒ EB = 8√3 cm." },
        { label: "b)", points: 3, answer: "ΔABC dreptunghic în A, cos B = AB/BC ⇒ BC = 8 cm; ΔEBC dreptunghic în B, EC² = EB² + BC² ⇒ EC = 16 cm; P(BCE) = 8√3 + 8 + 16 = (8√3 + 24) cm și, cum 8√3 < 14 (192 < 196), perimetrul este mai mic decât 38 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă patrulateră. Unghi diedru",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Piramida patrulateră VABCD cu baza pătrată ABCD; V sus, O centrul bazei (AC ∩ BD), M pe segmentul VO.",
      content: "În figura alăturată este reprezentată o piramidă patrulateră VABCD cu baza pătratul ABCD și VA = 4√11 cm. Punctul O este intersecția dreptelor AC și BD, dreapta VO este perpendiculară pe planul (ABC), VO = 12 cm și punctul M este situat pe segmentul VO astfel încât VM/VO = 2/3.\na) Arată că lungimea segmentului AC este egală cu 8√2 cm.\nb) Calculează măsura unghiului determinat de planele (ABC) și (MBC).",
      rubric: [
        { label: "a)", points: 2, answer: "VO ⊥ (ABC) ⇒ VO ⊥ AC; ΔVOA dreptunghic în O, deci AO² = VA² − VO² = 176 − 144 = 32 ⇒ AO = 4√2 cm ⇒ AC = 8√2 cm." },
        { label: "b)", points: 3, answer: "N mijlocul lui BC; ON ⊥ BC și MN ⊥ BC ⇒ ∢((ABC),(MBC)) = ∢ONM; din VM/VO = 2/3 rezultă MO = 4 cm, iar ON = 4 cm ⇒ ΔMON dreptunghic isoscel ⇒ ∢ONM = 45°, deci măsura unghiului dintre plane este 45°." },
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
  console.log(`\n=== import-exam-mate-2021-test-02 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
