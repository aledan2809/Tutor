#!/usr/bin/env node
/**
 * import-exam-mate-2026-simulare.mjs — Exam-Bank series 2, pair 2026 Simulare (Matematică)
 *
 * SOURCE: Ministerul Educației și Cercetării / CNCCE — EN VIII, an școlar 2025–2026, Simulare.
 *   Public (edu.ro / pro-matematica). Content transcribed verbatim from the official subiect +
 *   barem PDFs (`~/Downloads/Temp/tutor eval nat/pro-matematica/2026_EN_Matematica_Simulare_*`).
 *   Answer keys + rubric taken from the official BAREM — ground-truth, zero generation.
 *
 * Barem chei: I = 1b 2c 3c 4c 5d 6a · II = 1b 2d 3b 4c 5b 6c
 * Figures: 10 PNG in public/exam-figures/ (en-viii-2026-mate-simulare-s{2,3}-{label}.png).
 *   NB: I.6 e o problemă text (fără figură). finalAnswer: III.1=12, III.3=(7,0), III.5=9√3/2.
 *
 * Idempotent: upsert paper by unique (examType, year, subjectKey, variant) → replace items.
 * Modes: --validate (offline) | --dry (DB read, no writes) | (none) apply.
 * DB target: DATABASE_URL from env. On prod this is VPS2 local PG (DBM). Never Neon.
 */

const MODE = process.argv.includes("--validate")
  ? "validate"
  : process.argv.includes("--dry")
    ? "dry"
    : "apply";

const FIG = (s) => `/exam-figures/en-viii-2026-mate-simulare-${s}.png`;

