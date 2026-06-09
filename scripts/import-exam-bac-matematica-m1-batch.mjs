#!/usr/bin/env node
/**
 * import-exam-bac-matematica-m1-batch.mjs — BAC Matematică M1 (Mate-Info) → SIMULĂRI (full papers, batch)
 *
 * Clone of import-exam-bac-matematica-m1-model.mjs but with a PAPERS[] array so the
 * remaining Faza-B simulări (13 lucrări: 2022/2023/2024 model+simulare+var-XX, minus
 * 2024 model already shipped by the -model script) accumulate here, one entry each.
 *
 * Per paper: Subiectul I (6 × 5p, SHORT + finalAnswer + rubric) + Subiectul al II-lea
 * (2 × 15p, OPEN, rubric a/b/c) + Subiectul al III-lea (2 × 15p, OPEN, rubric a/b/c) = 90p
 * (+10 oficiu = 100). examType="BAC", subjectKey="matematica_m1", grade 12, timeLimit 180.
 * Content + rubrics transcribed VERBATIM from the official CNPEE subject + barem (rendered
 * PDF, not the garbled fitz dump). Math notation = plain Unicode inline (UI has no KaTeX).
 * The 3 BAC programs (M1/M2/M3) are NEVER mixed. Idempotent per (examType,year,subjectKey,variant).
 *
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL from env (VPS2 local PG).
 */
const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

