#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-06.mjs — Exam-Bank, CNCE training Test 6 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 6.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1b 2c 3a 4c 5d 6d · II = 1b 2d 3a 4b 5b 6c
 * NB: SII.2 NU are figură (enunț pur text) ⇒ autoGradable. Deci 8 figuri (S2-1,3,4,5,6 + S3-4,5,6)
 *     și 7 autoGradable (SI 1-6 + SII.2). Figuri via 4uPDF /api/extract-region.
 * finalAnswer: III.1=3 (singurul find scalar curat — „Află câte kg pe m²").
 *   SKIP: III.2 (E(−2)−8=0 + inegalitate), III.3 (proof natural), III.4 (proof), III.5 (raport 1/2 fracție),
 *   III.6 (preț — vezi mai jos).
 * NB III.6 b): enunțul oficial dă preț 125 lei/bidon (⇒ 4·125 = 500 lei), dar baremul CNCE tipărește
 *   600 lei (= 4·150). Inconsecvență subiect/barem preluată ca atare; finalAnswer omis (valoare ambiguă).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-06-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 6 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-06", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Ordinea operațiilor",
      content: "Rezultatul calculului 44 − 4 · 4 este egal cu:",
      options: [{ key: "a", text: "0" }, { key: "b", text: "28" }, { key: "c", text: "60" }, { key: "d", text: "160" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporții",
      content: "Dacă 3/(x + 1) = 1/674, atunci numărul real x este egal cu:",
      options: [{ key: "a", text: "3" }, { key: "b", text: "674" }, { key: "c", text: "2021" }, { key: "d", text: "2022" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Înmulțirea numerelor întregi",
      content: "Produsul numerelor −18 și 3 este egal cu:",
      options: [{ key: "a", text: "−54" }, { key: "b", text: "−21" }, { key: "c", text: "−15" }, { key: "d", text: "−6" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Procente. Reduceri",
      content: "În tabelul de mai jos este prezentată oferta cu reduceri de prețuri pentru două produse, în funcție de numărul de produse cumpărate:\n• Săpun — preț 2,5 lei/bucată; reducere 10% la cumpărarea a 4 bucăți, 12% la cumpărarea a 8 bucăți\n• Pastă de dinți — preț 8 lei/bucată; reducere 20% la cumpărarea a 4 bucăți, 25% la cumpărarea a 8 bucăți\nȘtiind că un cumpărător a achiziționat 8 bucăți de săpun și 4 bucăți de pastă de dinți, prețul total plătit de acesta în urma aplicării reducerilor este:",
      options: [{ key: "a", text: "49,6 lei" }, { key: "b", text: "45,6 lei" }, { key: "c", text: "43,2 lei" }, { key: "d", text: "32 lei" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Mulțimi. Intersecție",
      content: "Maria scrie mulțimea formată din literele comune următoarelor trei cuvinte: matematică, gramatică, informatică. Numărul elementelor mulțimii scrise de Maria este egal cu:",
      options: [{ key: "a", text: "11" }, { key: "b", text: "10" }, { key: "c", text: "9" }, { key: "d", text: "6" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Ordonarea numerelor reale",
      content: "Dintre următoarele secvențe de numere, cea care reprezintă o enumerare în ordine crescătoare este:",
      options: [{ key: "a", text: "−√2, −2, 2, √2" }, { key: "b", text: "−√2, −2, √2, 2" }, { key: "c", text: "−2, −√2, 2, √2" }, { key: "d", text: "−2, −√2, √2, 2" }], correctAnswer: "d" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Ordine pe dreaptă",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Două puncte distincte A (stânga) și B (dreapta) pe o dreaptă orizontală.",
      content: "În figura alăturată sunt reprezentate punctele distincte A și B. Andrei trebuie să poziționeze pe segmentul AB punctele C, D și E astfel încât AB = 2 · AC = 4 · AD = 5 · AE. Ordinea pe dreapta AB a celor 5 puncte este:",
      options: [{ key: "a", text: "A − C − D − E − B" }, { key: "b", text: "A − E − D − C − B" }, { key: "c", text: "A − C − E − D − B" }, { key: "d", text: "A − E − C − D − B" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Unghiuri complementare",
      content: "Unghiurile AOB și BOC sunt adiacente complementare, iar măsura unghiului BOC este de 30°. Măsura unghiului AOB este egală cu:",
      options: [{ key: "a", text: "15°" }, { key: "b", text: "30°" }, { key: "c", text: "45°" }, { key: "d", text: "60°" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Linie mijlocie. Perimetru",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul dreptunghic isoscel ABC cu ipotenuza BC (unghi drept în A); D, E, F mijloacele laturilor BC, AB, respectiv AC.",
      content: "În figura alăturată este reprezentat triunghiul dreptunghic isoscel ABC cu ipotenuza BC. Punctele D, E și F sunt mijloacele laturilor BC, AB, respectiv AC. Perimetrul patrulaterului AEDF este:",
      options: [{ key: "a", text: "egal cu suma lungimilor laturilor AB și AC" }, { key: "b", text: "mai mare decât suma lungimilor laturilor AB și AC" }, { key: "c", text: "mai mic decât suma lungimilor laturilor AB și AC" }, { key: "d", text: "mai mic decât lungimea laturii BC" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghiuri congruente. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "O morișcă din patru triunghiuri dreptunghice congruente cu vârful comun O; A, C, E, G la exterior, iar B, D, F, H mijloacele segmentelor OC, OE, OG, respectiv OA.",
      content: "În figura alăturată este reprezentată o morișcă despre care știm că este compusă din patru triunghiuri dreptunghice congruente AOB, COD, EOF și GOH, dispuse astfel încât punctele B, D, F și H sunt mijloacele segmentelor OC, OE, OG, respectiv OA. Știind că AH = 10 cm și că cele patru triunghiuri au fost decupate dintr-un carton, fără pierderi de material, aria suprafeței cartonului era egală cu:",
      options: [{ key: "a", text: "1 dm²" }, { key: "b", text: "4 dm²" }, { key: "c", text: "10 dm²" }, { key: "d", text: "40 dm²" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Dreptunghi",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu diametrele perpendiculare AB (orizontal) și CD (vertical); N pe cerc, M pe OB, P pe OD, patrulaterul OMNP dreptunghi.",
      content: "Segmentele AB și CD sunt două diametre perpendiculare în cercul de centru O din figura alăturată. Punctul N aparține acestui cerc, iar punctele M și P aparțin segmentelor OB, respectiv OD, astfel încât patrulaterul OMNP să fie dreptunghi. Dacă lungimea coardei AC este √2 cm, atunci lungimea segmentului MP este:",
      options: [{ key: "a", text: "2 cm" }, { key: "b", text: "1 cm" }, { key: "c", text: "0,5 cm" }, { key: "d", text: "√2 cm" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Prismă triunghiulară regulată. Volum",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Prisma triunghiulară regulată dreaptă ABCA′B′C′ cu bazele ABC (jos) și A′B′C′ (sus).",
      content: "În figura alăturată este reprezentată o prismă triunghiulară regulată dreaptă ABCA′B′C′, de baze ABC și A′B′C′, cu muchiile AB și AA′ egale. Știind că aria laterală a prismei reprezentate este egală cu 27 cm², volumul aceleiași prisme este egal cu:",
      options: [{ key: "a", text: "3 cm³" }, { key: "b", text: "9 cm³" }, { key: "c", text: "27√3/4 cm³" }, { key: "d", text: "27 cm³" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme practice. Împărțire",
      finalAnswer: "3",
      content: "Pe un lot cu suprafața de 48 m², un agricultor a cultivat cartofi. Întreaga recoltă obținută o vinde la piață cu 1,85 lei kilogramul și încasează 266,40 lei.\na) Verifică dacă întreaga recoltă este de 150 kg de cartofi.\nb) Află câte kilograme de cartofi au fost recoltate de pe un metru pătrat. (Se consideră că producția este aceeași pe fiecare metru pătrat al lotului.)",
      rubric: [
        { label: "a)", points: 2, answer: "Pentru 150 kg de cartofi s-ar încasa 150 · 1,85 = 277,50 lei ≠ 266,40 lei, așadar recolta de pe întreg lotul nu este de 150 kg." },
        { label: "b)", points: 3, answer: "Notăm cu x cantitatea (în kg) recoltată de pe un metru pătrat; cum 48 · x · 1,85 = 266,40 lei, rezultă x = 3 kg." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Inegalități",
      content: "Se consideră expresia E(x) = 2(x + 3)² − (2 + x)(x − 2) − 2(5x + 7), unde x este număr real.\na) Arată că E(−2) − 8 = 0.\nb) Demonstrează că E(x) ≥ 7, pentru orice număr real x.",
      rubric: [
        { label: "a)", points: 2, answer: "E(−2) = 2(−2 + 3)² − (2 + (−2))((−2) − 2) − 2(5·(−2) + 7) = 2 · 1 − 0 − 2·(−3) = 2 + 6 = 8; deci E(−2) − 8 = 8 − 8 = 0." },
        { label: "b)", points: 3, answer: "E(x) = 2(x² + 6x + 9) − (x² − 4) − (10x + 14) = 2x² + 12x + 18 − x² + 4 − 10x − 14 = x² + 2x + 8 = (x + 1)² + 7 ≥ 7, pentru orice număr real x." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Puteri. Divizibilitate",
      content: "Se consideră numărul întreg a = 2²⁰⁴⁸ − 2048².\na) Arată că la împărțirea numărului 2048 cu 64 câtul este egal cu 2⁵.\nb) Arată că numărul a este un număr natural.",
      rubric: [
        { label: "a)", points: 2, answer: "2048 : 64 = 32; cum 32 = 2⁵, câtul obținut este egal cu 2⁵." },
        { label: "b)", points: 3, answer: "2048 = 2¹¹, deci 2048² = 2²², iar a = 2²⁰⁴⁸ − 2²². Cum 2²⁰⁴⁸ > 2²², a este diferența pozitivă a două numere naturale, deci a este un număr natural." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez dreptunghic. Paralelism",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Trapezul dreptunghic ABCD (D sus-stânga, C sus, A jos-stânga, B jos-dreapta) cu AD ⊥ AB și AB ∥ CD; semidreapta BD trasată.",
      content: "În figura alăturată este reprezentat un trapez dreptunghic ABCD cu AD ⊥ AB și AB ∥ CD. Semidreapta BD este bisectoarea unghiului ABC, AB = 16 cm și CD = 10 cm.\na) Știind că E ∈ AB astfel încât CE ⊥ AB, demonstrează că BE = 6 cm.\nb) Știind că P este punctul de intersecție a laturii AB cu perpendiculara din C pe dreapta BD, demonstrează că DP ∥ BC.",
      rubric: [
        { label: "a)", points: 2, answer: "AECD este dreptunghi (AD ⊥ AB, CE ⊥ AB, AB ∥ CD), deci AE = CD = 10 cm; BE = AB − AE = 16 − 10 = 6 cm." },
        { label: "b)", points: 3, answer: "BD este bisectoare în triunghiul BCP și BD ⊥ CP, deci triunghiul BCP este isoscel, adică BC = BP, de unde BP = CD; cum BP ∥ CD, BCDP este paralelogram, deci DP ∥ BC." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Linie mijlocie. Rapoarte",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A (C sus, A jos-stânga, B jos-dreapta); M mijlocul lui AC, N mijlocul lui BC; segmentul MN trasat.",
      content: "În figura alăturată, punctele M și N sunt mijloacele laturilor AC, respectiv BC ale unui triunghi ABC dreptunghic în A, cu BC = 24 cm și măsura unghiului C egală cu 30°.\na) Determină lungimea segmentului MN.\nb) Calculează raportul dintre perimetrul triunghiului AMN și perimetrul triunghiului ABC.",
      rubric: [
        { label: "a)", points: 2, answer: "AB = BC/2 = 12 cm (catetă opusă unghiului de 30°); MN este linie mijlocie în triunghiul ABC, deci MN = AB/2 = 12/2 = 6 cm." },
        { label: "b)", points: 3, answer: "AN este mediană corespunzătoare ipotenuzei în triunghiul dreptunghic ABC, deci AN = BC/2; M fiind mijlocul lui AC, AM = AC/2; cum și MN = AB/2, toate laturile triunghiului AMN sunt jumătate din laturile triunghiului ABC, deci P(AMN)/P(ABC) = 1/2." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Piramidă patrulateră regulată. Arii. Probleme practice",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Acoperiș în formă de piramidă patrulateră regulată VABCD (vârf V, bază pătrată ABCD); O centrul bazei, M mijlocul muchiei BC.",
      content: "În figura alăturată este reprezentat acoperișul unei case sub forma suprafeței laterale a piramidei patrulatere regulate VABCD, de înălțime VO = 3 m, în care unghiul de înclinație a acoperișului (unghiul dintre planul unei fețe laterale și planul bazei) are măsura egală cu 30°. Punctul M este mijlocul muchiei BC.\na) Arată că AB = 6√3 m.\nb) Știind că acoperișul este realizat din tablă și că proprietarul casei dorește să-l vopsească într-un singur strat cu vopsea specială pentru tablă care se vinde la bidon de 3 litri care costă 125 de lei și care, conform specificațiilor producătorului, acoperă 12 m² la utilizarea unui litru, determină prețul minim pe care trebuie să-l achite proprietarul pentru cumpărarea cantității de vopsea necesară la bidon de 3 litri. (Pentru justificare, se poate folosi inegalitatea 1,73 < √3 < 1,74.)",
      rubric: [
        { label: "a)", points: 2, answer: "VO ⊥ (ABC), deci triunghiul VOM este dreptunghic în O cu ∢VMO = 30°; din tg(∢VMO) = VO/OM rezultă OM = 3√3 m. OM este apotema pătratului bazei ABCD, deci AB = 2 · OM = 6√3 m." },
        { label: "b)", points: 3, answer: "VM = VO / sin30° = 6 m, deci aria laterală (suprafața de vopsit) este 4 · (AB · VM)/2 = 72√3 m². Cum 1,73 < √3 < 1,74, rezultă 124,56 < 72√3 < 125,28, deci cantitatea de vopsea necesară (aria împărțită la 12 m²/litru) este între 10 și 11 litri, de unde numărul minim de bidoane de 3 litri este 4. (NB: baremul oficial CNCE indică 600 lei — adică 150 lei/bidon; cu prețul de 125 lei/bidon din enunț costul ar fi 4 · 125 = 500 lei. Inconsecvență subiect/barem preluată ca atare din sursă.)" },
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
  console.log(`\n=== import-exam-mate-2021-test-06 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