const MATH = {
  source: "EN VIII 2026 Simulare (edu.ro)",
  examType: "EN_VIII",
  year: 2026,
  subjectKey: "matematica",
  subjectName: "Matematică",
  grade: 8,
  variant: "simulare",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2026/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNCCE)",
  passages: [],
  items: [
    // ── Subiectul I (6 × 5p MCQ) ──
    {
      section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true,
      topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 12 − 8 : 4 este egal cu:",
      options: [{ key: "a", text: "16" }, { key: "b", text: "10" }, { key: "c", text: "5" }, { key: "d", text: "1" }],
      correctAnswer: "b",
    },
    {
      section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true,
      topic: "Procente",
      content: "Din cei 26 de elevi ai unei clase, 50% sunt băieți. Numărul băieților din acea clasă este egal cu:",
      options: [{ key: "a", text: "5" }, { key: "b", text: "12" }, { key: "c", text: "13" }, { key: "d", text: "20" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true,
      topic: "Intervale. Numere naturale",
      content: "Cel mai mare număr natural din intervalul (2/3, 9/4] este egal cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "1" }, { key: "c", text: "2" }, { key: "d", text: "9" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true,
      topic: "Ecuații",
      content: "Dacă 2x = 3/2, atunci 4x este egal cu:",
      options: [{ key: "a", text: "3/4" }, { key: "b", text: "8/3" }, { key: "c", text: "3" }, { key: "d", text: "6" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true,
      topic: "Radicali. Produsul a două numere",
      content: "Patru elevi, Alin, Mihai, Ioana și Maria, au calculat produsul numerelor a = 3 + 2√2 și b = 3 − 2√2. Rezultatele obținute de cei patru elevi: Alin → 17; Mihai → 6; Ioana → 5; Maria → 1. Conform informațiilor din tabel, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Alin" }, { key: "b", text: "Mihai" }, { key: "c", text: "Ioana" }, { key: "d", text: "Maria" }],
      correctAnswer: "d",
    },
    {
      section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true,
      topic: "Proporționalitate",
      content: "Două pixuri și un caiet costă 20 de lei. Enunțul: „Patru pixuri și două caiete, de același tip, costă 40 de lei.” este:",
      options: [{ key: "a", text: "adevărat" }, { key: "b", text: "fals" }],
      correctAnswer: "a",
    },
    // ── Subiectul al II-lea (6 × 5p MCQ, toate cu figură) ──
    {
      section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false,
      topic: "Segmente",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare, în această ordine; BC = AB/2, CD = BC/2.",
      content: "În figura alăturată, punctele A, B, C și D sunt coliniare, în această ordine, astfel încât lungimea segmentului BC este jumătate din lungimea segmentului AB și lungimea segmentului CD este jumătate din lungimea segmentului BC. Dacă BC = 4 cm, atunci lungimea segmentului AD este egală cu:",
      options: [{ key: "a", text: "20 cm" }, { key: "b", text: "14 cm" }, { key: "c", text: "12 cm" }, { key: "d", text: "7 cm" }],
      correctAnswer: "b",
    },
    {
      section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false,
      topic: "Unghiuri. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiurile adiacente suplementare AOC și COB; OM bisectoarea unghiului AOC.",
      content: "În figura alăturată sunt reprezentate unghiurile adiacente suplementare AOC și COB. Semidreapta OM este bisectoarea unghiului AOC, iar măsura unghiului MOB este egală cu 145°. Măsura unghiului BOC este egală cu:",
      options: [{ key: "a", text: "35°" }, { key: "b", text: "70°" }, { key: "c", text: "105°" }, { key: "d", text: "110°" }],
      correctAnswer: "d",
    },
    {
      section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false,
      topic: "Triunghi isoscel",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi isoscel ABC (AB = AC), ∢BAC = 36°; M pe AC cu AM = BM.",
      content: "În figura alăturată este reprezentat triunghiul isoscel ABC, cu AB = AC și măsura unghiului BAC este egală cu 36°. Punctul M aparține laturii AC, astfel încât AM = BM. Măsura unghiului MBC este egală cu:",
      options: [{ key: "a", text: "18°" }, { key: "b", text: "36°" }, { key: "c", text: "54°" }, { key: "d", text: "72°" }],
      correctAnswer: "b",
    },
    {
      section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false,
      topic: "Pătrat. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Pătrat ABCD; M mijlocul lui BC; P = AM ∩ DC.",
      content: "În figura alăturată este reprezentat pătratul ABCD, cu AB = 4 cm. Punctul M este mijlocul laturii BC. Dreptele AM și DC se intersectează în punctul P. Aria triunghiului ABP este egală cu:",
      options: [{ key: "a", text: "3 cm²" }, { key: "b", text: "4 cm²" }, { key: "c", text: "8 cm²" }, { key: "d", text: "16 cm²" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false,
      topic: "Cerc. Unghi înscris",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cerc de centru O, diametru AB; C, D pe cerc cu AB ∥ CD, ∢BOC = 60°.",
      content: "În figura alăturată este reprezentat cercul de centru O și diametru AB. Punctele C și D aparțin cercului, astfel încât dreptele AB și CD sunt paralele și măsura unghiului BOC este egală cu 60°. Măsura unghiului BAD este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "120°" }],
      correctAnswer: "b",
    },
    {
      section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false,
      topic: "Prismă dreaptă",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Prismă dreaptă ABCA'B'C' cu baza triunghi echilateral ABC; AA' = 3 cm, AB = 4 cm.",
      content: "În figura alăturată este reprezentată prisma dreaptă ABCA'B'C', cu baza triunghiul echilateral ABC, cu AA' = 3 cm și AB = 4 cm. Lungimea segmentului BC' este egală cu:",
      options: [{ key: "a", text: "3 cm" }, { key: "b", text: "4 cm" }, { key: "c", text: "5 cm" }, { key: "d", text: "7 cm" }],
      correctAnswer: "c",
    },
    // ── Subiectul al III-lea (6 × 5p deschis) ──
    {
      section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false,
      topic: "Probleme. Numere naturale",
      finalAnswer: "12",
      content: "Pentru a putea așeza elevii unei clase câte doi în fiecare bancă, în această sală de clasă, ar mai trebui adusă încă o bancă în care să fie așezați doi elevi.",
      rubric: [
        { label: "a)", points: 2, answer: "Notând cu e numărul elevilor și cu b numărul băncilor: e = 2(b + 1), deci e este număr par. Cum 25 este număr impar, nu este posibil ca în acea clasă să fie 25 de elevi." },
        { label: "b)", points: 3, answer: "Dacă elevii se așază câte 4: e = 4(b − 6) + 2 (5 bănci rămân libere și o bancă are doar 2 elevi). Din 2(b + 1) = 4(b − 6) + 2 ⇒ 2b = 24 ⇒ b = 12 bănci." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false,
      topic: "Calcul algebric. Expresii raționale",
      content: "Se consideră expresia E(x) = (1/(x²−3x+2) + 1/(1−x)) : (x²−6x+9)/(x−1), unde x este număr real, x ≠ 1, x ≠ 2 și x ≠ 3.",
      rubric: [
        { label: "a)", points: 2, answer: "x² − 3x + 2 = x² − x − 2x + 2 = x(x − 1) − 2(x − 1) = (x − 2)(x − 1), pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = −1/((x − 2)(x − 3)) = 1/(x − 2) − 1/(x − 3). Atunci T = E(4) + E(5) + E(6) + E(7) = −(1/(1·2) + 1/(2·3) + 1/(3·4) + 1/(4·5)) = −4/5; cum −√64/10 < −√50/10, rezultă că T = −4/5 < −√2/2." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false,
      topic: "Geometrie analitică",
      hasFigure: true, figureUrl: FIG("s3-3"),
      finalAnswer: "(7,0)",
      figureNote: "Sistem de axe ortogonale xOy.",
      content: "În sistemul de axe ortogonale xOy se consideră punctele A(2, 0) și B(10, 4).",
      rubric: [
        { label: "a)", points: 2, answer: "C(10, 0) este proiecția punctului B pe axa Ox, deci AC = 8 și BC = 4; AB² = AC² + BC² = 64 + 16 = 80, deci AB = √80 = 4√5." },
        { label: "b)", points: 3, answer: "M(m, 0) ⇒ AM = |m − 2|. Triunghiul BMC este dreptunghic în C, cu BM = |m − 2| și CM = |10 − m|, deci (m − 2)² = 16 + (10 − m)² ⇒ m = 7, de unde M(7, 0)." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false,
      topic: "Cerc. Pătrat înscris. Tangentă",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Cerc de centru O; ABCD pătrat înscris; M mijlocul arcului mic AD; P = AD ∩ BM.",
      content: "În figura alăturată este reprezentat cercul de centru O. Punctele A, B, C și D aparțin cercului, astfel încât ABCD este pătrat, cu AB = 4 cm. Punctul M este mijlocul arcului mic AD, iar dreptele AD și BM se intersectează în punctul P.",
      rubric: [
        { label: "a)", points: 2, answer: "Diagonala pătratului BD = 4√2 cm; MO = OB = BD/2 = 2√2 cm." },
        { label: "b)", points: 3, answer: "În triunghiul isoscel OAD, OM este bisectoare, deci OQ (Q = OM ∩ AD) este înălțime și mediană ⇒ OQ = 2 cm și MQ = 2(√2 − 1) cm. Cum MQ ∥ AB ⇒ ΔMPQ ∼ ΔBPA ⇒ MQ/BA = PQ/PA, de unde (BA + MQ)/BA = (PA + PQ)/PA, deci (2 + 2√2)/BA = 2/PA. În triunghiul BAP dreptunghic în A: tg(∢BPA) = BA/PA = (2 + 2√2)/2 = 1 + √2." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false,
      topic: "Triunghi echilateral. Proiecții. Arii",
      hasFigure: true, figureUrl: FIG("s3-5"),
      finalAnswer: "9√3/2",
      figureNote: "Triunghi echilateral ABC; M mijlocul lui AC; P proiecția lui M pe BC; Q proiecția lui P pe AB.",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC, cu AB = 8 cm. Punctul M este mijlocul segmentului AC, punctul P este proiecția punctului M pe dreapta BC și punctul Q este proiecția punctului P pe dreapta AB.",
      rubric: [
        { label: "a)", points: 2, answer: "MC = AC/2 = 4 cm; MP ⊥ BC și ∢PMC = 30°, deci PC = MC/2 = 2 cm." },
        { label: "b)", points: 3, answer: "PQ ⊥ AB, ∢PBQ = 60° ⇒ PQ = 3√3 cm. QT ⊥ MP (T pe MP), ∢MPQ = 60° ⇒ QT = 9/2 cm. Cum MP = 2√3 cm, Aria(MPQ) = (QT·MP)/2 = 9√3/2 cm²." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false,
      topic: "Tetraedru regulat. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Tetraedru regulat ABCD; M mijlocul muchiei AD; P simetricul lui B față de M.",
      content: "În figura alăturată este reprezentat tetraedrul regulat ABCD, cu AB = 6 cm. Punctul M este mijlocul muchiei AD și punctul P este simetricul punctului B față de punctul M.",
      rubric: [
        { label: "a)", points: 2, answer: "BM = CM și PM = BM ⇒ BP = 2·CM, deci triunghiul PCB este dreptunghic în C. CM = 3√3 cm și PC = √(PB² − BC²) = 6√2 cm." },
        { label: "b)", points: 3, answer: "ME este linie mijlocie în ΔPDB (E mijlocul lui BD) ⇒ ME ∥ DP, deci ∢(DP, CM) = ∢(ME, CM). ME = AB/2 = 3 cm; cum CE = CM, triunghiul MCE este isoscel. CF ⊥ ME (F pe ME) ⇒ CF = √((3√3)² − (3/2)²) = 3√11/2 cm, iar din triunghiul dreptunghic CFM: sin(∢CMF) = CF/MC = (3√11/2)·(1/(3√3)) = √33/6." },
      ],
    },
  ],
};

const PAPERS = [MATH];

function validate() {
  const errors = [];
  for (const p of PAPERS) {
    const tag = `${p.subjectKey}/${p.variant}`;
    const expectedItemPoints = p.maxScore - p.officeBonus;
    let sum = 0;
    const labels = new Set();
    for (const it of p.items) {
      if (!it.section || !it.label || !it.type || typeof it.points !== "number")
        errors.push(`[${tag}] item missing required field: ${JSON.stringify(it.label)}`);
      if (!it.content || !it.content.trim())
        errors.push(`[${tag}] item ${it.label} empty content`);
      const labelKey = `${it.section}::${it.label}`;
      if (labels.has(labelKey)) errors.push(`[${tag}] duplicate label ${it.section} ${it.label}`);
      labels.add(labelKey);
      if (it.type === "MCQ") {
        if (!Array.isArray(it.options) || it.options.length < 2)
          errors.push(`[${tag}] MCQ ${it.label} needs >=2 options`);
        if (!it.correctAnswer) errors.push(`[${tag}] MCQ ${it.label} missing correctAnswer`);
        const keys = (it.options || []).map((o) => o.key);
        if (it.correctAnswer && !keys.includes(it.correctAnswer))
          errors.push(`[${tag}] MCQ ${it.label} correctAnswer '${it.correctAnswer}' not in option keys`);
      }
      if (it.autoGradable && it.hasFigure)
        errors.push(`[${tag}] item ${it.label} autoGradable but hasFigure (contradiction)`);
      if (it.autoGradable && it.type === "OPEN")
        errors.push(`[${tag}] item ${it.label} autoGradable but type OPEN (contradiction)`);
      if (it.hasFigure && !it.figureUrl)
        errors.push(`[${tag}] item ${it.label} hasFigure but missing figureUrl`);
      if (Array.isArray(it.rubric) && it.rubric.length && it.rubric.every((r) => typeof r.points === "number")) {
        const rsum = it.rubric.reduce((a, r) => a + r.points, 0);
        if (rsum !== it.points)
          errors.push(`[${tag}] item ${it.label} rubric points ${rsum} != item points ${it.points}`);
      }
      sum += it.points;
    }
    if (sum !== expectedItemPoints)
      errors.push(`[${tag}] item points sum ${sum} != maxScore-officeBonus ${expectedItemPoints}`);
    const autoCount = p.items.filter((i) => i.autoGradable).length;
    const figCount = p.items.filter((i) => i.hasFigure).length;
    console.log(
      `  ${tag.padEnd(22)} items=${p.items.length} pts=${sum}(+${p.officeBonus} oficiu=${sum + p.officeBonus}) ` +
        `autoGradable=${autoCount} figures=${figCount}`
    );
  }
  if (errors.length) {
    console.error(`\n❌ VALIDATE FAILED (${errors.length}):`);
    for (const e of errors) console.error("   - " + e);
    process.exit(1);
  }
  console.log("\n✅ VALIDATE OK — paper structurally sound, points sum to 90 (+10 oficiu = 100).");
}

async function run(dry) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const p of PAPERS) {
      const existing = await prisma.examPaper.findUnique({
        where: {
          examType_year_subjectKey_variant: {
            examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant,
          },
        },
        include: { _count: { select: { items: true, passages: true } } },
      });
      const action = existing ? "UPDATE" : "CREATE";
      console.log(
        `  ${p.subjectKey}/${p.variant} ${action} paper → items=${p.items.length}` +
          (existing ? ` (replacing items=${existing._count.items})` : "")
      );
      if (dry) continue;

      const paper = await prisma.examPaper.upsert({
        where: {
          examType_year_subjectKey_variant: {
            examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant,
          },
        },
        update: {
          source: p.source, subjectName: p.subjectName, grade: p.grade, maxScore: p.maxScore,
          officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language,
          sourceUrl: p.sourceUrl, license: p.license, isActive: true,
        },
        create: {
          source: p.source, examType: p.examType, year: p.year, subjectKey: p.subjectKey,
          subjectName: p.subjectName, grade: p.grade, variant: p.variant, maxScore: p.maxScore,
          officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language,
          sourceUrl: p.sourceUrl, license: p.license,
        },
      });
      await prisma.examItem.deleteMany({ where: { paperId: paper.id } });
      await prisma.examPassage.deleteMany({ where: { paperId: paper.id } });

      await prisma.examItem.createMany({
        data: p.items.map((it, idx) => ({
          paperId: paper.id, section: it.section, label: it.label, orderIndex: idx,
          type: it.type, points: it.points, content: it.content,
          options: it.options ?? undefined, correctAnswer: it.correctAnswer ?? null,
          rubric: it.rubric ?? undefined, passageRef: it.passageRef ?? null,
          hasFigure: !!it.hasFigure, figureNote: it.figureNote ?? null,
          figureUrl: it.figureUrl ?? null, finalAnswer: it.finalAnswer ?? null,
          autoGradable: !!it.autoGradable, topic: it.topic ?? null,
        })),
      });
    }
    const [papers, items] = await Promise.all([prisma.examPaper.count(), prisma.examItem.count()]);
    console.log(`\n${dry ? "🔎 DRY — no writes." : "✅ APPLIED."} DB totals: ExamPaper=${papers} ExamItem=${items}`);
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  console.log(`\n=== import-exam-mate-2026-simulare (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
