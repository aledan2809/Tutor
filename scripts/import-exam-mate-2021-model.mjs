#!/usr/bin/env node
/**
 * import-exam-mate-2021-model.mjs — Exam-Bank series 3, pair 2021 Model (Matematică)
 *
 * SOURCE: Ministerul Educației și Cercetării / CNPEE — EN VIII, an școlar 2020–2021, Model.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1d 2a 3d 4c 5c 6b · II = 1b 2c 3b 4c 5c 6b
 * Figures: 9 PNG (en-viii-2021-mate-model-s{2,3}-{label}.png) — s2-1..5, s3-3..6.
 *   (II.6 = paralelipiped, fără figură. finalAnswer: III.1=10, III.3=(1,-2), III.4=3,2, III.6=30.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-model-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Model (edu.ro)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "model", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Puteri. Numere prime",
      content: "Scrierea numărului 432 ca produs de puteri de numere prime distincte este:",
      options: [{ key: "a", text: "2·6³" }, { key: "b", text: "3·12²" }, { key: "c", text: "2³·3⁴" }, { key: "d", text: "2⁴·3³" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte",
      content: "În tabelul de mai jos sunt prezentate informații referitoare la numărul fructelor cumpărate de patru elevi. (Mere, Banane) — Mircea: (5, 7); Alina: (4, 2); Nicolae: (3, 4); Diana: (6, 3). Elevii, pentru care raportul dintre numărul de mere și numărul de banane are aceeași valoare, sunt:",
      options: [{ key: "a", text: "Alina și Diana" }, { key: "b", text: "Mircea și Nicolae" }, { key: "c", text: "Mircea și Alina" }, { key: "d", text: "Diana și Nicolae" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Într-o zi, dimineața, temperatura aerului era de −6°C, iar la prânz de +3°C. În acea zi, temperatura măsurată la prânz este mai mare decât temperatura măsurată dimineața cu:",
      options: [{ key: "a", text: "−9°C" }, { key: "b", text: "3°C" }, { key: "c", text: "6°C" }, { key: "d", text: "9°C" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții zecimale. Ordonare",
      content: "Dintre următoarele seturi de numere, cel scris în ordine crescătoare este:",
      options: [
        { key: "a", text: "2,14 ; 2,1(4) ; 2,(14) ; 2,144" },
        { key: "b", text: "2,1(4) ; 2,144 ; 2,(14) ; 2,14" },
        { key: "c", text: "2,14 ; 2,(14) ; 2,144 ; 2,1(4)" },
        { key: "d", text: "2,144 ; 2,14 ; 2,(14) ; 2,1(4)" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Media aritmetică",
      content: "Patru elevi calculează media aritmetică a numerelor 8√3, 3√3 și −17√3 și obțin rezultatele înregistrate în tabelul următor: Mircea → −3√3; Alina → −14√3; Nicolae → −2√3; Diana → 2√3. Dintre cei patru elevi, cel care a calculat corect media aritmetică a celor trei numere este:",
      options: [{ key: "a", text: "Mircea" }, { key: "b", text: "Alina" }, { key: "c", text: "Nicolae" }, { key: "d", text: "Diana" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Unități de timp",
      content: "Un autoturism se deplasează în intervalul orar 18:30 – 22:15, apoi staționează. Mircea afirmă că „după trei ore de la plecare, autoturismul staționează”. Afirmația lui Mircea este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Simetria față de un punct",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Pe o rețea de pătrate sunt marcate punctele A, B, C, D, M și P.",
      content: "În figura alăturată sunt reprezentate punctele A, B, C, D, M și P. Simetricul punctului M față de punctul P este punctul:",
      options: [{ key: "a", text: "A" }, { key: "b", text: "B" }, { key: "c", text: "C" }, { key: "d", text: "D" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte paralele. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Dreptele a și b sunt paralele; o linie frântă formează cu ele unghiurile marcate 40° (la dreapta a) și 20° (la dreapta b), iar la vârf unghiul x.",
      content: "În figura alăturată dreptele a și b sunt paralele. Valoarea lui x este egală cu:",
      options: [{ key: "a", text: "40°" }, { key: "b", text: "20°" }, { key: "c", text: "60°" }, { key: "d", text: "120°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Mediană",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Schița unui traseu turistic: triunghiul ABC dreptunghic în A, șoseaua reprezentată de dreapta AM (M mijlocul lui BC).",
      content: "Figura alăturată reprezintă schița unui traseu turistic. Punctele A, B și C marchează poziția a trei cabane. Triunghiul ABC este dreptunghic cu măsura unghiului A de 90°. Zona este străbătută de o șosea care este reprezentată de dreapta AM, unde punctul M este mijlocul laturii BC. Dacă măsura unghiului ABC este de 60° și AC = 4 km, atunci distanța de la cabana C la șoseaua AM este de:",
      options: [{ key: "a", text: "1 km" }, { key: "b", text: "2 km" }, { key: "c", text: "4 km" }, { key: "d", text: "8 km" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Pătrat. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Cameră în formă de pătrat ABCD cu latura AB = 9 m; șemineul este pătratul CEFG cu latura de 1 m; se acoperă patrulaterul AFED.",
      content: "Figura alăturată reprezintă schița unei camere în formă de pătrat ABCD cu latura AB = 9 m. Pătratul CEFG cu latura de 1 m reprezintă un șemineu. Proprietarul acoperă suprafața reprezentată de patrulaterul AFED cu podea din lemn masiv. Aria suprafeței acoperită cu lemn masiv, reprezentată de patrulaterul AFED, este egală cu:",
      options: [{ key: "a", text: "16 m²" }, { key: "b", text: "32 m²" }, { key: "c", text: "40 m²" }, { key: "d", text: "80 m²" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Două cercuri se intersectează în E și F; O este centrul cercului mic, M centrul cercului mare, M mijlocul segmentului OA.",
      content: "Cercurile din figura alăturată se intersectează în punctele E și F. Punctul O este centrul cercului mic, iar punctul M este centrul cercului mare. Dacă punctul M este mijlocul segmentului OA, atunci unghiul OEA are măsura de:",
      options: [{ key: "a", text: "60°" }, { key: "b", text: "80°" }, { key: "c", text: "90°" }, { key: "d", text: "100°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Paralelipiped dreptunghic. Volume",
      content: "Mircea are o cutie de jucării în formă de paralelipiped dreptunghic, cu dimensiunile de 20 cm, 30 cm și 115 cm. Numărul maxim de cuburi din lemn cu latura de 10 cm care intră în cutia pentru jucării a lui Mircea este egal cu:",
      options: [{ key: "a", text: "60" }, { key: "b", text: "66" }, { key: "c", text: "69" }, { key: "d", text: "72" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Sisteme de ecuații. Probleme",
      finalAnswer: "10",
      content: "Trei pixuri și două stilouri costă împreună 38 lei. Patru pixuri și cinci stilouri costă 74 lei.",
      rubric: [
        { label: "a)", points: 2, answer: "Cinci stilouri ar costa 5·16 = 80 de lei. Cum patru pixuri și cinci stilouri costă 74 lei, deducem că nu este posibil ca prețul unui stilou să fie de 16 lei." },
        { label: "b)", points: 3, answer: "3x + 2y = 38 și 4x + 5y = 74, unde x este prețul unui pix și y este prețul unui stilou. Rezolvând sistemul, x = 6 lei și y = 10 lei." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Expresii raționale",
      content: "Se consideră expresia E(x) = ((2x² − 7x − 17)/(x² − 10x + 21) − (x + 1)/(x − 7)) : 1/(x² − 9), unde x ∈ ℝ \\ {−3, 3, 7}.",
      rubric: [
        { label: "a)", points: 2, answer: "x² − 10x + 21 = x² − 3x − 7x + 21 = x(x − 3) − 7(x − 3) = (x − 3)(x − 7), pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = (2x² − 7x − 17 − (x + 1)(x − 3))/((x − 3)(x − 7)) · (x − 3)(x + 3) = (x² − 5x − 14)/(x − 7) · (x + 3) = ((x + 2)(x − 7))/(x − 7) · (x + 3) = (x + 2)(x + 3), pentru orice x ∈ ℝ \\ {−3, 3, 7}." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Grafic",
      hasFigure: true, figureUrl: FIG("s3-3"), finalAnswer: "(1,-2)",
      figureNote: "Sistem de axe ortogonale xOy cu reprezentarea grafică a funcției f(x) = 2x − 4.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = 2x − 4.",
      rubric: [
        { label: "a)", points: 2, answer: "f(0) = −4; f(2) = 0, deci f(0) + f(2) = −4." },
        { label: "b)", points: 3, answer: "Reprezentarea grafică intersectează axele în A(2, 0) și B(0, −4). Mijlocul segmentului AB are coordonatele (1, −2)." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-4"), finalAnswer: "3,2",
      figureNote: "Trapezul ABCD cu AB ∥ CD, AB = 4 cm, BC = 8 cm, CD = 10 cm; paralela prin A la BC taie CD în T și diagonala BD în M.",
      content: "În figura alăturată este reprezentat trapezul ABCD cu AB ∥ CD, AB = 4 cm, BC = 8 cm și CD = 10 cm. Paralela prin punctul A la dreapta BC intersectează latura CD în punctul T și diagonala BD în punctul M.",
      rubric: [
        { label: "a)", points: 2, answer: "AB ∥ TC și AT ∥ BC, deci ABCT este paralelogram; rezultă AT = BC = 8 cm." },
        { label: "b)", points: 3, answer: "AB ∥ DT ⇒ ΔAMB ~ ΔTMD ⇒ AB/TD = AM/TM, deci AB/TD = AM/(AT − AM) și, cum TD = CD − TC = 6 cm, obținem AM = 3,2 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Teorema înălțimii",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A; perpendiculara în B pe BC intersectează dreapta AC în E; AC = 9 cm, AE = 4 cm.",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în A. Perpendiculara în punctul B pe dreapta BC intersectează dreapta AC în punctul E. Lungimea laturii AC este de 9 cm, iar lungimea segmentului AE este de 4 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔBCE este dreptunghic în B și BA ⊥ CE, A ∈ CE, deci BA² = AC·AE; rezultă AB = √(9·4) = 6 cm." },
        { label: "b)", points: 3, answer: "ΔABC dreptunghic în A ⇒ BC² = AB² + AC² ⇒ BC = 3√13 cm; ΔABE dreptunghic în A ⇒ BE² = AB² + AE² ⇒ BE = 2√13 cm, deci P(BCE) = (5√13 + 13) cm și, cum 5√13 < 19 ⇔ √325 < √361, obținem că triunghiul BCE are perimetrul mai mic decât 32 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s3-6"), finalAnswer: "30",
      figureNote: "Cutie în formă de cub ABCDA'B'C'D' cu AB = 30 cm; O = BC' ∩ B'C.",
      content: "Ionel oferă un cadou într-o cutie în formă de cub ABCDA'B'C'D' cu AB = 30 cm, reprezentat în figura alăturată.",
      rubric: [
        { label: "a)", points: 2, answer: "Aria hârtiei de ambalat este 100·50 = 5000 cm². Deoarece aria totală a cubului este 6·30² = 5400 cm² > 5000 cm², hârtia în formă de dreptunghi (1 m × 50 cm) nu este suficientă pentru ambalarea cadoului." },
        { label: "b)", points: 3, answer: "AB' ∥ DC', deci ∢(AO, DC') = ∢(AO, AB'). Triunghiul AB'C este echilateral și AO este mediană, deci ∢(AO, AB') = ∢B'AO = 30°." },
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
  console.log(`\n=== import-exam-mate-2021-model (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
