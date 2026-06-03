#!/usr/bin/env node
/**
 * import-exam-mate-2021-model-2.mjs — Exam-Bank series 3, pair 2021 Model 2 (Matematică)
 *
 * SOURCE: Ministerul Educației și Cercetării / CNPEE — EN VIII, an școlar 2020–2021, al doilea Model.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1c 2c 3b 4a 5d 6b · II = 1a 2b 3c 4c 5b 6c
 * Figures: 10 PNG (en-viii-2021-mate-model-2-s{2,3}-{label}.png) — toate 6 din SII + s3-3..6.
 *   finalAnswer: doar III.1=13 (III.3=3√2, III.4=32√3, III.6=50√2 radicali → skip; III.2/5 demonstrații).
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-model-2-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Model 2 (edu.ro)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "model-2", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Divizori primi",
      content: "Cel mai mare divizor prim al numărului 154 este numărul:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "7" }, { key: "c", text: "11" }, { key: "d", text: "77" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte",
      content: "Se consideră numerele naturale a = 5 și b = 11. Raportul dintre numerele a și b are aceeași valoare cu raportul:",
      options: [{ key: "a", text: "10/11" }, { key: "b", text: "1/2" }, { key: "c", text: "10/22" }, { key: "d", text: "5/22" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi",
      content: "Luni, temperatura măsurată la ora 10, la o stație meteo a fost de −5°C, iar marți, la aceeași oră, au fost înregistrate −7°C. Diferența dintre temperatura înregistrată marți și cea înregistrată luni este egală cu:",
      options: [{ key: "a", text: "−9°C" }, { key: "b", text: "−2°C" }, { key: "c", text: "6°C" }, { key: "d", text: "9°C" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții. Ordonare",
      content: "Dintre următoarele seturi de numere, cel scris în ordine crescătoare este:",
      options: [
        { key: "a", text: "1/18 ; 1/3 ; 5/6 ; 8/9" },
        { key: "b", text: "1/3 ; 1/18 ; 5/6 ; 8/9" },
        { key: "c", text: "8/9 ; 5/6 ; 1/3 ; 1/18" },
        { key: "d", text: "1/3 ; 8/9 ; 5/6 ; 1/18" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali",
      content: "Bogdan, Ana, Cătălin și Laura înmulțesc numărul n = √2 − √8 + √18 cu √2 și obțin rezultatele înregistrate în tabelul următor: Bogdan → −4; Ana → 2√2; Cătălin → 0; Laura → 4. Dintre cei patru elevi, cel care a obținut rezultatul corect al înmulțirii este:",
      options: [{ key: "a", text: "Bogdan" }, { key: "b", text: "Ana" }, { key: "c", text: "Cătălin" }, { key: "d", text: "Laura" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Media aritmetică ponderată",
      content: "În tabelul următor sunt înregistrate punctajele obținute de elevii unei clase la un test de cultură generală: Punctaj 40, 50, 60, 70, 80, 90, 100; Număr de elevi 2, 4, 5, 2, 4, 2, 1. Media aritmetică a punctajelor obținute de elevii participanți la test este:",
      options: [{ key: "a", text: "60,9" }, { key: "b", text: "66" }, { key: "c", text: "69,5" }, { key: "d", text: "69" }], correctAnswer: "b" },
    // ── Subiectul al II-lea (toate cu figură) ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Simetria față de un punct",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, M, C coliniare; C este simetricul lui A față de M.",
      content: "În figura alăturată sunt reprezentate punctele A, M și C. Punctul C este simetricul punctului A față de punctul M. Dacă AM = 3 cm, atunci segmentul CM are lungimea egală cu:",
      options: [{ key: "a", text: "3 cm" }, { key: "b", text: "4 cm" }, { key: "c", text: "6 cm" }, { key: "d", text: "9 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghi înscris în semicerc",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Punctele A, B, C la distanțe egale față de O; A, O, C coliniare (AC este diametru).",
      content: "În figura alăturată sunt reprezentate punctele A, B, C și O, astfel încât A, B și C sunt situate la distanțe egale față de punctul O, iar punctele A, O și C sunt coliniare. Măsura unghiului ABC este egală cu:",
      options: [{ key: "a", text: "120°" }, { key: "b", text: "90°" }, { key: "c", text: "60°" }, { key: "d", text: "30°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi isoscel. Trigonometrie",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghi isoscel cu AR = AP și ∢RAP = 120°; M mijlocul lui RP; D pe AP cu MD⊥AP; AD = 400 m.",
      content: "Locuința Alinei, marcată pe schiță cu punctul A, este situată la distanțe egale față de locuințele celor doi colegi de clasă, Radu și Paul, marcate pe schiță cu punctele R, respectiv P. Radu pornește de acasă, spre Paul, pe drumul cel mai scurt. La jumătatea distanței, adică în punctul M, se hotărăște să se îndrepte spre șoseaua AP, parcurgând distanța cea mai scurtă. Ajuns la șosea, în punctul D, Radu află că până la locuința Alinei sunt 400 m. La ce distanță se află locuința lui Paul față de punctul D, în care s-a oprit Radu, dacă măsura unghiului RAP este de 120°?",
      options: [{ key: "a", text: "400 m" }, { key: "b", text: "800 m" }, { key: "c", text: "1200 m" }, { key: "d", text: "1600 m" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Romb. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Romb ABCD; M, N mijloacele laturilor BC, respectiv CD; triunghiul AMN hașurat.",
      content: "În figura alăturată este reprezentată schița unei grădini de plante aromatice, în formă de romb ABCD. Suprafața hașurată, corespunzătoare triunghiului AMN, unde M și N sunt mijloacele laturilor BC, respectiv CD, este acoperită cu cimbru, iar restul suprafeței grădinii este acoperită cu lavandă. Din aria totală a grădinii, aria suprafeței acoperite cu cimbru reprezintă:",
      options: [{ key: "a", text: "1/2" }, { key: "b", text: "1/3" }, { key: "c", text: "3/8" }, { key: "d", text: "1/5" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghiuri înscrise și la centru",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cerc de centru O; A, B diametral opuse; C, D pe cerc; ∢ACD = 55°.",
      content: "Punctele A, B, C și D sunt situate pe un cerc de centru O, astfel încât punctele A și B sunt diametral opuse și măsura unghiului ACD este de 55°. Măsura unghiului DOB este egală cu:",
      options: [{ key: "a", text: "55°" }, { key: "b", text: "70°" }, { key: "c", text: "110°" }, { key: "d", text: "180°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Volume",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cubul ABCDA'B'C'D' cu muchia de 12 cm.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D' care are muchia egală cu 12 cm. Secționăm cubul ABCDA'B'C'D' în 27 de cubulețe cu volume egale. Lungimea muchiei unui cubuleț este egală cu:",
      options: [{ key: "a", text: "1 cm" }, { key: "b", text: "2 cm" }, { key: "c", text: "4 cm" }, { key: "d", text: "6 cm" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Ecuații. Probleme",
      finalAnswer: "13",
      content: "Dacă într-o clasă se așază câte doi elevi într-o bancă, atunci un elev rămâne singur în bancă, iar două bănci rămân libere. Dacă elevii se așază câte trei în bancă, atunci șase bănci rămân libere, iar celelalte bănci sunt ocupate complet.",
      rubric: [
        { label: "a)", points: 2, answer: "Deoarece, dacă se așază câte doi elevi în bancă, un elev stă singur, numărul elevilor din clasă este impar. Cum 14 nu este număr impar, deducem că nu este posibil ca în clasă să fie 14 elevi." },
        { label: "b)", points: 3, answer: "2(x − 3) + 1 = 3(x − 6), unde x este numărul de bănci din clasă, de unde x = 13." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Expresii raționale",
      content: "Se consideră expresia E(x) = (x − 1/(2 − x)) : (x³ − 2x² + x)/(x² − 7x + 10), unde x ∈ ℝ \\ {0, 1, 2, 5}.",
      rubric: [
        { label: "a)", points: 2, answer: "x² − 7x + 10 = x² − 2x − 5x + 10 = x(x − 2) − 5(x − 2) = (x − 2)(x − 5), pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = (2x − x² − 1)/(2 − x) · ((x − 2)(x − 5))/(x(x² − 2x + 1)) = (x − 5)/x, pentru orice x ∈ ℝ \\ {0, 1, 2, 5}." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Grafic",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu reprezentarea grafică a funcției f(x) = −x + 6; A pe Ox, B pe Oy.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = −x + 6.",
      rubric: [
        { label: "a)", points: 2, answer: "f(6) = 0, deci f(0)·f(6) = 0." },
        { label: "b)", points: 3, answer: "OA = 6, OB = 6, AB = 6√2, deci distanța de la punctul O la dreapta AB este (OA·OB)/AB = 3√2." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi echilateral. Trapez. Arii",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghiul echilateral ABC cu AB = 8 cm; M mijlocul lui AB; din M perpendiculara pe AC taie AC în P; D = (perpendiculara din M pe AC) ∩ (paralela prin C la AB).",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC, cu AB = 8 cm. Notăm cu M mijlocul laturii AB și construim din M perpendiculara pe AC, care intersectează pe AC în P și paralela prin C la AB în D.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔAMP ~ ΔCDP ⇒ AM/CD = AP/CP; AP = 2 cm, deci CD = 12 cm." },
        { label: "b)", points: 3, answer: "CM = 4√3 cm; A(AMCD) = ((AM + CD)·CM)/2 = 32√3 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Teorema catetei",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A; E proiecția lui A pe BC; AC = 6 cm, EC = 4 cm.",
      content: "În figura alăturată este reprezentat triunghiul ABC dreptunghic în A. Notăm cu E proiecția punctului A pe dreapta BC. Lungimea laturii AC este de 6 cm, iar lungimea segmentului EC este de 4 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "ΔABC dreptunghic în A, AE ⊥ BC, E ∈ BC, deci AC² = EC·BC; 6² = 4·BC ⇒ BC = 9 cm." },
        { label: "b)", points: 3, answer: "AB = 3√5 cm; P(ABC) = 3(5 + √5) cm și, cum 3√5 < 7, obținem că P(ABC) < 22 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Distanță punct-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cubul ABCDA'B'C'D' cu o diagonală spațială și o diagonală a unei fețe laterale evidențiate.",
      content: "Se consideră cubul ABCDA'B'C'D'. Distanța de la mijlocul unei diagonale a cubului la mijlocul unei diagonale a unei fețe laterale este de 50 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "Muchia cubului este 100 cm = 1 m; aria totală = 6 m², deci pentru a vopsi exteriorul cubului sunt necesari 0,5·6 = 3 litri de vopsea." },
        { label: "b)", points: 3, answer: "AQ ⊥ A'B (Q mijlocul lui A'B); A'D' ⊥ (A'AB) ⇒ AQ ⊥ A'D' și, cum A'D' ∩ A'B = {A'} și A'B ⊂ (A'D'C), obținem AQ = d(A, (A'D'C)) = 50√2 cm." },
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
  console.log(`\n=== import-exam-mate-2021-model-2 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
