#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-09.mjs — Exam-Bank, CNCE training Test 9 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 9.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1c 2b 3d 4d 5a 6c · II = 1c 2d 3c 4c 5b 6b
 * NB: SI.6 ARE figură (diagramă circulară) ⇒ slug s1-6, autoGradable false. SII.6 (acvariu) NU are figură.
 *     Deci 9 figuri (S1-6 + S2-1..5 + S3-4,5,6) și 6 autoGradable (SI 1-5 + SII.6). Via 4uPDF.
 * finalAnswer: III.1="15" (răspunsuri corecte Silvia), III.4="24" (perimetru AOED) — find scalari.
 *   SKIP: III.2 (E≡x + N pătrat), III.3 (grafice/distanță proof), III.5 (8√21 + inegalitate), III.6 (proof).
 *   NB rubric III.2 = a)3p / b)2p.
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-09-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 9 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-09", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Divizibilitate",
      content: "Dintre numerele 2020, 2021, 2022 și 2023, numărul divizibil cu 3 este:",
      options: [{ key: "a", text: "2020" }, { key: "b", text: "2021" }, { key: "c", text: "2022" }, { key: "d", text: "2023" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Proporționalitate",
      content: "Cinci kilograme de mere costă 17,5 lei. Două kilograme de mere, de același fel, costă:",
      options: [{ key: "a", text: "3,5 lei" }, { key: "b", text: "7 lei" }, { key: "c", text: "14 lei" }, { key: "d", text: "35 de lei" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi. Tabele",
      content: "Maria măsoară temperatura pe parcursul unei zile, din două în două ore, de la ora 8:00 până la ora 18:00. Temperaturile măsurate sunt:\n• 8:00 — −4 °C\n• 10:00 — 0 °C\n• 12:00 — 2 °C\n• 14:00 — 6 °C\n• 16:00 — 5 °C\n• 18:00 — 1 °C\nTemperatura înregistrată la ora 14:00 este mai mare decât temperatura înregistrată la ora 8:00 cu:",
      options: [{ key: "a", text: "−9 °C" }, { key: "b", text: "−6 °C" }, { key: "c", text: "8 °C" }, { key: "d", text: "10 °C" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Operații cu fracții",
      content: "Se consideră numerele reale x = (1 + 1/2)(1 + 1/3)(1 + 1/4) și y = (1 − 1/2)(1 − 1/3)(1 − 1/4). Dintre enunțurile de mai jos, propoziția adevărată este:",
      options: [{ key: "a", text: "x = y" }, { key: "b", text: "0 > x > y" }, { key: "c", text: "x > 0 > y" }, { key: "d", text: "x > y > 0" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Operații cu radicali",
      content: "Tudor, Ilinca, Maria și Mihai calculează produsul numerelor a = √(2² + 2²) și b = √(2⁴ + 2⁴) și obțin rezultatele:\n• Tudor — 16\n• Ilinca — 32\n• Maria — 64\n• Mihai — 256\nDintre cei patru elevi, cel care a obținut rezultatul corect este:",
      options: [{ key: "a", text: "Tudor" }, { key: "b", text: "Ilinca" }, { key: "c", text: "Maria" }, { key: "d", text: "Mihai" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Interpretarea datelor. Procente",
      hasFigure: true, figureUrl: FIG("s1-6"),
      figureNote: "Diagramă circulară a celor 100 000 de persoane pe grupe de vârstă: cel mult 18 ani — 15%, între 18 și cel mult 30 ani — 20%, peste 50 ani — 35%, iar segmentul „între 30 și cel mult 50 ani” este nemarcat (de determinat).",
      content: "În diagrama alăturată este reprezentată distribuția celor 100 000 de persoane ale unui oraș în funcție de grupa de vârstă din care fac parte. Numărul de persoane cu vârsta cuprinsă între 30 de ani și cel mult 50 de ani este egal cu:",
      options: [{ key: "a", text: "15 000" }, { key: "b", text: "20 000" }, { key: "c", text: "30 000" }, { key: "d", text: "35 000" }], correctAnswer: "c" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Linie mijlocie",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Trei puncte coliniare A, B, C (în această ordine) pe o dreaptă; M mijlocul lui AB, N mijlocul lui BC.",
      content: "În figura alăturată sunt reprezentate punctele coliniare A, B și C, în această ordine. Punctul M este mijlocul segmentului AB și punctul N este mijlocul segmentului BC. Știind că MN = 5 cm, lungimea segmentului AC este egală cu:",
      options: [{ key: "a", text: "2,5 cm" }, { key: "b", text: "5 cm" }, { key: "c", text: "10 cm" }, { key: "d", text: "20 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Drepte paralele. Unghiuri",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Dreptele paralele a (jos) și b (sus) intersectate de transversalele c și d; sunt marcate unghiurile de 120° și x° (la b) și de 60° și 40° (la a).",
      content: "În figura alăturată, paralelele a și b sunt intersectate de dreptele c și d. Valoarea lui x este de:",
      options: [{ key: "a", text: "40" }, { key: "b", text: "60" }, { key: "c", text: "120" }, { key: "d", text: "140" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Bisectoare. Simetric",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Triunghiul ABC dreptunghic în A (A sus, B stânga, C dreapta); E pe AC, BE bisectoarea unghiului ABC; F simetricul lui E față de dreapta BC (sub BC).",
      content: "Figura alăturată reprezintă schița unui loc de joacă pentru copii în care triunghiul ABC este dreptunghic în A, unghiul ABC are măsura de 60°, BE este bisectoarea acestuia, E ∈ AC, iar AE = 3 m. Eugen se deplasează în linie dreaptă din punctul E până în punctul F, care este simetricul punctului E față de dreapta BC, apoi iarăși în linie dreaptă, din punctul F până în punctul C. Deplasându-se astfel, Eugen a parcurs un traseu de lungime egală cu:",
      options: [{ key: "a", text: "3 m" }, { key: "b", text: "6 m" }, { key: "c", text: "12 m" }, { key: "d", text: "18 m" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Paralelogram. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Paralelogramul ABCD (D, C sus, A, B jos); P mijlocul laturii AD; triunghiul PBC hașurat.",
      content: "Figura alăturată reprezintă schița unei grădini, în formă de paralelogram ABCD. Punctul P este mijlocul segmentului AD. Suprafața corespunzătoare triunghiului PBC este cultivată cu legume. Raportul dintre aria suprafeței cultivate cu legume și aria suprafeței grădinii este egal cu:",
      options: [{ key: "a", text: "1/4" }, { key: "b", text: "1/3" }, { key: "c", text: "1/2" }, { key: "d", text: "3/4" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Poligon regulat înscris în cerc",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Pentagonul regulat ABCDE înscris într-un cerc (coardele AB, BC, CD, DE, AE congruente).",
      content: "Punctele A, B, C, D și E sunt situate, în această ordine, pe un cerc, astfel încât coardele AB, BC, CD, DE și AE sunt congruente. Măsura unghiului EAB este egală cu:",
      options: [{ key: "a", text: "72°" }, { key: "b", text: "108°" }, { key: "c", text: "144°" }, { key: "d", text: "288°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Prismă. Volum",
      content: "Un acvariu are forma unei prisme drepte cu baza pătrat de latură 6 dm, iar muchia laterală a prismei este de 4 dm. Acvariul este umplut cu apă la jumătatea capacității maxime. Numărul de litri de apă din acvariu este egal cu:",
      options: [{ key: "a", text: "36 de litri" }, { key: "b", text: "72 de litri" }, { key: "c", text: "108 litri" }, { key: "d", text: "144 de litri" }], correctAnswer: "b" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Probleme. Ecuații",
      finalAnswer: "15",
      content: "Un test conține 20 de întrebări. Pentru fiecare răspuns corect se acordă 4 puncte, pentru fiecare răspuns greșit se scad 2 puncte și nu se acordă puncte din oficiu.\na) Este posibil ca Mihai, după ce a parcurs integral testul și a răspuns la toate întrebările, să obțină 65 de puncte? Justifică răspunsul dat.\nb) Silvia a răspuns la toate întrebările testului și a obținut 50 de puncte. Determină numărul de întrebări din test la care Silvia a răspuns corect.",
      rubric: [
        { label: "a)", points: 2, answer: "Punctajul pentru răspunsurile corecte este multiplu de 4 (număr par), iar cel pentru răspunsurile greșite este multiplu de 2 (număr par), deci punctajul total este par. Cum 65 este impar, nu este posibil ca Mihai să obțină 65 de puncte." },
        { label: "b)", points: 3, answer: "4x − 2(20 − x) = 50, unde x este numărul răspunsurilor corecte; rezultă 6x − 40 = 50, deci x = 15." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Sume",
      content: "Se consideră expresia E(x) = (x√2 − 3)(x√2 + 3) − (2x + 3)² + 2x(x + 6,5) + 18, unde x este număr real.\na) Demonstrează că E(x) = x, pentru orice număr real x.\nb) Demonstrează că numărul N = E(1) + E(2) + E(3) + ... + E(49) este pătratul unui număr natural.",
      rubric: [
        { label: "a)", points: 3, answer: "E(x) = (2x² − 9) − (4x² + 12x + 9) + (2x² + 13x) + 18 = 2x² − 9 − 4x² − 12x − 9 + 2x² + 13x + 18 = x, pentru orice număr real x." },
        { label: "b)", points: 2, answer: "Cum E(k) = k, N = E(1) + E(2) + ... + E(49) = 1 + 2 + ... + 49 = (49 · 50)/2 = 1225 = (7 · 5)² = 35², deci N este pătratul unui număr natural." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Geometrie analitică",
      content: "Se consideră funcțiile f : ℝ → ℝ, f(x) = x + 2 și g : ℝ → ℝ, g(x) = −x + 4.\na) Demonstrează că punctul A(1, 3) este punctul de intersecție a reprezentărilor geometrice ale graficelor funcțiilor f și g în sistemul de axe ortogonale xOy.\nb) Demonstrează că, în sistemul de axe ortogonale xOy, distanța dintre punctele B și C, care reprezintă intersecția reprezentării geometrice a graficului funcției f, respectiv g, cu axa Ox, este egală cu dublul distanței de la punctul A(1, 3) la axa Ox.",
      rubric: [
        { label: "a)", points: 2, answer: "f(1) = 1 + 2 = 3, deci A(1, 3) aparține graficului lui f; g(1) = −1 + 4 = 3, deci A(1, 3) aparține graficului lui g; prin urmare A este punctul de intersecție al celor două grafice." },
        { label: "b)", points: 3, answer: "Graficul lui f intersectează axa Ox în B(−2, 0), iar graficul lui g în C(4, 0), deci BC = 6. Distanța de la A(1, 3) la axa Ox este 3, iar BC = 6 = 2 · 3, deci BC este dublul acestei distanțe." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Trapez dreptunghic. Perimetru",
      hasFigure: true, figureUrl: FIG("s3-4"),
      finalAnswer: "24",
      content: "În figura alăturată este reprezentat trapezul dreptunghic ABCD cu AB ∥ CD, AD ⊥ AB, AD = 6 cm, ∢BCD = 120° și DC = BC. Punctul E reprezintă proiecția punctului D pe dreapta BC.\na) Arată că BD = 12 cm.\nb) Punctul O este mijlocul segmentului BD. Calculează perimetrul patrulaterului AOED.",
      figureNote: "Trapezul dreptunghic ABCD (D, C sus, A, B jos) cu AB ∥ CD și AD ⊥ AB; E proiecția lui D pe dreapta BC (deasupra); O mijlocul lui BD.",
      rubric: [
        { label: "a)", points: 2, answer: "DC ∥ AB și DC = CB, deci ∢CDB ≡ ∢CBD ≡ ∢DBA; cum ∢DCB = 120°, obținem ∢DBA = 30°. În triunghiul ABD dreptunghic în A cu ∢ABD = 30°, rezultă BD = 2 · AD = 12 cm." },
        { label: "b)", points: 3, answer: "DAB și DEB sunt triunghiuri dreptunghice cu O mijlocul ipotenuzei BD, deci AO = EO = BD/2 = 6 cm. Din ΔDAB ≡ ΔDEB rezultă DE = AD = 6 cm. Patrulaterul AOED are AO = OE = ED = DA = 6 cm, deci P(AOED) = 4 · AD = 24 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi isoscel. Inegalități",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul isoscel ABC (A sus, B jos-stânga, C jos-dreapta) cu AB = AC; D pe latura AC, cu BD = BC.",
      content: "În figura alăturată este reprezentat triunghiul ABC isoscel, cu AB = AC = 10 cm și BC = 8 cm. Punctul D aparține laturii AC astfel încât BD = BC.\na) Arată că aria triunghiului ABC este egală cu 8√21 cm².\nb) Demonstrează că triunghiul ABD are perimetrul mai mic decât 22 cm.",
      rubric: [
        { label: "a)", points: 2, answer: "Fie AM ⊥ BC, M ∈ BC; cum triunghiul ABC este isoscel, M este mijlocul lui BC, deci AM = √(AB² − BM²) = √(100 − 16) = 2√21 cm; A(ABC) = (AM · BC)/2 = (2√21 · 8)/2 = 8√21 cm²." },
        { label: "b)", points: 3, answer: "ΔABC ~ ΔBDC ⇒ AB/BD = BC/DC; cum BD = BC = 8 cm, obținem DC = BC²/AB = 64/10 = 6,4 cm, deci AD = AC − DC = 3,6 cm; P(ABD) = AB + BD + AD = 10 + 8 + 3,6 = 21,6 cm < 22 cm." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Tetraedru regulat. Perpendicularitate",
      hasFigure: true, figureUrl: FIG("s3-6"),
      figureNote: "Tetraedrul regulat ABCD (A sus, B, C, D la bază); M pe AB, N pe BC, P pe CD, Q pe AD, cu AM = BN = CP = DQ = 2 cm.",
      content: "În figura alăturată este reprezentat tetraedrul regulat ABCD cu AB = 6 cm. Punctele M, N, P și Q aparțin segmentelor AB, BC, CD, respectiv AD, astfel încât AM = BN = CP = DQ = 2 cm.\na) Demonstrează că unghiul dintre dreptele MN și AC are măsura de 30°.\nb) Punctul O este mijlocul segmentului MP. Demonstrează că dreapta MP este perpendiculară pe planul (NOQ).",
      rubric: [
        { label: "a)", points: 2, answer: "Considerăm punctul E mijlocul lui NC; din AM/BM = CE/BE rezultă ME ∥ AC, deci ∢(MN, AC) = ∢(MN, ME) = ∢NME. Cum MN este mediană în triunghiul echilateral MBE, este și bisectoare, de unde ∢NME = 30°." },
        { label: "b)", points: 3, answer: "ΔBMN ≡ ΔCNP ≡ ΔDPQ ≡ ΔAQM, deci MN = NP = PQ = MQ. NO și QO sunt mediane în triunghiurile isoscele MNP, respectiv MQP, situate în plane diferite, deci NO ⊥ MP și QO ⊥ MP, de unde MP ⊥ (NOQ)." },
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
  console.log(`\n=== import-exam-mate-2021-test-09 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
