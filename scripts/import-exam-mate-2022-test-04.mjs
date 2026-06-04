#!/usr/bin/env node
/**
 * import-exam-mate-2022-test-04.mjs — Exam-Bank, CNCE training Test 4 (Matematică, EN VIII 2021–2022)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2021–2022, Test de antrenament nr. 4. Public.
 *
 * Barem chei: I = 1b 2b 3d 4c 5c 6b · II = 1d 2c 3c 4b 5a 6b
 *   ⚠️ SII.6 BAREM-DISCREPANCY: baremul oficial tipărește „a)" (=8 dm), DAR răspunsul corect matematic
 *      este 8√2 dm = opțiunea b): pătrat AB=2 → diagonala BD=2√2; ΔVBD echilateral → VB=VD=BD=2√2;
 *      piramidă regulată ⇒ toate 4 muchiile laterale = 2√2; suma = 4·2√2 = 8√2 dm. Folosim b (corect).
 * NB: SI 1-6 fără figură (6 autoGradable). SII 1-6 toate cu figură. SIII.3 (grafic), 4 (dreptunghi),
 *     5 (triunghi echilateral), 6 (cub) cu figură. Total figuri = 10 (s2-1..6 + s3-3,4,5,6). Via 4uPDF.
 * finalAnswer: III.1="10" (apartamente 2 cam), III.2="2021" (n), III.6="30" (unghi grade). SKIP: III.3
 *   (√26 radical), III.4 (b „Arată că 16,32" tipărit), III.5 (demonstrație inegalitate PN>3√3).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2022-mate-test-04-${s}.png`;

const MATH = {
  source: "EN VIII 2022 Testul 4 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2022, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-04", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2022/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Numere prime. Diferență",
      content: "Diferența dintre numărul 21 și cel mai mic număr prim este egală cu:",
      options: [{ key: "a", text: "18" }, { key: "b", text: "19" }, { key: "c", text: "20" }, { key: "d", text: "21" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Ecuații simple",
      content: "Numărul natural nenul x pentru care 1/x = 1 este egal cu:",
      options: [{ key: "a", text: "−1" }, { key: "b", text: "1" }, { key: "c", text: "2" }, { key: "d", text: "3" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Media aritmetică. Intervale",
      content: "Media aritmetică a numerelor întregi din intervalul (−3, 4] este egală cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "1/2" }, { key: "c", text: "4/7" }, { key: "d", text: "1" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Divizibilitate. Fracții",
      content: "Mulțimea valorilor naturale ale lui x pentru care 6/(x+1) este număr natural este:",
      options: [{ key: "a", text: "{−7, −4, −3, −2, 0, 1, 2}" }, { key: "b", text: "{0, 1, 2, 3, 5}" }, { key: "c", text: "{0, 1, 2, 5}" }, { key: "d", text: "{1, 2, 5}" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Operații cu radicali",
      content: "Andrei, Dina, Matei și Nora calculează diferența dintre cel mai mare și cel mai mic dintre numerele reale x = 7 − 4√3 și y = 7 + 4√3. Rezultatele obținute de ei sunt trecute în tabelul următor:\n\nAndrei | Dina | Matei | Nora\n−8√3 | 0 | 8√3 | 14\n\nDintre cei patru elevi, cel care a calculat corect diferența este:",
      options: [{ key: "a", text: "Andrei" }, { key: "b", text: "Dina" }, { key: "c", text: "Matei" }, { key: "d", text: "Nora" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Probleme cu sume de bani",
      content: "Adrian are 150 de lei, iar Bogdan are 100 de lei. Adrian afirmă: „Dacă Bogdan mi-ar da jumătate din suma lui, atunci aș avea dublul sumei care i-ar rămâne lui Bogdan.” Afirmația lui Adrian este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente coliniare. Mijloace",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele distincte coliniare A, B, C, D, E (în această ordine) pe o dreaptă orizontală; C este mijlocul segmentului AE și, totodată, mijlocul segmentului BD; BC = 2·AB.",
      content: "În figura alăturată sunt reprezentate punctele distincte coliniare A, B, C, D și E, astfel încât punctul C este și mijlocul segmentului AE și mijlocul segmentului BD. Dacă BC = 2·AB, atunci numărul perechilor de segmente congruente, determinate de punctele date, este egal cu:",
      options: [{ key: "a", text: "1" }, { key: "b", text: "2" }, { key: "c", text: "3" }, { key: "d", text: "4" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri. Bisectoare. Perpendiculare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Punctele coliniare A, O, B (O între A și B) pe o dreaptă orizontală; semidreptele OE, OD, OC de aceeași parte a dreptei AB (E spre stânga, C spre dreapta); OC bisectoarea unghiului DOB, OE ⊥ OC, ∢DOE = 50°.",
      content: "În figura alăturată sunt reprezentate punctele coliniare A, O și B. Punctele C, D și E sunt situate de aceeași parte a dreptei AB, astfel încât semidreapta OC este bisectoarea unghiului DOB. Dreptele OE și OC sunt perpendiculare și măsura unghiului DOE este de 50°. Măsura unghiului AOE este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "40°" }, { key: "c", text: "50°" }, { key: "d", text: "100°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Mediană. Perpendiculară",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC dreptunghic în A (C sus, A jos-stânga, B jos-dreapta); M mijlocul ipotenuzei BC, MN ⊥ BC cu N pe latura AC; AM = 3 cm, ∢C = 30°.",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în A. Punctul M este mijlocul segmentului BC, iar AM = 3 cm. Măsura unghiului C este egală cu 30°, iar dreptele MN și BC sunt perpendiculare. Lungimea segmentului MN este egală cu:",
      options: [{ key: "a", text: "√3/2 cm" }, { key: "b", text: "1,5 cm" }, { key: "c", text: "√3 cm" }, { key: "d", text: "3 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Trapez. Linie mijlocie. Arie",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Trapezul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta) cu suprafața de 424 m²; EF linia mijlocie (F pe AD, E pe BC); triunghiul CEF hașurat.",
      content: "Figura alăturată reprezintă schița unui teren în formă de trapez ABCD cu suprafața de 424 m². Dacă EF este linia mijlocie a trapezului ABCD, atunci aria triunghiului CEF este:",
      options: [{ key: "a", text: "53 m²" }, { key: "b", text: "106 m²" }, { key: "c", text: "207 m²" }, { key: "d", text: "212 m²" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Diametru. Unghi înscris",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu A și B diametral opuse (AB diametru orizontal), D sus și C jos pe cerc; coardele AB și CD concurente; ∢DOB = 70°.",
      content: "Punctele A, B, C și D sunt situate pe un cerc de centru O, astfel încât punctele A și B sunt diametral opuse, segmentele AB și CD sunt concurente, iar măsura unghiului DOB este de 70°. Măsura unghiului ACD este egală cu:",
      options: [{ key: "a", text: "55°" }, { key: "b", text: "70°" }, { key: "c", text: "110°" }, { key: "d", text: "180°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Piramidă regulată. Muchii laterale",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Piramida regulată VABCD cu baza pătratul ABCD (V vârful sus, A față-stânga, B față-dreapta, C dreapta, D stânga); triunghiul VBD echilateral (evidențiat); AB = 2 dm.",
      content: "În figura alăturată este reprezentată o piramidă regulată VABCD, cu baza pătratul ABCD. Dacă triunghiul VBD este echilateral și AB = 2 dm, atunci suma lungimilor muchiilor laterale ale piramidei este egală cu:",
      options: [{ key: "a", text: "8 dm" }, { key: "b", text: "8√2 dm" }, { key: "c", text: "4√2 dm" }, { key: "d", text: "6 dm" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Sisteme de ecuații",
      finalAnswer: "10",
      content: "Într-un bloc de locuințe sunt 110 camere, repartizate în 40 de apartamente cu 2, respectiv cu 3 camere.\na) Este posibil ca numărul apartamentelor cu două camere din acel bloc să fie egal cu numărul apartamentelor cu trei camere? Justifică răspunsul dat.\nb) Determină numărul apartamentelor cu 2 camere din acest bloc.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă numărul apartamentelor cu 2 camere ar fi egal cu cel al apartamentelor cu 3 camere, ar fi câte 20 din fiecare, deci 20·2 + 20·3 = 100 de camere. Cum 100 ≠ 110, nu este posibil ca cele două numere să fie egale." },
        { label: "b)", points: 3, answer: "Notăm cu x numărul apartamentelor cu 2 camere și cu y numărul celor cu 3 camere; x + y = 40 și 2x + 3y = 110. Din 2x + 3(40 − x) = 110 rezultă x = 10 apartamente cu 2 camere." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Sume telescopice",
      finalAnswer: "2021",
      content: "Se consideră expresia E(x) = (−x + x²)² + 4x³, unde x este număr real.\na) Arată că E(−1) = E(0).\nb) Determină numărul natural nenul n, știind că 1/√E(1) + 1/√E(2) + 1/√E(3) + ... + 1/√E(n) = 2021/2022.",
      rubric: [
        { label: "a)", points: 2, answer: "E(−1) = (1 + 1)² + 4·(−1) = 4 − 4 = 0 și E(0) = 0 + 0 = 0, deci E(−1) = E(0)." },
        { label: "b)", points: 3, answer: "E(x) = (x² − x)² + 4x³ = x⁴ − 2x³ + x² + 4x³ = x⁴ + 2x³ + x² = (x² + x)², deci √E(n) = n² + n = n(n+1). Suma 1/(1·2) + 1/(2·3) + ... + 1/(n(n+1)) = 1 − 1/(n+1) = n/(n+1). Din n/(n+1) = 2021/2022 rezultă n = 2021." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Distanțe în plan",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistemul de axe ortogonale xOy cu graficul funcției f(x)=2−x (dreaptă descrescătoare); A intersecția cu Ox (la dreapta), B intersecția cu Oy (sus), C(−4,0) pe Ox la stânga.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = 2 − x.\na) Calculează (f(0) − f(2))/2.\nb) Știind că A și B sunt punctele de intersecție a reprezentării grafice a funcției f cu axele Ox, respectiv Oy ale sistemului de axe ortogonale xOy, determină distanța dintre punctul C(−4, 0) și mijlocul segmentului AB.",
      rubric: [
        { label: "a)", points: 2, answer: "f(0) = 2 și f(2) = 0, deci (f(0) − f(2))/2 = (2 − 0)/2 = 1." },
        { label: "b)", points: 3, answer: "Graficul intersectează axele în A(2, 0) și B(0, 2). Mijlocul segmentului AB este M(1, 1). Distanța de la C(−4, 0) la M este CM = √((1 − (−4))² + (1 − 0)²) = √(25 + 1) = √26 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Asemănare. Arii",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Dreptunghiul ABCD (D sus-stânga, M pe DC, C sus-dreapta, A jos-stânga, B jos-dreapta) cu AB=8 cm, AD=6 cm; M mijlocul lui CD, N pe diagonala BD cu MN ⊥ BD.",
      content: "În figura alăturată este reprezentat un dreptunghi ABCD cu AB = 8 cm și AD = 6 cm. Punctul M este mijlocul laturii CD, iar punctul N se află pe BD, astfel încât dreptele MN și BD sunt perpendiculare.\na) Calculează perimetrul triunghiului ABD.\nb) Arată că aria triunghiului BCN este 16,32 cm².",
      rubric: [
        { label: "a)", points: 2, answer: "În triunghiul ABD dreptunghic în A, BD = √(AB² + AD²) = √(64 + 36) = 10 cm. Perimetrul triunghiului ABD = AB + AD + BD = 8 + 6 + 10 = 24 cm." },
        { label: "b)", points: 3, answer: "ΔMND ~ ΔBCD cu raportul (DM/BD)² = (4/10)² = 4/25, deci A(MND) = (4/25)·A(BCD). A(BCD) = A(ABCD)/2... (M mijlocul lui CD) ⇒ A(CMN) = A(MND) = 96/25 = 3,84 cm². Atunci A(BCN) = A(BCD) − A(MND) = 24 − 7,68 = 16,32 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi echilateral. Inegalități",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul echilateral ABC (A sus, B jos-stânga, C jos-dreapta) cu AB=8 cm; M mijlocul lui BC, N mijlocul lui AC, P pe latura AB cu MP ⊥ AB.",
      content: "În figura alăturată este reprezentat un triunghi echilateral ABC, cu AB = 8 cm. Punctele M și N sunt mijloacele segmentelor BC, respectiv AC, iar punctul P se află pe latura AB, astfel încât dreptele MP și AB sunt perpendiculare.\na) Arată că BP = 2 cm.\nb) Arată că lungimea segmentului PN este mai mare decât 3√3 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiul BMP este dreptunghic în P, cu ∢BPM = 90° și ∢BMP = 30° (deoarece ∢B = 60°). Atunci BP = BM/2 = (BC/2)/2 = 8/4 = 2 cm." },
        { label: "b)", points: 3, answer: "MN = AB/2 = 4 cm (linie mijlocie) și MP = √(BM² − BP²) = √(16 − 4) = 2√3 cm. Măsura unghiului PMN este 180° − (30° + 60°) = 90°, deci triunghiul PMN este dreptunghic în M, de unde PN = √(PM² + MN²) = √(12 + 16) = 2√7 cm. Cum 2√7 > 3√3 (echivalent 28 > 27), rezultă PN > 3√3 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Volum. Unghi dreaptă-plan",
      hasFigure: true, figureUrl: FIG("s3-6"), finalAnswer: "30",
      figureNote: "Cubul ABCDA'B'C'D' (baza inferioară ABCD, baza superioară A'B'C'D') cu AB=6 cm; Q mijlocul segmentului A'D; triunghiul A'BC evidențiat.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D' cu AB = 6 cm.\na) Arată că volumul cubului este mai mare decât 0,2 litri.\nb) Calculează unghiul dintre dreapta AQ și planul (A'BC), unde punctul Q este mijlocul segmentului A'D.",
      rubric: [
        { label: "a)", points: 2, answer: "Volumul cubului V = AB³ = 6³ = 216 cm³ = 0,216 dm³ = 0,216 litri. Cum 0,216 > 0,2, volumul cubului este mai mare decât 0,2 litri." },
        { label: "b)", points: 3, answer: "A'D' ⊂ (A'BC) și A'D' ⊥ (ABB'A'), deci (A'BC) ⊥ (ABB'A') și AM ⊥ (A'BC), unde M este mijlocul lui A'B. Cum Q ∈ A'D, ∢(AQ, (A'BC)) = ∢(AD', MD') = ∢AD'M. În triunghiul AD'M dreptunghic în M, AD' = 2·AM, deci ∢AD'M = 30°." },
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
  console.log(`\n=== import-exam-mate-2022-test-04 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
