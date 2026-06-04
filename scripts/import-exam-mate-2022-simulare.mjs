#!/usr/bin/env node
/**
 * import-exam-mate-2022-simulare.mjs — Exam-Bank series 3, pair 2022 Simulare (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2021–2022, Simulare.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1b 2c 3b 4d 5c 6a · II = 1b 2c 3c 4b 5a 6d
 * Figures: 9 PNG (en-viii-2022-mate-simulare-s{2,3}-{label}.png) — s2-1..6, s3-4..6.
 *   finalAnswer: III.2=15, III.3=25. (III.1 pereche a,b; III.4/5/6 radicali → skip.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2022-mate-simulare-${s}.png`;

const MATH = {
  source: "EN VIII 2022 Simulare (edu.ro)",
  examType: "EN_VIII", year: 2022, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "simulare", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2022/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 6 − 18 : 2 este egal cu:",
      options: [{ key: "a", text: "−6" }, { key: "b", text: "−3" }, { key: "c", text: "0" }, { key: "d", text: "12" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte. Proporții",
      content: "Dacă a/2 = b/3, atunci rezultatul calculului 2b − 3a este egal cu:",
      options: [{ key: "a", text: "−5" }, { key: "b", text: "−1" }, { key: "c", text: "0" }, { key: "d", text: "5" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Ecuații de gradul I",
      content: "Soluția ecuației x + 6 = 2 este numărul întreg:",
      options: [{ key: "a", text: "−8" }, { key: "b", text: "−4" }, { key: "c", text: "4" }, { key: "d", text: "8" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Puteri cu exponent natural",
      content: "Dintre numerele (1/2)², (1/2)³, (1/2)⁴ și (1/2)⁵, cel mai mic este numărul:",
      options: [{ key: "a", text: "(1/2)²" }, { key: "b", text: "(1/2)³" }, { key: "c", text: "(1/2)⁴" }, { key: "d", text: "(1/2)⁵" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Media aritmetică",
      content: "Patru elevi, Elena, Alina, Paul și Adi, au calculat media aritmetică a numerelor a = 3 − 2√2 și b = 3 + 2√2. Rezultatele obținute sunt: Elena → 14; Alina → 6; Paul → 3; Adi → 1. Conform informațiilor din tabel, rezultatul corect a fost obținut de:",
      options: [{ key: "a", text: "Elena" }, { key: "b", text: "Alina" }, { key: "c", text: "Paul" }, { key: "d", text: "Adi" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Intervale de numere reale",
      content: "Numărul real x verifică relațiile 2 ≤ x < 5. Ioana afirmă „Numărul real x aparține intervalului [2, 5)”. Afirmația Ioanei este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A și B distincte; C pe segmentul AB cu AC = 2 cm.",
      content: "În figura alăturată, A și B sunt puncte distincte, punctul C se află pe segmentul AB, astfel încât AB = 3·AC, iar AC = 2 cm. Lungimea segmentului BC este egală cu:",
      options: [{ key: "a", text: "2 cm" }, { key: "b", text: "4 cm" }, { key: "c", text: "6 cm" }, { key: "d", text: "8 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri adiacente complementare. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Unghiurile AOB și BOC adiacente complementare cu vârful O; OD bisectoarea unghiului BOC.",
      content: "În figura alăturată, unghiurile AOB și BOC sunt adiacente complementare. Semidreapta OD este bisectoarea unghiului BOC, iar măsura unghiului AOD este de 55°. Măsura unghiului AOB este egală cu:",
      options: [{ key: "a", text: "55°" }, { key: "b", text: "35°" }, { key: "c", text: "20°" }, { key: "d", text: "15°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Bisectoare",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC dreptunghic în A; BM bisectoarea unghiului ABC, M pe AC.",
      content: "În figura alăturată, triunghiul ABC este dreptunghic în A cu AB = 4 cm. Semidreapta BM este bisectoarea unghiului ABC, M ∈ AC și BM = MC. Lungimea segmentului BC este egală cu:",
      options: [{ key: "a", text: "2 cm" }, { key: "b", text: "4 cm" }, { key: "c", text: "8 cm" }, { key: "d", text: "12 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Trapez. Linie mijlocie",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Trapezul ABCD cu AB ∥ CD, AB = 4 cm, CD = 8 cm.",
      content: "În figura alăturată este reprezentat trapezul ABCD cu AB ∥ CD, AB = 4 cm și CD = 8 cm. Lungimea liniei mijlocii a trapezului ABCD este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "6 cm" }, { key: "c", text: "8 cm" }, { key: "d", text: "12 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghi înscris. Arc",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Punctele A, B, C, D pe cercul de centru O; AB diametru; CD ⊥ AB.",
      content: "În figura alăturată, punctele A, B, C și D se află pe cercul de centru O, AB este diametru, măsura arcului mic AC este egală cu 60° și dreptele CD și AB sunt perpendiculare. Măsura unghiului ACD este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "90°" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Tetraedru regulat. Muchii",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Tetraedrul regulat VABC.",
      content: "În figura alăturată este reprezentat un tetraedru regulat VABC cu AB = 4 cm. Suma lungimilor tuturor muchiilor tetraedrului regulat VABC este egală cu:",
      options: [{ key: "a", text: "12 cm" }, { key: "b", text: "16 cm" }, { key: "c", text: "20 cm" }, { key: "d", text: "24 cm" }], correctAnswer: "d" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "C.m.m.d.c. Numere naturale",
      content: "Suma a două numere naturale a și b este egală cu 42. Cel mai mare divizor comun al numerelor a și b este 7.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă a = 14 și b = 28, atunci c.m.m.d.c.(14, 28) = 14. Dar c.m.m.d.c.(a, b) = 7 ≠ 14, deci nu este posibil ca numerele să fie 14 și 28." },
        { label: "b)", points: 3, answer: "c.m.m.d.c.(a, b) = 7, deci a = 7k, b = 7p, unde k și p sunt numere naturale cu (k, p) = 1 și k < p. Din 7k + 7p = 42 rezultă k + p = 6, deci k = 1 și p = 5. Obținem a = 7 și b = 35." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Minimul unei expresii",
      finalAnswer: "15",
      content: "Se consideră expresia E(x) = (2x + 1)² − (2x + 3)(2x − 3) + (2x − 3)², unde x este număr real.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = 4x² + 4x + 1 − (4x² − 9) + 4x² − 12x + 9 = 4x² − 8x + 19, pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = (2x − 2)² + 15. Cum (2x − 2)² ≥ 0, rezultă E(x) ≥ 15, pentru orice număr real x. Cum A este cel mai mare număr natural pentru care E(x) ≥ A oricare ar fi x, obținem A = 15." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Procente. Ieftiniri succesive",
      finalAnswer: "25",
      content: "Prețul unui obiect este 500 de lei. După o ieftinire cu 12% din prețul obiectului, urmată de o ieftinire cu p% din noul preț, obiectul costă 330 de lei.",
      rubric: [
        { label: "a)", points: 2, answer: "(12/100)·500 = 60. 500 − 60 = 440, deci după prima ieftinire obiectul costă 440 de lei." },
        { label: "b)", points: 3, answer: "440 − (p/100)·440 = 330 ⇒ (p/100)·440 = 110 ⇒ p = 25." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrat. Triunghi echilateral. Distanță",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Pătratul ABCD și triunghiul echilateral CDE cu EC = 6 cm; dreptele EC și AB se intersectează în P.",
      content: "În figura alăturată este reprezentat pătratul ABCD și triunghiul echilateral CDE cu EC = 6 cm. Dreptele EC și AB se intersectează în punctul P.",
      rubric: [
        { label: "a)", points: 2, answer: "CD ∥ AP și EP secantă ⇒ ∢DCE = ∢BPC = 60°, deci ∢BCP = 30° și CP = 2·BP. În triunghiul BCP dreptunghic în B: CP² = BP² + BC² ⇒ BP = 2√3 cm, deci CP = 4√3 cm." },
        { label: "b)", points: 3, answer: "∢ADE = 150°, AD = DE ⇒ triunghiul ADE este isoscel și ∢AED = 15°, deci ∢AEP = 45°. EP = 6 + 4√3 cm. Fie Q pe AE cu PQ ⊥ AE; în triunghiul dreptunghic PQE, sin(∢QEP) = PQ/EP ⇒ PQ = √2(3 + 2√3) cm, deci d(P, AE) = √2(3 + 2√3) cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi. Centru de greutate",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC cu G centrul de greutate; AG = 4 cm, BG = 3 cm, AG ⊥ BG.",
      content: "În figura alăturată este reprezentat triunghiul ABC. Punctul G este centrul de greutate al triunghiului ABC, AG = 4 cm, BG = 3 cm și dreptele AG și BG sunt perpendiculare.",
      rubric: [
        { label: "a)", points: 2, answer: "În triunghiul dreptunghic ABG: AB² = AG² + BG² ⇒ AB = 5 cm. P_ABG = 3 + 4 + 5 = 12 cm." },
        { label: "b)", points: 3, answer: "Fie {P} = AG ∩ BC ⇒ AP este mediană în triunghiul ABC. GP = AG/2 = 2 cm. În triunghiul dreptunghic PGB: BP² = BG² + PG² ⇒ BP = √13 cm, de unde BC = 2√13 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă patrulateră regulată. Linie mijlocie",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Piramida patrulateră regulată SABCD cu baza pătratul ABCD, ∢SAC = 45°, AB = 12 cm; M, N mijloacele lui BC, SD; O = AC ∩ BD.",
      content: "În figura alăturată este reprezentată o piramidă patrulateră regulată SABCD cu baza pătratul ABCD, ∢SAC = 45° și AB = 12 cm. Punctele M și N sunt mijloacele segmentelor BC, respectiv SD, iar O este punctul de intersecție a dreptelor AC și BD.",
      rubric: [
        { label: "a)", points: 2, answer: "AC este diagonală în pătratul ABCD, deci AC = 12√2 cm. ∢SAC = ∢SCA = 45° ⇒ SAC este triunghi dreptunghic isoscel ⇒ SA² + SC² = AC², deci SC = 12 cm." },
        { label: "b)", points: 3, answer: "Fie P mijlocul lui SA. NP este linie mijlocie în triunghiul SAD, deci NP ∥ AD și NP = AD/2. Cum NP ∥ MB și NP = MB, BMNP este paralelogram, deci MN = BP. BP este înălțime în triunghiul echilateral SAB, deci BP = 6√3 cm, de unde MN = 6√3 cm." },
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
  console.log(`\n=== import-exam-mate-2022-simulare (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
