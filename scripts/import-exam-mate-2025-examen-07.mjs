#!/usr/bin/env node
/**
 * import-exam-mate-2025-examen-07.mjs — Exam-Bank series 2, pair 2025 Examen Varianta 7 (Matematică)
 *
 * SOURCE: Ministerul Educației și Cercetării / CNCCE — EN VIII, an școlar 2024–2025, Varianta 7.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Answer keys + rubric from the official BAREM — ground-truth.
 *
 * Barem chei: I = 1c 2a 3a 4d 5a 6b · II = 1d 2d 3b 4c 5c 6a
 * Figures: 11 PNG (en-viii-2025-mate-examen-07-s{1,2,3}-{label}.png). finalAnswer: III.1=6, III.5=7,2.
 *
 * Idempotent upsert by unique key. Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2025-mate-examen-07-${s}.png`;

const MATH = {
  source: "EN VIII 2025 Examen, Varianta 7 (edu.ro)",
  examType: "EN_VIII", year: 2025, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "examen-07", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNCCE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 4 + 12 : 2 este egal cu:",
      options: [{ key: "a", text: "6" }, { key: "b", text: "8" }, { key: "c", text: "10" }, { key: "d", text: "12" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte și proporții",
      content: "Știind că a/2 = 2/3, atunci a/4 este egal cu:",
      options: [{ key: "a", text: "1/3" }, { key: "b", text: "4/3" }, { key: "c", text: "2" }, { key: "d", text: "3" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Produsul numerelor −2 și 5 este egal cu:",
      options: [{ key: "a", text: "−10" }, { key: "b", text: "−3" }, { key: "c", text: "3" }, { key: "d", text: "10" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Ecuații",
      content: "Soluția ecuației 6x − 2 = 1 este numărul:",
      options: [{ key: "a", text: "−1/3" }, { key: "b", text: "−1/2" }, { key: "c", text: "1/3" }, { key: "d", text: "1/2" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali",
      content: "Patru elevi, Ana, Maria, Dan și Vlad, calculează suma numerelor a = √(3² + 4²) și b = √(3² · 4²). Rezultatele obținute: Ana → 17; Maria → 19; Dan → 37; Vlad → 43. Conform informațiilor din tabel, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Ana" }, { key: "b", text: "Maria" }, { key: "c", text: "Dan" }, { key: "d", text: "Vlad" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Interpretarea diagramelor",
      hasFigure: true, figureUrl: FIG("s1-6"),
      figureNote: "Diagramă cu bare — numărul de elevi pe punctaje: 40→2, 50→3, 60→6, 70→5, 80→4, 90→6, 100→4.",
      content: "În diagrama alăturată sunt prezentate rezultatele obținute de elevii participanți la un concurs. Afirmația „Conform informațiilor din diagramă, 5 dintre elevii participanți au obținut exact 80 de puncte.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea (figuri) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Simetric",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "B mijlocul lui AC; D simetricul lui B față de C; AD = 12 cm.",
      content: "În figura alăturată, punctul B este mijlocul segmentului AC și punctul D este simetricul punctului B față de C. Știind că AD = 12 cm, lungimea segmentului AC este egală cu:",
      options: [{ key: "a", text: "3 cm" }, { key: "b", text: "4 cm" }, { key: "c", text: "6 cm" }, { key: "d", text: "8 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiuri adiacente AOB și BOC cu ∢BOC = 2·∢AOB; OM bisectoarea unghiului BOC.",
      content: "În figura alăturată sunt reprezentate unghiurile adiacente AOB și BOC, ∢BOC = 2·∢AOB. Măsura unghiului AOC este egală cu 120° și semidreapta OM este bisectoarea unghiului BOC. Măsura unghiului AOM este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "40°" }, { key: "c", text: "60°" }, { key: "d", text: "80°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi isoscel",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi isoscel ABC cu ∢BAC = 120°; E pe BC cu CE = 4 cm; AB ⊥ AE.",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC, cu ∢BAC = 120°. Punctul E aparține segmentului BC, astfel încât CE = 4 cm, iar dreptele AB și AE sunt perpendiculare. Lungimea segmentului BC este egală cu:",
      options: [{ key: "a", text: "16 cm" }, { key: "b", text: "12 cm" }, { key: "c", text: "8 cm" }, { key: "d", text: "6 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Dreptunghi. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Dreptunghi ABCD cu AB = 3·BC; perimetrul 32 cm.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD, cu AB = 3·BC. Perimetrul dreptunghiului ABCD este egal cu 32 cm. Aria dreptunghiului ABCD este egală cu:",
      options: [{ key: "a", text: "16 cm²" }, { key: "b", text: "32 cm²" }, { key: "c", text: "48 cm²" }, { key: "d", text: "64 cm²" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghi înscris",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Triunghi echilateral ABC înscris în cercul de centru O; D pe arcul mic BC.",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC, înscris în cercul de centru O. Punctul D aparține arcului mic BC. Măsura unghiului BDC este egală cu:",
      options: [{ key: "a", text: "60°" }, { key: "b", text: "90°" }, { key: "c", text: "120°" }, { key: "d", text: "150°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Con circular drept",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Con circular drept cu secțiunea axială triunghiul echilateral VAB, AB = 6 cm.",
      content: "În figura alăturată este reprezentat conul circular drept cu secțiunea axială triunghiul echilateral VAB, cu AB = 6 cm. Aria laterală a conului este egală cu:",
      options: [{ key: "a", text: "18π cm²" }, { key: "b", text: "27π cm²" }, { key: "c", text: "36π cm²" }, { key: "d", text: "54π cm²" }], correctAnswer: "a" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Procente. Probleme",
      finalAnswer: "6",
      content: "Ana a cumpărat de la o librărie caiete, pixuri și creioane. Prețul unui pix este egal cu 75% din prețul unui caiet, iar prețul unui creion este egal cu 40% din prețul unui pix.",
      rubric: [
        { label: "a)", points: 2, answer: "Notând cu x prețul unui caiet: prețul unui pix = (75/100)·x = (3/4)·x. Opt pixuri costă 8·(3/4)·x = 6x; cum 6x ≠ 5x, nu este posibil ca prețul a opt pixuri să fie egal cu prețul a cinci caiete." },
        { label: "b)", points: 3, answer: "Prețul unui creion = (40/100)·(3/4)·x = (3/10)·x. Din 3x + 4·(3/4)·x + 5·(3/10)·x = 45 ⇒ 15x = 90 ⇒ x = 6, deci prețul unui caiet este 6 lei." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Expresii raționale",
      content: "Se consideră expresia E(x) = (2/(x−3) − 3/x + 2/(x+3)) : 1/(x²−3x), unde x este număr real, x ≠ −3, x ≠ 0 și x ≠ 3.",
      rubric: [
        { label: "a)", points: 2, answer: "2/(x−3) − 3/x + 2/(x+3) = (2x(x+3) − 3(x−3)(x+3) + 2x(x−3)) / (x(x−3)(x+3)) = (2x² + 6x − 3x² + 27 + 2x² − 6x) / (x(x−3)(x+3)) = (x² + 27) / (x(x−3)(x+3)), pentru orice x real, x ≠ −3, 0, 3." },
        { label: "b)", points: 3, answer: "E(x) = (x² + 27)/(x(x−3)(x+3)) · x(x−3) = (x² + 27)/(x+3). E(n) − 6 = (n² + 27 − 6n − 18)/(n+3) = (n−3)²/(n+3). Cum n + 3 > 0 și (n−3)² > 0 pentru n natural, n ≠ 3, rezultă E(n) − 6 > 0, deci E(n) > 6." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Grafic",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu graficul funcției f(x) = 2x − 4.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = 2x − 4.",
      rubric: [
        { label: "a)", points: 2, answer: "f(2) = 0 și f(0) = −4, deci f(2) − f(0) = 0 − (−4) = 4." },
        { label: "b)", points: 3, answer: "Graficul intersectează axele în A(2, 0) și B(0, −4). C este simetricul lui A față de Oy ⇒ OC = OA = 2, deci CA = 4. AB = BC = 2√5, de unde P(ABC) = 2√5 + 2√5 + 4 = 4(√5 + 1)." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrat. Triunghi echilateral. Distanță",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Pătrat ABCD și triunghi echilateral ACE; D și E de aceeași parte a dreptei AC; perimetrul pătratului 48 cm.",
      content: "În figura alăturată este reprezentat pătratul ABCD și triunghiul echilateral ACE, astfel încât punctele D și E sunt situate de aceeași parte a dreptei AC. Perimetrul pătratului ABCD este egal cu 48 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "AB = 12 cm, AC = 12√2 cm; P(ACE) = 3·AC = 36√2 cm." },
        { label: "b)", points: 3, answer: "ΔADE ≡ ΔCDE ⇒ Aria(ADE) = (Aria(ACE) − Aria(ACD))/2 = 36(√3 − 1) cm². DM ⊥ AE (M pe AE) ⇒ d(D, AE) = DM și Aria(ADE) = (AE·DM)/2, de unde DM = 2·Aria(ADE)/AE = 3√2(√3 − 1) cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez dreptunghic. Arii",
      hasFigure: true, figureUrl: FIG("s3-5"),
      finalAnswer: "7,2",
      figureNote: "Trapez dreptunghic ABCD cu AB ∥ DC, ∢DAB = 90°, AB = 8 cm, AD = DC = 4 cm; M mijlocul lui DC; P = AM ∩ BD.",
      content: "În figura alăturată este reprezentat trapezul dreptunghic ABCD, cu AB ∥ DC, ∢DAB = 90°, AB = 8 cm și AD = DC = 4 cm. Punctul M este mijlocul segmentului DC și P este punctul de intersecție a dreptelor AM și BD.",
      rubric: [
        { label: "a)", points: 2, answer: "CN ⊥ AB (N pe AB) ⇒ CN = 4 cm și NB = 4 cm; BC = √(CN² + BN²) = 4√2 cm." },
        { label: "b)", points: 3, answer: "DM ∥ AB ⇒ ΔDPM ∼ ΔBPA ⇒ PM/PA = DM/BA = 1/4. ΔPME ∼ ΔPAF ⇒ PE/PF = PM/PA = 1/4, de unde PF = 16/5 cm, deci Aria(APB) = (AB·PF)/2 = 64/5 cm². Aria(ABCM) = 20 cm², deci Aria(MPBC) = Aria(ABCM) − Aria(APB) = 36/5 = 7,2 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Drepte perpendiculare",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cub ABCDA'B'C'D' cu AB = 8 cm; O = AC ∩ BD; E = A'B ∩ AB'; F mijlocul lui CC'.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D', cu AB = 8 cm. Dreptele AC și BD se intersectează în punctul O, iar dreptele A'B și AB' se intersectează în punctul E. Punctul F este mijlocul segmentului CC'.",
      rubric: [
        { label: "a)", points: 2, answer: "Volumul cubului = AB³ = 8³ = 512 cm³." },
        { label: "b)", points: 3, answer: "FO este linie mijlocie în ΔACC' ⇒ FO ∥ AC', deci ∢(FO, DE) = ∢(AC', DE). AB' ∥ DC' ⇒ ΔAQE ∼ ΔC'QD (Q = DE ∩ AC') ⇒ QD = (2/3)·DE, C'Q = (2/3)·C'A. DE = 4√6 cm, C'A = 8√3 cm ⇒ QD = 8√6/3 cm, C'Q = 16√3/3 cm; cum C'D = 8√2 cm și QD² + C'Q² = 128 = C'D², rezultă ∢DQC' = 90°, deci ∢(FO, DE) = 90°: dreptele FO și DE sunt perpendiculare." },
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
  console.log(`\n=== import-exam-mate-2025-examen-07 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
