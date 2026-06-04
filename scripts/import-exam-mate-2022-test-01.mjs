#!/usr/bin/env node
/**
 * import-exam-mate-2022-test-01.mjs — Exam-Bank, CNCE training Test 1 (Matematică, EN VIII 2021–2022)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2021–2022, Test de antrenament nr. 1.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1c 2b 3d 4c 5b 6a · II = 1d 2c 3c 4c 5a 6b
 * NB: SI 1-6 text/tabele fără figură → 6 autoGradable. SII 1-6 toate cu figură. SIII.4 (trapez),
 *     5 (dreptunghi/gresie), 6 (piramidă) cu figură. Deci 9 figuri (s2-1..6 + s3-4,5,6). Via 4uPDF.
 * finalAnswer: III.1="360" (kg mere), III.2="0" (n natural), III.3="9" (xy natural), III.5="12/7"
 *   (raport arii). SKIP: III.4 (72√3 radical), III.6 (demonstrație VM⊥BC).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2022-mate-test-01-${s}.png`;

const MATH = {
  source: "EN VIII 2022 Testul 1 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2022, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-01", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2022/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Cel mai mic multiplu comun",
      content: "Cel mai mic multiplu comun al numerelor 2 și 5 este egal cu:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "7" }, { key: "c", text: "10" }, { key: "d", text: "20" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporții",
      content: "Valoarea numărului x din proporția x/15 = 4/5 este egală cu:",
      options: [{ key: "a", text: "4" }, { key: "b", text: "12" }, { key: "c", text: "15" }, { key: "d", text: "60" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi. Diferență de temperaturi",
      content: "Duminică, temperatura măsurată la ora 10, la o stație meteo de pe vârful Omu, a fost de −17°C, în timp ce temperatura măsurată la aceeași oră în Baia Mare a fost de 4°C. Temperatura înregistrată duminică la ora 10 în Baia Mare este mai mare decât temperatura înregistrată în același timp pe vârful Omu cu:",
      options: [{ key: "a", text: "−21°C" }, { key: "b", text: "−13°C" }, { key: "c", text: "13°C" }, { key: "d", text: "21°C" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Ordonarea fracțiilor",
      content: "Dintre următoarele seturi de numere, cel scris în ordine descrescătoare este:",
      options: [{ key: "a", text: "3/4, 1/2, 13/24, 2/3" }, { key: "b", text: "13/24, 3/4, 2/3, 1/2" }, { key: "c", text: "3/4, 2/3, 13/24, 1/2" }, { key: "d", text: "1/2, 2/3, 3/4, 13/24" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Operații cu radicali",
      content: "Patru elevi, Ana, Cristian, George și Lia, au calculat produsul numerelor √2, √5, √8 și √20. Rezultatele obținute sunt prezentate în tabelul de mai jos:\n\nAna | Cristian | George | Lia\n80 | 40 | 16√10 | 4√10\n\nDintre cei patru elevi, cel care a obținut rezultatul corect a fost:",
      options: [{ key: "a", text: "Ana" }, { key: "b", text: "Cristian" }, { key: "c", text: "George" }, { key: "d", text: "Lia" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Interpretarea datelor în tabel",
      content: "În tabelul de mai jos este reprezentat numărul de bilete vândute pentru două filme care au rulat la un cinematograf într-o zi de duminică, în funcție de ora începerii.\n\nOra începerii filmului | 11:30 | 13:30 | 15:30 | 17:30 | 19:30 | 21:30\nNumărul biletelor vândute pentru filmul A | 25 | 95 | 83 | 60 | 40 | 92\nNumărul biletelor vândute pentru filmul B | 16 | 47 | 91 | 42 | 30 | 86\n\nAna afirmă că: „Cel mai mare număr de bilete vândute este pentru filmele cu ora de început 21:30”. Afirmația Anei este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloace",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele coliniare A, B, M, C, D (în această ordine) pe o dreaptă orizontală; M mijlocul lui AD, B mijlocul lui AC, segmentele AB și CD congruente.",
      content: "În figura următoare sunt reprezentate punctele coliniare A, B, M, C și D, în această ordine. Punctul M este mijlocul segmentului AD, punctul B este mijlocul segmentului AC, iar segmentele AB și CD sunt congruente. Dacă BM = 2,5 cm, atunci segmentul AC are lungimea egală cu:",
      options: [{ key: "a", text: "2,5 cm" }, { key: "b", text: "5 cm" }, { key: "c", text: "7,5 cm" }, { key: "d", text: "10 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiul AOB cu vârful O (B sus, A pe semidreapta orizontală dreapta); semidreptele OD și OC în interior, OC bisectoarea unghiului AOD; unghiurile AOC și BOD au fiecare 26°.",
      content: "În figura următoare, punctele C și D sunt situate în interiorul unghiului AOB, astfel încât semidreapta OC este bisectoarea unghiului AOD, iar fiecare dintre unghiurile AOC și BOD are măsura de 26°. Măsura unghiului BOC este egală cu:",
      options: [{ key: "a", text: "26°" }, { key: "b", text: "39°" }, { key: "c", text: "52°" }, { key: "d", text: "78°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Perpendiculare",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC dreptunghic în A (C sus-stânga, A jos-stânga, B jos-dreapta); din A se duce perpendiculara AM pe BC (M pe BC), apoi din M perpendiculara MN pe AB (N pe AB). AB=40 dm, ∢B=30°.",
      content: "La cercul de robotică, Radu a creat un roboțel care se poate deplasa parcurgând drumul cel mai scurt de la un punct la o dreaptă. Terenul de verificare, reprezentat în figura următoare, are forma unui triunghi ABC, dreptunghic în A, cu AB = 40 dm și ∢B = 30°. Roboțelul pornește din punctul A către dreapta BC, pe care o întâlnește în punctul M, după care se deplasează spre dreapta AB, pe care o intersectează în punctul N. Lungimea segmentului AN este egală cu:",
      options: [{ key: "a", text: "20 dm" }, { key: "b", text: "15 dm" }, { key: "c", text: "10 dm" }, { key: "d", text: "5 dm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Pătrat. Triunghi isoscel. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Pătratul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta) cu punctul M în interior (lângă latura DC); ∢DAM=30° și AM=CD.",
      content: "În figura următoare, M este un punct în interiorul pătratului ABCD, astfel încât măsura unghiului DAM este egală cu 30° și AM = CD. Măsura unghiului ADM este egală cu:",
      options: [{ key: "a", text: "45°" }, { key: "b", text: "60°" }, { key: "c", text: "75°" }, { key: "d", text: "90°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Triunghi echilateral. Diametru",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu punctele A (sus), B (jos-stânga), C (jos-dreapta) și D (dreapta) pe cerc; triunghiul ABC echilateral, BD diametru.",
      content: "Punctele A, B, C și D sunt situate pe un cerc de centru O, astfel încât triunghiul ABC este echilateral și BD este diametru. Măsura unghiului ACD este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "90°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelipiped dreptunghic. Volum",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Paralelipipedul dreptunghic ABCDEFGH (baza inferioară ABCD, baza superioară EFGH); AE=20 cm, AB=12 cm, AD=5 cm.",
      content: "O cutie plină cu suc de caise are forma unui paralelipiped dreptunghic ABCDEFGH cu AE = 20 cm, AB = 12 cm și AD = 5 cm. Tot sucul din cutie se toarnă în pahare de 200 ml. Numărul paharelor umplute cu sucul de caise din cutie este egal cu:",
      options: [{ key: "a", text: "5" }, { key: "b", text: "6" }, { key: "c", text: "12" }, { key: "d", text: "20" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Sisteme de ecuații",
      finalAnswer: "360",
      content: "La un magazin s-au vândut într-o zi 500 kg de cireșe și de mere. Suma obținută prin vânzarea acestora este de 4620 de lei. Un kilogram de cireșe costă 15 lei, iar un kilogram de mere costă 7 lei.\na) Este posibil ca suma obținută din vânzarea cireșelor să fie egală cu suma obținută din vânzarea merelor? Justifică răspunsul dat.\nb) Câte kilograme de mere s-au vândut în ziua aceea la magazin?",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă suma obținută din vânzarea cireșelor ar fi egală cu suma obținută din vânzarea merelor, fiecare dintre aceste sume ar fi de 4620:2 = 2310 lei. Cantitatea de cireșe vândute ar fi de 2310:15 = 154 kg, iar cea de mere ar fi de 2310:7 = 330 kg. Cum 154 + 330 = 484 ≠ 500, deducem că suma obținută din vânzarea cireșelor nu poate fi egală cu suma obținută din vânzarea merelor." },
        { label: "b)", points: 3, answer: "Notăm cu x numărul kilogramelor de mere vândute, deci numărul kilogramelor de cireșe vândute este 500 − x. Din 15(500 − x) + 7x = 4620 rezultă x = 360, deci s-au vândut 360 kg de mere." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Pătrate perfecte",
      finalAnswer: "0",
      content: "Se consideră expresia E(x) = (4x + 3)² + (2x − 4)(4x + 3) + (x − 2)², unde x ∈ ℝ.\na) Verifică dacă E(−3) este pătratul unui număr natural.\nb) Determină numărul natural n pentru care √E(n) ≤ 3.",
      rubric: [
        { label: "a)", points: 2, answer: "E(−3) = (−9)² + (−10)·(−9) + (−5)² = 81 + 90 + 25 = 196 = 14², deci este pătratul unui număr natural." },
        { label: "b)", points: 3, answer: "E(x) = 25x² + 10x + 1 = (5x + 1)², deci √E(n) = 5n + 1. Din 5n + 1 ≤ 3 rezultă n ≤ 2/5 și, cum n este număr natural, rezultă n = 0." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Operații cu radicali",
      finalAnswer: "9",
      content: "Se consideră numerele reale x = √144 + 2√18 − (√3)² și y = (√5 − √3)² − √72 + (√5 + √3)² − 7.\na) Arată că x = 9 + 6√2.\nb) Arată că produsul numerelor x și y este număr natural.",
      rubric: [
        { label: "a)", points: 2, answer: "x = √144 + 2√18 − (√3)² = 12 + 6√2 − 3 = 9 + 6√2." },
        { label: "b)", points: 3, answer: "y = (√5 − √3)² − √72 + (√5 + √3)² − 7 = (8 − 2√15) − 6√2 + (8 + 2√15) − 7 = 9 − 6√2. Atunci xy = (9 + 6√2)(9 − 6√2) = 9² − (6√2)² = 81 − 72 = 9, care este număr natural." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez dreptunghic. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Trapezul dreptunghic ABCD cu AB∥CD, dreptunghic în A; B jos-dreapta, A jos-stânga, D-C la mijloc, M punctul de intersecție al dreptelor AD și BC (sus). AB=12 cm, BC=CD=8 cm, ∢A=90°.",
      content: "În figura alăturată este reprezentat trapezul dreptunghic ABCD cu AB∥CD, AB = 12 cm, BC = CD = 8 cm, iar unghiul A are măsura egală cu 90°.\na) Arată că AD = 4√3 cm.\nb) Calculează aria triunghiului ABM, unde AD ∩ BC = {M}.",
      rubric: [
        { label: "a)", points: 2, answer: "Construim CE ⊥ AB, E ∈ AB; cum ∢A = ∢D = ∢E = 90°, AECD este dreptunghi, deci AE = CD = 8 cm, de unde EB = 4 cm. Triunghiul CEB este dreptunghic în E, deci CE = √(BC² − EB²) = √(64 − 16) = 4√3 cm și, cum AD = CE, obținem AD = 4√3 cm." },
        { label: "b)", points: 3, answer: "CD∥AB, deci ΔMDC ~ ΔMAB, de unde MD/MA = DC/AB = 8/12 = 2/3. Din MA − MD = AD = 4√3 rezultă MA = 12√3 cm. Cum AD ⊥ AB, aria triunghiului ABM = (MA · AB)/2 = (12√3 · 12)/2 = 72√3 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Asemănare. Arii",
      hasFigure: true, figureUrl: FIG("s3-5"), finalAnswer: "12/7",
      figureNote: "Dreptunghiul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta) cu N și M pe latura DC (D, N, M, C în această ordine), DN=NM=MC; O intersecția dreptelor AM și BN; patrulaterele ADNO și BCMO hașurate.",
      content: "În figura următoare este reprezentată o placă de gresie de forma unui dreptunghi ABCD cu AB = 60 cm și BC = 40 cm. Punctele M și N sunt situate pe segmentul DC astfel încât DN = MN = MC, iar O este punctul de intersecție a dreptelor AM și BN.\na) Arată că perimetrul patrulaterului ABMN este egal cu 40(2 + √5) cm.\nb) Determină raportul dintre aria dreptunghiului ABCD și suma ariilor patrulaterelor ADNO și BCMO.",
      rubric: [
        { label: "a)", points: 2, answer: "DN = NM = MC = 60:3 = 20 cm. AN = √(AD² + DN²) = √(40² + 20²) = 20√5 cm și BM = 20√5 cm, deci P(ABMN) = AB + BM + MN + NA = 60 + 20√5 + 20 + 20√5 = 40(2 + √5) cm." },
        { label: "b)", points: 3, answer: "ΔOMN ~ ΔOAB (MN∥AB), deci d(O,MN)/d(O,AB) = MN/AB = 1/3. Cum d(O,MN) + d(O,AB) = 40 cm, rezultă d(O,MN) = 10 cm, d(O,AB) = 30 cm, deci A(OMN) = MN·d(O,MN)/2 = 100 cm² și A(OAB) = AB·d(O,AB)/2 = 900 cm². A(ABCD) = AB·BC = 2400 cm², deci raportul căutat este A(ABCD) / (A(ABCD) − (A(OMN) + A(OAB))) = 2400/1400 = 12/7." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă patrulateră. Perpendicularitate",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Piramida VABCD cu baza pătratul ABCD (B jos-stânga, C jos, D dreapta, A mijloc), V vârful; O intersecția diagonalelor AC și BD; P mijlocul lui VB, Q mijlocul lui CV. AB=8 cm, VO=4√2 cm.",
      content: "În figura alăturată este reprezentată o piramidă VABCD cu ABCD pătrat, AB = 8 cm și înălțimea VO = 4√2 cm, unde O este punctul de intersecție a dreptelor AC și BD. Punctele P și Q sunt mijloacele segmentelor VB, respectiv CV.\na) Arată că VB = 8 cm.\nb) Demonstrează că dreptele VM și BC sunt perpendiculare, unde {M} = AP ∩ DQ.",
      rubric: [
        { label: "a)", points: 2, answer: "ABCD este pătrat cu AB = 8 cm, deci diagonala BD = 8√2 cm și OB = BD/2 = 4√2 cm. În triunghiul dreptunghic VOB, VB² = VO² + OB² = (4√2)² + (4√2)² = 32 + 32 = 64, deci VB = 8 cm." },
        { label: "b)", points: 3, answer: "PQ este linie mijlocie în triunghiul VBC, deci PQ∥BC și PQ = BC/2; cum BC∥AD, rezultă PQ∥AD și PQ = AD/2, deci PQ este linie mijlocie în triunghiul MAD, de unde Q este mijlocul lui MD. Cum Q este și mijlocul lui CV, VMCD este paralelogram, deci VM∥CD. Atunci ∢(VM, BC) = ∢(CD, BC) = 90°, deci VM ⊥ BC." },
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
  console.log(`\n=== import-exam-mate-2022-test-01 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
