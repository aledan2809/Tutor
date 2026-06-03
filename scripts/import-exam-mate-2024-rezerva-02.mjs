#!/usr/bin/env node
/**
 * import-exam-mate-2024-rezerva-02.mjs — Exam-Bank series 2, pair 2024 Rezervă Varianta 2 (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2023–2024, Rezervă Varianta 2.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1b 2a 3c 4b 5c 6b · II = 1c 2a 3c 4c 5a 6b
 * Figures: 10 PNG (en-viii-2024-mate-rezerva-02-s{2,3}-{label}.png). finalAnswer: III.1=95.
 *   (I.6 = vârste, fără figură. III.2 n∈{3,4,6}, III.3/6 radicali — fără finalAnswer scalar.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2024-mate-rezerva-02-${s}.png`;

const MATH = {
  source: "EN VIII 2024 Rezervă, Varianta 2 (edu.ro)",
  examType: "EN_VIII", year: 2024, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "rezerva-02", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2024/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 14 − 14 : (4 − 2) este:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "7" }, { key: "c", text: "14" }, { key: "d", text: "21" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte",
      content: "Dacă 6/a = b/2, a ≠ 0, atunci raportul (a·b)/(a·b + 1) este egal cu:",
      options: [{ key: "a", text: "12/13" }, { key: "b", text: "1" }, { key: "c", text: "12/11" }, { key: "d", text: "12" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Divizori",
      content: "Mulțimea divizorilor naturali ai numărului 15 este:",
      options: [{ key: "a", text: "{3, 5}" }, { key: "b", text: "{0, 3, 5, 15}" }, { key: "c", text: "{1, 3, 5, 15}" }, { key: "d", text: "{3, 5, 15}" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Ecuații",
      content: "Mulțimea soluțiilor reale ale ecuației 2x² = 8 este:",
      options: [{ key: "a", text: "{−2}" }, { key: "b", text: "{−2, 2}" }, { key: "c", text: "{2}" }, { key: "d", text: "{4}" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea numerelor",
      content: "Patru elevi, George, Anca, Marius și Alina, ordonează crescător numerele a = 2/3, b = 0,5, c = 0,1(3) și d = 1/4. Răspunsurile date: George → d < c < b < a; Anca → c < d < a < b; Marius → c < d < b < a; Alina → d < b < a < c. Dintre cei patru elevi, cel care a răspuns corect este:",
      options: [{ key: "a", text: "George" }, { key: "b", text: "Anca" }, { key: "c", text: "Marius" }, { key: "d", text: "Alina" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Vârste. Probleme",
      content: "În prezent, Ioana și Maria au împreună 28 de ani. Afirmația „Peste 3 ani, Ioana și Maria vor avea împreună 31 de ani.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea (figuri) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Numere consecutive",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare, în această ordine; AB < BC < CD, BC = 7 cm, numere naturale consecutive; M mijlocul lui AB.",
      content: "În figura alăturată punctele A, B, C și D sunt coliniare, în această ordine, astfel încât AB < BC < CD și BC = 7 cm. Lungimile segmentelor AB, BC și CD, exprimate în centimetri, sunt trei numere naturale consecutive, iar punctul M este mijlocul segmentului AB. Lungimea segmentului MD este egală cu:",
      options: [{ key: "a", text: "10 cm" }, { key: "b", text: "13 cm" }, { key: "c", text: "18 cm" }, { key: "d", text: "21 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte paralele. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Drepte paralele a și b; A, E pe a; B, C pe b; CD ⊥ AB, D pe AB; ∢DAE = 67°.",
      content: "În figura alăturată sunt reprezentate dreptele paralele a și b. Punctele A și E aparțin dreptei a, iar punctele B și C aparțin dreptei b. Dreapta CD este perpendiculară pe dreapta AB, punctul D aparține segmentului AB, iar măsura unghiului DAE este egală cu 67°. Măsura unghiului DCB este egală cu:",
      options: [{ key: "a", text: "23°" }, { key: "b", text: "33°" }, { key: "c", text: "67°" }, { key: "d", text: "113°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi ABC dreptunghic în A, ∢C = 75°; E pe semidreapta AC; BC bisectoarea unghiului ABE.",
      content: "În figura alăturată este reprezentat triunghiul ABC, dreptunghic în A, cu măsura unghiului C egală cu 75°. Punctul E aparține semidreptei AC astfel încât semidreapta BC este bisectoarea unghiului ABE. Măsura unghiului BEC este egală cu:",
      options: [{ key: "a", text: "15°" }, { key: "b", text: "30°" }, { key: "c", text: "60°" }, { key: "d", text: "105°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Dreptunghi. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Dreptunghi ABCD cu AC = 20 cm; O = AC ∩ BD; ∢AOB = 30°.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD, cu AC = 20 cm și O punctul de intersecție a dreptelor AC și BD. Măsura unghiului AOB este egală cu 30°. Aria dreptunghiului ABCD este egală cu:",
      options: [{ key: "a", text: "20 cm²" }, { key: "b", text: "25 cm²" }, { key: "c", text: "100 cm²" }, { key: "d", text: "200 cm²" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Coardă",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cerc de centru O; diametru DB = 50 cm; coarda AC = 30 cm ⊥ BD; E = AC ∩ BD.",
      content: "În figura alăturată este reprezentat cercul cu centrul în punctul O. Diametrul DB are lungimea egală cu 50 cm. Coarda AC are lungimea egală cu 30 cm și este perpendiculară pe diametrul BD. Dacă E este punctul de intersecție a dreptelor AC și BD, atunci lungimea segmentului OE este egală cu:",
      options: [{ key: "a", text: "20 cm" }, { key: "b", text: "15 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "10 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Con. Volum",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Con circular drept cu înălțimea VO = 8 cm și secțiunea axială triunghiul VAB, VA = 10 cm.",
      content: "În figura alăturată este reprezentat un con circular drept cu înălțimea VO = 8 cm și secțiunea axială triunghiul VAB, cu VA = 10 cm. Volumul conului este egal cu:",
      options: [{ key: "a", text: "60π cm³" }, { key: "b", text: "96π cm³" }, { key: "c", text: "120π cm³" }, { key: "d", text: "360π cm³" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Sisteme. Probleme",
      finalAnswer: "95",
      content: "Pentru un concert s-au vândut în total 225 de bilete pentru adulți și copii. Prețul unui bilet pentru adulți a fost de 25 de lei, iar prețul unui bilet pentru copii a fost de 20 de lei. Suma obținută din vânzarea biletelor a fost de 5150 de lei.",
      rubric: [
        { label: "a)", points: 2, answer: "205·25 = 5125 de lei; 5150 − 5125 = 25, care nu este multiplu de 20, deci nu au fost vândute 205 bilete pentru adulți." },
        { label: "b)", points: 3, answer: "25·(225 − n) + 20n = 5150 (n = numărul biletelor pentru copii) ⇒ 5625 − 5n = 5150 ⇒ n = 95." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = (2/(x−2) + x/(x+2)) : (x²+4)/(x²+4x+4), unde x este număr real, x ≠ −2 și x ≠ 2.",
      rubric: [
        { label: "a)", points: 2, answer: "2/(x−2) + x/(x+2) = (2(x+2) + x(x−2))/((x−2)(x+2)) = (x²+4)/((x−2)(x+2)), pentru orice x real, x ≠ −2, x ≠ 2." },
        { label: "b)", points: 3, answer: "E(x) = (x+2)/(x−2). N = E(n) − 1 = 4/(n−2), pentru orice număr natural n ≠ 2. N natural ⇒ n − 2 ∈ {1, 2, 4}, de unde n = 3, n = 4, n = 6." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Grafic. Geometrie analitică",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu graficul funcției f(x) = x + 2.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x + 2.",
      rubric: [
        { label: "a)", points: 2, answer: "f(1) = 3 și f(4) = 6, de unde 2·f(1) = f(4)." },
        { label: "b)", points: 3, answer: "A(−2, 0) și B(0, 2). Triunghiul AOB dreptunghic în O ⇒ AB = 2√2. MN ⊥ AB (N pe AB), MN = (MA·BO)/AB și, cum MA = 6 cm (pentru M(4, 0)), MN = 3√2 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrat. Bisectoare. Coliniaritate",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Pătrat ABCD; M pe CD; paralela prin M la AD taie AB în N; bisectoarea unghiului ANM taie AD în P; bisectoarea unghiului MNB taie BC în Q.",
      content: "În figura alăturată este reprezentat pătratul ABCD. Punctul M aparține laturii CD, iar paralela prin M la dreapta AD intersectează latura AB în punctul N. Bisectoarea unghiului ANM intersectează latura AD în punctul P, iar bisectoarea unghiului MNB intersectează latura BC în punctul Q.",
      rubric: [
        { label: "a)", points: 2, answer: "NP bisectoarea unghiului ANM ⇒ ∢PNM = 45°; NQ bisectoarea unghiului MNB ⇒ ∢MNQ = 45°, de unde ∢PNQ = 90°." },
        { label: "b)", points: 3, answer: "Triunghiurile PAN și NBQ sunt dreptunghice isoscele ⇒ AN = AP și NB = BQ; cum ABCD este pătrat, DP = BQ. Cum DP ∥ BQ, DPBQ este paralelogram. {O} = AC ∩ DB (O mijlocul lui DB) ⇒ O este mijlocul segmentului PQ, deci punctele P, O și Q sunt coliniare." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez. Pătrate. Trapez isoscel",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Trapez ABCD cu AB ∥ CD, AB = 2·AD = 4 cm, ∢BAD = 90°, ∢ABC = 30°; pătratele ABEF și BCHG în exterior.",
      content: "În figura alăturată este reprezentat trapezul ABCD cu AB ∥ CD, AB = 2·AD = 4 cm, măsura unghiului BAD egală cu 90° și măsura unghiului ABC egală cu 30°. În exteriorul trapezului se construiesc pătratele ABEF și BCHG.",
      rubric: [
        { label: "a)", points: 2, answer: "CM ⊥ AB (M pe AB) ⇒ CM = AD = 2 cm. ∢MBC = 30° ⇒ BC = 2·CM = 4 cm." },
        { label: "b)", points: 3, answer: "BC = AB ⇒ ∢CAB = 75°. ∢CAE = 120°; BE = BG, ∢EBG = 150° ⇒ ∢BEG = 15°, de unde ∢AEG = 60°, deci ∢CAE + ∢AEG = 180° ⇒ AC ∥ EG. ABEF, CBGH pătrate cu AB = BC ⇒ AE = CG și, cum AC ∥ EG și AE ∦ CG, AEGC este trapez isoscel." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Distanță punct-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cub ABCDA'B'C'D' cu AB = 8 cm; O = AC ∩ BD; M mijlocul lui A'B'.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D' cu AB = 8 cm și O punctul de intersecție a dreptelor AC și BD.",
      rubric: [
        { label: "a)", points: 2, answer: "Volumul cubului = AB³ = 8³ = 512 cm³." },
        { label: "b)", points: 3, answer: "DC ⊥ MP și DC ⊥ OP (P mijlocul lui DC), MP ∩ OP = {P} ⇒ DC ⊥ (MOP). ON ⊥ MP (N pe MP) și ON ⊥ DC ⇒ ON ⊥ (CMD), deci d(O, (CMD)) = ON. Aria(MOP) = (ON·MP)/2 = (OP·d(M,OP))/2 și, cum OP = 4 cm, d(M,OP) = 8 cm, MP = 8√2 cm, obținem ON = 2√2 cm." },
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
  console.log(`\n=== import-exam-mate-2024-rezerva-02 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
