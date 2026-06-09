#!/usr/bin/env node
/**
 * import-exam-bac-matematica-m1-model.mjs — BAC Matematică M1 (Mate-Info) → SIMULARE (full paper)
 *
 * Subiectul I (6 × 5p, SHORT + finalAnswer) + Subiectul al II-lea (2 problems × 15p, OPEN, rubric a/b/c)
 * + Subiectul al III-lea (2 problems × 15p, OPEN, rubric a/b/c) = 90p (+10 oficiu = 100).
 * examType="BAC", subjectKey="matematica_m1", grade 12, timeLimit 180.
 * Content + rubrics transcribed VERBATIM from the official CNPEE subject + barem (rendered PDF,
 * not the garbled fitz dump). Math notation = plain Unicode inline (UI has no KaTeX). Model 2024
 * has NO figures (algebra + analysis only). The 3 BAC programs (M1/M2/M3) are NEVER mixed.
 *
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL from env (VPS2 local PG). Idempotent.
 */
const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

const PAPER = {
  source: "BAC 2024 Model — Matematică M_mate-info (CNPEE)",
  examType: "BAC",
  year: 2024,
  subjectKey: "matematica_m1",
  subjectName: "Matematică M1 (Mate-Info)",
  grade: 12,
  variant: "model",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 180,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2024/bacalaureat/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)",
  passages: [],
  items: [
    // ── SUBIECTUL I (30p) — 6 itemi × 5p ──
    { section: "Subiectul I", label: "1", type: "SHORT", points: 5, autoGradable: false, topic: "Numere complexe",
      content: "Arătați că 2(1−2i)+i(4+i)=1, unde i²=−1.",
      finalAnswer: "1",
      rubric: [{ label: "barem", points: 5, answer: "2(1−2i)+i(4+i)=2−4i+4i+i²=2+(−1)=1." }] },
    { section: "Subiectul I", label: "2", type: "SHORT", points: 5, autoGradable: false, topic: "Funcții. Grafic",
      content: "Se consideră funcția f:ℝ→ℝ, f(x)=x²+ax−a, unde a este număr real. Determinați numărul real a pentru care punctul A(3,−3) aparține graficului funcției f.",
      finalAnswer: "a=−6",
      rubric: [{ label: "barem", points: 5, answer: "f(3)=−3 ⇒ 9+3a−a=−3 ⇒ a=−6." }] },
    { section: "Subiectul I", label: "3", type: "SHORT", points: 5, autoGradable: false, topic: "Ecuații logaritmice",
      content: "Rezolvați în mulțimea numerelor reale ecuația log₂(x²+8)=log₂(8−2x).",
      finalAnswer: "x∈{−2, 0}",
      rubric: [{ label: "barem", points: 5, answer: "x²+8=8−2x, de unde obținem x²+2x=0; x=−2 sau x=0, care convin." }] },
    { section: "Subiectul I", label: "4", type: "SHORT", points: 5, autoGradable: false, topic: "Elemente de combinatorică",
      content: "Determinați câte numere naturale de două cifre distincte, cu cifra zecilor pară, se pot forma cu elementele mulțimii A={1,2,3,4,5}.",
      finalAnswer: "8",
      rubric: [{ label: "barem", points: 5, answer: "Cifra zecilor se poate alege în 2 moduri (2 sau 4). Pentru fiecare alegere, cifra unităților se poate alege în câte 4 moduri, deci se pot forma 2·4=8 numere." }] },
    { section: "Subiectul I", label: "5", type: "SHORT", points: 5, autoGradable: false, topic: "Vectori. Geometrie analitică",
      content: "În sistemul cartezian xOy se consideră punctele A(0,3) și B(4,0). Determinați coordonatele punctului C pentru care OC⃗=OA⃗+OB⃗.",
      finalAnswer: "C(4, 3)",
      rubric: [{ label: "barem", points: 5, answer: "OA⃗=3j⃗, OB⃗=4i⃗ ⇒ OC⃗=4i⃗+3j⃗, deci punctul C are coordonatele (4,3)." }] },
    { section: "Subiectul I", label: "6", type: "SHORT", points: 5, autoGradable: false, topic: "Trigonometrie. Triunghiul",
      content: "Se consideră triunghiul ascuțitunghic ABC, cu AB=5, măsura unghiului C egală cu π/4 și înălțimea AD=4 (D∈BC). Arătați că BC=7.",
      finalAnswer: "BC=7",
      rubric: [{ label: "barem", points: 5, answer: "În triunghiul dreptunghic ADC: DC=4 (∢C=45°, AD=4). În triunghiul dreptunghic ADB: BD=√(AB²−AD²)=√(25−16)=3. Deci BC=BD+DC=3+4=7." }] },

    // ── SUBIECTUL al II-lea (30p) — 2 probleme × 15p ──
    { section: "Subiectul al II-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Matrice. Determinanți. Inversa",
      content: "Se consideră matricele I₃=(1 0 0 / 0 1 0 / 0 0 1) și A(a)=(0 0 1 / a −1 a / 1 0 0), unde a este număr real.\na) Arătați că det(A(1))=1.\nb) Arătați că A(a)·A(b)=A(a)−A(b)+I₃, pentru orice numere reale a și b.\nc) Determinați matricea X∈M₃(ℝ) pentru care A(1)·X·A(0)=I₃.",
      rubric: [
        { label: "a)", points: 5, answer: "A(1)=(0 0 1 / 1 −1 1 / 1 0 0) ⇒ det(A(1))=0+0+0−(−1)−0−0=1." },
        { label: "b)", points: 5, answer: "A(a)·A(b)=(1 0 0 / a−b 1 a−b / 0 0 1)=(0 0 0 / a−b 0 a−b / 0 0 0)+I₃=A(a)−A(b)+I₃, pentru orice numere reale a și b." },
        { label: "c)", points: 5, answer: "(A(1))⁻¹=A(1), (A(0))⁻¹=A(0); X=(A(1))⁻¹·(A(0))⁻¹, de unde obținem X=(1 0 0 / 1 1 1 / 0 0 1)." },
      ] },
    { section: "Subiectul al II-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Lege de compoziție. Element neutru",
      content: "Pe mulțimea M=[3,+∞) se definește legea de compoziție x∘y=m(x−3)(y−3)+3, unde m∈(0,+∞).\na) Arătați că 3∘5=3, pentru orice m∈(0,+∞).\nb) Pentru m=2, arătați că e=7/2 este elementul neutru al legii de compoziție „∘”.\nc) Se consideră funcția f:M→M, f(x)=3+√(x−3). Pentru m=1, arătați că f(x∘y)=f(x)∘f(y), pentru orice x,y∈M.",
      rubric: [
        { label: "a)", points: 5, answer: "3∘5=m(3−3)(5−3)+3=m·0·2+3=3, pentru orice m∈(0,+∞)." },
        { label: "b)", points: 5, answer: "Pentru m=2: x∘(7/2)=2(x−3)(7/2−3)+3=2(x−3)·(1/2)+3=(x−3)+3=x și, analog, (7/2)∘x=x, pentru orice x∈M, deci e=7/2 este elementul neutru." },
        { label: "c)", points: 5, answer: "Pentru m=1: f(x∘y)=3+√((x−3)(y−3)+3−3)=3+√(x−3)·√(y−3). f(x)∘f(y)=(f(x)−3)(f(y)−3)+3=√(x−3)·√(y−3)+3, deci f(x∘y)=f(x)∘f(y), pentru orice x,y∈M." },
      ] },

    // ── SUBIECTUL al III-lea (30p) — 2 probleme × 15p ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Derivate. Asimptote. Bijectivitate",
      content: "Se consideră funcția f:(1,+∞)→ℝ, f(x)=x − e^(−x)/(x−1).\na) Arătați că f′(x)=((x−1)²+x·e^(−x))/(x−1)², pentru orice x∈(1,+∞).\nb) Determinați ecuația asimptotei oblice spre +∞ la graficul funcției f.\nc) Demonstrați că funcția f este bijectivă.",
      rubric: [
        { label: "a)", points: 5, answer: "f′(x)=1−((−e^(−x))(x−1)−e^(−x))/(x−1)²=1+x·e^(−x)/(x−1)²=((x−1)²+x·e^(−x))/(x−1)², pentru orice x∈(1,+∞)." },
        { label: "b)", points: 5, answer: "lim_{x→+∞} f(x)/x=lim_{x→+∞}(1−e^(−x)/(x(x−1)))=1; lim_{x→+∞}(f(x)−x)=lim_{x→+∞}(−e^(−x)/(x−1))=0, deci dreapta de ecuație y=x este asimptota oblică spre +∞." },
        { label: "c)", points: 5, answer: "f′(x)>0 pentru orice x∈(1,+∞) ⇒ f strict crescătoare ⇒ injectivă. lim_{x→+∞}f(x)=+∞, lim_{x→1, x>1}f(x)=−∞ și f continuă ⇒ surjectivă, deci f bijectivă." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 15, autoGradable: false, topic: "Analiză. Integrale definite. Șiruri de integrale",
      content: "Se consideră funcția f:ℝ→ℝ, f(x)=x/(x²+1)².\na) Arătați că ∫₁³ f(x)(x²+1)² dx=4.\nb) Arătați că ∫₀¹ f(x) dx=1/4.\nc) Pentru fiecare număr natural nenul n, se consideră numărul Iₙ=∫₀¹ xⁿ·√(x·f(x)) dx. Arătați că Iₙ−I_{n+4}=2/((n+2)(n+4)), pentru orice număr natural nenul n.",
      rubric: [
        { label: "a)", points: 5, answer: "∫₁³ f(x)(x²+1)² dx=∫₁³ x dx=x²/2 |₁³=9/2−1/2=4." },
        { label: "b)", points: 5, answer: "∫₀¹ f(x) dx=∫₀¹ x/(x²+1)² dx=(1/2)·(−1/(x²+1)) |₀¹=(1/2)(−1/2+1)=1/4." },
        { label: "c)", points: 5, answer: "√(x·f(x))=x/(x²+1), deci Iₙ=∫₀¹ x^(n+1)/(x²+1) dx. Iₙ−I_{n+4}=∫₀¹ x^(n+1)(1−x⁴)/(x²+1) dx=∫₀¹ x^(n+1)(1−x²) dx=1/(n+2)−1/(n+4)=2/((n+2)(n+4)), pentru orice număr natural nenul n." },
      ] },
  ],
};

const PAPERS = [PAPER];

function validate() {
  const errors = [];
  for (const p of PAPERS) {
    const tag = p.subjectKey;
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
    console.log(`  ${tag.padEnd(14)} items=${p.items.length} pts=${sum}(+${p.officeBonus} oficiu=${sum + p.officeBonus})`);
  }
  if (errors.length) { console.error(`\n❌ VALIDATE FAILED (${errors.length}):`); for (const e of errors) console.error("   - " + e); process.exit(1); }
  console.log("\n✅ VALIDATE OK — 90p (+10 oficiu = 100).");
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
      console.log(`  ${p.subjectKey.padEnd(14)} ${existing ? "UPDATE" : "CREATE"} → items=${p.items.length}` + (existing ? ` (replacing ${existing._count.items})` : ""));
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
  console.log(`\n=== import-exam-bac-matematica-m1-model (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
