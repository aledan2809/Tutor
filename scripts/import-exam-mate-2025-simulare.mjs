#!/usr/bin/env node
/**
 * import-exam-mate-2025-simulare.mjs — Exam-Bank series 2, pair 2025 Simulare (Matematică)
 *
 * SOURCE: Ministerul Educației și Cercetării / CNCE — EN VIII, an școlar 2024–2025, Simulare.
 *   Public (edu.ro / pro-matematica). Content transcribed verbatim from the official subiect +
 *   barem PDFs (`~/Downloads/Temp/tutor eval nat/pro-matematica/2025_EN_Matematica_Simulare_*`).
 *   Answer keys + rubric taken from the official BAREM — ground-truth, zero generation.
 *
 * Barem chei: I = 1b 2c 3d 4b 5a 6b · II = 1c 2b 3c 4c 5b 6c
 * Figures: 10 PNG in public/exam-figures/ (en-viii-2025-mate-simulare-s{1,2,3}-{label}.png).
 * finalAnswer (clean numeric result for free auto-check): III.1=44, III.2=2, III.3=1,8, III.5=9, III.6=45.
 *
 * Idempotent: upsert paper by unique (examType, year, subjectKey, variant) → replace items/passages.
 * Modes: --validate (offline) | --dry (DB read, no writes) | (none) apply.
 * DB target: DATABASE_URL from env. On prod this is VPS2 local PG (DBM). Never Neon.
 */

const MODE = process.argv.includes("--validate")
  ? "validate"
  : process.argv.includes("--dry")
    ? "dry"
    : "apply";

const FIG = (s) => `/exam-figures/en-viii-2025-mate-simulare-${s}.png`;

