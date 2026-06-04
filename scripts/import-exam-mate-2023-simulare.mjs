#!/usr/bin/env node
/**
 * import-exam-mate-2023-simulare.mjs — Exam-Bank series 3, pair 2023 Simulare (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2022–2023, Simulare.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1d 2a 3c 4d 5c 6b · II = 1d 2c 3b 4c 5a 6b
 * Figures: 9 PNG (en-viii-2023-mate-simulare-s{2,3}-{label}.png) — s2-1..6, s3-4..6.
 *   finalAnswer: III.1=14, III.3=3, III.4=5, III.6=60. (III.2 mulțime {2,5}, III.5 demonstrație+radical √2+1 → skip.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2023-mate-simulare-${s}.png`;

const MATH = {
  source: "EN VIII 2023 Simulare (edu.ro)",
  examType: "EN_VIII", year: 2023, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "simulare", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2023/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Criterii de divizibilitate",
      content: "Numărul natural de trei cifre, scris în baza zece de forma 17x (cifra sutelor 1, cifra zecilor 7, cifra unităților x), divizibil cu 10, este egal cu:",
      options: [{ key: "a", text: "17" }, { key: "b", text: "70" }, { key: "c", text: "100" }, { key: "d", text: "170" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Procente",
      content: "Numărul care reprezintă 20% din 50 este egal cu:",
      options: [{ key: "a", text: "10" }, { key: "b", text: "20" }, { key: "c", text: "25" }, { key: "d", text: "100" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Suma numerelor întregi din intervalul [−2, 3] este egală cu:",
      options: [{ key: "a", text: "−9" }, { key: "b", text: "−3" }, { key: "c", text: "3" }, { key: "d", text: "6" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Inversul unui număr rațional",
      content: "Inversul numărului 2/3 este numărul:",
      options: [{ key: "a", text: "−3/2" }, { key: "b", text: "−2/3" }, { key: "c", text: "2/3" }, { key: "d", text: "3/2" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Media geometrică",
      content: "Patru elevi, Elena, Maria, George și Mihai, au calculat media geometrică a numerelor x = 3 − 2√2 și y = 3 + 2√2 și au obținut următoarele rezultate: Elena → √17; Maria → √2; George → 1; Mihai → 3. Dintre cei patru elevi, cel care a calculat corect media geometrică este:",
      options: [{ key: "a", text: "Elena" }, { key: "b", text: "Maria" }, { key: "c", text: "George" }, { key: "d", text: "Mihai" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Compararea numerelor reale",
      content: "Afirmația „Numărul 4 este mai mare decât numărul 2√5.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Simetric față de un punct",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Pe o dreaptă, punctele C, A, B, D coliniare în această ordine; segmentul AB = 5 cm, C simetricul lui B față de A, D simetricul lui C față de B.",
      content: "În figura alăturată este reprezentat segmentul AB cu lungimea de 5 cm. Punctul C este simetricul punctului B față de punctul A, iar punctul D este simetricul punctului C față de punctul B. Lungimea segmentului CD este egală cu:",
      options: [{ key: "a", text: "5 cm" }, { key: "b", text: "10 cm" }, { key: "c", text: "15 cm" }, { key: "d", text: "20 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri opuse la vârf. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Două drepte care se intersectează în O; A stânga și B dreapta pe o dreaptă, C sus-stânga, D jos-dreapta (AOC și BOD opuse la vârf); semidreapta OE (bisectoarea lui BOC) în sus.",
      content: "În figura alăturată, unghiurile AOC și BOD sunt opuse la vârf. Măsura unghiului AOC este egală cu 30°, iar semidreapta OE este bisectoarea unghiului BOC. Măsura unghiului DOE este egală cu:",
      options: [{ key: "a", text: "75°" }, { key: "b", text: "90°" }, { key: "c", text: "105°" }, { key: "d", text: "150°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Linie mijlocie. Perimetru",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC cu C sus, A jos-stânga, B jos-dreapta; M, N, P mijloacele laturilor AB, BC, respectiv AC.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu AB = 12 cm, BC = 13 cm și AC = 7 cm. Punctele M, N și P sunt mijloacele segmentelor AB, BC, respectiv AC. Perimetrul triunghiului MNP este egal cu:",
      options: [{ key: "a", text: "8 cm" }, { key: "b", text: "16 cm" }, { key: "c", text: "18 cm" }, { key: "d", text: "32 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Mijlocul ipotenuzei",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Patrulaterul ABCD cu A jos-stânga, B jos-dreapta, C sus-dreapta, D sus-stânga; M mijlocul lui AB; AC ⊥ BC și AD ⊥ BD.",
      content: "În figura alăturată este reprezentat patrulaterul ABCD. Dreapta AC este perpendiculară pe dreapta BC și dreapta AD este perpendiculară pe dreapta BD. Punctul M este mijlocul segmentului AB și măsura unghiului DCM este egală cu 40°. Măsura unghiului CMD este egală cu:",
      options: [{ key: "a", text: "80°" }, { key: "b", text: "90°" }, { key: "c", text: "100°" }, { key: "d", text: "120°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghi înscris. Arc",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu diametrul BC (C în stânga, B în dreapta); punctul A pe cerc, sus-dreapta.",
      content: "În figura alăturată este reprezentat cercul de centru O și diametru BC. Punctul A aparține cercului, astfel încât măsura arcului mic AC este egală cu 120°. Măsura unghiului ACB este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "120°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Con circular drept. Generatoare",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Con circular drept cu vârful V sus, baza cerc cu diametrul AB și centrul O; secțiunea axială este triunghiul dreptunghic VAB.",
      content: "În figura alăturată este reprezentat un con circular drept cu secțiunea axială triunghiul dreptunghic VAB și raza bazei conului AO = 4 cm. Generatoarea acestui con are lungimea egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "4√2 cm" }, { key: "c", text: "8 cm" }, { key: "d", text: "8√2 cm" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Ecuații",
      finalAnswer: "14",
      content: "Într-un bloc de locuințe sunt 22 de apartamente cu două, respectiv cu patru camere, în total fiind 60 de camere.",
      rubric: [
        { label: "a)", points: 2, answer: "În 16 apartamente cu patru camere sunt 4·16 = 64 de camere. Cum numărul total de camere din bloc este egal cu 60, nu este posibil ca blocul să aibă 16 apartamente cu patru camere, deoarece 64 > 60." },
        { label: "b)", points: 3, answer: "2x + 4(22 − x) = 60, unde x reprezintă numărul apartamentelor cu două camere ⇒ 2x = 28 ⇒ x = 14 apartamente cu două camere." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = ((x²−9)/(x²−16) − 1) : (1/(x+4) + 1/(x−4) − 3/(x²−16)), unde x este număr real, x ≠ −4, x ≠ 4 și x ≠ 3/2.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = ((x²−9−x²+16)/(x²−16)) · ((x²−16)/(x−4+x+4−3)) = (7/(x²−16)) · ((x−4)(x+4)/(2x−3)) = 7/(2x−3), pentru orice x real, x ≠ −4, x ≠ 4, x ≠ 3/2." },
        { label: "b)", points: 3, answer: "E(n) = 7/(2n−3), unde n este număr natural. 7/(2n−3) ∈ ℕ ⇒ 2n−3 = 1 sau 2n−3 = 7 ⇒ n = 2 sau n = 5, care convin." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Puteri. Media aritmetică",
      finalAnswer: "3",
      content: "Se consideră numerele a = (−1/3)^32 : (−1/3)^30 · (−6)² și b = (1/(1+2) + 1/(1+2+3)) · (0,5)^(−2).",
      rubric: [
        { label: "a)", points: 2, answer: "a = (−1/3)² · (−6)² = (1/9) · 36 = 4." },
        { label: "b)", points: 3, answer: "b = (1/3 + 1/6) · (5/10)^(−2) = (3/6) · (10/5)² = (1/2) · 4 = 2. Media aritmetică (a + b)/2 = (4 + 2)/2 = 3." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi. Arie. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-4"), finalAnswer: "5",
      figureNote: "Triunghiul ABC cu A sus, B jos-stânga, C jos-dreapta; D pe latura AC; ∢ACB = 30°.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu BC = 10 cm, AC = 20 cm și măsura unghiului ACB este egală cu 30°. Punctul D aparține segmentului AC, astfel încât unghiul DBC este congruent cu BAC.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie BP ⊥ AC, P ∈ AC; triunghiul BPC este dreptunghic, ∢BCP = 30° ⇒ BP = BC/2 = 5 cm. A_ABC = (AC·BP)/2 = (20·5)/2 = 50 cm²." },
        { label: "b)", points: 3, answer: "∢BCD ≡ ∢BCA și ∢CBD ≡ ∢BAC ⇒ ΔCBD ~ ΔCAB ⇒ CD/BC = BC/AC ⇒ CD/10 = 10/20 ⇒ CD = 5 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Romb. Triunghi dreptunghic isoscel. Tangentă",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Rombul ABCD (D sus-stânga, C sus-dreapta, A stânga, B în mijloc) cu ∢BAD = 45°; triunghiul dreptunghic isoscel ABE cu vârful E jos; C și E de o parte și de alta a dreptei AB.",
      content: "În figura alăturată sunt reprezentate rombul ABCD cu măsura unghiului BAD egală cu 45° și triunghiul dreptunghic isoscel ABE cu AB = BE = 10 cm. Punctele C și E sunt de o parte și de alta a dreptei AB.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiul ABE este dreptunghic isoscel ⇒ ∢BAE = 45°. ∢DAE = ∢DAB + ∢BAE = 45° + 45° = 90°, deci dreapta DA este perpendiculară pe dreapta AE." },
        { label: "b)", points: 3, answer: "Fie {N} = BC ∩ AE; DA ∥ BN și DA ⊥ AE ⇒ BN ⊥ AE. În triunghiul dreptunghic isoscel ABE, AE = 10√2 cm, BN înălțime ⇒ BN mediană, deci BN = AN = AE/2 = 5√2 cm. În triunghiul dreptunghic ACN, tg(∢CAE) = CN/AN = (10 + 5√2)/(5√2) = √2 + 1." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Asemănare. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s3-6"), finalAnswer: "60",
      figureNote: "Cubul ABCDA'B'C'D'; M mijlocul lui B'C', R = BM ∩ B'C, P pe AC cu AP = 2√2 cm.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D' cu AB = 6 cm. Punctul M este mijlocul segmentului B'C' și dreptele BM și B'C se intersectează în punctul R. Punctul P aparține segmentului AC, astfel încât AP = 2√2 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "AC = 6√2 cm. CP = AC − AP = 6√2 − 2√2 = 4√2 cm = 2·AP." },
        { label: "b)", points: 3, answer: "ΔBRC ~ ΔMRB' ⇒ B'R/RC = 1/2. Cum AP/PC = 1/2 ⇒ B'R/RC = AP/PC, deci PR ∥ AB'. ∢(PR, AD') = ∢(AB', AD') = ∢D'AB' și, cum ΔD'AB' este echilateral ⇒ ∢(PR, AD') = 60°." },
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
  console.log(`\n=== import-exam-mate-2023-simulare (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
