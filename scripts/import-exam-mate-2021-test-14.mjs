#!/usr/bin/env node
/**
 * import-exam-mate-2021-test-14.mjs — Exam-Bank, CNCE training Test 14 (Matematică, EN VIII 2020–2021)
 *
 * SOURCE: Ministerul Educației / CNPEE — EN VIII, an școlar 2020–2021, Test de antrenament nr. 14.
 *   Public (edu.ro / CNPEE). Transcribed verbatim from official subiect + barem PDFs.
 *
 * Barem chei: I = 1c 2d 3a 4d 5b 6b · II = 1c 2b 3d 4d 5a 6c
 * NB: SI 1-6 tabele/text fără figură → 6 autoGradable. SII 1-6 toate cu figură. SIII.3 (grafic),
 *     SIII.4 (triunghi), SIII.5 (triunghi), SIII.6 (prismă) cu figură. Deci 10 figuri
 *     (s2-1..6 + s3-3,4,5,6). Via 4uPDF.
 * finalAnswer: III.6="90" (unghiul (AA',EF)=90°). SKIP: III.1 (da/nu + ziua), III.2 (demonstrații),
 *   III.3 (a=2 dar b=2√5 radical → item mixt), III.4 (demonstrații), III.5 ("arată" valori date).
 *
 * Modes: --validate | --dry | apply. DB: DATABASE_URL (prod = VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";
const FIG = (s) => `/exam-figures/en-viii-2021-mate-test-14-${s}.png`;

const MATH = {
  source: "EN VIII 2021 Testul 14 — antrenament (CNPEE)",
  examType: "EN_VIII", year: 2021, subjectKey: "matematica", subjectName: "Matematică",
  grade: 8, variant: "test-14", maxScore: 100, officeBonus: 10, timeLimit: 120, language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2021/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației / CNPEE)",
  passages: [],
  items: [
    // ── Subiectul I ──
    { section: "Subiectul I", label: "1", type: "MCQ", points: 5, autoGradable: true, topic: "Divizibilitate. Numere de două cifre",
      content: "Numărul natural de două cifre, cu cifra zecilor egală cu 2, divizibil cu 6 este:",
      options: [{ key: "a", text: "28" }, { key: "b", text: "26" }, { key: "c", text: "24" }, { key: "d", text: "22" }], correctAnswer: "c" },
    { section: "Subiectul I", label: "2", type: "MCQ", points: 5, autoGradable: true, topic: "Rapoarte. Tabel de date",
      content: "În tabelul de mai jos sunt prezentate informații referitoare la temperatura înregistrată în patru zile, la ora 8:00, respectiv ora 12:00.\n\nZiua | ora 8:00 | ora 12:00\nLuni | 4°C | 8°C\nMarți | 3°C | 9°C\nMiercuri | 4°C | 16°C\nJoi | 6°C | 18°C\n\nZilele pentru care raportul dintre temperatura înregistrată la ora 8:00 și temperatura înregistrată la ora 12:00 are aceeași valoare sunt:",
      options: [{ key: "a", text: "Luni și Miercuri" }, { key: "b", text: "Luni și Joi" }, { key: "c", text: "Marți și Miercuri" }, { key: "d", text: "Marți și Joi" }], correctAnswer: "d" },
    { section: "Subiectul I", label: "3", type: "MCQ", points: 5, autoGradable: true, topic: "Numere întregi. Modul",
      content: "Vârful Omu din Munții Bucegi are altitudinea de 2505 m. Marea Neagră are o adâncime medie de 1271 m. Valoarea absolută a diferenței dintre adâncimea medie a Mării Negre și altitudinea vârfului Omu este egală cu:",
      options: [{ key: "a", text: "3776 m" }, { key: "b", text: "−3776 m" }, { key: "c", text: "1234 m" }, { key: "d", text: "−1234 m" }], correctAnswer: "a" },
    { section: "Subiectul I", label: "4", type: "MCQ", points: 5, autoGradable: true, topic: "Fracții ordinare subunitare",
      content: "Dintre următoarele seturi de numere, cel care reprezintă numai fracții ordinare subunitare este:",
      options: [
        { key: "a", text: "2/3, 2/5, 4/3, 6/8, 1/3, 5/7" },
        { key: "b", text: "10/13, 1/5, 2/3, 15/8, 2/7, 3/10" },
        { key: "c", text: "1/4, 9/15, 6/11, 7/8, 6/5, 5/7" },
        { key: "d", text: "5/9, 3/8, 2/7, 10/11, 4/13, 5/7" },
      ], correctAnswer: "d" },
    { section: "Subiectul I", label: "5", type: "MCQ", points: 5, autoGradable: true, topic: "Media geometrică. Radicali",
      content: "Patru elevi, Radu, Alexandru, Vlad și Eva, calculează media geometrică a numerelor 8√3 și 3√3. Rezultatele obținute sunt înregistrate în tabelul următor.\n\nElev | Rezultat\nRadu | 2√6\nAlexandru | 6√2\nVlad | 4√3\nEva | 6√3\n\nDintre cei patru elevi, cel care a calculat corect media geometrică a celor două numere este:",
      options: [{ key: "a", text: "Radu" }, { key: "b", text: "Alexandru" }, { key: "c", text: "Vlad" }, { key: "d", text: "Eva" }], correctAnswer: "b" },
    { section: "Subiectul I", label: "6", type: "MCQ", points: 5, autoGradable: true, topic: "Media aritmetică ponderată",
      content: "Elevii unei clase au obținut la un test notele prezentate în tabelul de mai jos:\n\nNota | 10 | 9 | 8 | 7 | 6 | 5 | 4\nNumăr elevi | 2 | 2 | 6 | 7 | 5 | 1 | 1\n\nUn elev afirmă că „media notelor obținute de elevii clasei este egală cu 7,30”. Afirmația făcută este:",
      options: [{ key: "a", text: "adevărată" }, { key: "b", text: "falsă" }], correctAnswer: "b" },
    // ── Subiectul al II-lea ──
    { section: "Subiectul al II-lea", label: "1", type: "MCQ", points: 5, autoGradable: false, topic: "Segmente. Mijloace",
      hasFigure: true, figureUrl: FIG("s2-1"),
      figureNote: "Punctele coliniare A, B, C (în această ordine) pe o dreaptă orizontală; M mijlocul segmentului AB, N mijlocul segmentului BC.",
      content: "În figura alăturată sunt reprezentate, în această ordine, punctele coliniare A, B, C. Știind că punctele M și N sunt mijloacele segmentelor AB, respectiv BC, AB = 2 cm și BC = 4 cm, lungimea segmentului MN este egală cu:",
      options: [{ key: "a", text: "1 cm" }, { key: "b", text: "2 cm" }, { key: "c", text: "3 cm" }, { key: "d", text: "4 cm" }], correctAnswer: "c" },
    { section: "Subiectul al II-lea", label: "2", type: "MCQ", points: 5, autoGradable: false, topic: "Triunghi echilateral. Unghi la centru",
      hasFigure: true, figureUrl: FIG("s2-2"),
      figureNote: "Punctele A (sus), B (jos-stânga), C (jos-dreapta) la distanțe egale unul față de celălalt și punctul G la distanțe egale față de A, B, C (centrul triunghiului echilateral).",
      content: "În figura alăturată punctele A, B, C se găsesc la distanțe egale unul față de celălalt, respectiv la distanțe egale față de punctul G. Măsura unghiului BGC este egală cu:",
      options: [{ key: "a", text: "90°" }, { key: "b", text: "120°" }, { key: "c", text: "130°" }, { key: "d", text: "150°" }], correctAnswer: "b" },
    { section: "Subiectul al II-lea", label: "3", type: "MCQ", points: 5, autoGradable: false, topic: "Pătrat. Diagonală. Perpendiculară",
      hasFigure: true, figureUrl: FIG("s2-3"),
      figureNote: "Pătratul ABCD (C sus-stânga, D sus-dreapta, B jos-stânga, A jos-mijloc) cu diagonala BD; perpendiculara în D pe BD intersectează dreapta AB în punctul E (jos-dreapta).",
      content: "În figura alăturată este reprezentat un pătrat ABCD de latură 3 cm. Perpendiculara în D pe diagonala BD a pătratului ABCD intersectează dreapta AB în punctul E. Perimetrul triunghiului DBE este egal cu:",
      options: [{ key: "a", text: "9 cm" }, { key: "b", text: "3(2 + √2) cm" }, { key: "c", text: "18 cm" }, { key: "d", text: "6(1 + √2) cm" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "4", type: "MCQ", points: 5, autoGradable: false, topic: "Romb. Dreptunghiul mijloacelor. Arii",
      hasFigure: true, figureUrl: FIG("s2-4"),
      figureNote: "Romb cu diagonalele de 60 cm și 80 cm (pe rețea de pătrățele); dreptunghiul interior cu vârfurile în mijloacele laturilor rombului reprezintă broderia (hașurată închis).",
      content: "Figura alăturată reprezintă schița unei fețe de masă în formă de romb cu lungimile diagonalelor de 60 cm și de 80 cm. Pe fața de masă este cusută o broderie în formă de dreptunghi, care are vârfurile în mijloacele laturilor feței de masă. Valoarea raportului dintre suprafața broderiei și suprafața feței de masă este:",
      options: [{ key: "a", text: "1/8" }, { key: "b", text: "1/4" }, { key: "c", text: "1/3" }, { key: "d", text: "1/2" }], correctAnswer: "d" },
    { section: "Subiectul al II-lea", label: "5", type: "MCQ", points: 5, autoGradable: false, topic: "Cerc. Triunghi înscris. Arie",
      hasFigure: true, figureUrl: FIG("s2-5"),
      figureNote: "Cercul de centru O cu diametrul AB (A jos-stânga, B sus-dreapta) trecând prin O; punctul C pe cerc (în dreapta), cu segmentele OC și BC trasate.",
      content: "În figura alăturată punctele A și B sunt situate pe cercul de centru O și sunt diametral opuse, iar punctul C aparține cercului dat astfel încât AC = 2√3 cm și BC = OC. Aria triunghiului BOC este egală cu:",
      options: [{ key: "a", text: "√3 cm" }, { key: "b", text: "6 cm" }, { key: "c", text: "8 cm" }, { key: "d", text: "6√3 cm" }], correctAnswer: "a" },
    { section: "Subiectul al II-lea", label: "6", type: "MCQ", points: 5, autoGradable: false, topic: "Piramidă patrulateră. Volum",
      hasFigure: true, figureUrl: FIG("s2-6"),
      figureNote: "Piramida patrulateră VABCD cu vârful V (sus) și baza pătratul ABCD; înălțimea VO din vârf în centrul O al bazei.",
      content: "În figura alăturată este reprezentată o piramidă patrulateră VABCD cu ABCD pătrat, AB = 12 cm și înălțimea VO = 8 cm. Volumul piramidei VABCD este egal cu:",
      options: [{ key: "a", text: "96 cm³" }, { key: "b", text: "144 cm³" }, { key: "c", text: "384 cm³" }, { key: "d", text: "1152 cm³" }], correctAnswer: "c" },
    // ── Subiectul al III-lea ──
    { section: "Subiectul al III-lea", label: "1", type: "OPEN", points: 5, autoGradable: false, topic: "Procente. Probleme",
      content: "Un automobil a parcurs un drum în trei zile, astfel: în prima zi a parcurs 35% din lungimea drumului, în a doua zi 20% din lungimea drumului rămas, iar în a treia zi restul de 624 km.\na) Este adevărat că automobilul a parcurs în primele două zile jumătate din lungimea drumului? Justifică răspunsul dat.\nb) Determină în care dintre cele trei zile automobilul a parcurs cei mai mulți kilometri.",
      rubric: [
        { label: "a)", points: 2, answer: "După prima zi automobilul mai are de parcurs 65% din lungimea drumului; în a doua zi parcurge 20% din rest, adică (20/100)·(65/100)·x = (13/100)·x = 13% din x, unde x este lungimea totală a drumului. În primele două zile a parcurs 35% + 13% = 48% < 50%, deci nu este adevărat că a parcurs jumătate din drum în primele două zile." },
        { label: "b)", points: 3, answer: "În a treia zi automobilul a parcurs 100% − 48% = 52% din lungimea drumului. Cum (13/100)·x < (35/100)·x < (52/100)·x, cea mai lungă distanță corespunde celei de-a treia zile, deci în a treia zi automobilul a parcurs cei mai mulți kilometri." },
      ] },
    { section: "Subiectul al III-lea", label: "2", type: "OPEN", points: 5, autoGradable: false, topic: "Calcul algebric. Descompuneri",
      content: "Se consideră expresia E(x) = (x + 2021)² − 10(x + 2021) + 21, unde x este număr real.\na) Arată că x² − 10x + 21 = (x − 3)(x − 7), pentru orice număr real x.\nb) Demonstrează că E(−2018) · E(−2019) · E(−2020) · E(−2021) = 0.",
      rubric: [
        { label: "a)", points: 2, answer: "x² − 10x + 21 = x² − 3x − 7x + 21 = x(x − 3) − 7(x − 3) = (x − 3)(x − 7), pentru orice număr real x." },
        { label: "b)", points: 3, answer: "E(x) = (x + 2021)² − 10(x + 2021) + 25 − 4 = (x + 2021 − 5)² − 2² = (x + 2016)² − 2² = (x + 2014)(x + 2018), pentru orice număr real x. Atunci E(−2018) = (−2018 + 2014)(−2018 + 2018) = (−4)·0 = 0, deci E(−2018) · E(−2019) · E(−2020) · E(−2021) = 0." },
      ] },
    { section: "Subiectul al III-lea", label: "3", type: "OPEN", points: 5, autoGradable: false, topic: "Funcții. Distanță între puncte",
      hasFigure: true, figureUrl: FIG("s3-3"),
      figureNote: "Sistemul de axe ortogonale xOy cu reprezentarea grafică a unei drepte descrescătoare (graficul funcției f).",
      content: "Se consideră funcția f : ℝ → ℝ, f(x) = −2x + 8.\na) Determină numărul real a, știind că punctul A(a, 2a) aparține graficului funcției f.\nb) În sistemul de axe ortogonale xOy se consideră punctul A(2, 4), iar B este punctul de intersecție al graficului funcției f cu axa Oy. Determină lungimea segmentului AB.",
      rubric: [
        { label: "a)", points: 2, answer: "A(a, 2a) ∈ G_f ⇔ f(a) = 2a, adică −2a + 8 = 2a, de unde 4a = 8, deci a = 2." },
        { label: "b)", points: 3, answer: "B(0, 8) este punctul de intersecție al graficului funcției f cu axa Oy. AB = √((x_B − x_A)² + (y_B − y_A)²) = √((0 − 2)² + (8 − 4)²) = √(4 + 16) = √20 = 2√5." },
      ] },
    { section: "Subiectul al III-lea", label: "4", type: "OPEN", points: 5, autoGradable: false, topic: "Asemănare. Teorema fundamentală",
      hasFigure: true, figureUrl: FIG("s3-4"),
      figureNote: "Triunghiul ABC (A sus, B jos-stânga, C jos-dreapta) cu M pe AB, N pe AC astfel încât MN ∥ BC, și P pe BC cu NP ∥ AB.",
      content: "În figura alăturată este reprezentat triunghiul ABC. Pe latura AB a triunghiului se consideră punctul M și se construiește paralela MN la dreapta BC, cu N ∈ AC. Paralela prin N la dreapta AB intersectează pe BC în punctul P.\na) Arată că MN · AC = BC · AN.\nb) Demonstrează că BP/BC + BM/AB = 1.",
      rubric: [
        { label: "a)", points: 2, answer: "În triunghiul ABC, MN ∥ BC, deci ΔAMN ~ ΔABC; din asemănare MN/BC = AN/AC, de unde MN · AC = BC · AN." },
        { label: "b)", points: 3, answer: "NP ∥ AB ⇒ BP/BC = AN/AC; MN ∥ BC ⇒ BM/AB = CN/AC. Atunci BP/BC + BM/AB = AN/AC + CN/AC = (AN + CN)/AC = AC/AC = 1." },
      ] },
    { section: "Subiectul al III-lea", label: "5", type: "OPEN", points: 5, autoGradable: false, topic: "Triunghi dreptunghic. Mediană. Arie",
      hasFigure: true, figureUrl: FIG("s3-5"),
      figureNote: "Triunghiul ABC dreptunghic în A (A sus, B jos-stânga, C jos-dreapta) cu M mijlocul ipotenuzei BC.",
      content: "Se consideră triunghiul ABC dreptunghic în A. Punctul M este mijlocul segmentului BC, măsura unghiului ACB este de 30° și AB = 6 cm.\na) Arată că perimetrul triunghiului ABM este egal cu 18 cm.\nb) Arată că aria triunghiului AMC este mai mică decât 16 cm².",
      rubric: [
        { label: "a)", points: 2, answer: "În triunghiul ABC dreptunghic în A cu ∢C = 30°, BC = 2·AB = 12 cm. Cum M este mijlocul ipotenuzei BC, AM = BM = BC/2 = 6 cm. Perimetrul ΔABM = AB + BM + AM = 6 + 6 + 6 = 18 cm." },
        { label: "b)", points: 3, answer: "AC² = BC² − AB² = 144 − 36 = 108, deci AC = 6√3 cm. AM fiind mediană, A(AMC) = A(ABC)/2 = (AB · AC/2)/2 = (6 · 6√3)/4 = 9√3 cm². Cum 9√3 = √243 < √256 = 16, aria triunghiului AMC este mai mică decât 16 cm²." },
      ] },
    { section: "Subiectul al III-lea", label: "6", type: "OPEN", points: 5, autoGradable: false, topic: "Prismă triunghiulară. Drepte perpendiculare",
      hasFigure: true, figureUrl: FIG("s3-6"), finalAnswer: "90",
      figureNote: "Prisma dreaptă ABCDEF cu baza inferioară ABC (triunghi echilateral) și baza superioară DEF; muchiile laterale AD, BE, CF verticale.",
      content: "În figura alăturată este reprezentată prisma dreaptă ABCDEF, cu baza triunghiul echilateral ABC, iar AB = 12 cm și AD = 18 cm.\na) Arată că aria totală a prismei este mai mare decât 720 cm².\nb) Se consideră punctul A′ din planul (BCD) astfel încât AA′ = 9 cm. Determină măsura unghiului dintre dreptele AA′ și EF.",
      rubric: [
        { label: "a)", points: 2, answer: "Aria laterală = P_ABC · AD = 36 · 18 = 648 cm²; aria totală A_t = A_l + 2·A_bază = 648 + 2·(12²√3)/4 = 648 + 72√3 = 72(9 + √3) cm². Cum 9 + √3 > 10 (deoarece √3 > 1), rezultă 72(9 + √3) > 720, deci aria totală a prismei ABCDEF este mai mare decât 720 cm²." },
        { label: "b)", points: 3, answer: "Fie M mijlocul lui BC. AM ⊥ BC și, cum DA ⊥ (ABC), DM ⊥ BC, deci BC ⊥ (ADM). Construim AQ ⊥ DM (Q ∈ DM); cum AQ ⊥ BC, rezultă AQ ⊥ (DBC), deci d(A, (BCD)) = AQ. În triunghiul dreptunghic ADM, AQ = (AD · AM)/DM = (18 · 6√3)/(12√3) = 9 cm, deci AA′ = AQ = d(A, (BCD)) și A′ = Q. Cum EF ∥ BC și BC ⊥ (ADM), avem EF ⊥ (ADM), de unde ∢(AA′, EF) = 90°." },
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
  console.log(`\n=== import-exam-mate-2021-test-14 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
