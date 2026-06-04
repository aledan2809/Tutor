#!/usr/bin/env node
/**
 * import-exam-ro-2025-simulare.mjs — Exam-Bank · Limba și literatura română
 *
 * EN VIII 2025 Simulare (anul școlar 2024–2025). Subiect + barem oficiale
 * (Ministerul Educației și Cercetării / CNPEE — documente publice, edu.ro).
 * Texte transcrise verbatim din PDF; cheile/rubricile = ground-truth din BAREM
 * (zero generare, zero mesh gate). Fără figuri.
 *
 * Structură: Subiectul I — A (lectură, 38p, 9 itemi) + B (limbă, 32p, 8 itemi) +
 *   Subiectul al II-lea (compunere 20p). 90p + 10 oficiu = 100.
 *
 * Idempotent: upsert paper pe (examType, year, subjectKey, variant) → delete
 *   items/passages → recreate. Re-rulare = aceleași counturi.
 *
 * Modes: --validate (in-memory only) · --dry (connect DB, no writes) · (no flag) apply.
 * DB target: DATABASE_URL din env. Pe prod = VPS2 local PG (DBM). Niciodată Neon.
 */

const MODE = process.argv.includes("--validate")
  ? "validate"
  : process.argv.includes("--dry")
    ? "dry"
    : "apply";