const PAPERS = [
  {
    source: "BAC 2024 Simulare — Matematică M_mate-info (CNPEE)",
    examType: "BAC", year: 2024, subjectKey: "matematica_m1", subjectName: "Matematică M1 (Mate-Info)",
    grade: 12, variant: "simulare", maxScore: 100, officeBonus: 10, timeLimit: 180, language: "ro",
    sourceUrl: "https://subiecte.edu.ro/2024/bacalaureat/", license: "edu.ro public (CNPEE)", passages: [],
    items: [
      // ── SUBIECTUL I (30p) — 6 itemi × 5p ──
      { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Logaritmi",
        content: "Arătați că (3+lg(1/10))·lg√10=1.",
        finalAnswer: "1",
        rubric: [{ label: "barem", points: 5, answer: "lg(1/10)=−1, deci 3+lg(1/10)=2. (3+lg(1/10))·lg√10=2·lg√10=2·(1/2)=1." }] },
      { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții. Compunere",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²+ax−1, unde a este număr real. Determinați numerele reale a pentru care (f∘f)(1)=1.",
        finalAnswer: "a∈{−1, 1}",
        rubric: [{ label: "barem", points: 5, answer: "f(1)=1+a−1=a; (f∘f)(1)=f(a)=a²+a·a−1=2a²−1. 2a²−1=1, de unde obținem a=−1 sau a=1." }] },
      { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații exponențiale",
        content: "Rezolvați în mulțimea numerelor reale ecuația 2^(x+1)·8^x=32.",
        finalAnswer: "x=1",
        rubric: [{ label: "barem", points: 5, answer: "2^(x+1)·2^(3x)=32, deci 2^(4x+1)=2^5, de unde obținem 4x+1=5; x=1." }] },
      { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Probabilități",
        content: "Calculați probabilitatea ca, alegând un număr n din mulțimea numerelor naturale de două cifre, numărul √(n+100) să fie natural.",
        finalAnswer: "2/45",
        rubric: [{ label: "barem", points: 5, answer: "Mulțimea numerelor naturale de două cifre are 90 de elemente, deci sunt 90 de cazuri posibile. Cum 110≤n+100≤199 și n+100 este pătratul unui număr natural, obținem 4 numere: 21, 44, 69 și 96, deci p=4/90=2/45." }] },
      { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Vectori. Geometrie analitică",
        content: "În reperul cartezian xOy se consideră punctele A(1,4), B(4,6) și C(4,2). Determinați coordonatele punctului D, știind că OD⃗=½(AB⃗+AC⃗).",
        finalAnswer: "D(3, 0)",
        rubric: [{ label: "barem", points: 5, answer: "AB⃗=3i⃗+2j⃗, AC⃗=3i⃗−2j⃗ ⇒ OD⃗=½(3i⃗+2j⃗+3i⃗−2j⃗)=3i⃗, deci punctul D are coordonatele (3,0)." }] },
      { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Trigonometrie. Expresii",
        content: "Se consideră expresia E(x)=tg x−4cos(x/2)·cos x, unde x∈(0,π/2). Arătați că E(π/3)=0.",
        finalAnswer: "0",
        rubric: [{ label: "barem", points: 5, answer: "tg(π/3)=√3, cos(π/6)=√3/2, cos(π/3)=1/2. E(π/3)=√3−4·(√3/2)·(1/2)=√3−√3=0." }] },

      // ── SUBIECTUL al II-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți. Inversa",
        content: "Se consideră matricele I₃=(1 0 0 / 0 1 0 / 0 0 1) și A(x)=(1 −1 x / −1 0 0 / x 0 −1), unde x este număr real.\na) Arătați că det(A(0))=1.\nb) Arătați că det(A(x)·A(x)−I₃)≤0, pentru orice număr real x.\nc) Se consideră matricea B∈M₂,₃(ℝ), B=(1 0 1 / 0 1 0). Determinați matricea X∈M₂,₃(ℝ) pentru care X·(A(0))⁻¹=B·A(0), unde (A(0))⁻¹ este inversa matricei A(0).",
        rubric: [
          { label: "a)", points: 5, answer: "A(0)=(1 −1 0 / −1 0 0 / 0 0 −1) ⇒ det(A(0))=0+0+0−0−0−(−1)=1." },
          { label: "b)", points: 5, answer: "A(x)·A(x)=(2+x² −1 0 / −1 1 −x / 0 −x x²+1), deci A(x)·A(x)−I₃=(1+x² −1 0 / −1 0 −x / 0 −x x²). det(A(x)·A(x)−I₃)=−x²(1+x²)−x²=−x²(2+x²)≤0, pentru orice număr real x." },
          { label: "c)", points: 5, answer: "X·(A(0))⁻¹=B·A(0) ⇒ X=B·A(0)·A(0). X=(2 −1 1 / −1 1 0)." },
        ] },
      { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Element neutru",
        content: "Pe mulțimea M=[0,+∞) se definește legea de compoziție x∗y=(x²+y²+x+y)/(x+y+1).\na) Arătați că 1∗2=2.\nb) Arătați că e=0 este elementul neutru al legii de compoziție „∗”.\nc) Determinați perechile (m,n) de numere naturale pentru care m∗n=5.",
        rubric: [
          { label: "a)", points: 5, answer: "1∗2=(1²+2²+1+2)/(1+2+1)=8/4=2." },
          { label: "b)", points: 5, answer: "x∗0=(x²+x)/(x+1)=x(x+1)/(x+1)=x, pentru orice x∈M și, analog, 0∗x=x, pentru orice x∈M, deci e=0 este elementul neutru al legii de compoziție „∗”." },
          { label: "c)", points: 5, answer: "(m²+n²+m+n)/(m+n+1)=5, de unde obținem (m−2)²+(n−2)²=13. Cum m și n sunt numere naturale, obținem perechile (0,5), (4,5), (5,0) și (5,4)." },
        ] },

      // ── SUBIECTUL al III-lea (30p) — 2 probleme × 15p ──
      { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Monotonie",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(x+6)√(x²+4).\na) Arătați că f′(x)=2(x²+3x+2)/√(x²+4), x∈ℝ.\nb) Determinați intervalele de monotonie ale funcției f.\nc) Demonstrați că ecuația f(x)=m are soluție unică, pentru orice număr întreg m.",
        rubric: [
          { label: "a)", points: 5, answer: "f′(x)=√(x²+4)+(x+6)·2x/(2√(x²+4))=((x²+4)+(x+6)x)/√(x²+4)=(2x²+6x+4)/√(x²+4)=2(x²+3x+2)/√(x²+4), x∈ℝ." },
          { label: "b)", points: 5, answer: "f′(x)=2(x+1)(x+2)/√(x²+4). f′(x)>0 pentru x∈(−∞,−2)∪(−1,+∞) ⇒ f strict crescătoare pe (−∞,−2] și pe [−1,+∞); f′(x)<0 pentru x∈(−2,−1) ⇒ f strict descrescătoare pe [−2,−1]." },
          { label: "c)", points: 5, answer: "lim_{x→−∞}f(x)=−∞, f(−2)=√128, f(−1)=√125, lim_{x→+∞}f(x)=+∞, f continuă; 11<√125<√128<12. Cum f este strict crescătoare pe (−∞,−2], descrescătoare pe [−2,−1] și strict crescătoare pe [−1,+∞), iar valorile extremelor locale √128 și √125 nu sunt întregi, ecuația f(x)=m are soluție unică, pentru orice număr întreg m." },
        ] },
      { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale definite. Șiruri de integrale",
        content: "Se consideră funcția f:ℝ→ℝ, f(x)=(x+1)/eˣ.\na) Arătați că ∫₀⁴ eˣ·f(x) dx=12.\nb) Arătați că ∫₀¹ f(x) dx=(2e−3)/e.\nc) Pentru fiecare număr natural n, n≥2, se consideră numărul Iₙ=∫₀¹ x^(n−1)/f(xⁿ) dx. Demonstrați că (ln2)/n ≤ Iₙ ≤ (e−1)/n, pentru orice număr natural n, n≥2.",
        rubric: [
          { label: "a)", points: 5, answer: "∫₀⁴ eˣ·f(x) dx=∫₀⁴ (x+1) dx=(x²/2+x)|₀⁴=8+4=12." },
          { label: "b)", points: 5, answer: "∫₀¹ f(x) dx=∫₀¹ (x+1)(−e^(−x))′ dx=(x+1)(−e^(−x))|₀¹−e^(−x)|₀¹=−2/e+1−1/e+1=(2e−3)/e." },
          { label: "c)", points: 5, answer: "Iₙ=∫₀¹ x^(n−1)e^(xⁿ)/(xⁿ+1) dx=(1/n)∫₀¹ (xⁿ)′e^(xⁿ)/(xⁿ+1) dx=(1/n)∫₀¹ eᵗ/(t+1) dt, pentru orice n≥2. Cum 1≤eᵗ și 1/(t+1)≤eᵗ/(t+1)≤eᵗ pe [0,1]: Iₙ≥(1/n)∫₀¹ 1/(t+1) dt=(1/n)ln(t+1)|₀¹=(ln2)/n și Iₙ≤(1/n)∫₀¹ eᵗ dt=(e−1)/n, pentru orice n≥2." },
        ] },
    ],
  },
];

