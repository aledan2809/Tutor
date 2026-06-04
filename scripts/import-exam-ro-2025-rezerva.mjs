#!/usr/bin/env node
/**
 * import-exam-ro-2025-rezerva.mjs — Exam-Bank · Limba și literatura română
 *
 * EN VIII 2025 Rezervă (23 iunie 2025; anul școlar 2024–2025). Subiect + barem oficiale
 * (Ministerul Educației și Cercetării / CNPEE — publice). Texte verbatim; chei ground-truth.
 *
 * Subiectul al II-lea = rezumat (80-120 cuvinte) — rubrică proprie.
 * Idempotent · Modes: --validate / --dry / (apply). DB: DATABASE_URL din env (VPS2 local PG).
 */

const MODE = process.argv.includes("--validate")
  ? "validate"
  : process.argv.includes("--dry")
    ? "dry"
    : "apply";

const RO = {
  source: "EN VIII 2025 Rezervă (23 iunie 2025) — Limba și literatura română (CNPEE)",
  examType: "EN_VIII",
  year: 2025,
  subjectKey: "limba_romana",
  subjectName: "Limba și literatura română",
  grade: 8,
  variant: "rezerva",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)",
  passages: [
    {
      ref: "Textul 1",
      title: "O vară cu Isidor",
      author: "Veronica D. Niculescu",
      sourceNote: "Fragment.",
      orderIndex: 1,
      body:
        "Au înflorit magnoliile albe de sub ferestre. Deși stăm la etajul șapte, le văd foarte bine. Sunt doi copaci. Mama spune că unul este mai tânăr și altul mai bătrân. De aceea nu înfloresc chiar deodată, nici chiar la fel de mult. [...] Oricum, toată povestea asta nu durează decât trei, patru zile, așa că stau cu coatele proptite pe pervaz și mă uit. Fac fotografii cu telefonul. Am treisprezece ani și, din câte mi-am dat seama până acum, sunt pasionată de fotografii și de plante.\n" +
        "Anul trecut, tata mi-a cumpărat un aparat de fotografiat Fuji, cu care pot mări și de zece ori o petală de magnolie – adică să mă apropii de ea mai mult decât dacă aș locui la etajul trei. Cu toate astea, acum fac poze cu telefonul. Mă cam feresc de tata, el spune că fotografiile făcute cu telefonul nu-s fotografii. [...]\n" +
        "Și deodată îmi dă prin minte că, de fapt, copacul cu florile trecute nu e neapărat cel mai bătrân dintre cei doi. Poate că, dimpotrivă, copacul tânăr înflorește mai repede. Dar mama trebuie să știe când au fost plantate magnoliile. Numai că să pun întrebarea ar însemna să las pervazul, să las fotografiile, să ies din camera mea. Și asta nu vreau. Mi-e bine aici. [...]\n" +
        "Cred că trebuie să fie îngrozitor să locuiești mai jos de etajul patru. Să nu vezi apusul, păsările, lumina diferită din fiecare seară. Da, dar cine știe cum se văd de acolo magnoliile...\n" +
        "Însă, indiferent la ce etaj locuiești, bănuiesc că la fel te strigă mama la masă la șapte, când încep știrile.\n" +
        "— Serena!\n" +
        "Și dacă nu răspunzi din prima, poți să fii sigură că a doua oară te strigă de două ori.\n" +
        "— Serena! Hai odată, Serena!\n" +
        "Așa că închizi fereastra, pui telefonul pe birou.\n" +
        "— Și spală-te pe mâini înainte să vii!\n" +
        "Iar tu sigur că te duci la baie să te speli pe mâini, fiindcă:\n" +
        "— Pe tastatura computerului și pe telefon sunt cele mai multe bacterii din toată casa. [...]\n" +
        "Așadar, mă supun. Mama, tata și eu. Stăm cu toții la masa din sufragerie și luăm cina, în timp ce ne uităm la știri. Eu, de fapt, nu prea mă uit. [...] Dar iată că astăzi știrea cu animalele se dă mai devreme. Nu mai e furată de pe internet. E de la noi. Pare și proaspătă. E singura știre la care tăcem cu toții. Tata a rămas cu o ceapă verde în mână. Mama se joacă în farfurie cu un cuțitaș de brânză. Ascultăm reportajul despre singurul cimpanzeu de la grădina zoologică din Băneasa. Vedem imagini. Oftăm. Zâmbim. Iarăși oftăm. Știu bine locul ăsta, mergem acolo de două, trei ori pe an. În treisprezece ani de viață, asta înseamnă ceva. Și știu animalul despre care se vorbește la televizor. Un cimpanzeu cu barba albă. Habar n-am avut că îl chema Thor. [...] Pe condor nu l-au arătat. Dar eu îl știu foarte bine. E o pasăre mută. Stă pe-un munte în miniatură, construit din bolovani, și se joacă cu un băț. Mută și eu, mă retrag în camera mea, de unde n-o să mai ies toată seara. Mama și tata au hotărât, zâmbind visători, în timp ce strângeau farfuriile, că duminică mergem la zoo. [...] Descarc fotografiile. Sting calculatorul. Îmi fac patul, încerc să citesc dintr-o carte. Dar rămân cu privirea pierdută între rânduri. [...]\n" +
        "Cum de n-am știut că pe cimpanzeu îl cheamă Thor? În camera mea, proptită în perne, cu muzică în căștile albe, întrebările curg. Și oare toate animalele de la zoo au nume? Are și condorul un nume? Ce înseamnă „cel mai bătrân”? [...] A plouat toată noaptea. Am auzit stropii și-n somn, răpăind pe pervaz. Apa șiroind în burlanele din curtea interioară. Dar iată că dimineața e soare.\n" +
        "Mergem la zoo. Mi-am pus blugii preferați, un tricou, jacheta de piele și bascheții verzi. Îi aștept la ușă, îmbrăcată, încălțată.\n" +
        "— Aparatul foto nu-l iei?\n" +
        "Normal că l-am luat.\n" +
        "Am și făcut câteva fotografii pe fereastră. Magnoliile sunt deja cafenii în copacul pe care-l bănuiesc mai bătrân.\n" +
        "Ajungem la grădina zoologică cu autobuzul luat de la Piața Romană, ca de obicei. [...]\n" +
        "E soare, dar o adiere încă rece scutură florile albe din copaci. Petalele o iau în stoluri în sus, surprinse de pala de vânt, apoi coboară și se alătură suratelor lor de pe alei, de pe gardurile vii, de pe bănci. Uneori nici nu simți vreo adiere, dar petalele continuă să se desprindă și să cadă. De parcă ar exista adieri pe care le simt doar florile, nu și oamenii.",
    },
    {
      ref: "Textul 2",
      title: "Pui de vulpe",
      author: "Otilia Cazimir",
      sourceNote: "În vol. „Amintiri despre G. Topîrceanu”. (*prepelicar – câine de vânătoare; *sticleți – mică pasăre cântătoare)",
      orderIndex: 2,
      body:
        "— Bagă de seamă, mi-a spus George Topîrceanu. E pui de lup! [...]\n" +
        "Ca totdeauna, mama s-a uitat cam lung: atâta ne mai lipsea! Găzduiam într-o colivie două gaițe și-l țineam și pe Black, cel mai bleg și mai mâncăcios dintre prepelicari* și, pe deasupra, mare haimana... Dar, ca totdeauna, mama n-a zis nimic. A zâmbit, închipuindu-și cum o să umblăm prin vecini, căutând lupul când o va lua razna... [...]\n" +
        "După ce l-am așezat în cușca lui improvizată, pe fân moale, puiul de lup s-a mai liniștit. George Topîrceanu a plecat acasă, mort de oboseală: îi dăduse de lucru dihania. Peste noapte, „lupul” a început să latre la lună. Țăcănea grăbit, apoi se tânguia subțirel, prelung și jalnic.\n" +
        "— Mi se pare mie că lupul vostru e vulpe toată ziua! a râs de noi tata, a doua zi.\n" +
        "Peste vreo săptămână, l-am găsit dimineața cu ghearele tocite și însângerate. Încercase să rupă plasa de sârmă. George Topîrceanu mi-a cerut repede tinctură de iod, vată și pansament. Și, curios, sălbăticiunea a stat liniștită până i-a bandajat toate patru labele betege.\n" +
        "— Vezi dacă n-ai fost cuminte? îl certa George Topîrceanu. Uite, acum parcă ești motanul încălțat! [...]\n" +
        "Se apropia vremea când trebuia să plecăm, ca în fiecare vară, la mănăstire. Da, dar ce facem cu puiul de vulpe?... [...] Atunci, George Topîrceanu a hotărât:\n" +
        "— Îl luăm cu noi!\n" +
        "Și l-am luat, într-o colivie pentru sticleți*, în care ar fi încăput numai bine fără coadă. În tren a fost cuminte. [...]\n" +
        "De a doua zi, puiul de vulpe a fost una dintre atracțiile Mănăstirii Neamțului. Mergea cu noi la plimbare, cu zgardă și curelușă, ca un cățel. Părea așa de mic și de umilit sub poala pădurii înalte de brad! Numai coada mai era de el. Toată lumea îl mângâia – de la distanță – și-i aducea pachețele de oase. [...]\n" +
        "După ce ne-am întors la Iași, vulpoiul a început a slăbi văzând cu ochii. Creștea prea repede, tăișul rău i se aprindea tot mai des în ochi și începea să răspândească miros pătrunzător de sălbăticiune. [...]\n" +
        "Ne-am hotărât să-l ducem la pădure, sus, pe dealul lui Păun. În trăsură, puiul stătea liniștit, cu botul pe genunchii mei și cu ochii închiși.\n" +
        "— Eu cred că înțelege, zicea George Topîrceanu. Și poate că-i pare rău... mai știi?\n" +
        "Ne-am coborât din trăsură în marginea pădurii, acolo unde drumul o ia în sus, spre Chetrărie. Am ales locul anume: erau pe-acolo câteva case, cu câteva cotețe... Puiul mergea între noi ca un cățelandru cuminte, fără să întindă curelușa. I-am simțit bătăile grăbite ale inimii. Apoi, încet, i-am desfăcut zgărduța... A scuturat din cap cu neîncredere, apoi s-a depărtat puțin. [...] Cu botul în vânt adulmeca aerul umed. Parcă încerca să-și aducă aminte de ceva de demult... Și fără veste a pornit-o drept înainte, cu coada roșie întinsă orizontal în urma lui. S-a dus.",
    },
  ],
  items: [
    // ── A. Lectură (38p) ──
    {
      section: "I.A", label: "A.1", type: "SHORT", points: 2, autoGradable: false,
      passageRef: "Textul 1",
      content: "Notează, din textul 1, doi termeni din câmpul lexical al vestimentației.",
      correctAnswer: "Doi termeni dintre: blugi, tricou, jachetă, bascheți.",
      rubric: [{ label: "barem", points: 2, answer: "2×1p pentru oricare doi termeni din câmpul lexical al vestimentației (ex.: jachetă, tricou, blugi, bascheți)." }],
    },
    {
      section: "I.A", label: "A.2", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 1",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 1. Familia Serenei locuiește într-un bloc, la etajul",
      options: [{ key: "a", text: "doi." }, { key: "b", text: "trei." }, { key: "c", text: "patru." }, { key: "d", text: "șapte." }],
      correctAnswer: "d",
    },
    {
      section: "I.A", label: "A.3", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 1",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 1. Thor este numele",
      options: [
        { key: "a", text: "unei stații de autobuz." },
        { key: "b", text: "unui cimpanzeu de la zoo." },
        { key: "c", text: "unui condor de la Băneasa." },
        { key: "d", text: "unei mărci de aparat foto." },
      ],
      correctAnswer: "b",
    },
    {
      section: "I.A", label: "A.4", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. Puiul își rănește labele",
      options: [
        { key: "a", text: "în propria zgardă." },
        { key: "b", text: "într-un geam spart." },
        { key: "c", text: "într-o creangă de brad." },
        { key: "d", text: "într-o plasă de sârmă." },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.A", label: "A.5", type: "TF_GRID", points: 6, autoGradable: true,
      passageRef: "Textul 1, Textul 2",
      content: "Notează „X” în dreptul fiecărui enunț pentru a marca dacă acesta este adevărat sau fals, bazându-te pe informațiile din cele două texte.",
      rubric: [
        { label: "Textul 1 — Serena are treisprezece ani.", points: 1, answer: "Adevărat" },
        { label: "Textul 1 — Tatăl îi recomandă Serenei să facă poze cu telefonul.", points: 1, answer: "Fals" },
        { label: "Textul 1 — În dimineața în care familia merge la Băneasa, plouă torențial.", points: 1, answer: "Fals" },
        { label: "Textul 2 — Black este un motan.", points: 1, answer: "Fals" },
        { label: "Textul 2 — În călătoria spre Mănăstirea Neamțului, nu este luat niciun animal.", points: 1, answer: "Fals" },
        { label: "Textul 2 — Când crește, puiul de vulpe este lăsat liber la marginea pădurii.", points: 1, answer: "Adevărat" },
      ],
      correctAnswer: "Textul 1: A, F, F | Textul 2: F, F, A",
    },
    {
      section: "I.A", label: "A.6", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Transcrie, din secvența următoare, două figuri de stil, pe care le vei preciza: „E soare, dar o adiere încă rece scutură florile albe din copaci. Petalele o iau în stoluri în sus, surprinse de pala de vânt, apoi coboară și se alătură suratelor lor de pe alei, de pe gardurile vii, de pe bănci”.",
      rubric: [{ label: "barem", points: 6, answer: "2×1p transcrierea a două figuri de stil + 2×2p precizarea felului. Ex.: „Petalele o iau în stoluri în sus” – metaforă; „de pe alei, de pe gardurile vii, de pe bănci” – enumerație." }],
    },
    {
      section: "I.A", label: "A.7", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1, Textul 2",
      content: "Prezintă, în minimum 30 de cuvinte, un element de conținut comun celor două texte date, valorificând câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea unui element comun (ex.: prezența animalelor) + 2×1p prezentarea din fiecare text + 1p norme + 1p numărul minim de cuvinte." }],
    },
    {
      section: "I.A", label: "A.8", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 2",
      content: "Crezi că a avea un animal implică multă responsabilitate? Motivează-ți răspunsul, în 50-100 de cuvinte, valorificând textul 2.",
      rubric: [{ label: "barem", points: 6, answer: "1p menționarea răspunsului + 1p motivarea răspunsului + 2p valorificarea textului 2 + 1p norme + 1p încadrarea în numărul de cuvinte." }],
    },
    {
      section: "I.A", label: "A.9", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Asociază fragmentul din opera literară „O vară cu Isidor” de Veronica D. Niculescu cu un alt text literar studiat la clasă sau citit ca lectură suplimentară, prezentând, în 50-100 de cuvinte, o valoare comună, prin referire la câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "1p numirea unei valori (ex.: empatia, armonia în familie) + 1p titlul și autorul textului asociat + 2p prezentarea valorii comune (secvență din fiecare text) + 1p norme + 1p numărul de cuvinte." }],
    },
    // ── B. Limbă (32p) ──
    {
      section: "I.B", label: "B.1", type: "MCQ", points: 2, autoGradable: true,
      topic: "Diftong",
      content: "Conțin diftong ambele cuvinte din seria:",
      options: [
        { key: "a", text: "„atracțiile”, „tăișul”." },
        { key: "b", text: "„birou”, „construit”." },
        { key: "c", text: "„coada”, „mergea”." },
        { key: "d", text: "„numai”, „tânguia”." },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.2", type: "MCQ", points: 2, autoGradable: true,
      topic: "Sufixe diminutivale",
      content: "Seria care cuprinde doar cuvinte derivate cu sufix diminutival este:",
      options: [
        { key: "a", text: "„cățelandru”, „retrag”." },
        { key: "b", text: "„subțirel”, „cafenii”." },
        { key: "c", text: "„ghearele”, „sticleți”." },
        { key: "d", text: "„pachețele”, „curelușa”." },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.3", type: "MCQ", points: 2, autoGradable: true,
      topic: "Sensul cuvintelor în context",
      content: "Sensul secvenței subliniate în enunțul „Habar n-am avut că îl chema Thor” este:",
      options: [{ key: "a", text: "a nu îngriji." }, { key: "b", text: "a se mira." }, { key: "c", text: "a nu ști." }, { key: "d", text: "a poseda." }],
      correctAnswer: "c",
    },
    {
      section: "I.B", label: "B.4", type: "MCQ", points: 2, autoGradable: true,
      topic: "Omonime",
      content: "Sunt omonime ambele cuvinte subliniate din seria:",
      options: [
        { key: "a", text: "„sălbăticiunea a stat liniștită până i-a bandajat toate patru labele.”; „În tren a fost cuminte”." },
        { key: "b", text: "„se apropia vremea când trebuia să plecăm”; Era supărat că nu putea să vină la serbare." },
        { key: "c", text: "„tăișul rău i se aprindea tot mai des în ochi”; Aragazul cel vechi se aprindea foarte greu." },
        { key: "d", text: "„trebuia să plecăm, ca în fiecare vară, la mănăstire”; Ana este vară primară cu Andrei." },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.5", type: "OPEN", points: 6, autoGradable: false,
      content: "Selectează, din secvența următoare, trei verbe la timpuri diferite ale modului indicativ, pe care le vei preciza: „Uite, acum parcă ești motanul încălțat! [...] Se apropia vremea când trebuia să plecăm, ca în fiecare vară, la mănăstire. Da, dar ce facem cu puiul de vulpe?... [...] Atunci, George Topîrceanu a hotărât.”.",
      rubric: [{ label: "barem", points: 6, answer: "3×1p selectarea a trei verbe la modul indicativ + 3×1p precizarea timpului (diferit). Ex.: „ești” – prezent; „se apropia” – imperfect; „a hotărât” – perfect compus." }],
    },
    {
      section: "I.B", label: "B.6", type: "OPEN", points: 6, autoGradable: false,
      content: "Alcătuiește o propoziție afirmativă, în care pronumele personal „eu” să fie atribut (1), și o propoziție negativă, în care substantivul comun „motan” să fie complement direct (2).",
      rubric: [{ label: "barem", points: 6, answer: "2×1p alcătuirea fiecărui tip de propoziție + 2×1p respectarea funcției sintactice (atribut; complement direct) + 2×1p norme. Ex.: (1) Cartea de la mine îți va fi utilă mai târziu.; (2) N-am văzut motanul azi." }],
    },
    {
      section: "I.B", label: "B.7", type: "OPEN", points: 6, autoGradable: false,
      content: "Transcrie propozițiile subordonate din fraza următoare, precizând felul acestora: „Mama și tata au hotărât, zâmbind visători, în timp ce strângeau farfuriile, că duminică mergem la zoo.”",
      rubric: [{ label: "barem", points: 6, answer: "2×1p transcrierea fiecărei propoziții subordonate + 2×2p precizarea felului: „în timp ce strângeau farfuriile” – circumstanțială de timp; „că duminică mergem la zoo” – completivă directă." }],
    },
    {
      section: "I.B", label: "B.8", type: "FILL", points: 6, autoGradable: false,
      content: "Completează enunțurile următoare cu forma corectă a fiecărui cuvânt indicat în paranteză, reprezentând mesajul unui membru al echipei de voluntariat pentru protecția animalelor: „I-am spus ___ (Denisa, cazul dativ) că suntem ___ (mândru, masculin, plural) de acești noi ___ (membru) ai echipei. Proiectele ___ (creat) de către elevii ___ ___ (care, cazul genitiv) idei s-au dovedit utile sunt premiate.”",
      correctAnswer: "Denisei, mândri, membri, create, ale, căror",
      rubric: [{ label: "barem", points: 6, answer: "6×1p: Denisei, mândri, membri, create, ale, căror." }],
    },
    // ── SUBIECTUL al II-lea (20p) — rezumat ──
    {
      section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 20, autoGradable: false,
      passageRef: "Textul 1",
      content: "Scrie, în 80 – 120 de cuvinte, rezumatul textului 1. Rezumatul nu va fi precedat de titlu sau de motto.",
      rubric: [
        { label: "Conținut", points: 12, answer: "6p formularea ideilor importante, dovedind înțelegerea textului (menționarea personajelor) + 2p prezentarea evenimentelor în succesiune logică + 4p respectarea regulilor de alcătuire a unui rezumat (persoana a III-a + vorbire indirectă 1p; idei cu propriile cuvinte, fără citate 1p; verbe la moduri/timpuri adecvate 1p; ton neutru/obiectivitate 1p)." },
        { label: "Redactare", points: 8, answer: "Coerență 1p, proprietatea termenilor 1p, corectitudine gramaticală 1p, claritate 1p, ortografie 2p, punctuație 1p, lizibilitate 1p. Doar dacă rezumatul are minimum 80 de cuvinte și dezvoltă subiectul." },
      ],
    },
  ],
};

const PAPERS = [RO];

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

async function run(dry) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const p of PAPERS) {
      const existing = await prisma.examPaper.findUnique({
        where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } },
        include: { _count: { select: { items: true, passages: true } } },
      });
      const action = existing ? "UPDATE" : "CREATE";
      console.log(
        `  ${p.subjectKey.padEnd(14)} ${action} paper → items=${p.items.length} passages=${p.passages.length}` +
          (existing ? ` (replacing items=${existing._count.items} passages=${existing._count.passages})` : "")
      );
      if (dry) continue;

      const paper = await prisma.examPaper.upsert({
        where: { examType_year_subjectKey_variant: { examType: p.examType, year: p.year, subjectKey: p.subjectKey, variant: p.variant } },
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
          figureUrl: it.figureUrl ?? null,
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
  console.log(`\n=== import-exam-ro-2025-rezerva (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