const RO = {
  source: "EN VIII 2025 Simulare — Limba și literatura română (CNPEE)",
  examType: "EN_VIII",
  year: 2025,
  subjectKey: "limba_romana",
  subjectName: "Limba și literatura română",
  grade: 8,
  variant: "simulare",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)",
  passages: [
    {
      ref: "Textul 1",
      title: "Trezire",
      author: "Lucian Blaga",
      sourceNote:
        "*a mocni – a sta în așteptare, gata să izbucnească; *a urni – a (se) pune în mișcare, a porni; *vână – nervură, vas sangvin; pl. vine; *muncel – munte sau deal mic; *a podidi – a cuprinde cu putere, a umple, a năpădi; *ogor – teren arabil, câmp semănat.",
      orderIndex: 1,
      body:
        "Mocnește* copacul. Martie sună.\n" +
        "Albinele-n faguri adună\n" +
        "şi-amestecă învierea,\n" +
        "ceara şi mierea.\n\n" +
        "Nehotărât între două hotare,\n" +
        "cu vine* trimise subt șapte ogoare*,\n" +
        "în văzduhuri zmeu,\n" +
        "doarme alesul, copacul meu.\n\n" +
        "Copacul meu.\n" +
        "Vântul îl scutură, Martie sună.\n" +
        "Câte puteri sunt, se leagă-mpreună,\n" +
        "din greul ființei să mi-l urnească*,\n" +
        "din somn, din starea dumnezeiască.\n\n" +
        "Cine vântură de pe muncel*\n" +
        "atâta lumină peste el?\n\n" +
        "Ca lacrimi – mugurii l-au podidit*.\n" +
        "Soare, soare, de ce l-ai trezit?",
    },
    {
      ref: "Textul 2",
      title: "Rezistența prin apicultură",
      author: "Cristina Ștefan",
      sourceNote: "în www.dilemaveche.ro",
      orderIndex: 2,
      body:
        "Sfârșit de februarie. În curtea blocului au mai rămas câteva pete de zăpadă neagră, e un soare năucitor și la florăria din colț e plin de ghiocei, lalele și zambile mov. Albinele n-au apărut încă, însă eu merg să mă întâlnesc cu cineva care îmi poate povesti mai multe despre ele. Alexandru Frusina are 33 de ani și este a patra generație de apicultori. Prima din familie a fost, de fapt, străbunica lui, Voica, din județul Prahova. [...] Pe bunicul său, Alex l-a prins doar trei ani, dar îl ține minte în continuare.\n\n" +
        "Știe că în copilărie era mereu înconjurat de stupi și s-a obișnuit de mic cu albinele. Între timp, s-au mutat în Țăndărei, în județul Ialomița, iar tradiția a fost continuată de Florin, tatăl lui Alex. „Aici e o poveste care îmi place mult”, spune Alex zâmbind. „După moartea bunicului, mai aveam în curte doar trei stupi, pe care tata, care era inginer agronom, îi păstrase mai mult ca să continue moștenirea de familie, căci nu prea mai avea grijă de ei. La un moment dat, și-a dat seama că au murit toți și a vrut să renunțe la apicultură. Doar că, trei zile mai târziu, a văzut într-un copac din curte un roi mare de albine. A prins roiul și a luat asta ca pe un semn că trebuie, totuși, să continue.”\n\n" +
        "Acum, familia Frusina are aproximativ 150 de stupi, pe care îi mută în funcție de culturi. Fac miere de rapiță, floarea-soarelui și coriandru – preferata lui Alex, pentru că „este cea mai aromată, are gust de bomboană sau ursuleți Haribo” – și ar vrea să facă și de salcâm.\n\n" +
        "Alex nu s-a ocupat dintotdeauna de apicultură. A studiat agronomia, la fel ca tatăl său, însă nu i-a plăcut atât de mult și a ajuns să lucreze, în București, într-un magazin de echipamente foto. [...]. Între timp, tatăl său are grijă de albine, stând într-o rulotă, ca să fie mai aproape de stupi. Alex îmi povestește, entuziast, cum sunt mutați stupii, noaptea, și ce sistem sofisticat de comunicare au albinele: într-un loc nou, mai întâi ies cercetătoarele, puține la număr, care apoi transmit în ce direcție, la ce distanță și cât de multă hrană este în zonă. Îl întreb dacă tatăl său nu se consideră izolat vara, când trebuie să fie atent cel mai des la albine, dar Alex îmi răspunde că nu – îi place cu adevărat ce face și asta e suficient. Iar când i se alătură și el la stupină, spune că acolo se simte cel mai liber.\n\n" +
        "Se știe că albinele sunt esențiale în polenizarea culturilor agricole – cereale, legume, fructe. Și nu doar atât. În lipsa albinelor, recoltele sunt mai mici, și asta în condițiile unui an climatic foarte bun. Alex îmi spune că un studiu a arătat o creștere cu 10-15% a producției de rapiță doar datorită prezenței albinelor în zona respectivă. Însă albinele sunt sensibile. Bolile, schimbările bruște de temperatură, cauzate de încălzirea globală, dar și insecticidele folosite de agricultori le-ar putea dăuna albinelor. Alex confirmă – iarna aceasta le-au murit în jur de zece familii –, însă în privința legăturii cu agricultorii, nu sunt probleme – tatăl său, fiind inginer agronom, e în permanentă legătură cu aceștia și are grijă astfel de albinele sale. Nu toți agricultorii sunt însă la fel de atenți – de pildă, un articol din 2014 informează că „peste 400 de familii de albine aparținând unor apicultori din județul Botoșani au murit, după ce o societate agricolă a stropit culturile de muștar și rapiță cu substanțe chimice pentru combaterea dăunătorilor [...]”.\n\n" +
        "Producția de miere nu a fost foarte bună în ultimii ani. Totuși, conform datelor centralizate la nivel european, România este țara cu cea mai mare producție de miere din Uniunea Europeană, realizând, în 2015, 35.000 de tone de miere, comparativ cu doar 20.000 de tone în 2014.\n\n" +
        "În ciuda acestui fapt, consumul intern rămâne unul dintre cele mai scăzute la nivel european. Potrivit statisticilor, românii mănâncă de patru ori mai puțină miere decât italienii sau francezii. Unul dintre motive ar putea fi practica atât de comună a falsificării mierii, cu efecte negative asupra apicultorilor de bună-credință, care duce și la neîncrederea oamenilor în produsele aflate pe piață. [...]\n\n" +
        "În plus, adaugă el, mierea de foarte bună calitate produsă în România este exportată și amestecată cu alte tipuri de miere, ceea ce lui nu i se pare corect. „Noi vindem acum mierea printr-o asociație apicolă, însă aș vrea să încep să vând numai pe cont propriu. [...] Mierea se cristalizează foarte repede și, pentru a fi adusă înapoi la starea lichidă, trebuie încălzită la temperaturi de până la 40 de grade – peste 40, ea nu devine toxică, dar începe să își piardă din calități. Acest proces durează însă, iar unii producători nu au răbdare și încălzesc mierea la temperaturi mai înalte.” Așa că Alex se gândește acum la modalități de a vinde mierea produsă exclusiv pe cont propriu. Îmi spune că îi place să își facă planuri pe termen lung și nu înțelege de ce mulți tineri nu mai au această obișnuință.\n\n" +
        "Acasă, mă uit [...] la imagini cu Alex și tatăl său, cu rulota în care locuiește acesta, cu albine, faguri și stupi. Îmi atrage atenția o fotografie cu tatăl lui Alex, pe câmp, în costumul de protecție, privind asfințitul. Pare, într-adevăr, senin și liber.",
    },
  ],
  items: [
    // ── A. Lectură (38p) ──
    {
      section: "I.A", label: "A.1", type: "FILL", points: 2, autoGradable: false,
      passageRef: "Textul 2",
      content:
        "Completează spațiile punctate cu informațiile din textul 2: „Cristina Ștefan se întâlnește cu apicultorul ___ (prenume și nume) la sfârșitul lunii ___.”",
      correctAnswer: "Alexandru Frusina (Alex Frusina); februarie",
      rubric: [
        { label: "completare", points: 2, answer: "Alexandru Frusina / Alex Frusina; februarie (2×1p). Se acceptă și notarea inversă nume + prenume. Nu se punctează răspunsul incomplet (doar numele sau doar prenumele)." },
      ],
    },
    {
      section: "I.A", label: "A.2", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. Străbunica Voica era din",
      options: [{ key: "a", text: "Botoșani." }, { key: "b", text: "București." }, { key: "c", text: "Ialomița." }, { key: "d", text: "Prahova." }],
      correctAnswer: "d",
    },
    {
      section: "I.A", label: "A.3", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. Tânărul apicultor își dorește să obțină miere și din",
      options: [{ key: "a", text: "coriandru." }, { key: "b", text: "floarea-soarelui." }, { key: "c", text: "rapiță." }, { key: "d", text: "salcâm." }],
      correctAnswer: "d",
    },
    {
      section: "I.A", label: "A.4", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 1",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 1. Primăvara, copacul este trezit din somn de",
      options: [{ key: "a", text: "lacrimi." }, { key: "b", text: "ploaie." }, { key: "c", text: "soare." }, { key: "d", text: "zmeu." }],
      correctAnswer: "c",
    },
    {
      section: "I.A", label: "A.5", type: "TF_GRID", points: 6, autoGradable: true,
      passageRef: "Textul 1, Textul 2",
      content: "Notează „X” în dreptul fiecărui enunț pentru a marca dacă acesta este adevărat sau fals, bazându-te pe informațiile din cele două texte.",
      rubric: [
        { label: "Textul 1 — În poezie este prezentat un peisaj de primăvară.", points: 1, answer: "Adevărat" },
        { label: "Textul 1 — În jurul unui copac înflorit se rotesc fluturi.", points: 1, answer: "Fals" },
        { label: "Textul 1 — În văzduh se înalță un zmeu de hârtie.", points: 1, answer: "Fals" },
        { label: "Textul 2 — La nivel european, în 2015, țara noastră a ocupat primul loc la producția de miere.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Francezii consumă de patru ori mai multă miere decât românii.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Încălzită la peste 40 de grade, mierea devine toxică.", points: 1, answer: "Fals" },
      ],
      correctAnswer: "Textul 1: A, F, F | Textul 2: A, A, F",
    },
    {
      section: "I.A", label: "A.6", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Precizează felul rimei din prima strofă și măsura primelor două versuri din textul blagian.",
      rubric: [
        { label: "felul rimei", points: 2, answer: "Rimă împerecheată." },
        { label: "măsura versurilor", points: 4, answer: "Câte 2p pentru fiecare vers: 11 silabe (versul 1) și 9 silabe (versul 2)." },
      ],
    },
    {
      section: "I.A", label: "A.7", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1, Textul 2",
      content: "Prezintă, în minimum 30 de cuvinte, un element de conținut comun celor două texte, valorificând câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea unui element de conținut comun (ex.: natura, albina, mierea, copacul) + 2×1p prezentarea elementului din fiecare text (secvență relevantă) + 1p norme + 1p numărul minim de cuvinte." }],
    },
    {
      section: "I.A", label: "A.8", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 2",
      content: "Crezi că, odată ce ai făcut o alegere, este bine să îți păstrezi opțiunea, indiferent de situație? Motivează-ți răspunsul, în 50 – 100 de cuvinte, valorificând textul 2.",
      rubric: [{ label: "barem", points: 6, answer: "1p menționarea răspunsului + 1p motivarea răspunsului + 2p valorificarea textului 2 + 1p norme + 1p încadrarea în numărul de cuvinte." }],
    },
    {
      section: "I.A", label: "A.9", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Asociază poezia „Trezire” de Lucian Blaga cu un alt text literar studiat la clasă sau citit ca lectură suplimentară, prezentând, în 50 – 100 de cuvinte, o valoare comună, prin referire la câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "1p numirea unei valori identificate în poezie (ex.: iubirea/respectul/prețuirea naturii; puterea de regenerare a naturii) + 1p titlul și autorul textului asociat + 2p prezentarea valorii comune (secvență din fiecare text) + 1p norme + 1p numărul de cuvinte." }],
    },
    // ── B. Limbă (32p) ──
    {
      section: "I.B", label: "B.1", type: "MCQ", points: 2, autoGradable: true,
      topic: "Accentuare",
      content: "Cuvintele subliniate în secvențele „culturile de muştar” și „era mereu înconjurat de stupi” sunt corect accentuate, în seria (vocala accentuată este marcată):",
      options: [
        { key: "a", text: "cúlturile; éra." },
        { key: "b", text: "cúlturile; erá." },
        { key: "c", text: "cultúrile; éra." },
        { key: "d", text: "cultúrile; erá." },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.2", type: "MCQ", points: 2, autoGradable: true,
      topic: "Mijloace de îmbogățire a vocabularului",
      content: "Cuvintele subliniate în versurile „Câte puteri sunt, se leagă-mpreună,/din greul (1) ființei (2) să mi-l urnească” s-au format prin:",
      options: [
        { key: "a", text: "derivare (1), derivare (2)." },
        { key: "b", text: "derivare (1), conversiune (2)." },
        { key: "c", text: "conversiune (1), derivare (2)." },
        { key: "d", text: "conversiune (1), conversiune (2)." },
      ],
      correctAnswer: "c",
    },
    {
      section: "I.B", label: "B.3", type: "MCQ", points: 2, autoGradable: true,
      topic: "Sinonime contextuale",
      content: "Seria care cuprinde sinonimele contextuale pentru cuvintele subliniate în secvențele: „Unul dintre motive ar putea fi practica atât de comună a falsificării mierii, cu efecte negative asupra apicultorilor de bună-credință” este:",
      options: [
        { key: "a", text: "frecventă, previziuni." },
        { key: "b", text: "modernă, consecințe." },
        { key: "c", text: "obișnuită, urmări." },
        { key: "d", text: "tradițională, cauze." },
      ],
      correctAnswer: "c",
    },
    {
      section: "I.B", label: "B.4", type: "MCQ", points: 2, autoGradable: true,
      topic: "Substantivul articulat hotărât",
      content: "În secvența „e plin de ghiocei, lalele şi zambile mov. Albinele n-au apărut încă, însă eu merg să mă întâlnesc cu cineva” există:",
      options: [
        { key: "a", text: "un substantiv articulat hotărât." },
        { key: "b", text: "două substantive articulate hotărât." },
        { key: "c", text: "trei substantive articulate hotărât." },
        { key: "d", text: "patru substantive articulate hotărât." },
      ],
      correctAnswer: "a",
    },
    {
      section: "I.B", label: "B.5", type: "OPEN", points: 6, autoGradable: false,
      content: "Selectează, din fragmentul următor, trei pronume de feluri diferite, pe care le vei preciza: „Îl întreb dacă tatăl său nu se consideră izolat vara, când trebuie să fie atent cel mai des la albine, dar Alex îmi răspunde că nu – îi place cu adevărat ce face şi asta e suficient”.",
      rubric: [{ label: "barem", points: 6, answer: "3×1p selectarea oricăror trei pronume de feluri diferite + 3×1p menționarea felului (ex.: „Îl” – pronume personal; „ce” – pronume relativ; „asta” – pronume demonstrativ de apropiere). În cazul a două pronume de același fel, se punctează unul singur." }],
    },
    {
      section: "I.B", label: "B.6", type: "OPEN", points: 6, autoGradable: false,
      content: "Alcătuiește un enunț interogativ, în care substantivul „floarea-soarelui” să fie în cazul genitiv (1) și un enunț asertiv, în care verbul „a apărea” să fie la modul condițional-optativ, timpul prezent (2).",
      rubric: [{ label: "barem", points: 6, answer: "2×1p alcătuirea fiecărui tip de enunț + 1p respectarea cazului genitiv + 1p respectarea modului și timpului (condițional-optativ prezent) + 2×1p norme. Ex.: (1) Când începe recoltarea florii-soarelui?; (2) M-aș bucura dacă ar apărea volumul tău." }],
    },
    {
      section: "I.B", label: "B.7", type: "OPEN", points: 6, autoGradable: false,
      content: "Completează cu o singură propoziție enunțul următor, precizând tipul raportului sintactic din fraza obținută: „Alex nu s-a ocupat dintotdeauna de apicultură”.",
      rubric: [{ label: "barem", points: 6, answer: "3p completarea enunțului cu o propoziție + 2p precizarea tipului de raport sintactic (coordonare/subordonare) + 1p norme. Nu se acordă punctajul dacă fraza are trei sau mai multe propoziții. Ex.: „Alex nu s-a ocupat dintotdeauna de apicultură, dar și-a dorit asta.” – raport de coordonare." }],
    },
    {
      section: "I.B", label: "B.8", type: "FILL", points: 6, autoGradable: false,
      content: "Scrie, pe spațiile punctate, forma corectă a cuvintelor subliniate în următorul enunț, reprezentând mesajul unui apicultor: „— Omule, dacă ții / ți (1) la / l-a (2) bunăstarea / bună starea (3) familiei tale, ia-ți / i-ați (4) copii / copiii (5) și mergeți să îngrijiți albinele ale / ai (6) căror stupi au fost stricați de ploaie!”",
      correctAnswer: "ții, la, bunăstarea, ia-ți, copiii, ai",
      rubric: [{ label: "barem", points: 6, answer: "6×1p: ții, la, bunăstarea, ia-ți, copiii, ai." }],
    },
    // ── SUBIECTUL al II-lea (20p) ──
    {
      section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 20, autoGradable: false,
      passageRef: "Textul 1",
      content:
        "Scrie un text de minimum 150 de cuvinte, în care să prezinți mesajul poeziei/o semnificație a poeziei „Trezire” de Lucian Blaga. În redactarea textului: vei preciza mesajul textului/o semnificație a textului, prin referire la temă; vei prezenta două elemente componente ale peisajului; vei interpreta două figuri de stil diferite, relevante pentru mesaj/semnificație; vei menționa o emoție exprimată/un sentiment exprimat în textul poetic, justificându-ți alegerea. Compunerea nu va fi precedată de titlu sau de motto.",
      rubric: [
        { label: "Conținut", points: 12, answer: "1p mesajul/o semnificație + 1p tema + 2×2p prezentarea a două elemente componente ale peisajului + 2×2p interpretarea a două figuri de stil diferite + 2p menționarea unei emoții/unui sentiment cu justificarea alegerii." },
        { label: "Redactare", points: 8, answer: "Paragrafe 1p, coerență 1p, proprietatea termenilor 1p, corectitudine gramaticală 1p, claritate 1p, ortografie 1p, punctuație 1p, lizibilitate 1p. Doar dacă are minimum 150 de cuvinte și dezvoltă subiectul." },
      ],
    },
  ],
};