function validate() {
  const errors = [];
  for (const p of PAPERS) {
    const tag = `${p.year}-${p.variant}`;
    const expected = p.maxScore - p.officeBonus;
    let sum = 0;
    const labels = new Set();
    for (const it of p.items) {
      if (!it.section || !it.label || !it.type || typeof it.points !== "number") errors.push(`[${tag}] item missing field: ${it.label}`);
      if (!it.content || !it.content.trim()) errors.push(`[${tag}] item ${it.label} empty content`);
      const key = `${it.section}::${it.label}`;
      if (labels.has(key)) errors.push(`[${tag}] duplicate ${key}`);
      labels.add(key);
      if (it.autoGradable && it.type === "OPEN") errors.push(`[${tag}] ${it.label} autoGradable but OPEN`);
      if (Array.isArray(it.rubric) && it.rubric.length && it.rubric.every((r) => typeof r.points === "number")) {
        const rsum = it.rubric.reduce((a, r) => a + r.points, 0);
        if (rsum !== it.points) errors.push(`[${tag}] ${it.label} rubric ${rsum} != points ${it.points}`);
      }
      sum += it.points;
    }
    if (sum !== expected) errors.push(`[${tag}] points sum ${sum} != ${expected}`);
    console.log(`  ${tag.padEnd(16)} items=${p.items.length} pts=${sum}(+${p.officeBonus} oficiu=${sum + p.officeBonus})`);
  }
  if (errors.length) { console.error(`\n❌ VALIDATE FAILED (${errors.length}):`); for (const e of errors) console.error("   - " + e); process.exit(1); }
  console.log(`\n✅ VALIDATE OK — ${PAPERS.length} paper(s), 90p (+10 oficiu = 100) fiecare.`);
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
      console.log(`  ${p.year}-${p.variant} ${existing ? "UPDATE" : "CREATE"} → items=${p.items.length}` + (existing ? ` (replacing ${existing._count.items})` : ""));
      if (dry) continue;
      const paper = await prisma.examPaper.upsert({
        where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } },
        update: { source: p.source, subjectName: p.subjectName, grade: p.grade, maxScore: p.maxScore, officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language, sourceUrl: p.sourceUrl, license: p.license, isActive: true },
        create: { source: p.source, examType: p.examType, year: p.year, subjectKey: p.subjectKey, subjectName: p.subjectName, grade: p.grade, variant: p.variant, maxScore: p.maxScore, officeBonus: p.officeBonus, timeLimit: p.timeLimit, language: p.language, sourceUrl: p.sourceUrl, license: p.license, isActive: true },
      });
      await prisma.examItem.deleteMany({ where: { paperId: paper.id } });
      await prisma.examItem.createMany({
        data: p.items.map((it, idx) => ({
          paperId: paper.id, section: it.section, label: it.label, orderIndex: idx,
          type: it.type, points: it.points, content: it.content,
          options: it.options ?? undefined, correctAnswer: it.correctAnswer ?? null,
          rubric: it.rubric ?? undefined, passageRef: it.passageRef ?? null,
          hasFigure: !!it.hasFigure, figureNote: it.figureNote ?? null,
          figureUrl: it.figureUrl ?? null, autoGradable: !!it.autoGradable,
          finalAnswer: it.finalAnswer ?? null, topic: it.topic ?? null,
        })),
      });
    }
    const [papers, items] = await Promise.all([prisma.examPaper.count(), prisma.examItem.count()]);
    console.log(`\n${dry ? "🔎 DRY — no writes." : "✅ APPLIED."} DB totals: ExamPaper=${papers} ExamItem=${items}`);
  } finally { await prisma.$disconnect(); }
}

(async () => {
  console.log(`\n=== import-exam-bac-matematica-m1-batch (mode=${MODE}, papers=${PAPERS.length}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
