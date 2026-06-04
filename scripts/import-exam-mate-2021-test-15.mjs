#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-15.mjs — Exam-Bank, CNCE training Test 15 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 15.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1c 2b 3a 4a 5d 6b · II = 1c 2a 3c 4d 5b 6b
 * NB: SI 1-5 text/tabele fără figură → 5 autoGradable. SI.6 (pie chart) cu figură. SII 1-6 toate cu
 *     figură. SIII.3 (grafic), 4 (triunghi), 5 (patrulater), 6 (piramidă) cu figură. Deci 11 figuri
 *     (s1-6 + s2-1..6 + s3-3,4,5,6). Via 4uPDF (pie chart = vector, randat de extract-region).
 * finalAnswer: III.1="25" (găini), III.2="0" (N=2a-5b), III.3="6" (suma distanțelor), III.6="5"
 *   (proiecția MN). SKIP: III.4 (80√41/41 radical), III.5 (demonstrații).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-15-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 15 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-15", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Numere naturale. Cifre identice",
      content: "Cel mai mic număr par de ordinul zecilor, format cu cifre identice, este numărul:",
      options: [{ key: "a", text: "10" }, { key: "b", text: "11" }, { key: "c", text: "22" }, { key: "d", text: "98" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Fracție dintr-un număr",
      content: "Numărul care reprezintă 3/4 din 1600 este egal cu:",
      options: [{ key: "a", text: "120" }, { key: "b", text: "1200" }, { key: "c", text: "6400/3" }, { key: "d", text: "4800" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi. Operații",
      content: "Patru elevi propun câte un exercițiu de calcul. În tabelul de mai jos sunt scrise numele elevilor și exercițiile propuse de aceștia.\n\nElev | Exercițiu\nAlina | −3 + (−4)\nMihai | −3 + 4\nDaria | −(−3) + 4\nVlad | +3 − 4\n\nConform informațiilor din tabel, prin rezolvarea corectă a calculelor, rezultatul care reprezintă cel mai mic număr corespunde exercițiului propus de:",
      options: [{ key: "a", text: "Alina" }, { key: "b", text: "Mihai" }, { key: "c", text: "Daria" }, { key: "d", text: "Vlad" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Sistem de ecuații. Probleme",
      content: "Șase caiete tip dictando și cinci caiete de matematică costă 15 lei, iar șase caiete tip dictando și două caiete de matematică costă 11,4 lei. Prețul unui caiet de matematică este de:",
      options: [{ key: "a", text: "1,2 lei" }, { key: "b", text: "1,5 lei" }, { key: "c", text: "2,1 lei" }, { key: "d", text: "3,6 lei" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Intervale",
      content: "Numărul 2√7 aparține intervalului de numere reale:",
      options: [{ key: "a", text: "(2, 3)" }, { key: "b", text: "[3, 4]" }, { key: "c", text: "[4, 5)" }, { key: "d", text: "(5, 6)" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Diagrame circulare. Procente",
      hasFigure: true, figureUrl: FIG("s1-6"),
      figureNote: "Diagramă circulară (pie chart) cu distribuția celor 300 de pomi fructiferi: meri 20%, peri 45%, caiși (restul); legendă: meri, peri, caiși.",
      content: "Într-o livadă sunt 300 de pomi fructiferi de trei tipuri: meri, peri și caiși. În diagrama de mai jos este reprezentată distribuția celor 300 de pomi fructiferi în funcție de tipul acestora. Conform diagramei, numărul caișilor din livadă este egal cu:",
      options: [{ key: "a", text: "60" }, { key: "b", text: "105" }, { key: "c", text: "135" }, { key: "d", text: "150" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloace",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele coliniare distincte A, B, C, D, E (în această ordine) pe o dreaptă orizontală; C este mijlocul segmentului AE și, totodată, al segmentului BD.",
      content: "În figura alăturată sunt reprezentate punctele coliniare A, B, C, D și E, distincte, în această ordine, astfel încât punctul C este mijlocul segmentului AE și, respectiv, al segmentului BD. Dintre afirmațiile următoare, cea adevărată este:",
      options: [{ key: "a", text: "AC − CD > DE" }, { key: "b", text: "AC − CD < DE" }, { key: "c", text: "AC − CD = DE" }, { key: "d", text: "AC + CD = DE" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi. Bisectoare. Unghiul BIC",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Triunghiul ABC (A sus, B dreapta, C jos-stânga) cu I punctul de intersecție al bisectoarelor (incentru); unghiul BIC = 120°.",
      content: "În figura alăturată este reprezentat triunghiul ABC. Punctul I este punctul de intersecție a bisectoarelor unghiurilor acestui triunghi. Știind că măsura unghiului BIC este egală cu 120°, atunci măsura unghiului BAI este:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "120°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Linii mijlocii. Perimetru",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC (A sus, B jos-stânga, C jos-dreapta) cu M, N, P mijloacele laturilor AB, AC, BC și Q, R, T mijloacele segmentelor MP, NP, MN (triunghi interior QRT).",
      content: "În figura alăturată este reprezentat triunghiul ABC. Punctele M, N și P sunt mijloacele laturilor AB, AC, respectiv BC, iar punctele Q, R și T sunt mijloacele segmentelor MP, NP, respectiv MN. Raportul dintre perimetrul triunghiului QRT și perimetrul triunghiului ABC este egal cu:",
      options: [{ key: "a", text: "1/2" }, { key: "b", text: "1/3" }, { key: "c", text: "1/4" }, { key: "d", text: "1/12" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Romb. Distanță. Arie",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Rombul ABCD (B sus, A stânga, C dreapta, D jos) cu diagonalele AC și BD intersectându-se în O.",
      content: "Se consideră rombul ABCD în care diagonalele AC și BD se intersectează în punctul O. Perimetrul rombului este egal cu 100 cm, iar distanța de la punctul A la dreapta BC este egală cu 24 cm. Aria suprafeței triunghiului AOB este egală cu:",
      options: [{ key: "a", text: "2400 cm²" }, { key: "b", text: "600 cm²" }, { key: "c", text: "300 cm²" }, { key: "d", text: "150 cm²" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Coardă. Lungimea cercului",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu punctele A și B pe cerc (coarda AB jos, orizontală); distanța de la O la dreapta AB reprezentată ca segment vertical.",
      content: "În figura alăturată este reprezentat cercul de centru O și punctele A și B care aparțin acestui cerc. Lungimea segmentului AB este de 8 cm și distanța de la centrul cercului la dreapta AB este de 3 cm. Lungimea acestui cerc este egală cu:",
      options: [{ key: "a", text: "25π cm" }, { key: "b", text: "10π cm" }, { key: "c", text: "8π cm" }, { key: "d", text: "5π cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelipiped dreptunghic. Pătrat",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Paralelipipedul dreptunghic ABCDEFGH (baza inferioară ABCD, baza superioară EFGH) cu secțiunea diagonală ACGE evidențiată.",
      content: "În figura alăturată este reprezentat paralelipipedul dreptunghic ABCDEFGH care are dimensiunile: AB = 2√2 cm, BC = 3√3 cm și AE = 5 cm. Afirmația „Patrulaterul ACGE este pătrat.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Sisteme de ecuații",
      finalAnswer: "25",
      content: "Bunica Mariei are în ograda sa iepuri, găini și rațe. În total, în ogradă sunt 69 de animale care au 198 de picioare. Numărul găinilor este cu 11 mai mare decât al rațelor.\na) Pot fi în ograda bunicii Mariei 35 de iepuri? Justifică răspunsul dat.\nb) Determină numărul găinilor din ograda bunicii Mariei.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă ar fi 35 de iepuri, atunci 35·4 + 2(g + r) = 198, unde g este numărul găinilor și r al rațelor, deci g + r = 29. Cum 35 + 29 = 64 ≠ 69, deducem că în ograda bunicii Mariei nu pot fi 35 de iepuri." },
        { label: "b)", points: 3, answer: "Cum g = r + 11, deci r = g − 11, din i + g + r = 69 rezultă i + 2g = 80, unde i este numărul iepurilor. Din 4i + 2(g + r) = 198 și r = g − 11 obținem i + g = 55. Scăzând, g = 80 − 55 = 25 găini." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Operații cu fracții și radicali",
      finalAnswer: "0",
      content: "Se consideră numerele: a = −1/2 + 1/3 : 1/4 și b = (√3/2 − 2/√3)² − (√3/2 − 1)·(1 + √3/2).\na) Arată că a = 5/6.\nb) Arată că numărul N = 2a − 5b este natural.",
      rubric: [
        { label: "a)", points: 2, answer: "a = −1/2 + (1/3 : 1/4) = −1/2 + 1/3·4 = −1/2 + 4/3 = (−3 + 8)/6 = 5/6." },
        { label: "b)", points: 3, answer: "b = (√3/2 − 2/√3)² − (√3/2 − 1)(1 + √3/2) = (√3/2 − 2√3/3)² − (3/4 − 1) = 3/4 − 2 + 4/3 − (3/4 − 1) = 4/3 − 1 = 1/3. Atunci N = 2a − 5b = 2·(5/6) − 5·(1/3) = 5/3 − 5/3 = 0 ∈ ℕ." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Distanțe la axe",
      hasFigure: true, figureUrl: FIG("s3-3"), finalAnswer: "6",
      figureNote: "Sistemul de axe ortogonale xOy cu graficul funcției f (dreaptă crescătoare), punctele A pe Ox, B pe Oy și C pe grafic (sus-dreapta).",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = 2x − 3.\na) Arată că: f(2) + f(1/2) = f(2·1/2).\nb) Reprezentarea geometrică a graficului funcției f intersectează axele Ox și Oy ale sistemului de axe ortogonale xOy în punctele A, respectiv B. Punctul C aparține reprezentării grafice a funcției f astfel încât punctul A este mijlocul segmentului BC. Calculează suma distanțelor de la punctul C la axele de coordonate.",
      rubric: [
        { label: "a)", points: 2, answer: "f(2) = 1, f(1/2) = −2, iar f(2·1/2) = f(1) = −1; deci f(2) + f(1/2) = 1 + (−2) = −1 = f(2·1/2)." },
        { label: "b)", points: 3, answer: "A(3/2, 0) și B(0, −3) sunt intersecțiile graficului cu axele Ox, respectiv Oy. A fiind mijlocul lui BC, C = 2A − B = (3, 3). Distanța de la C la Oy este 3, iar la Ox este 3, deci suma distanțelor de la C la axele de coordonate este 3 + 3 = 6." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi isoscel. Centru de greutate",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghiul isoscel ABC (A sus, B jos-stânga, C jos-dreapta) cu T mijlocul lui BC, G centrul de greutate pe AT, și S simetricul lui G față de mijlocul lui AC (dreapta sus).",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC cu AB ≡ AC, BC = 20 cm, punctul G reprezintă centrul de greutate al triunghiului ABC, punctul T este mijlocul segmentului BC și GT = 8 cm. Punctul S este simetricul punctului G față de mijlocul segmentului AC.\na) Arată că perimetrul triunghiului ABC este egal cu 72 cm.\nb) Calculează distanța de la punctul S la dreapta CG.",
      rubric: [
        { label: "a)", points: 2, answer: "În triunghiul isoscel ABC, AT este mediană, deci și înălțime; G fiind centrul de greutate, AT = 3·GT = 24 cm. Triunghiul ATB este dreptunghic în T, deci AB = √(AT² + BT²) = √(576 + 100) = 26 cm, de unde P(ABC) = AB + AC + BC = 26 + 26 + 20 = 72 cm." },
        { label: "b)", points: 3, answer: "Fie N mijlocul lui AC (BG ∩ AC = N); cum S este simetricul lui G față de N, GN ≡ NS și BG ≡ GS, deci GT este linie mijlocie în triunghiul BGS, de unde SC ⊥ BC. A(SGC) = A(SBC) − A(GBC) = (BC·SC)/2 − (BC·GT)/2 = (20·16)/2 − (20·8)/2 = 80 cm². În triunghiul GTC dreptunghic în T, GC² = GT² + TC² = 64 + 100 = 164, deci GC = 2√41 cm. Din A(GSC) = (GC·d(S, GC))/2 = 80, obținem d(S, CG) = 160/(2√41) = 80/√41 = 80√41/41 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Patrulater. Trigonometrie. Bisectoare",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Patrulaterul ABCD (A jos-stânga, B jos-mijloc, C sus-dreapta, D stânga) cu diagonala BD trasată.",
      content: "În figura alăturată este reprezentat patrulaterul ABCD cu AB = 8 cm, BC = 20 cm, CD = 25 cm, AD = 4 cm și BD = 10 cm.\na) Arată că raportul dintre sinusul unghiului ADB și sinusul unghiului ABD este egal cu 2.\nb) Demonstrează că semidreapta DB este bisectoarea unghiului ADC.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie AT ⊥ BD, T ∈ BD. Atunci sin(∢ADB) = AT/AD și sin(∢ABD) = AT/AB, deci sin(∢ADB)/sin(∢ABD) = AB/AD = 8/4 = 2." },
        { label: "b)", points: 3, answer: "DA/BD = 4/10, AB/BC = 8/20, BD/CD = 10/25, deci DA/BD = AB/BC = BD/CD = 2/5, de unde ΔBDA ~ ΔCDB. Rezultă ∢ADB ≡ ∢BDC, deci DB este bisectoarea unghiului ADC." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă regulată. Proiecție",
      hasFigure: true, figureUrl: FIG("s3-6"), finalAnswer: "5",
      figureNote: "Piramida triunghiulară regulată VABC (V sus) cu baza ABC; M mijlocul lui BC, N mijlocul lui VC.",
      content: "În figura alăturată este reprezentată piramida triunghiulară regulată VABC cu baza triunghiul ABC, AB = 6 cm, VA = 10 cm. Punctele M și N sunt mijloacele segmentelor BC, respectiv VC.\na) Arată că aria laterală a piramidei este egală cu 9√91 cm².\nb) Determină lungimea proiecției segmentului MN pe planul (VAB).",
      rubric: [
        { label: "a)", points: 2, answer: "Apotema VM: VM² = VB² − BM² = 100 − 9 = 91, deci VM = √91 cm. Aria laterală = 3·(BC·VM)/2 = 3·(6·√91)/2 = 9√91 cm²." },
        { label: "b)", points: 3, answer: "MN este linie mijlocie în triunghiul VBC, deci MN ∥ VB și MN = VB/2 = 5 cm. Cum VB ⊂ (VAB) și MN ∥ VB, rezultă MN ∥ (VAB), deci proiecția segmentului MN pe planul (VAB) este un segment de lungime egală cu MN, adică 5 cm." },
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
  console.log(`\n=== import-exam-mate-2021-test-15 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