const PAPERS = [RO];

// ─────────────────────────────────────────────────────────────────────────────
// Validation (no DB)
// ─────────────────────────────────────────────────────────────────────────────
function validate() {
  const errors = [];
  for (const p of PAPERS) {
    const tag = `${p.subjectKey}`;
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
      if (Array.isArray(it.rubric) && it.rubric.length && it.rubric.every((r) => typeof r.points === "number")) {
        const rsum = it.rubric.reduce((a, r) => a + r.points, 0);
        if (rsum !== it.points)
          errors.push(`[${tag}] item ${it.label} rubric points ${rsum} != item points ${it.points}`);
      }
      sum += it.points;
    }
    if (sum !== expectedItemPoints)
      errors.push(`[${tag}] item points sum ${sum} != maxScore-officeBonus ${expectedItemPoints}`);
    const passRefs = new Set((p.passages || []).map((x) => x.ref));
    for (const it of p.items) {
      if (it.passageRef) {
        for (const r of String(it.passageRef).split(",").map((s) => s.trim())) {
          if (!passRefs.has(r))
            errors.push(`[${tag}] item ${it.label} passageRef '${r}' not found among passages`);
        }
      }
    }
    const autoCount = p.items.filter((i) => i.autoGradable).length;
    console.log(
      `  ${tag.padEnd(14)} items=${p.items.length} passages=${p.passages.length} ` +
        `pts=${sum}(+${p.officeBonus} oficiu=${sum + p.officeBonus}) autoGradable=${autoCount}`
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
// DB write (apply) / dry
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
        `  ${p.subjectKey.padEnd(14)} ${action} paper → items=${p.items.length} passages=${p.passages.length}` +
          (existing ? ` (replacing items=${existing._count.items} passages=${existing._count.passages})` : "")
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
          autoGradable: !!it.autoGradable, topic: it.topic ?? null,
        })),
      });
    }
    const [papers, items, passages] = await Promise.all([
      prisma.examPaper.count(), prisma.examItem.count(), prisma.examPassage.count(),
    ]);
    console.log(`\n${dry ? "🔎 DRY — no writes." : "✅ APPLIED."} DB totals: ExamPaper=${papers} ExamItem=${items} ExamPassage=${passages}`);
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  console.log(`\n=== import-exam-ro-2025-simulare (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
