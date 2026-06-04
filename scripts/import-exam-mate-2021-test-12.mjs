#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-12.mjs — Exam-Bank, CNCE training Test 12 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 12.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1c 2c 3b 4d 5c 6a · II = 1a 2c 3c 4c 5b 6c
 * NB: SI.3 + SI.6 sunt tabele text (fără figură). SII.5 (diametru) fără figură. Deci 8 figuri
 *     (s2-1,2,3,4,6 + s3-4,5,6) și 7 autoGradable (SI 1-6 + SII.5). Via 4uPDF.
 * finalAnswer: III.1="7" (preț trandafir). SKIP: III.2 (b multi-valoare a∈{0,1,2}), III.3 (b pereche
 *   coordonate M(0,2)), III.4 (36√3 + asemănare), III.5 (proof), III.6 (9√2/2 radical).
 * NB: subiectul tipărește III.2 ca (3p)/(3p)=6 (eroare), baremul punctează a)2p / b)3p — rubricul urmează baremul.
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-12-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 12 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-12", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Numere prime",
      content: "Produsul a două numere prime este egal cu 14. Suma celor două numere prime este egală cu:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "7" }, { key: "c", text: "9" }, { key: "d", text: "15" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Probabilități",
      content: "Într-o lădiță sunt 48 de mere roșii, verzi și galbene. Probabilitatea ca, alegând un măr din lădiță, acesta să fie roșu este egală cu 5/8. Numărul de mere roșii din această lădiță este egal cu:",
      options: [{ key: "a", text: "6" }, { key: "b", text: "8" }, { key: "c", text: "30" }, { key: "d", text: "40" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Media aritmetică. Numere întregi",
      content: "Mihai a înregistrat temperaturile măsurate la aceeași oră pe parcursul unei săptămâni:\n• Luni — −4 °C\n• Marți — −1 °C\n• Miercuri — −5 °C\n• Joi — −2 °C\n• Vineri — 0 °C\n• Sâmbătă — 1 °C\n• Duminică — −3 °C\nMedia aritmetică a temperaturilor măsurate de Mihai, în această săptămână, la aceeași oră, este egală cu:",
      options: [{ key: "a", text: "0 °C" }, { key: "b", text: "−2 °C" }, { key: "c", text: "−5 °C" }, { key: "d", text: "−7 °C" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții. Divizibilitate",
      content: "Știind că x este un număr natural, x > 1, iar fracția 6/x este supraunitară și ireductibilă, atunci x este egal cu:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "3" }, { key: "c", text: "4" }, { key: "d", text: "5" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Media aritmetică. Radicali",
      content: "Media aritmetică a numerelor a = √(5² − 1²) și b = 48/√6 aparține intervalului:",
      options: [{ key: "a", text: "[5, 6]" }, { key: "b", text: "[10, 11]" }, { key: "c", text: "[12, 13]" }, { key: "d", text: "[15, 16]" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Procente. Interpretarea datelor",
      content: "În tabelul următor este prezentat numărul de elevi al fiecăreia dintre clasele V–VIII ale unei școli:\n• a V-a A — 32\n• a V-a B — 30\n• a VI-a A — 28\n• a VI-a B — 31\n• a VII-a A — 27\n• a VII-a B — 32\n• a VIII-a A — 29\n• a VIII-a B — 31\nNumărul elevilor din clasele a VIII-a din această școală reprezintă p% din numărul total al elevilor școlii. Valoarea lui p este egală cu:",
      options: [{ key: "a", text: "25" }, { key: "b", text: "29" }, { key: "c", text: "31" }, { key: "d", text: "60" }], correctAnswer: "a" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloc. Comparare",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Pe segmentul AE: punctele A, B, C, D, E coliniare (în această ordine); C cu AC < CE, B mijlocul lui AC, D mijlocul lui CE.",
      content: "În figura alăturată, pe segmentul AE se consideră punctul C astfel încât AC < CE, iar punctele B și D sunt mijloacele segmentelor AC, respectiv CE. Dintre următoarele afirmații, cea adevărată este:",
      options: [{ key: "a", text: "AC < BD < CE" }, { key: "b", text: "BD < AC < CE" }, { key: "c", text: "AC < CE < BD" }, { key: "d", text: "AC = BD = CE" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiul drept AOB; OC bisectoarea lui AOB; semidreapta OD astfel încât OB este bisectoarea unghiului COD.",
      content: "În figura alăturată este reprezentat unghiul drept AOB, bisectoarea OC a acestuia și semidreapta OD astfel încât semidreapta OB este bisectoarea unghiului COD. Măsura unghiului BOD este egală cu:",
      options: [{ key: "a", text: "90°" }, { key: "b", text: "50°" }, { key: "c", text: "45°" }, { key: "d", text: "40°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Linie mijlocie",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC dreptunghic în B (A sus, B jos-stânga, C jos-dreapta) cu AB ⊥ BC; D mijlocul lui AC, E pe BC cu DE ∥ AB.",
      content: "În figura alăturată, segmentele AB, AC și CB reprezintă alei într-un parc, unde dreptele AB și BC sunt perpendiculare. Ana și Dan ocupă inițial pozițiile A, respectiv D, unde D este mijlocul segmentului AC. Din pozițiile inițiale, Ana ajunge în punctul B și Dan parcurge segmentul DE, unde DE ∥ AB, ajungând în punctul E. Raportul dintre distanța parcursă de Dan și cea parcursă de Ana este egal cu:",
      options: [{ key: "a", text: "1/4" }, { key: "b", text: "1/3" }, { key: "c", text: "1/2" }, { key: "d", text: "2/3" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Pătrat. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Pătratul ABCD (D sus-stânga, C sus-dreapta, A jos-stânga, B jos-dreapta) cu E în interior unit cu cele patru vârfuri; triunghiurile AEB, DEC, AED și BEC.",
      content: "Figura alăturată reprezintă schița unei grădini în formă de pătrat ABCD cu latura AB = 10 cm. Pe suprafața corespunzătoare triunghiului echilateral AEB sunt plantate begonii, pe cea corespunzătoare triunghiului DEC sunt plantate crizanteme, iar pe cele corespunzătoare triunghiurilor AED și BEC sunt plantate panseluțe, E fiind un punct din interiorul pătratului ABCD. Aria suprafeței totale cultivate cu panseluțe este:",
      options: [{ key: "a", text: "mai mare decât suma ariilor suprafețelor cultivate cu begonii și cu crizanteme" }, { key: "b", text: "mai mică decât suma ariilor suprafețelor cultivate cu begonii și cu crizanteme" }, { key: "c", text: "egală cu suma ariilor suprafețelor cultivate cu begonii și cu crizanteme" }, { key: "d", text: "egală cu o treime din aria suprafeței întregii grădini" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Cerc. Diametru",
      content: "Diametrul unui cerc cu lungimea de 10π cm este egal cu:",
      options: [{ key: "a", text: "5 cm" }, { key: "b", text: "10 cm" }, { key: "c", text: "20 cm" }, { key: "d", text: "25 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Arie totală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cubul ABCDA′B′C′D′ (A′B′C′D′ sus, ABCD jos); diagonala feței BC′ trasată.",
      content: "În figura alăturată este reprezentat un cub ABCDA′B′C′D′, cu lungimea segmentului BC′ egală cu 4√2 cm. Aria totală a cubului ABCDA′B′C′D′ este egală cu:",
      options: [{ key: "a", text: "16 cm²" }, { key: "b", text: "64 cm²" }, { key: "c", text: "96 cm²" }, { key: "d", text: "192 cm²" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Sisteme de ecuații",
      finalAnswer: "7",
      content: "O florărie are la vânzare lalele și trandafiri, dar prețurile acestora nu sunt afișate. Vânzătorul îi spune Anastasiei că cinci fire de lalele și patru fire de trandafiri costă împreună 43 de lei, iar două fire de lalele și trei fire de trandafiri costă împreună 27 de lei.\na) Anastasia face afirmația: „Prețul unui fir de trandafir este de 10 lei.” Este această afirmație adevărată? Justifică răspunsul dat.\nb) Determină prețul unui fir de trandafir pe care îl are spre vânzare florăria.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă prețul unui fir de trandafir ar fi 10 lei, trei fire de trandafiri ar costa 3 · 10 = 30 de lei. Cum două fire de lalele și trei fire de trandafiri costă împreună doar 27 de lei, nu este posibil ca prețul unui fir de trandafir să fie 10 lei (afirmația este falsă)." },
        { label: "b)", points: 3, answer: "5x + 4y = 43 și 2x + 3y = 27, unde x este prețul unui fir de lalea și y prețul unui fir de trandafir; rezolvând sistemul, y = 7 lei, deci prețul unui fir de trandafir este de 7 lei." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Inecuații",
      content: "Se consideră expresia E(x) = (1 + 2√3x)(2√3x − 1) − 2(2x + 1)² − (4x + 1)(x − 3) + 1 − x, unde x este număr real.\na) Arată că E(x) = 2x + 1, pentru orice număr real x.\nb) Determină numerele naturale a pentru care E(a) ≤ 3√5.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = (12x² − 1) − 2(4x² + 4x + 1) − (4x² − 11x − 3) + 1 − x = 12x² − 1 − 8x² − 8x − 2 − 4x² + 11x + 3 + 1 − x = 2x + 1, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(a) = 2a + 1; din 2a + 1 ≤ 3√5 = √45 < 7 și 2a + 1 fiind număr natural impar, rezultă 2a + 1 ∈ {1, 3, 5}, deci a ∈ {0, 1, 2}." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Drum minim",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = (3/2)x + 2.\na) Arată că f(−2) + f(2) = 4.\nb) Se consideră punctele A(−2, −1) și B(2, 5) care aparțin reprezentării geometrice a graficului funcției f. Determină coordonatele punctului M(x, y) situat pe axa Oy a sistemului de axe ortogonale xOy, astfel încât suma lungimilor segmentelor MA și MB să fie minimă.",
      rubric: [
        { label: "a)", points: 2, answer: "f(−2) = (3/2)·(−2) + 2 = −1 și f(2) = (3/2)·2 + 2 = 5, deci f(−2) + f(2) = −1 + 5 = 4." },
        { label: "b)", points: 3, answer: "MA + MB are valoare minimă când A, M și B sunt coliniare; cum A și B sunt de o parte și de alta a axei Oy, M este punctul de intersecție a dreptei AB cu axa Oy, deci M(0, 2)." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi echilateral. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghiul echilateral ABC (A sus, B și C la bază, C dreapta); D pe dreapta BC, cu B între D și C (BC = 2BD); BM bisectoarea unghiului ABD, M pe AD; N pe AB, cu MN ∥ BC.",
      content: "În figura alăturată este reprezentat un triunghi echilateral ABC cu AB = 12 cm și punctul D este situat pe dreapta BC astfel încât BC = 2BD și punctul B aparține segmentului CD. Semidreapta BM (M ∈ AD) este bisectoarea unghiului ABD și N este punctul de intersecție dintre AB și paralela prin M la BC.\na) Arată că aria triunghiului ABC este egală cu 36√3 cm².\nb) Demonstrează că triunghiurile BMN și ABC sunt asemenea.",
      rubric: [
        { label: "a)", points: 2, answer: "A(ABC) = (AB²√3)/4 = (144√3)/4 = 36√3 cm²." },
        { label: "b)", points: 3, answer: "MN ∥ BC ⇒ ∢MNB = ∢ABC = 60°; cum B aparține lui CD, ∢ABD = 180° − ∢ABC = 120°, iar BM este bisectoare, deci ∢ABM = ∢ABD/2 = 60° = ∢ACB. Triunghiurile BMN și ABC au câte două unghiuri respectiv congruente, deci ΔBMN ~ ΔABC." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi isoscel. Trigonometrie",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul DBC (D sus-stânga, B jos, C dreapta) cu BC = BD; A pe latura DC, cu AC = 4√3 cm.",
      content: "În figura alăturată este reprezentat un triunghi DBC cu BC = BD = 6 cm și DC = 6√3 cm. Punctul A este situat pe latura DC astfel încât AC = 4√3 cm.\na) Arată că măsura unghiului C este egală cu 30°.\nb) Demonstrează că triunghiul ABD este isoscel.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie M mijlocul laturii DC; cum triunghiul BCD este isoscel de bază DC, BM ⊥ DC. În triunghiul BMC dreptunghic în M, cos C = MC/BC = (3√3)/6 = √3/2, deci ∢C = 30°." },
        { label: "b)", points: 3, answer: "În triunghiul BMC dreptunghic în M cu ∢C = 30°, BM = BC/2 = 3 cm; AM = AC − MC = 4√3 − 3√3 = √3 cm și AD = DC − AC = 6√3 − 4√3 = 2√3 cm. În triunghiul AMB dreptunghic în M, AB = √(AM² + BM²) = √(3 + 9) = 2√3 cm = AD, deci triunghiul ABD este isoscel." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă triunghiulară regulată. Distanțe",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Piramida triunghiulară regulată VABC (vârf V, bază ABC); M mijlocul muchiei BC.",
      content: "În figura alăturată este reprezentată o piramidă triunghiulară regulată VABC cu baza triunghiul ABC. Punctul M este mijlocul segmentului BC, AB = 18 cm și VA = 9√2 cm.\na) Arată că măsura unghiului dintre dreapta VM și dreapta AC este egală cu 60°.\nb) Determină distanța de la punctul M la planul (VAC).",
      rubric: [
        { label: "a)", points: 2, answer: "Construim MN ∥ AC (N ∈ AB); MN este linie mijlocie în triunghiul ABC, deci MN = AC/2 = 9 cm, iar ∢(VM, AC) = ∢(VM, MN) = ∢VMN. În triunghiul VMC dreptunghic în M, VM = √(VC² − MC²) = 9 cm; cum VN = VM = MN, triunghiul VMN este echilateral, deci ∢VMN = 60°." },
        { label: "b)", points: 3, answer: "VB² + VC² = BC² ⇒ ΔVBC este dreptunghic în V, deci și ΔVAB este dreptunghic, VB ⊥ VC și VB ⊥ VA; cum VA, VC ⊂ (VAC), rezultă VB ⊥ (VAC). Fie P mijlocul segmentului VC; MP ∥ VB ⇒ MP ⊥ (VAC) și MP = VB/2 = 9√2/2 cm. Așadar d(M, (VAC)) = 9√2/2 cm." },
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
  console.log(`\n=== import-exam-mate-2021-test-12 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
