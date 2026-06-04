#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-11.mjs — Exam-Bank, CNCE training Test 11 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 11.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1c 2c 3a 4b 5d 6b · II = 1b 2a 3b 4c 5d 6b
 * NB: SI.6 ARE figură (diagramă cu bare — VECTORIALĂ, bbox estimat) ⇒ slug s1-6. SII.3 (diametru) fără
 *     figură. Deci 9 figuri (s1-6, s2-1,2,4,5,6, s3-4,5,6) și 6 autoGradable (SI 1-5 + SII.3). Via 4uPDF.
 * finalAnswer: III.1="4" (apartamente 2 camere), III.6="24" (distanța M la (ABC)) — find.
 *   SKIP: III.2 (N=−16168 „arată întreg"), III.3 (b = pereche de coordonate, format ambiguu),
 *   III.4 (GG'=26/3 fracție), III.5 (√5/5 + proof).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-11-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 11 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-11", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 32 : 8 + 8 · 2 este egal cu:",
      options: [{ key: "a", text: "1" }, { key: "b", text: "4" }, { key: "c", text: "20" }, { key: "d", text: "24" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte și proporții",
      content: "Știind că a/b = c/2, b · c = 30 și b ≠ 0, valoarea numărului a este egală cu:",
      options: [{ key: "a", text: "60" }, { key: "b", text: "30" }, { key: "c", text: "15" }, { key: "d", text: "10" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Calcul algebric. Valori",
      content: "Se consideră expresia E(x) = 3 − (x + 2), unde x este număr real. Pentru x = −2, valoarea expresiei este egală cu:",
      options: [{ key: "a", text: "3" }, { key: "b", text: "0" }, { key: "c", text: "−1" }, { key: "d", text: "−3" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Unități de măsură. Volum",
      content: "În tabelul de mai jos sunt trecute volumul unui pahar mic și volumul unui pahar mare:\n• Pahar mic — 0,25 litri\n• Pahar mare — 0,5 litri\nVolumul a șase pahare mici și trei pahare mari, toate pline, este egal cu:",
      options: [{ key: "a", text: "2 litri" }, { key: "b", text: "3 litri" }, { key: "c", text: "4 litri" }, { key: "d", text: "9 litri" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Estimarea radicalilor",
      content: "Cel mai mic număr natural mai mare decât 3√2 este:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "3" }, { key: "c", text: "4" }, { key: "d", text: "5" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Interpretarea datelor. Grafic",
      hasFigure: true, figureUrl: FIG("s1-6"),
      figureNote: "Diagramă cu bare a numărului de elevi pe note (nota 4 … nota 10); pe verticală numărul de elevi (0, 2, 4, 6, 8).",
      content: "În graficul de mai jos sunt reprezentate rezultatele obținute la un test de matematică de elevii unei clase a VIII-a. Conform graficului, numărul elevilor care au obținut cel puțin nota 8 la acest test este egal cu:",
      options: [{ key: "a", text: "4" }, { key: "b", text: "10" }, { key: "c", text: "12" }, { key: "d", text: "20" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte determinate de puncte",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, C, B coliniare (în această ordine) pe o dreaptă orizontală; punctul D în afara dreptei (sus).",
      content: "În figura alăturată sunt reprezentate punctele distincte A, B, C și D. Punctul C aparține dreptei AB și punctul D nu aparține dreptei AC. Numărul dreptelor determinate de oricare două dintre punctele A, B, C și D este egal cu:",
      options: [{ key: "a", text: "3" }, { key: "b", text: "4" }, { key: "c", text: "5" }, { key: "d", text: "6" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte paralele. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Dreptele paralele AB și CD tăiate de secanta BC; la vârful B unghiul ABC = 45°, iar la vârful C unghiul dintre CB și CD are măsura 3x.",
      content: "În figura alăturată, AB ∥ CD și măsura unghiului ABC este de 45°. Unghiul marcat la vârful C (între CB și CD) are măsura 3x. Valoarea lui x este egală cu:",
      options: [{ key: "a", text: "15" }, { key: "b", text: "45" }, { key: "c", text: "90" }, { key: "d", text: "135" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Cerc. Lungime",
      content: "Diametrul unui cerc este de 22 cm. Lungimea cercului este egală cu:",
      options: [{ key: "a", text: "11π cm" }, { key: "b", text: "22π cm" }, { key: "c", text: "44π cm" }, { key: "d", text: "121π cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Dreptunghi. Diagonale. Arie",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Dreptunghiul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta) cu diagonalele AC și BD intersectate în O; unghiul BOC = 60°.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD. Diagonalele AC și BD se intersectează în punctul O, ∢BOC = 60° și AD = 10 m. Aria suprafeței ABCD este egală cu:",
      options: [{ key: "a", text: "50√3 m²" }, { key: "b", text: "100 m²" }, { key: "c", text: "100√3 m²" }, { key: "d", text: "200 m²" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Dreptunghi. Arii",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Dreptunghiul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta); M mijlocul lui CD, I intersecția dreptelor BD și AM.",
      content: "În figura alăturată, ABCD este un dreptunghi, punctul M este mijlocul segmentului CD și punctul I este intersecția dreptelor BD și AM. Raportul dintre aria triunghiului DIM și aria dreptunghiului ABCD este egal cu:",
      options: [{ key: "a", text: "1/2" }, { key: "b", text: "1/3" }, { key: "c", text: "1/6" }, { key: "d", text: "1/12" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Arie totală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cubul ABCDEFGH (EFGH sus, ABCD jos), reprezentând o cutie din tablă.",
      content: "În figura alăturată, cubul ABCDEFGH reprezintă o cutie confecționată din tablă care are muchia de 10 cm. Afirmația „Pentru confecționarea cutiei este suficientă o foaie de tablă cu aria de 5 dm²” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Sisteme. Probleme",
      finalAnswer: "4",
      content: "Într-un bloc de locuințe sunt apartamente cu două, trei și patru camere, în total fiind 40 de apartamente care au 122 de camere. Numărul apartamentelor cu trei camere este de cinci ori mai mare decât al celor cu patru camere.\na) Este posibil ca în acest bloc să fie nouă apartamente cu trei camere? Justifică răspunsul dat.\nb) Determină numărul de apartamente cu două camere din acest bloc.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă y este numărul apartamentelor cu trei camere și z al celor cu patru camere, atunci y = 5z. Pentru y = 9 ar trebui 9 = 5z, dar 9 nu este divizibil cu 5, deci nu este posibil ca în bloc să fie nouă apartamente cu trei camere." },
        { label: "b)", points: 3, answer: "Fie x, y, z numerele de apartamente cu 2, 3, respectiv 4 camere: x + y + z = 40, y = 5z și 2x + 3y + 4z = 122. Înlocuind y = 5z: x + 6z = 40 și 2x + 19z = 122; rezolvând, z = 6 și x = 4. Deci în bloc sunt 4 apartamente cu două camere." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Puteri. Radicali",
      content: "Se consideră numerele a = 2021 − 2021⁰ − (−1)²⁰²¹ și b = √2/2 − 3/√2.\na) Arată că a = 2021.\nb) Arată că numărul N = ((a − b)² − (a + b)²) · b este întreg.",
      rubric: [
        { label: "a)", points: 2, answer: "2021⁰ = 1 și (−1)²⁰²¹ = −1, deci a = 2021 − 1 − (−1) = 2021 − 1 + 1 = 2021." },
        { label: "b)", points: 3, answer: "b = √2/2 − 3/√2 = √2/2 − 3√2/2 = −2√2/2 = −√2. Cum (a − b)² − (a + b)² = −4ab, rezultă N = −4ab · b = −4ab² = −4 · 2021 · (−√2)² = −4 · 2021 · 2 = −16168, care este un număr întreg." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Simetric",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x + 1.\na) Arată că f(1) + f(3) = 2 · f(2).\nb) Reprezentarea geometrică a graficului funcției f intersectează axele Ox și Oy ale sistemului de axe ortogonale xOy în punctele M, respectiv N. Determină coordonatele simetricului punctului M față de punctul N.",
      rubric: [
        { label: "a)", points: 2, answer: "f(1) = 2, f(3) = 4 și f(2) = 3; f(1) + f(3) = 2 + 4 = 6 = 2 · 3 = 2 · f(2)." },
        { label: "b)", points: 3, answer: "M(−1, 0) (intersecția cu Ox) și N(0, 1) (intersecția cu Oy). Simetricul P al lui M față de N are pe N drept mijloc al segmentului MP, deci P = 2N − M = (1, 2)." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Centre de greutate",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghiul ABC (A jos-stânga, B sus, C dreapta) cu D proiecția lui A pe BC; G centrul de greutate al triunghiului ADC, G′ al triunghiului ADB.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu AB = 10 cm, AC = 24 cm și BC = 26 cm, punctul D reprezintă proiecția punctului A pe dreapta BC și punctele G și G′ sunt centrele de greutate ale triunghiului ADC, respectiv ADB.\na) Arată că aria triunghiului ABC este egală cu 120 cm².\nb) Determină lungimea segmentului GG′.",
      rubric: [
        { label: "a)", points: 2, answer: "Cum BC² = 26² = 676 = 10² + 24² = AB² + AC², triunghiul ABC este dreptunghic în A, deci A(ABC) = (AB · AC)/2 = (10 · 24)/2 = 120 cm²." },
        { label: "b)", points: 3, answer: "Fie {N} = AG ∩ BC și {P} = AG′ ∩ BC (N, P mijloacele lui DC, respectiv DB); NP = DC/2 + BD/2 = BC/2 = 13 cm. Cum AG/GN = AG′/G′P = 2, GG′ ∥ NP și ΔAGG′ ~ ΔANP, deci GG′/NP = AG/AN = 2/3, de unde GG′ = (2/3)·13 = 26/3 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez dreptunghic. Trigonometrie",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Trapezul dreptunghic ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta) cu AD ∥ CB și ∢DAB = 90°; T pe AB, cu ∢ATD ≡ ∢BTC.",
      content: "În figura alăturată este reprezentat trapezul dreptunghic ABCD cu AD ∥ CB, măsura unghiului DAB este de 90°, AD = 10 cm și AB = 60 cm. Punctul T aparține segmentului AB, AT = 20 cm și unghiurile ATD și BTC sunt congruente.\na) Arată că sinusul unghiului BTC este egal cu √5/5.\nb) Demonstrează că triunghiul BCD este isoscel.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiul ADT este dreptunghic în A, deci DT = √(DA² + AT²) = √(100 + 400) = 10√5 cm; sin(∢DTA) = DA/DT = 10/(10√5) = √5/5. Cum ∢DTA ≡ ∢BTC, rezultă sin(∢BTC) = √5/5." },
        { label: "b)", points: 3, answer: "În triunghiul BTC dreptunghic în B, sin(∢BTC) = BC/TC = √5/5, deci TC = BC√5; din TC² = BC² + BT² (BT = AB − AT = 40 cm) rezultă 5BC² = BC² + 1600, deci BC = 20 cm. Fie S proiecția lui D pe BC; ABSD este dreptunghi, deci BS = AD = 10 cm și SC = BC − BS = 10 cm = BS, deci DS este înălțime și mediană în triunghiul DBC, de unde triunghiul DBC este isoscel de bază BC." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Paralelipiped. Drum minim",
      hasFigure: true, figureUrl: FIG("s3-6"),
      finalAnswer: "24",
      content: "În figura alăturată, paralelipipedul dreptunghic ABCDA′B′C′D′ reprezintă un acvariu cu dimensiunile AB = 60 cm, BC = 40 cm și înălțimea AA′ = 60 cm. Apa din acvariu are adâncimea de 50 cm.\na) Arată că în acvariu sunt 120 de litri de apă.\nb) Se consideră punctul M pe muchia BB′ a paralelipipedului, astfel încât perimetrul triunghiului A′MC să aibă cea mai mică valoare. Determină distanța de la punctul M la planul (ABC).",
      figureNote: "Paralelipipedul dreptunghic ABCDA′B′C′D′ (acvariu): A′B′C′D′ sus, ABCD jos; M pe muchia BB′.",
      rubric: [
        { label: "a)", points: 2, answer: "V_apă = A_bază · h_apă = AB · BC · 50 = 60 · 40 · 50 = 120 000 cm³ = 120 dm³ = 120 de litri." },
        { label: "b)", points: 3, answer: "AC′ este constant, deci perimetrul triunghiului A′MC este minim când A′M + MC este minimă. Pe desfășurarea în plan a fețelor ce conțin muchia BB′, minimul se realizează când A′, M, C sunt coliniare. Din ΔCBM ~ ΔCAA′ rezultă MB/AA′ = CB/CA, de unde MB = 24 cm; cum MB = d(M, (ABC)), distanța de la M la planul (ABC) este 24 cm." },
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
  console.log(`\n=== import-exam-mate-2021-test-11 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