const MATH = {
  source: "EN VIII 2025 Simulare (edu.ro)",
  examType: "EN_VIII",
  year: 2025,
  subjectKey: "matematica",
  subjectName: "Matematică",
  grade: 8,
  variant: "simulare",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNCE)",
  passages: [],
  items: [
    // ── Subiectul I (6 × 5p MCQ) ──
    {
      section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true,
      topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 25 − 2 · 5 este egal cu:",
      options: [{ key: "a", text: "10" }, { key: "b", text: "15" }, { key: "c", text: "35" }, { key: "d", text: "115" }],
      correctAnswer: "b",
    },
    {
      section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true,
      topic: "Procente",
      content: "Numărul care reprezintă 10% din 50 este egal cu:",
      options: [{ key: "a", text: "40" }, { key: "b", text: "10" }, { key: "c", text: "5" }, { key: "d", text: "1" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true,
      topic: "Numere întregi",
      content: "Într-o zi, dimineața, temperatura aerului a fost de −1°C, iar la prânz a fost de +2°C. În acea zi, temperatura măsurată la prânz a fost mai mare decât temperatura măsurată dimineața cu:",
      options: [{ key: "a", text: "−3°C" }, { key: "b", text: "−1°C" }, { key: "c", text: "1°C" }, { key: "d", text: "3°C" }],
      correctAnswer: "d",
    },
    {
      section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true,
      topic: "Ecuații",
      content: "Soluția ecuației x + 1/4 = 1/2 este:",
      options: [{ key: "a", text: "1/6" }, { key: "b", text: "1/4" }, { key: "c", text: "1/2" }, { key: "d", text: "3/4" }],
      correctAnswer: "b",
    },
    {
      section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true,
      topic: "Radicali. Media aritmetică",
      content: "Patru elevi, Andreea, Iris, Mihai și Radu, calculează media aritmetică a numerelor a = 4 − √2 și b = 4 + √2. Rezultatele calculelor făcute de cei patru elevi sunt: Andreea → 4; Iris → √2; Mihai → 2; Radu → √14. Dintre cei patru elevi, cel care a calculat corect media aritmetică a numerelor a și b este:",
      options: [{ key: "a", text: "Andreea" }, { key: "b", text: "Iris" }, { key: "c", text: "Mihai" }, { key: "d", text: "Radu" }],
      correctAnswer: "a",
    },
    {
      section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: false,
      topic: "Interpretarea diagramelor",
      hasFigure: true, figureUrl: FIG("s1-6"),
      figureNote: "Diagramă cu bare — numărul de elevi pe sporturi: Fotbal 40, Baschet 25, Tenis 35, Șah 45.",
      content: "În diagrama alăturată sunt prezentate informații despre numărul de elevi care au făcut opțiuni pentru practicarea sporturilor de tip fotbal, baschet, tenis și șah, în cadrul unui club sportiv școlar. Afirmația „Conform informațiilor din diagramă, în acest club sportiv școlar, numărul elevilor care au făcut opțiuni pentru practicarea fotbalului este egal cu numărul elevilor care au făcut opțiuni pentru practicarea șahului.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }],
      correctAnswer: "b",
    },
    // ── Subiectul al II-lea (6 × 5p MCQ, toate cu figură) ──
    {
      section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false,
      topic: "Segmente congruente",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare, în această ordine.",
      content: "În figura alăturată sunt reprezentate punctele distincte și coliniare A, B, C și D, în această ordine. Segmentele AB, BC și CD sunt congruente, iar lungimea segmentului AD este egală cu 24 cm. Lungimea segmentului CD este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "6 cm" }, { key: "c", text: "8 cm" }, { key: "d", text: "12 cm" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false,
      topic: "Unghiuri adiacente suplementare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiurile adiacente suplementare AOB și BOC; semidreapta OD opusă semidreptei OB.",
      content: "În figura alăturată sunt reprezentate unghiurile adiacente suplementare AOB și BOC. Știind că ∢BOC = 60° și că semidreapta OD este opusă semidreptei OB, măsura unghiului DOC este egală cu:",
      options: [{ key: "a", text: "160°" }, { key: "b", text: "120°" }, { key: "c", text: "60°" }, { key: "d", text: "30°" }],
      correctAnswer: "b",
    },
    {
      section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false,
      topic: "Triunghi echilateral. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi echilateral ABC; BE bisectoarea unghiului ABC; D mijlocul lui BC; P = AD ∩ BE.",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC. Semidreapta BE este bisectoarea unghiului ABC și punctul D este mijlocul segmentului BC. Dreptele AD și BE se intersectează în punctul P. Măsura unghiului DPE este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "120°" }, { key: "d", text: "150°" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false,
      topic: "Trapez isoscel. Linie mijlocie",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Trapez isoscel ABCD cu AB ∥ CD.",
      content: "În figura alăturată este reprezentat trapezul isoscel ABCD, cu AB ∥ CD, CD = 40 cm și AB = 100 cm. Lungimea liniei mijlocii a trapezului ABCD este egală cu:",
      options: [{ key: "a", text: "20 cm" }, { key: "b", text: "50 cm" }, { key: "c", text: "70 cm" }, { key: "d", text: "140 cm" }],
      correctAnswer: "c",
    },
    {
      section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false,
      topic: "Cerc. Aria discului",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cerc de centru O; A, B pe cerc; ∢AOB = 60°, AB = 12 cm.",
      content: "În figura alăturată este reprezentat cercul de centru O. Punctele A și B sunt situate pe cerc, astfel încât măsura unghiului AOB este egală cu 60° și AB = 12 cm. Aria discului de centru O și rază OA este egală cu:",
      options: [{ key: "a", text: "288π cm²" }, { key: "b", text: "144π cm²" }, { key: "c", text: "36π cm²" }, { key: "d", text: "24π cm²" }],
      correctAnswer: "b",
    },
    {
      section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false,
      topic: "Cub. Muchii",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cub ABCDEFGH; EG = 4√2 cm (diagonala feței).",
      content: "În figura alăturată este reprezentat cubul ABCDEFGH. Lungimea segmentului EG este egală cu 4√2 cm. Suma lungimilor tuturor muchiilor cubului este egală cu:",
      options: [{ key: "a", text: "96 cm" }, { key: "b", text: "72 cm" }, { key: "c", text: "48 cm" }, { key: "d", text: "16 cm" }],
      correctAnswer: "c",
    },
    // ── Subiectul al III-lea (6 × 5p deschis, rezolvări complete) ──
    {
      section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false,
      topic: "Probleme. Procente",
      finalAnswer: "44",
      content: "Un bunic dorește să împartă suma de 126 de lei celor trei nepoți ai săi: Ana, Bogdan și Costin. Ana va primi jumătate din suma pe care o vor primi împreună Bogdan și Costin.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă Ana ar primi 40 de lei, atunci Bogdan și Costin ar primi împreună 80 de lei; cum 40 + 80 = 120 ≠ 126, Ana NU poate primi de la bunicul ei 40 de lei." },
        { label: "b)", points: 3, answer: "Notând b și c sumele lui Bogdan, respectiv Costin: b = c + (1/10)c = (11/10)c. Ana primește (b+c)/2, deci (b+c)/2 + b + c = 126 ⇒ b + c = 84. Din (11/10)c + c = 84 ⇒ 21c = 840 ⇒ c = 40 lei, de unde b = 44 lei." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false,
      topic: "Calcul algebric. Expresii raționale",
      finalAnswer: "2",
      content: "Se consideră expresia E(x) = ((x−1)/(x+1) + (x+1)/(x−1) − 2) : 4/(x²+x−2), unde x este număr real, x ≠ −2, x ≠ −1 și x ≠ 1.",
      rubric: [
        { label: "a)", points: 2, answer: "(x−1)(x+2) = x(x+2) − (x+2) = x² + 2x − x − 2 = x² + x − 2, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = (x+2)/(x+1). Atunci E(2)·E(3)·…·E(10) = (4/3)·(5/4)·…·(12/11) = 12/3 = 4, deci N = √4 = 2, care este număr natural." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false,
      topic: "Geometrie analitică",
      finalAnswer: "1,8",
      content: "În sistemul de axe ortogonale xOy se consideră punctele A(2, 0) și B(6, 3).",
      rubric: [
        { label: "a)", points: 2, answer: "C(6, 0) este proiecția punctului B pe axa Ox, deci AC = 4 și BC = 3; AB² = AC² + BC² = 16 + 9 = 25, deci AB = √25 = 5." },
        { label: "b)", points: 3, answer: "Pentru M(5, 0): AM = 3 și d(B, AM) = BC, deci Aria(AMB) = (1/2)·AM·BC = 9/2. Dar Aria(AMB) = (1/2)·AB·d(M, AB) ⇒ 9/2 = (1/2)·5·d(M, AB), deci d(M, AB) = 9/5 = 1,8." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false,
      topic: "Pătrat. Linie mijlocie. Inegalități",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Pătrat ABCD; M mijlocul lui AD; N proiecția lui B pe dreapta CM.",
      content: "În figura alăturată este reprezentat pătratul ABCD, cu AB = 10 cm. Punctul M este mijlocul segmentului AD și punctul N este proiecția punctului B pe dreapta CM.",
      rubric: [
        { label: "a)", points: 2, answer: "Aria(ABCD) = AB² = 100 cm²; Aria(CDM) = Aria(ABM) = (5·10)/2 = 25 cm² ⇒ Aria(MBC) = 100 − (25 + 25) = 50 cm²." },
        { label: "b)", points: 3, answer: "AM este linie mijlocie în triunghiul TBC, unde {T} = AB ∩ MC, iar A este mijlocul lui TB; deci NA este mediană în triunghiul dreptunghic BNT ⇒ NA = TB/2 = 10 cm. TC = √(TB² + BC²) = 10√5 cm și BC² = CN·CT ⇒ CN = 2√5 cm, deci MN = 3√5 cm. P(MAN) = AM + MN + NA = 5 + 3√5 + 10 = (15 + 3√5) cm; cum 3√5 = √45 < √49 = 7, obținem P(MAN) < 22 cm." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false,
      topic: "Triunghi dreptunghic. Asemănare. Arii",
      hasFigure: true, figureUrl: FIG("s3-5"),
      finalAnswer: "9",
      figureNote: "Triunghi ABC dreptunghic în A; M pe AB; MP ∥ AC (P pe BC); G centrul de greutate; E = AG ∩ BC.",
      content: "În figura alăturată este reprezentat triunghiul ABC, dreptunghic în A, cu AB = 9 cm și AC = 12 cm. Punctul M se află pe latura AB, BM = 3 cm. Paralela prin M la dreapta AC intersectează dreapta BC în punctul P, punctul G este centrul de greutate al triunghiului ABC și E este punctul de intersecție a dreptelor AG și BC.",
      rubric: [
        { label: "a)", points: 2, answer: "În triunghiul ABC dreptunghic în A: BC = √(AB² + AC²) = √(81 + 144) = 15 cm." },
        { label: "b)", points: 3, answer: "G centru de greutate ⇒ AG/AE = 2/3; cum AM/AB = 2/3, rezultă MG ∥ BE ⇒ ΔAMG ∼ ΔABE ⇒ MG/BE = 2/3 ⇒ MG = 5 cm. MR ⊥ BP ⇒ MR = 12/5 cm; PE = BE − BP și, cum E este mijlocul lui BC, PE = 5/2 cm. MGEP este trapez ⇒ Aria(MGEP) = ((MG + PE)·MR)/2 = 9 cm²." },
      ],
    },
    {
      section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false,
      topic: "Tetraedru regulat. Unghiul a două drepte",
      hasFigure: true, figureUrl: FIG("s3-6"),
      finalAnswer: "45",
      figureNote: "Tetraedru regulat ABCD; M, N mijloacele muchiilor AB, respectiv CD.",
      content: "În figura alăturată este reprezentat un tetraedru regulat ABCD, cu AB = 20 cm, iar punctele M și N sunt mijloacele muchiilor AB, respectiv CD.",
      rubric: [
        { label: "a)", points: 2, answer: "CM și DM sunt înălțimi în triunghiurile echilaterale ABC și ABD, deci CM = DM = 10√3 cm; MN este înălțime în triunghiul isoscel CMD ⇒ MN = √(CM² − CN²) = 10√2 cm." },
        { label: "b)", points: 3, answer: "PN este linie mijlocie în ΔDBC (P mijlocul lui BC) ⇒ PN ∥ BD, deci ∢(MN, BD) = ∢(MN, PN). Cum PN = BD/2 = 10 cm și MP = AC/2 = 10 cm, rezultă MP² + PN² = MN², deci ΔMPN este dreptunghic isoscel cu ∢MPN = 90°. Obținem ∢(MN, PN) = ∢MNP = 45°, deci ∢(MN, BD) = 45°." },
      ],
    },
  ],
};

const PAPERS = [MATH];

// ─────────────────────────────────────────────────────────────────────────────
// Validation (no DB) — identical contract to slice-1 importer
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// DB write (apply) / dry — figureUrl + finalAnswer baked into items
// ─────────────────────────────────────────────────────────────────────────────
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

      if (p.passages.length) {
        await prisma.examPassage.createMany({
          data: p.passages.map((x) => ({
            paperId: paper.id, ref: x.ref, title: x.title ?? null, author: x.author ?? null,
            sourceNote: x.sourceNote ?? null, body: x.body, orderIndex: x.orderIndex,
          })),
        });
      }
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
  console.log(`\n=== import-exam-mate-2025-simulare (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
