#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-13.mjs — Exam-Bank, CNCE training Test 13 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 13.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1d 2b 3c 4b 5c 6b · II = 1d 2a 3b 4d 5b 6d
 * NB: SII.6 (cubulețe) fără figură; SIII.3 (funcții) self-contained, fără figură. Deci 8 figuri
 *     (s2-1..5 + s3-4,5,6) și 7 autoGradable (SI 1-6 + SII.6). Via 4uPDF.
 * finalAnswer: III.1="8" (probleme Ana), III.2="6" (E≡6 ⇒ E(10)=6 și n=6). SKIP: III.3 (√2 radical),
 *   III.4 (9 dat + raport 8/9), III.5 (108√3 + proof), III.6 (√6/3 radical).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-13-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 13 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-13", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Divizori. Sumă",
      content: "Suma tuturor numerelor naturale care sunt divizori ai numărului 20 este egală cu:",
      options: [{ key: "a", text: "8" }, { key: "b", text: "20" }, { key: "c", text: "21" }, { key: "d", text: "42" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte. Calcul algebric",
      content: "Știind că a și b sunt numere reale și a/2 = b/3, expresia 1,5 · a − b este egală cu:",
      options: [{ key: "a", text: "−0,5" }, { key: "b", text: "0" }, { key: "c", text: "1,5" }, { key: "d", text: "3,5" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Unități de măsură",
      content: "Două turnuri au înălțimile de 120 m, respectiv 10 dam. Diferența pozitivă a înălțimilor celor două turnuri este egală cu:",
      options: [{ key: "a", text: "119 m" }, { key: "b", text: "110 m" }, { key: "c", text: "20 m" }, { key: "d", text: "2 m" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Aproximări zecimale",
      content: "Se consideră numărul rațional 1,(3). Aproximarea prin lipsă la sutimi a acestui număr este egală cu:",
      options: [{ key: "a", text: "1,30" }, { key: "b", text: "1,33" }, { key: "c", text: "1,34" }, { key: "d", text: "1,40" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Puteri. Diferența de pătrate",
      content: "Se consideră numărul real a = −(3 + 2√2)(3 − 2√2). Patru elevi au calculat a²⁰²¹ și au scris rezultatele:\n• Andrei — 0\n• Valentina — 1\n• Mihai — −1\n• Rada — 2021\nDintre cei patru elevi, cel care a scris rezultatul corect este:",
      options: [{ key: "a", text: "Andrei" }, { key: "b", text: "Valentina" }, { key: "c", text: "Mihai" }, { key: "d", text: "Rada" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Viteză. Timp",
      content: "Un biciclist s-a deplasat cu viteza de 15 km/h pe o distanță de 6 km. Un pieton s-a deplasat cu viteza de 3 km/h pe o distanță de 1 km. Afirmația „Timpul de deplasare a biciclistului este egal cu timpul de deplasare a pietonului.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Simetric",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Șapte puncte coliniare A, B, C, D, E, F, G (în această ordine, cu segmente egale de 2 cm) pe o dreaptă orizontală.",
      content: "În figura alăturată sunt reprezentate, în această ordine, punctele coliniare A, B, C, D, E, F și G, astfel încât AB = BC = CD = DE = EF = FG = 2 cm. Distanța dintre simetricul punctului E față de punctul C și simetricul punctului E față de punctul F este egală cu:",
      options: [{ key: "a", text: "6 cm" }, { key: "b", text: "8 cm" }, { key: "c", text: "10 cm" }, { key: "d", text: "12 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri. Bisectoare. Complement",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Trei unghiuri congruente în jurul punctului O (∢MON, ∢NOP, ∢POM); OM jos, OP stânga, ON dreapta, OQ sus bisectoarea unghiului NOP.",
      content: "În figura alăturată, ∢MON, ∢NOP și ∢POM sunt unghiuri congruente în jurul punctului O, iar semidreapta OQ este bisectoarea unghiului NOP. Măsura complementului unghiului POQ este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "90°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Dreptunghi. Distanță punct-dreaptă",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Dreptunghiul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta); diagonala BD trasată.",
      content: "În figura alăturată, dreptunghiul ABCD reprezintă schița unui parc în care AB = 40 m și BD = 2 · AD. Știind că în vârful A este plantat un copac, distanța de la baza copacului la aleea BD este egală cu:",
      options: [{ key: "a", text: "10 m" }, { key: "b", text: "20 m" }, { key: "c", text: "25 m" }, { key: "d", text: "30 m" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Romb. Varignon. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Rombul ABCD (D sus, A stânga, C dreapta, B jos) cu MNPQ (mijloacele laturilor) formând un dreptunghi interior.",
      content: "Figura alăturată reprezintă schița unei grădini având forma unui romb ABCD cu AB = 100 m și ∢ABC = 60°. Pe suprafața delimitată de patrulaterul MNPQ, ale cărui vârfuri sunt mijloacele laturilor rombului dat, sunt cultivate flori, iar restul suprafeței grădinii este acoperit cu gazon. Aria suprafeței grădinii acoperite de gazon este egală cu:",
      options: [{ key: "a", text: "50√3 m²" }, { key: "b", text: "250√3 m²" }, { key: "c", text: "500√3 m²" }, { key: "d", text: "2500√3 m²" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Coarde perpendiculare",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu diametrul orizontal MN; coardele AB și CD perpendiculare pe MN, intersectându-l în P, respectiv Q (OP < OQ).",
      content: "În figura alăturată, AB și CD sunt două coarde perpendiculare pe diametrul MN al cercului de centru O, acestea intersectând MN în punctele P, respectiv Q, astfel încât OP < OQ. Patrulaterul convex cu vârfurile în punctele A, B, C și D reprezintă:",
      options: [{ key: "a", text: "un trapez dreptunghic" }, { key: "b", text: "un trapez isoscel" }, { key: "c", text: "un dreptunghi" }, { key: "d", text: "un pătrat" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Cub. Cubulețe vopsite",
      content: "Mihai are la dispoziție 216 cubulețe cu muchia de 10 cm, pe care le lipește obținând un cub ale cărui fețe le vopsește. Volumul total al cubulețelor care au exact 3 fețe vopsite este egal cu:",
      options: [{ key: "a", text: "3 dm³" }, { key: "b", text: "4 dm³" }, { key: "c", text: "6 dm³" }, { key: "d", text: "8 dm³" }], correctAnswer: "d" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Fracții",
      finalAnswer: "8",
      content: "Mihai și Ana rezolvă probleme din ultimul număr publicat al revistei Gazeta Matematică. Se știe că Ana a rezolvat cu două probleme mai mult decât Mihai.\na) Dacă problemele rezolvate de cei doi sunt diferite, este posibil ca numărul total de probleme rezolvate de Mihai și Ana să fie 15? Justifică răspunsul.\nb) Știind că numărul problemelor rezolvate de Mihai reprezintă 3/4 din numărul problemelor rezolvate de Ana, determină numărul problemelor rezolvate de Ana.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie a numărul problemelor rezolvate de Ana și m al lui Mihai; a = m + 2 și a + m = 15. Rezultă 2m + 2 = 15, ecuație fără soluție naturală, deci nu este posibil ca numărul total de probleme să fie 15." },
        { label: "b)", points: 3, answer: "m = (3/4)·a și a = m + 2; substituind, a = (3/4)·a + 2, deci (1/4)·a = 2, de unde a = 8 probleme rezolvate de Ana." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Pătrate perfecte",
      finalAnswer: "6",
      content: "Se consideră expresia E(x) = (2x + 1)² + (2x − 1)² − 4(2x² − 1), unde x este număr real.\na) Calculează E(10).\nb) Determină cel mai mic număr natural nenul n pentru care n · E(10) · E(11) · … · E(100) este pătratul unui număr natural.",
      rubric: [
        { label: "a)", points: 2, answer: "E(10) = 21² + 19² − 4 · 199 = 441 + 361 − 796 = 6." },
        { label: "b)", points: 3, answer: "E(x) = (4x² + 4x + 1) + (4x² − 4x + 1) − 8x² + 4 = 6, pentru orice număr real x. Atunci n · E(10) · E(11) · … · E(100) = n · 6⁹¹ = 6 · n · 6⁹⁰; pentru ca produsul să fie pătratul unui număr natural, cel mai mic n nenul este n = 6." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Distanță",
      content: "Se consideră funcțiile f : ℝ → ℝ, f(x) = −x + 2 și g : ℝ → ℝ, g(x) = x.\na) Argumentează că P(1, 1) este punctul de intersecție al reprezentărilor geometrice ale graficelor celor două funcții.\nb) Calculează distanța de la originea O(0, 0) a sistemului de axe ortogonale xOy la reprezentarea geometrică a graficului funcției f.",
      rubric: [
        { label: "a)", points: 2, answer: "f(1) = −1 + 2 = 1, deci P(1, 1) aparține graficului lui f; g(1) = 1, deci P(1, 1) aparține și graficului lui g; prin urmare P(1, 1) este punctul de intersecție al celor două grafice." },
        { label: "b)", points: 3, answer: "Graficul lui f intersectează axele în A(2, 0) și B(0, 2), deci OA = OB = 2, iar triunghiul AOB este dreptunghic isoscel cu AB = 2√2; d(O, AB) = (OA · OB)/AB = (2 · 2)/(2√2) = √2." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Asemănare. Arii",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghiul ABC (A sus-stânga, C dreapta, B jos-stânga) cu AB = 6, AC = 9, BC = 12; M mijlocul lui AB, N pe AC cu ∢ANM = ∢ABC.",
      content: "În figura alăturată este reprezentat un triunghi ABC cu AB = 6 cm, AC = 9 cm și BC = 12 cm, iar M este mijlocul segmentului AB și N este un punct ce aparține segmentului AC, astfel încât ∢ABC ≡ ∢ANM.\na) Arată că perimetrul triunghiului AMN este egal cu 9 cm.\nb) Demonstrează că aria patrulaterului BMNC reprezintă 8/9 din aria triunghiului ABC.",
      rubric: [
        { label: "a)", points: 2, answer: "∢MAN = ∢CAB (comun) și ∢ANM = ∢ABC, deci ΔAMN ~ ΔACB cu raportul AM/AC = 3/9 = 1/3; perimetrul ΔAMN = (1/3)·perimetrul ΔACB = 27/3 = 9 cm." },
        { label: "b)", points: 3, answer: "Din ΔAMN ~ ΔACB cu raportul 1/3, A(AMN)/A(ABC) = (1/3)² = 1/9; A(BMNC) = A(ABC) − A(AMN) = (1 − 1/9)·A(ABC) = (8/9)·A(ABC)." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez isoscel. Perpendicularitate",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Trapezul isoscel ABCD (D, C sus, A, B jos) cu AB ∥ CD; M mijlocul bazei mari AB, cu AM = AD = CD = 12 cm.",
      content: "În figura alăturată este reprezentat trapezul isoscel ABCD cu AB ∥ CD. Punctul M este mijlocul bazei mari AB și AM = AD = CD = 12 cm.\na) Arată că aria trapezului ABCD este egală cu 108√3 cm².\nb) Demonstrează că bisectoarea unghiului BAD este perpendiculară pe dreapta BC.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiurile AMD, DMC și MCB sunt echilaterale congruente (latura 12 cm); A(ABCD) = 3 · A(AMD) = 3 · (12²√3)/4 = 108√3 cm²." },
        { label: "b)", points: 3, answer: "AMCD este romb, deci AC este bisectoarea unghiului BAD. În triunghiul ABC, ∢CAB = 30° și ∢ABC = 60°, deci ∢ACB = 90°, adică AC ⊥ BC." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Tetraedru regulat. Unghi diedru",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Tetraedrul regulat ABCD (D sus, A stânga, C dreapta, B jos); M mijlocul muchiei AB, N mijlocul muchiei CD.",
      content: "O cutie de bomboane de forma unui tetraedru regulat ABCD, cu muchia de lungime 12 cm, este reprezentată în figura alăturată. Punctele M și N sunt mijloacele muchiilor AB, respectiv CD.\na) Arată că MN are lungimea mai mică decât 5√3 cm.\nb) Determină cosinusul unghiului dintre planele (ABN) și (ABC).",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiurile DBC și DAC (echilaterale, latura 12) dau BN = AN = (12√3)/2 = 6√3 cm; triunghiul ANB este isoscel, deci MN ⊥ AB și MN = √(AN² − AM²) = √(108 − 36) = 6√2 cm. Cum 72 < 75, adică 6√2 < 5√3, MN are lungimea mai mică decât 5√3 cm." },
        { label: "b)", points: 3, answer: "(ABN) ∩ (ABC) = AB; NM ⊥ AB și CM ⊥ AB (M mijlocul lui AB), deci unghiul dintre plane este ∢NMC. Cum CD ⊥ (ABN) ⇒ CN ⊥ MN, în triunghiul dreptunghic CMN cos(∢NMC) = MN/MC = (6√2)/(6√3) = √6/3." },
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
  console.log(`\n=== import-exam-mate-2021-test-13 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
