#!/usr/bin/env node
/**
 * import-exam-ro-2026-simulare.mjs — Exam-Bank · Limba și literatura română
 *
 * EN VIII 2026 Simulare națională (16 martie 2026, anul școlar 2025–2026).
 * Subiect + barem oficiale (Ministerul Educației și Cercetării / CNCE — publice).
 * Texte verbatim din PDF; cheile/rubricile = ground-truth din BAREM. Fără figuri.
 *
 * Structură: Subiectul I — A (lectură 38p, 9 itemi) + B (limbă 32p, 8 itemi) +
 *   Subiectul al II-lea (text argumentativ 20p). 90 + 10 oficiu = 100.
 *
 * Idempotent · Modes: --validate / --dry / (apply). DB: DATABASE_URL din env (VPS2 local PG).
 */

const MODE = process.argv.includes("--validate")
  ? "validate"
  : process.argv.includes("--dry")
    ? "dry"
    : "apply";

const RO = {
  source: "EN VIII 2026 Simulare națională (16 martie 2026) — Limba și literatura română (CNCE)",
  examType: "EN_VIII",
  year: 2026,
  subjectKey: "limba_romana",
  subjectName: "Limba și literatura română",
  grade: 8,
  variant: "simulare",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2026/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNCE)",
  passages: [
    {
      ref: "Textul 1",
      title: "De ce plânge mama?",
      author: "Ion D. Sîrbu",
      sourceNote: "Fragment. (*raniță – rucsac)",
      orderIndex: 1,
      body:
        "Baci-Vulcu se opri și se uită în ochii copiilor.\n" +
        "— Aici începe codrul meu, le zise. Asta-i cărarea, alta nu e. Semne turistice veți zări la fiecare sută de metri. Două dungi albe și una roșie la mijloc. O vedeți? Pe aici, dacă mergeți până se lasă umbra, ajungeți cu bine la stâna lui Lascu. Dar să nu pierdeți vremea pe drum. Călcați, fără grabă, cu spor însă. Că timp aveți destul. Vă e frică?\n" +
        "— Nu, răspunseră copiii, deși în ochii lor, pădurea asta fioroasă, imensă, părea să aprindă o luminiță de fior și spaimă.\n" +
        "— Dacă vă e frică, vă întoarceți. Stați la mine – și peste o zi-două, vă duc eu. Călare.\n" +
        "— Nu ne vom întoarce, declară Ligia și se încruntă așa cum o făcea de câte ori se apuca să-și rezolve problemele la matematică.\n" +
        "— Mâncare aveți destulă?\n" +
        "— Avem. Nici nu ne-am atins până acum de raniță*.\n" +
        "— Apăi, atunci plecați în pace. [...]\n" +
        "Cărarea se înfunda tot mai tare în codru. Din loc în loc, pe câte o stâncă de margine sau pe trunchiul vreunui brad, se puteau vedea semnele de marcaj. Mergeau bine, în pas voinicesc, uitându-se cu mirare în jur. Dundi o mai cotea din când în când la dreapta și la stânga, în mici recunoașteri. Dar de la o vreme – fie că s-a plictisit, fie că i se făcuse frică – nu se mai dezlipea de lângă stăpânii lui. Nu poți să spui: „Cât vedeai cu ochii era numai codru”, fiindcă nu prea vedeai departe. Brazi înalți străjuiau cărarea. Lumina plutea deasupra, spre vârfuri: pe jos era umbră, o umbră roșiatică, încremenită. Din loc în loc găseau trunchiuri răsturnate din rădăcini. [...]\n" +
        "— Să te întreb ceva: spune-mi, unde trăiesc șerpii boa?\n" +
        "— Șerpii boa? În Brazilia. Și în Africa, mi se pare. Pe aici, la noi, nu există.\n" +
        "— Sigur?\n" +
        "— Sigur.\n" +
        "— Dar tigri? [...]\n" +
        "— Ligia, aici nu există tigri. [...]\n" +
        "Poteca urcă puțin, apoi ieși la lumină. Se găseau într-o pajiște de toată frumusețea. Iarba era deasă și plină de flori de dumbravnic și mărgărite. În marginea luminișului se vedea o iesle. O cercetară. Era o iesle în care mai erau urme de fân. Alături găsiră un drob de sare. Se vede că fusese lins de niște animale.\n" +
        "— Mi-aduc aminte, zise Radu, unchiul Gavrilă mi-a povestit că paznicii de vânătoare au grijă de căprioare peste iarnă. Le pun fân și sare în iesle. Ca să le ajute când e iarna grea.\n" +
        "— Înseamnă, se bucură Ligia, că pe aici nu e pustietate. Umblă oameni.\n" +
        "— Desigur.\n\n" +
        "Porniră mai veseli. Parcă au scăpat de o greutate.\n" +
        "— Ligia, începu Radu, ce-ți place ție mai mult la mama?\n" +
        "— La mama? Să-ți spun: îmi [...] place când sunt bolnavă și mă roagă să iau medicamente. Sau când mă piaptănă dimineața... [...]\n" +
        "Erau obosiți. Le ardeau tălpile și Radu simțea acum că ranița lui a devenit mai grea. Nu-i nimic: încă o oră-două și ajung la stână. Trecură repede pe o porțiune unde se vede că a bântuit o furtună. Majoritatea brazilor erau răsturnați. Rădăcinile lor roșii-verzi arătau ca niște șerpi, iar gropile din care fuseseră smulse păreau vizuini sălbatice. Umbrele creșteau și parcă și viața tăcea în jur. Dundi se opri și lătră, li se părea că cineva a trecut în goană deasupra, pe coastă. Păsări mici, foarte colorate, apărură. Unele cântau. Zăriră o șopârlă, un erete. Apoi deodată se opriră în loc și inima începu să le bată tare, tare. Drumul trecea printr-o surpătură, în stânga nu se vedea nimic. În dreapta se așternea tăcut și nepătruns codrul. De aproape se auzea clar o talangă. Bătea rar, neregulat. Apoi, parcă, foșni ceva în desiș.\n" +
        "Se apropiară cu frică. Mai făcură doi pași, și încă doi.\n" +
        "Deodată izbucniră în râs. Deasupra lor, dintr-un tufiș, apăru capul mirat al unei capre. Cu barba, cu ochii ei de popă sever, se uita la copii ca la altă minune.\n" +
        "— Asta-i capra mătușii Sofia. Înseamnă că și ea trebuie să fie undeva pe aproape.\n" +
        "Urcară în fugă pe dâmb. Pădurea era roșie în partea asta și panta muntelui destul de lină. Iarba deasă foșnea în vântul ușor al serii, schimbând culori ca o mătase chinezească.\n" +
        "— Hai să strigăm!\n" +
        "Strigară. Ecoul se pierdu departe. Dar nu răspunse nimeni.\n" +
        "— Știi ce, propuse Radu. Uite, capra o ia spre casă. [...] Hai să ne luăm după ea!\n" +
        "Așa făcură.",
    },
    {
      ref: "Textul 2",
      title: "Eu și vulpea",
      author: "Vintilă Mihăilescu",
      sourceNote: "www.dilemaveche.ro",
      orderIndex: 2,
      body:
        "Plouase de curând, așa că pădurea era pustie. Din pământ se ridicau aburi subțiri, care se înfășurau în fâșii de ceață deasupra Văii Albe. A apărut brusc după un colț de stâncă. M-am uitat lung la ea. Nu puteam să cred că este o vulpe, așa că i-am examinat pe rând botul, blana și coada. Da, nu era niciun dubiu: avea coadă de vulpe! Așa că am întrebat-o: Ce faci, Vulpe? S-a uitat la mine, înclinând ușor capul, așa cum fac uneori câinii când vor să înțeleagă mai bine de ce i-ai strigat. Probabil că o fi priceput, căci ne-am privit în ochi minute în șir. Apoi a luat-o agale prin pădure și s-a oprit în fața unei mici scorburi. A început să sape, cu spatele la mine, dar, aruncându-mi din când în când câte o privire peste umăr, parcă mi-ar fi spus: Vezi ce fac? Văd, văd! – i-am răspuns și m-am așezat pe un trunchi de brad să o aștept. Brusc, la fel precum apăruse, a dispărut în scorbura de sub copac. I-am spus „la revedere” și m-am îndepărtat. [...] Cu fiecare picior ce călca pe o rădăcină, cu fiecare mână strângând un colț de stâncă, îmi revenea acel sentiment din copilărie că ating rețeaua nesfârșită de nervi a naturii, că aceasta tresare, mă recunoaște și mă acceptă din nou. Mă întorceam acasă, era evident! Mă simțeam un Mic Prinț răsturnat, ademenit de Vulpe în lumea copilăriei universale și eterne. Am coborât târziu în vale, promițându-mi că o să mă întorc în fiecare săptămână să mă întâlnesc cu vulpea. Au trecut însă luni de zile și nu am putut să plec din oraș. Am revenit de-abia ieri. Ploua din nou în averse. Am așteptat deci să se oprească și am pornit-o grăbit spre pădure. [...]. Eram obosit și nu aveam niciun chef să urc. Am rămas însă curând pironit locului, cu ochii ațintiți în penumbra pădurii: era acolo! Nici nu s-a uitat la mine. Ce faci, Vulpe? – am mai întrebat eu, de la depărtare. Nu a întors însă capul. De pe o potecă laterală coborau niște turiști. A, uite vulpea! – a constatat unul dintre ei și a scos niște biscuiți din buzunar. Psss, psss, psss... – a ademenit-o el ca pe o pisică. Eram revoltat. Dar vulpea s-a apropiat cu băgare de seamă și fără teamă. Era clar că era obișnuită de multă vreme cu turiștii, iar aceștia îi cunoșteau deja metehnele. Vulpea – „vulpea mea” – era, de fapt, îmblânzită de către turiști! Ei, te-ai văzut cu vulpea? – m-a întrebat soția mea la întoarcerea acasă. Nu – am răspuns eu cu privirea în gol – n-a mai venit. Poate altă dată...",
    },
  ],
  items: [
    // ── A. Lectură (38p) ──
    {
      section: "I.A", label: "A.1", type: "FILL", points: 2, autoGradable: false,
      passageRef: "Textul 1",
      content: "Completează spațiile punctate cu informațiile din textul 1: „Cei doi copii, Radu și ___, merg prin pădure către ___ lui Lascu.”",
      correctAnswer: "Ligia; stâna",
      rubric: [{ label: "completare", points: 2, answer: "Ligia; stâna (2×1p)." }],
    },
    {
      section: "I.A", label: "A.2", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 1",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 1. Dundi este numele",
      options: [{ key: "a", text: "unui câine." }, { key: "b", text: "unui copil." }, { key: "c", text: "unui șarpe." }, { key: "d", text: "unui tigru." }],
      correctAnswer: "a",
    },
    {
      section: "I.A", label: "A.3", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. În pădure, Vintilă Mihăilescu observă că",
      options: [
        { key: "a", text: "mulți arbori au căzut după furtuna puternică." },
        { key: "b", text: "nu funcționează rețeaua telefonică în pădure." },
        { key: "c", text: "nu mai plouase de mult timp în Valea Albă." },
        { key: "d", text: "unele sălbăticiuni nu se tem de oameni." },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.A", label: "A.4", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. Autorul simte că",
      options: [
        { key: "a", text: "e respins de pădure." },
        { key: "b", text: "natura îl înspăimântă." },
        { key: "c", text: "natura îl recunoaște." },
        { key: "d", text: "vrea să fie pădurar." },
      ],
      correctAnswer: "c",
    },
    {
      section: "I.A", label: "A.5", type: "TF_GRID", points: 6, autoGradable: true,
      passageRef: "Textul 1, Textul 2",
      content: "Notează „X” în dreptul fiecărui enunț pentru a marca dacă acesta este adevărat sau fals, bazându-te pe informațiile din cele două texte.",
      rubric: [
        { label: "Textul 1 — Apropiindu-se noaptea, Baci-Vulcu îi conduce pe copii prin pădure, până la destinație.", points: 1, answer: "Fals" },
        { label: "Textul 1 — Ieslea este folosită drept capcană pentru animale.", points: 1, answer: "Fals" },
        { label: "Textul 1 — Copiii trec printr-o zonă cu brazi răsturnați.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Autorul găsește în pădure un câine rătăcit.", points: 1, answer: "Fals" },
        { label: "Textul 2 — Turiștii hrănesc vulpea întâlnită în pădure.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Bărbatul îi confirmă soției că a întâlnit vulpea.", points: 1, answer: "Fals" },
      ],
      correctAnswer: "Textul 1: F, F, A | Textul 2: F, A, F",
    },
    {
      section: "I.A", label: "A.6", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Precizează, în minimum două enunțuri, o trăsătură a tiparului textual dialogat, identificată în textul 1, ilustrând-o cu o secvență relevantă.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea unei trăsături a tiparului dialogat (ex.: succesiune de replici) + 2p ilustrarea cu o secvență relevantă + 1p norme + 1p numărul minim de enunțuri." }],
    },
    {
      section: "I.A", label: "A.7", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1, Textul 2",
      content: "Prezintă, în minimum 30 de cuvinte, un element de conținut comun celor două texte, valorificând câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea unui element comun (ex.: copilăria, pădurea, animalele) + 2×1p prezentarea din fiecare text + 1p norme + 1p numărul minim de cuvinte." }],
    },
    {
      section: "I.A", label: "A.8", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Ce simt copiii când sunt singuri în pădure? Justifică-ți, în 50-100 de cuvinte, răspunsul la întrebarea dată, prin referire la o emoție, valorificând textul 1.",
      rubric: [{ label: "barem", points: 6, answer: "1p menționarea răspunsului + 1p justificarea prin referire la o emoție din text + 2p valorificarea textului 1 + 1p norme + 1p încadrarea în numărul de cuvinte." }],
    },
    {
      section: "I.A", label: "A.9", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Asociază fragmentul din opera „De ce plânge mama?” de Ion D. Sîrbu cu un alt text literar studiat la clasă sau citit ca lectură suplimentară, prezentând, în 50-100 de cuvinte, o valoare comună, prin referire la câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "1p numirea unei valori (ex.: curajul/perseverența) + 1p titlul și autorul textului asociat + 2p prezentarea valorii comune (secvență din fiecare text) + 1p norme + 1p numărul de cuvinte." }],
    },
    // ── B. Limbă (32p) ──
    {
      section: "I.B", label: "B.1", type: "MCQ", points: 2, autoGradable: true,
      topic: "Diftong",
      content: "Conțin diftong ambele cuvinte din seria:",
      options: [
        { key: "a", text: "„aceasta”, „făcea”." },
        { key: "b", text: "„copiilor”, „vizuini”." },
        { key: "c", text: "„roșiatică”, „unchiul”." },
        { key: "d", text: "„trecerea”, „ploua”." },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.2", type: "MCQ", points: 2, autoGradable: true,
      topic: "Mijloace de îmbogățire a vocabularului",
      content: "Cuvintele subliniate în fragmentul „Apoi, parcă, foșni ceva (1) în desiș (2)” s-au format prin:",
      options: [
        { key: "a", text: "derivare (1), derivare (2)." },
        { key: "b", text: "derivare (1), conversiune (2)." },
        { key: "c", text: "compunere (1), derivare (2)." },
        { key: "d", text: "compunere (1), conversiune (2)." },
      ],
      correctAnswer: "c",
    },
    {
      section: "I.B", label: "B.3", type: "MCQ", points: 2, autoGradable: true,
      topic: "Sensul cuvintelor în context",
      content: "Secvența subliniată în fragmentul „Dundi o mai cotea din când în când la dreapta și la stânga” are sensul de:",
      options: [{ key: "a", text: "câteodată." }, { key: "b", text: "nicăieri." }, { key: "c", text: "niciodată." }, { key: "d", text: "pretutindeni." }],
      correctAnswer: "a",
    },
    {
      section: "I.B", label: "B.4", type: "MCQ", points: 2, autoGradable: true,
      topic: "Substantivul articulat nehotărât",
      content: "În secvența „Trecură repede pe o porțiune unde se vede că a bântuit o furtună. Majoritatea brazilor erau răsturnați.” există:",
      options: [
        { key: "a", text: "un substantiv articulat nehotărât." },
        { key: "b", text: "două substantive articulate nehotărât." },
        { key: "c", text: "trei substantive articulate nehotărât." },
        { key: "d", text: "patru substantive articulate nehotărât." },
      ],
      correctAnswer: "b",
    },
    {
      section: "I.B", label: "B.5", type: "OPEN", points: 6, autoGradable: false,
      content: "Transcrie verbele din fragmentul următor, precizând modul acestora: „— Să te întreb ceva: spune-mi, unde trăiesc şerpii boa?”.",
      rubric: [{ label: "barem", points: 6, answer: "3×1p transcrierea corectă a celor trei verbe + 3×1p menționarea modului: „să întreb” – conjunctiv; „spune” – imperativ; „trăiesc” – indicativ." }],
    },
    {
      section: "I.B", label: "B.6", type: "OPEN", points: 6, autoGradable: false,
      content: "Alcătuiește un enunț asertiv în care substantivul „vulpe” să fie în cazul dativ (1) și un enunț interogativ în care pronumele personal „eu” să fie atribut (2).",
      rubric: [{ label: "barem", points: 6, answer: "2×1p alcătuirea fiecărui tip de enunț + 1p substantivul „vulpe” în cazul dativ + 1p respectarea funcției sintactice (atribut) + 2×1p norme. Ex.: (1) Îi dau vulpii de mâncare.; (2) Unde ai pus cadoul de la mine?" }],
    },
    {
      section: "I.B", label: "B.7", type: "OPEN", points: 6, autoGradable: false,
      content: "Transcrie două propoziții subordonate din secvența următoare, precizând felul acestora: „Cu fiecare picior ce călca pe o rădăcină, cu fiecare mână strângând un colț de stâncă, îmi revenea acel sentiment din copilărie că ating rețeaua nesfârșită de nervi a naturii, că aceasta tresare”.",
      rubric: [{ label: "barem", points: 6, answer: "2×1p transcrierea fiecărei propoziții subordonate + 2×2p precizarea felului. Ex.: „ce călca pe o rădăcină” – atributivă; „că ating rețeaua nesfârșită de nervi a naturii” – atributivă." }],
    },
    {
      section: "I.B", label: "B.8", type: "FILL", points: 6, autoGradable: false,
      content: "Scrie, pe spațiile punctate, forma corectă a cuvintelor subliniate în următoarele enunțuri, reprezentând mesajul unui pădurar: „— Ia-ți / I-ați (1) doar / decât (2) niște pantofi simpli / simplii (3) și vino în drumeție! Sper să nu fi / să nu fii (4) prea obosit din pricina / datorită (5) mersului pe jos după câțiva kilometri / kilometrii (6).”",
      correctAnswer: "Ia-ți, doar, simpli, să nu fii, din pricina, kilometri",
      rubric: [{ label: "barem", points: 6, answer: "6×1p: Ia-ți, doar, simpli, să nu fii, din pricina, kilometri." }],
    },
    // ── SUBIECTUL al II-lea (20p) ──
    {
      section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 20, autoGradable: false,
      passageRef: "Textul 2",
      content:
        "Crezi că știm cum să reacționăm atunci când lucrurile nu merg așa cum ne-am așteptat? Scrie un text argumentativ, de minimum 150 de cuvinte, în care să susții, prin două argumente, răspunsul la întrebarea dată, valorificând textul 2 și experiența personală sau de lectură. Compunerea nu va fi precedată de titlu sau de motto.",
      rubric: [
        { label: "Conținut", points: 12, answer: "1p formularea opiniei + 2×4p prezentarea a două argumente (1p enunțare + 1p dezvoltare + 2p valorificarea textului 2 și a unei experiențe personale/de lectură, fiecare) + 1p concluzie + 2p utilizarea corectă a conectorilor." },
        { label: "Redactare", points: 8, answer: "Paragrafe 1p, coerență 1p, proprietatea termenilor 1p, corectitudine gramaticală 1p, claritate 1p, ortografie 1p, punctuație 1p, lizibilitate 1p. Doar dacă are minimum 150 de cuvinte și dezvoltă subiectul." },
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
  console.log(`\n=== import-exam-ro-2026-simulare (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
