#!/usr/bin/env node
/**
 * import-exam-mate-2022-test-05.mjs — Exam-Bank, CNCE training Test 5 (Matematică, EN VIII 2021–2022)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2021–2022, Test de antrenament nr. 5. Public.
 *
 * Barem chei: I = 1d 2a 3b 4c 5c 6a · II = 1d 2b 3d 4b 5c 6a
 * NB: SII.4 — BC = √5 cm (NU 5; cu AP=3 și BC=√5 ⇒ AB=5=cheia b; BC=5 ar fi imposibil geometric).
 * NB: SI 1-6 fără figură (6 autoGradable). SII 1-6 toate cu figură. SIII.4 (pătrate), 5 (triunghi
 *     echilateral), 6 (cub) cu figură; SIII.1,2,3 fără figură. Total figuri = 9 (s2-1..6 + s3-4,5,6).
 * finalAnswer: NICIUNUL — toți itemii III au b-part de tip „Arată că"/demonstrație/multi-valoare/radical
 *   (III.1 abc=107 sau 119 multi-valoare; III.2 divizibilitate; III.3 demonstrație grafic; III.4 concurență;
 *    III.5 distanță 4√21/7 radical; III.6 sin=√6/6 tipărit). Niciun scalar clean tastabil.
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2022-mate-test-05-${s}.png`;

const MATH = {
  source: "EN VIII 2022 Testul 5 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2022, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-05", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2022/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Divizori",
      content: "Un divizor al numărului 75 este:",
      options: [{ key: "a", text: "150" }, { key: "b", text: "12" }, { key: "c", text: "7" }, { key: "d", text: "5" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Operații cu numere zecimale",
      content: "Rezultatul calculului 1,5 : 2 este egal cu:",
      options: [{ key: "a", text: "0,75" }, { key: "b", text: "2,25" }, { key: "c", text: "3" }, { key: "d", text: "75" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Probabilități",
      content: "Probabilitatea ca, alegând la întâmplare un element al mulțimii A = {0, 1, 2, 3, 4, 5, 6}, acesta să fie număr par este egală cu:",
      options: [{ key: "a", text: "3/7" }, { key: "b", text: "4/7" }, { key: "c", text: "7/4" }, { key: "d", text: "7/3" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Radicali. Intervale",
      content: "Numărul real −2√3 aparține intervalului:",
      options: [{ key: "a", text: "(−3, 4)" }, { key: "b", text: "(3, 4)" }, { key: "c", text: "(−4, −3)" }, { key: "d", text: "(−3, −2)" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Împărțirea cu rest. Sume",
      content: "Patru elevi, Alin, Cristina, Mihai și Dana, calculează suma tuturor numerelor naturale care împărțite la 3 dau câtul 4 și obțin rezultatele înregistrate în tabelul următor:\n\nAlin | Cristina | Mihai | Dana\n54 | 42 | 39 | 12\n\nConform informațiilor din tabel, dintre cei patru elevi, cel care a calculat corect suma numerelor este:",
      options: [{ key: "a", text: "Alin" }, { key: "b", text: "Cristina" }, { key: "c", text: "Mihai" }, { key: "d", text: "Dana" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Procente. Probleme",
      content: "Prețul unui stilou este 40 lei. Matei afirmă: „Dacă prețul stiloului ar fi fost cu 20% mai mic, atunci cu 128 lei aș fi putut cumpăra 4 stilouri de același fel.”. Afirmația lui Matei este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "a" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloace succesive",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele coliniare A, B, C, D, E (în această ordine) pe o dreaptă orizontală; B mijlocul lui AC, C mijlocul lui AD, D mijlocul lui AE.",
      content: "În figura alăturată, punctele A, B, C, D și E sunt coliniare, în această ordine, astfel încât punctul B este mijlocul segmentului AC, punctul C este mijlocul segmentului AD și punctul D este mijlocul segmentului AE. Raportul BD/AE este egal cu:",
      options: [{ key: "a", text: "1/2" }, { key: "b", text: "3/7" }, { key: "c", text: "2/5" }, { key: "d", text: "3/8" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte tăiate de o secantă. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Dreptele a (sus, ~orizontală) și b (jos) intersectate de dreapta d; unghiul de 32° la intersecția lui d cu a (dreapta-sus), unghiul de 140° la intersecția lui d cu b (stânga).",
      content: "În figura alăturată sunt reprezentate într-un plan, dreptele a și b intersectate de dreapta d, fiind evidențiate măsurile a două unghiuri de 32° și, respectiv de 140°. Unghiul dintre dreptele a și b este egal cu:",
      options: [{ key: "a", text: "0°" }, { key: "b", text: "8°" }, { key: "c", text: "90°" }, { key: "d", text: "172°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Centru de greutate. Linie paralelă",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC (A sus, B jos-stânga, C jos-dreapta) cu AC=6 cm; G centrul de greutate, D = BG ∩ AC (mijlocul lui AC), E pe AC cu GE ∥ BC.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu AC = 6 cm. Punctul G este centrul de greutate al triunghiului ABC, BG ∩ AC = {D} și GE ∥ BC, E ∈ AC. Lungimea segmentului DE este egală cu:",
      options: [{ key: "a", text: "4 cm" }, { key: "b", text: "3 cm" }, { key: "c", text: "2 cm" }, { key: "d", text: "1 cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Dreptunghi. Mediatoare. Teorema lui Pitagora",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Dreptunghiul ABCD (A sus-stânga, B sus-dreapta, C jos-dreapta, D jos-stânga); O mijlocul diagonalei AC, P pe latura DC cu PO ⊥ AC; AP=3 cm, BC=√5 cm.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD. Punctul O este mijlocul diagonalei AC, iar punctul P se află pe latura DC, astfel încât dreptele PO și AC sunt perpendiculare. Dacă AP = 3 cm și BC = √5 cm, atunci lungimea segmentului AB este egală cu:",
      options: [{ key: "a", text: "3 cm" }, { key: "b", text: "5 cm" }, { key: "c", text: "3√5 cm" }, { key: "d", text: "2√14 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Unghi înscris. Diametru",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul cu triunghiul ABC dreptunghic în A înscris (A sus, B stânga, C dreapta — BC diametru); M pe latura BC, dreapta AM intersectează a doua oară cercul în P (jos).",
      content: "În figura alăturată, punctele A, B și C se află pe un cerc și sunt vârfurile unui triunghi dreptunghic în A. Dacă punctul M se află pe latura BC și dreapta AM intersectează a doua oară cercul în punctul P, atunci măsura unghiului BPC este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "60°" }, { key: "c", text: "90°" }, { key: "d", text: "120°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Tetraedru regulat. Aria totală",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Tetraedrul regulat ABCD (A sus, B stânga, D dreapta, C jos-față); muchia AB = 6 cm.",
      content: "Muchia AB a tetraedrului regulat ABCD este egală cu 6 cm. Aria totală a tetraedrului regulat ABCD este egală cu:",
      options: [{ key: "a", text: "36√3 cm²" }, { key: "b", text: "27√3 cm²" }, { key: "c", text: "36 cm²" }, { key: "d", text: "18 cm²" }], correctAnswer: "a" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Numere scrise în baza 10. Împărțire cu rest",
      content: "Dacă împărțim numărul abc (scris în baza 10) la numărul ac obținem câtul 6 și restul 5.\na) Este posibil ca numărul ac să fie egal cu 18? Justifică răspunsul dat.\nb) Determină numerele abc.",
      rubric: [
        { label: "a)", points: 2, answer: "Dacă ac = 18, atunci c = 8 (cifra unităților), iar abc = 18·6 + 5 = 113, de unde c = 3. Cum 8 ≠ 3, deducem că nu este posibil ca numărul ac să fie egal cu 18." },
        { label: "b)", points: 3, answer: "Din abc = 6·ac + 5 rezultă 100a + 10b + c = 60a + 6c + 5, deci 8a + 2b = c + 1. Cum c + 1 ≤ 10, avem 8a + 2b ≤ 10, deci a = 1 și b ∈ {0, 1}: pentru b = 0, c = 7 ⇒ abc = 107; pentru b = 1, c = 9 ⇒ abc = 119." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Divizibilitate",
      content: "Se consideră expresia E(x) = (5x + 3)² − (3x + 4)², unde x este număr real.\na) Arată că E(x) = (2x − 1)(8x + 7), pentru orice număr real x.\nb) Dacă numărul natural n nu este divizibil cu 3, atunci arată că E(n) este divizibil cu 3.",
      rubric: [
        { label: "a)", points: 2, answer: "E(x) = (5x+3)² − (3x+4)² = (5x+3 − 3x−4)(5x+3 + 3x+4) = (2x − 1)(8x + 7), pentru orice număr real x." },
        { label: "b)", points: 3, answer: "Dacă n nu este divizibil cu 3, atunci n = 3k+1 sau n = 3k+2 (k natural). Pentru n = 3k+1: 8n+7 = 24k+15 = 3(8k+5), divizibil cu 3, deci E(n) divizibil cu 3. Pentru n = 3k+2: 2n−1 = 6k+3 = 3(2k+1), divizibil cu 3, deci E(n) divizibil cu 3." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Simetrie față de origine",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = x + 3.\na) Arată că f(√5)·f(−√5) = 4.\nb) Arată că simetricul punctului A(−3, −6) față de originea O(0, 0) a sistemului de axe ortogonale xOy aparține reprezentării grafice a funcției f.",
      rubric: [
        { label: "a)", points: 2, answer: "f(√5) = √5 + 3 și f(−√5) = −√5 + 3, deci f(√5)·f(−√5) = (3 + √5)(3 − √5) = 9 − 5 = 4." },
        { label: "b)", points: 3, answer: "Simetricul punctului A(−3, −6) față de originea O este B(3, 6) (O este mijlocul lui AB). Cum f(3) = 3 + 3 = 6, punctul B(3, 6) aparține reprezentării grafice a funcției f." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Pătrate. Concurența dreptelor",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Două pătrate ABCD și MPQD (D vârf comun); ABCD mare (A sus-stânga, B sus-dreapta, C jos-dreapta, D jos-stânga); MPQD interior cu M pe AD, P interior, Q pe latura CD; AM = 2 cm.",
      content: "În figura alăturată sunt reprezentate pătratele ABCD și MPQD. Punctul Q se află pe latura CD și AM = 2 cm.\na) Arată că PB = 2√2 cm.\nb) Demonstrează că dreptele AQ, CM și DP sunt concurente.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie T = QP ∩ AB; ATPM și TBCQ sunt dreptunghiuri, deci TP = AM = 2 cm și TB = CQ = AM = 2 cm. Triunghiul BTP este dreptunghic în T, deci PB = √(BT² + PT²) = √(4 + 4) = 2√2 cm." },
        { label: "b)", points: 3, answer: "Fie {S} = AQ ∩ DP și {V} = CM ∩ DP. Din PQ ∥ AD, ΔPSQ ~ ΔDSA ⇒ PS/SD = PQ/AD; din MP ∥ DC, ΔMVP ~ ΔCVD ⇒ PV/VD = MP/DC. Cum PQ = MP și AD = DC, rezultă PS/SD = PV/VD, deci S = V, adică dreptele AQ, CM și DP sunt concurente." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi echilateral. Distanță punct-dreaptă",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul echilateral ABC (A sus, B jos-mijloc, C jos-dreapta); D pe AC cu AD=2 cm, DC=4 cm; E pe dreapta BC (în stânga lui B) cu ED ⊥ AC; F = ED ∩ AB.",
      content: "În figura alăturată este reprezentat triunghiul echilateral ABC. Punctul D se află pe latura AC astfel încât AD = 2 cm și DC = 4 cm, iar punctul E se află pe dreapta BC astfel încât dreptele ED și AC sunt perpendiculare.\na) Arată că EB = 2 cm.\nb) Calculează distanța de la punctul E la dreapta CF, unde {F} = ED ∩ AB.",
      rubric: [
        { label: "a)", points: 2, answer: "Latura triunghiului echilateral este BC = AC = AD + DC = 6 cm. Triunghiul EDC este dreptunghic în D cu ∢E = 30° (∢C = 60°), deci EC = 2·DC = 8 cm, de unde EB = EC − BC = 8 − 6 = 2 cm." },
        { label: "b)", points: 3, answer: "∢ADF = 90° și ∢AFD = 30°, deci AF = 2·AD = 4 cm și BF = 2 cm. Fie Q = proiecția lui F pe BC; FQ = √3 cm și FC = 2√7 cm. Atunci A(EFC) = (d(E, CF)·CF)/2 = (FQ·EC)/2, de unde d(E, CF) = (FQ·EC)/CF = (√3·8)/(2√7) = 4√21/7 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Unghi dreaptă-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cubul ABCDA'B'C'D' (baza inferioară ABCD, baza superioară A'B'C'D'); M mijlocul muchiei CC', P mijlocul muchiei AD; MP = 2√6 cm.",
      content: "În figura alăturată este reprezentat un cub ABCDA'B'C'D'. Punctul M este mijlocul segmentului CC', punctul P este mijlocul segmentului AD și MP = 2√6 cm.\na) Arată că AB = 4 cm.\nb) Arată că sinusul unghiului dintre dreapta MP și planul (ABB') este egal cu √6/6.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie AB = 2x. PD = x (P mijlocul lui AD) și DC = 2x; triunghiul PDC dreptunghic în D ⇒ PC² = PD² + DC² = 5x². Triunghiul MCP dreptunghic în C (MC ⊥ planul bazei) ⇒ MP² = MC² + PC² = x² + 5x² = 6x²; din MP = 2√6 rezultă 6x² = 24, x = 2, deci AB = 2x = 4 cm." },
        { label: "b)", points: 3, answer: "(ABB') ∥ (DCC'), deci ∢(MP, (ABB')) = ∢(MP, (DCC')). Cum PD ⊥ DD' și PD ⊥ DC cu DD' ∩ DC = {D}, rezultă PD ⊥ (DCC'), deci unghiul căutat este ∢DMP cu sin(∢DMP) = DP/MP = 2/(2√6) = √6/6." },
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
  console.log(`\n=== import-exam-mate-2022-test-05 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
