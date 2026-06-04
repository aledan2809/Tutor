#!/usr/bin/env node
/**
 * import-exam-mate-2023-examen-1.mjs — Exam-Bank series 3, pair 2023 Examen Varianta 1 (Matematică)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2022–2023, Examen (sesiune iunie), Varianta 1.
 *   Public (edu.ro / pro-matematica). Transcribed verbatim from official subiect + barem PDFs.
 *   Keys + rubric from official BAREM — ground-truth.
 *
 * Barem chei: I = 1b 2c 3a 4c 5d 6b · II = 1c 2c 3c 4b 5b 6c
 * Figures: 11 PNG (en-viii-2023-mate-examen-1-{label}.png) — s1-6 (diagramă bare), s2-1..6, s3-3 (grafic), s3-4..6.
 *   finalAnswer: III.1=12, III.2=0, III.4=150. (III.3 radical 4√2, III.5 demonstrații, III.6 radical 10√3/3 → skip.)
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2023-mate-examen-1-${s}.png`;

const MATH = {
  source: "EN VIII 2023 Examen Varianta 1 (edu.ro)",
  examType: "EN_VIII", year: 2023, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "examen-1", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2023/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 15 − (3 + 4) este egal cu:",
      options: [{ key: "a", text: "3" }, { key: "b", text: "8" }, { key: "c", text: "16" }, { key: "d", text: "22" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte și proporții",
      content: "Știind că x/y = 5/2, y ≠ 0, rezultatul calculului 2x − 5y + 10 este egal cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "7" }, { key: "c", text: "10" }, { key: "d", text: "17" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi. Opusul unui număr",
      content: "Produsul dintre numărul 3 și opusul numărului 3 este egal cu:",
      options: [{ key: "a", text: "−9" }, { key: "b", text: "−6" }, { key: "c", text: "0" }, { key: "d", text: "1" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracție dintr-un întreg",
      content: "Numărul care reprezintă 2/3 din 12 este egal cu:",
      options: [{ key: "a", text: "2" }, { key: "b", text: "4" }, { key: "c", text: "8" }, { key: "d", text: "12" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi. Intervale",
      content: "Profesorul întreabă care este cel mai mare număr întreg din intervalul (−2, 5). Răspunsurile date de elevii Andreea, Marina, David și Vlad sunt prezentate în tabelul de mai jos: Andreea → −3; Marina → −2; David → 5; Vlad → 4. Dintre cei patru elevi, cel care a răspuns corect la întrebarea profesorului este:",
      options: [{ key: "a", text: "Andreea" }, { key: "b", text: "Marina" }, { key: "c", text: "David" }, { key: "d", text: "Vlad" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Citirea diagramelor",
      hasFigure: true, figureUrl: FIG("s1-6"),
      figureNote: "Diagramă cu bare (număr de elevi pe fiecare notă): Nota 4 → 2, Nota 5 → 2, Nota 6 → 6, Nota 7 → 8, Nota 8 → 5, Nota 9 → 4, Nota 10 → 2.",
      content: "În diagrama de mai jos sunt prezentate rezultatele obținute la un test la matematică, de către elevii unei clase a VIII-a. Afirmația: „Conform informațiilor din diagramă, la acest test, nota 7 a fost obținută de 10 elevi.” este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente congruente",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele A, B, C, D coliniare în această ordine pe o dreaptă, cu AB = BC = CD.",
      content: "În figura alăturată sunt reprezentate punctele coliniare A, B, C și D, în această ordine, astfel încât AB = BC = CD, iar lungimea segmentului AC este egală cu 10 cm. Lungimea segmentului AD este egală cu:",
      options: [{ key: "a", text: "5 cm" }, { key: "b", text: "10 cm" }, { key: "c", text: "15 cm" }, { key: "d", text: "20 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Unghiuri. Perpendicularitate",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Dreapta AB cu O între A și B (A sus, B jos-dreapta); semidreptele OM (∢MOA = 30°) și ON (ON ⊥ AB), cu M și N de aceeași parte a dreptei AB.",
      content: "În figura alăturată sunt reprezentate punctele coliniare A, O și B, în această ordine. Punctele M și N sunt de aceeași parte a dreptei AB, astfel încât măsura unghiului MOA este egală cu 30° și dreapta ON este perpendiculară pe dreapta AB. Măsura unghiului MON este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "90°" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Arii. Raport de arii",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC cu A sus, C jos-stânga, B jos-dreapta; M pe latura BC astfel încât BC = 3·BM.",
      content: "În figura alăturată este reprezentat triunghiul ABC cu aria de 15 cm². Punctul M se află pe segmentul BC, astfel încât BC = 3·BM. Aria triunghiului AMC este egală cu:",
      options: [{ key: "a", text: "5 cm²" }, { key: "b", text: "7,5 cm²" }, { key: "c", text: "10 cm²" }, { key: "d", text: "12,5 cm²" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Pătrat. Diagonală",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Pătratul ABCD cu D și C sus, A și B jos; diagonala AC trasată.",
      content: "În figura alăturată este reprezentat pătratul ABCD cu perimetrul egal cu 40 cm. Lungimea segmentului AC este egală cu:",
      options: [{ key: "a", text: "10 cm" }, { key: "b", text: "10√2 cm" }, { key: "c", text: "10√3 cm" }, { key: "d", text: "20 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Arce congruente",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu opt puncte A, B, C, D, E, F, G, H dispuse astfel încât cele opt arce mici consecutive (AB, BC, ..., HA) sunt congruente.",
      content: "În figura alăturată, punctele distincte A, B, C, D, E, F, G și H sunt reprezentate pe cercul de centru O, astfel încât arcele mici AB, BC, CD, DE, EF, FG, GH și HA sunt congruente. Măsura arcului mic BC este egală cu:",
      options: [{ key: "a", text: "30°" }, { key: "b", text: "45°" }, { key: "c", text: "60°" }, { key: "d", text: "75°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Cub. Diagonala cubului",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Cubul ABCDA'B'C'D'; este trasată diagonala BD'.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D' cu AB = 5 cm. Lungimea segmentului BD' este egală cu:",
      options: [{ key: "a", text: "5 cm" }, { key: "b", text: "5√2 cm" }, { key: "c", text: "5√3 cm" }, { key: "d", text: "10 cm" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Ecuații",
      finalAnswer: "12",
      content: "Maria are 14 ani și tatăl ei are 40 de ani.",
      rubric: [
        { label: "a)", points: 2, answer: "Peste 2 ani vârsta Mariei va fi de 14 + 2 = 16 ani, iar vârsta tatălui ei va fi de 40 + 2 = 42 de ani. Cum 16 + 42 = 58 ≠ 60, nu este posibil ca peste 2 ani suma dintre vârsta Mariei și vârsta tatălui ei să fie egală cu 60 de ani." },
        { label: "b)", points: 3, answer: "14 + x = (1/2)·(40 + x), unde x reprezintă numărul de ani care vor trece până când vârsta Mariei va fi jumătate din vârsta tatălui ei ⇒ 28 + 2x = 40 + x ⇒ x = 12." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Ecuații",
      finalAnswer: "0",
      content: "Se consideră expresia E(x) = (1/((x+1)(x+2)) + 1/(x+2)) : (x+3)/(5(x+1)), unde x este număr real, x ≠ −3, x ≠ −2 și x ≠ −1.",
      rubric: [
        { label: "a)", points: 2, answer: "1/((x+1)(x+2)) + 1/(x+2) = (1 + (x+1))/((x+1)(x+2)) = (x+2)/((x+1)(x+2)) = 1/(x+1), pentru orice număr real x, x ≠ −2 și x ≠ −1." },
        { label: "b)", points: 3, answer: "E(x) = (1/(x+1)) · (5(x+1)/(x+3)) = 5/(x+3). Din 5/(x+3) = (x−3)/8 obținem x² = 49 ⇒ x = −7 sau x = 7, care convin. Suma soluțiilor ecuației este egală cu 0." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcția de gradul I. Distanță",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistem de axe ortogonale xOy cu reprezentarea grafică a funcției f(x) = −x + 5 (dreaptă descendentă) și punctul P(0, −3) pe axa Oy.",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = −x + 5.",
      rubric: [
        { label: "a)", points: 2, answer: "f(4) = 1; f(6) = −1 ⇒ f(4) + f(6) = 1 + (−1) = 0." },
        { label: "b)", points: 3, answer: "A(5, 0) și B(0, 5) sunt punctele de intersecție a graficului cu axele Ox, respectiv Oy. În triunghiul dreptunghic AOB, AB = √(AO² + OB²) = 5√2. A_PAB = (d(P,AB)·AB)/2 = (AO·PB)/2 = (5·8)/2 = 20 ⇒ d(P, AB) = 4√2." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez dreptunghic. Triunghi isoscel",
      hasFigure: true, figureUrl: FIG("s3-4"), finalAnswer: "150",
      figureNote: "Trapezul dreptunghic ABCD cu AB ∥ CD (D și C sus, A și B jos), unghiuri drepte în A și D; diagonala BD trasată.",
      content: "În figura alăturată este reprezentat trapezul dreptunghic ABCD cu AB ∥ CD și BC = 10 cm. Semidreapta BD este bisectoarea unghiului ABC și măsura unghiului ABD este egală cu 15°.",
      rubric: [
        { label: "a)", points: 2, answer: "BD bisectoarea ∢ABC ⇒ ∢ABC = 2·15° = 30°. ABCD trapez (AB ∥ CD) ⇒ ∢BCD = 180° − 30° = 150°." },
        { label: "b)", points: 3, answer: "CD ∥ AB, BD secantă ⇒ ∢CDB ≡ ∢ABD ⇒ ΔBCD isoscel cu CD = BC = 10 cm. Fie CE ⊥ AB, E ∈ AB ⇒ AECD dreptunghi, deci AD = CE, AE = CD. În triunghiul dreptunghic CEB, ∢CBE = 30° ⇒ CE = BC/2 = 5 cm, BE = 5√3 cm, deci AB − AD = (5 + 5√3) cm. Cum 5 + 5√3 < 14 ⇔ 5√3 < 9 ⇔ √75 < √81, obținem AB − AD < 14 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Dreptunghi. Centru de greutate. Asemănare",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Dreptunghiul ABCD cu D și C sus, A și B jos; O = AC ∩ BD, M mijlocul lui CD, E = BC ∩ AM (deasupra lui C), P = OE ∩ CD, S = AM ∩ BD.",
      content: "În figura alăturată este reprezentat dreptunghiul ABCD cu AB = 9√10 cm și AC = 30 cm. Dreptele AC și BD se intersectează în punctul O, iar punctul M este mijlocul segmentului CD. Dreptele BC și AM se intersectează în punctul E, iar dreptele OE și CD se intersectează în punctul P.",
      rubric: [
        { label: "a)", points: 2, answer: "Triunghiul ABC este dreptunghic ⇒ BC² = AC² − AB², de unde BC = 3√10 cm. A_ABCD = AB·BC = 9√10·3√10 = 270 cm²." },
        { label: "b)", points: 3, answer: "ΔMCE ≡ ΔMDA ⇒ ME = MA. CM și EO sunt mediane în triunghiul ACE, CD ∩ EO = {P} ⇒ P este centrul de greutate, MP/MC = 1/3. AM și DO sunt mediane în triunghiul ACD, AM ∩ DO = {S} ⇒ S este centrul de greutate, MS/MA = 1/3. Cum MP/MC = MS/MA = 1/3 și ∢SMP ≡ ∢AMC ⇒ ΔSMP ~ ΔAMC ⇒ SP = (1/3)·AC = 10 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Cub. Unghiul a două drepte. Distanță punct-plan",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Cubul ABCDA'B'C'D' cu latura de 10 cm.",
      content: "În figura alăturată este reprezentat cubul ABCDA'B'C'D' cu AB = 10 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "AB' ∥ DC' ⇒ ∢(AB', BC') = ∢(DC', BC'). Cum BC' = DC' = DB (diagonale ale fețelor), triunghiul BC'D este echilateral ⇒ ∢(AB', BC') = ∢BC'D = 60°." },
        { label: "b)", points: 3, answer: "Fie {O} = AC ∩ BD. CC' ⊥ (ABC) și BD ⊂ (ABC) ⇒ BD ⊥ CC'; cum BD ⊥ AC ⇒ BD ⊥ (CC'O). CP ⊥ C'O, P ∈ C'O ⇒ CP ⊥ BD; deci CP ⊥ (BDC') și CP este distanța de la C la planul (BDC'). În triunghiul dreptunghic C'CO, C'O = 5√6 cm și CP = (CO·CC')/C'O = 10√3/3 cm." },
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
  console.log(`\n=== import-exam-mate-2023-examen-1 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
