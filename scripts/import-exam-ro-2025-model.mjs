#!/usr/bin/env node
/**
 * import-exam-ro-2025-model.mjs — Exam-Bank · Limba și literatura română
 *
 * EN VIII 2025 Model (anul școlar 2024–2025). Subiect + barem oficiale
 * (Ministerul Educației / CNPEE — publice). Texte verbatim; chei ground-truth din BAREM.
 *
 * O figură: Textul 2 (Erasmus+) conține un grafic („Figura 1"); itemul A.3 depinde de
 *   grafic → hasFigure:true, autoGradable:false, figureUrl la PNG extras din PDF.
 *
 * Structură: Subiectul I — A (38p, 9 itemi) + B (32p, 8 itemi) + Subiectul al II-lea (20p).
 * Idempotent · Modes: --validate / --dry / (apply). DB: DATABASE_URL din env (VPS2 local PG).
 */

const MODE = process.argv.includes("--validate")
  ? "validate"
  : process.argv.includes("--dry")
    ? "dry"
    : "apply";

const RO = {
  source: "EN VIII 2025 Model — Limba și literatura română (CNPEE)",
  examType: "EN_VIII",
  year: 2025,
  subjectKey: "limba_romana",
  subjectName: "Limba și literatura română",
  grade: 8,
  variant: "model",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)",
  passages: [
    {
      ref: "Textul 1",
      title: "Amintiri din copilărie",
      author: "Ion Creangă",
      sourceNote: "Fragment.",
      orderIndex: 1,
      body:
        "Cum nu se dă scos ursul din bârlog, țăranul de la munte, strămutat la câmp, și pruncul, dezlipit de la sânul mamei sale, așa nu mă dam eu dus din Humulești în toamna anului 1855, când veni vremea să plec la Socola, după stăruința mamei. Și oare de ce nu m-aș fi dat dus din Humulești, nici în ruptul capului, când mereu îmi spunea mama că pentru folosul mieu este aceasta? Iaca de ce nu: drăgăliță Doamne, eram și eu acum holteiu, din păcate! Și Iașii, pe care nu-i văzusem niciodată, nu erau aproape de Neamț, ca Fălticenii, de unde, toamna târziu și mai ales prin câșlegile de iarnă, fiind nopțile mari, mă puteam repezi din când în când, pâșlind-o așa cam pe după toacă, și tot înainte, sara pe lună, cu tovarășii mei la clăci în Humulești, pe unde știam noi, ținând tot o fugă, ca telegarii. [...] De la Neamț la Fălticeni și de la Fălticeni la Neamț era pentru noi atunci o palmă de loc. Dar acum se schimba vorba: o cale scurtă de două poște, de la Fălticeni la Neamț, nu se potrivește c-o întindere de șase poște, lungi și obositoare, de la Iași până la Neamț. [...] Dar, vorba ceea: „Ursul nu joacă de bună voie”. Mort-copt, trebui să fac pe cheful mamei, să plec fără voință și să las ce-mi era drag! Dragu-mi era satul nostru cu Ozana cea frumos curgătoare și limpede ca cristalul, în care se oglindește cu mâhnire Cetatea Neamțului de atâtea veacuri! Dragi-mi erau tata și mama, frații și surorile, și băieții satului, tovarășii mei din copilărie, cu cari, în zile geroase de iarnă, mă desfătam pe gheață și la săniuș, iar vara, în zile frumoase de sărbători, cântând și chiuind, cutreieram dumbrăvile și luncile umbroase, prundul cu știoalnele, țarinile cu holdele, câmpul cu florile și mândrele dealuri, de după cari-mi zâmbeau zorile în zburdalnica vârstă a tinereței! Asemenea, dragi-mi erau șezătorile, clăcile, horile și toate petrecerile din sat, la care luam parte cu cea mai mare însuflețire! De piatră de-ai fi fost, și nu se putea să nu-ți salte inima de bucurie când auzeai, uneori în puterea nopței, pe Mihai scripcariul din Humulești umblând tot satul câte c-o droaie de flăcăi după dânsul și cântând. [...] Și câte și mai câte nu cânta Mihai lăutariul din gură și din scripca sa răsunătoare, și câte alte petreceri pline de veselie nu se făceau pe la noi, de-ți părea tot anul zi de sărbătoare! Vorba unei babe: „Să dea D-zeu tot anul să fie sărbători și numai o zi de lucru, și atunci să fie praznic și nuntă”. Apoi lasă-ți, băiete, satul, cu tot farmecul frumuseților lui, și pasă de te du în loc strein și așa depărtat, dacă te lasă pârdalnica de inimă! Și doar mă și sileam eu, într-o părere, s-o fac a înțălege pe mama că pot să mă bolnăvesc de dorul ei... și să mor printre streini! că văru-mieu [...] Mogorogea, Gheorghe Trăsnea, Nică Oșlobanu și alții s-au lăsat de învățat și, despre asta, tot mănâncă pâne pe lângă părinții lor. Dar zadarnică trudă! Mama avea alte gânduri; ea îmi pregătea cu îngrijire cele trebuitoare, zicându-mi de la o vreme:\n" +
        "— Ioane, cată să nu dăm cinstea pe rușine și pacea pe gâlceavă!... Ai să pleci unde zic eu. Și Zaharia lui Gâtlan merge cu tine. Luca Moșneagu, megieșul nostru, vă duce cu căruța cu doi cai ca niște zmei. Ia, mai bine, răpezi-te până la el de vezi, gata-i de drum? Că mâne des-dimineață, cu ajutorul Domnului, plecați.\n" +
        "— Nu mă duc, mamă, nu mă duc la Socola, măcar să mă omori! ziceam eu, plângând cu zece rânduri de lacrimi. Mai trăiesc ei oamenii și fără popie.\n" +
        "— Degeaba te mai sclifosești, Ioane, răspunse mama cu nepăsare! La mine nu se trec acestea... Pare-mi-se că știi tu moarea mea... [...]\n" +
        "Apoi cheamă pe tata și-i zice hotărâtor:\n" +
        "— Spune-i și d-ta băietului, omule, ce se cuvine, ca să-și ieie nădejdea și să-și caute de drum.\n" +
        "— Mai rămâne vorbă despre asta? zise tata posomorât. Are să urmeze cum știm noi, nu cum vrea el, că doar nu-i de capul său. Când m-ar bate numai atâta grijă, măi femeie, ce mi-ar fi? Dar eu mă lupt cu gândul cum să-i port de cheltuială, căci banii nu se culeg de la trunchiu, ca surcelele. Și la iști vro șase, afară de dânsul, dacă rămân acasă, nu li mai trebuie nimica? Dar fiind el cel mai mare, norocul său; trebuie să căutăm a-l zburătăci, căci nu se știu zilele omului! Și poate vreodată să fie și el sprijin pentru iștialalți.\n" +
        "Văzând eu că nu-i chip de stat împotriva părinților, începui a mă gândi la pornire, zicând în sine-mi cu amărăciune: „Ce năcaz pe capul mieu!” [...]\n" +
        "În sfârșit, ca să nu-mi uit vorba, toată noaptea cea dinainte de plecare, până s-au revărsat zorile, m-am frământat cu gândul, fel și chip, cum aș putea îndupleca pe mama să mă deie mai bine la mânăstire; și tocmai când eram hotărât a spune mamei aceste, iaca și soarele răsare, vestind o zi frumoasă, și Luca Moșneagu [...] se și aude strigând afară: „Gata sunteți? Haidem! că eu vă aștept cu caii înhămați.”. Mama atunci mă și ia răpede-răpede la pornit, fără să am când îi spune de călugărie. Și, scurtă vorbă, ne adunăm, cu rudele lui Zaharia, cu ale mele, în ogradă la moș Luca, sărutăm noi mâna părinților, luându-ne rămas-bun cu ochii înecați în lacrâmi și, după ce ne suim în căruță, supărați și plânși, ca vai de noi, Luca Moșneagu, harabagiul nostru, dă biciu cailor [...].",
    },
    {
      ref: "Textul 2",
      title: "Erasmus+ — programul UE pentru educație, formare, tineret și sport",
      author: null,
      sourceNote: "Raport anual privind programul Erasmus+ pe 2022, www.op.europa.eu. (Textul include un grafic — Figura 1 — atașat la întrebarea A.3.)",
      orderIndex: 2,
      body:
        "Erasmus+ este programul UE în domeniul educației, al formării, al tineretului și sportului pentru perioada 2021-2027, care sprijină atât persoanele fizice, cât și organizațiile. [...] Educația, formarea, tineretul și sportul sunt domenii-cheie care ajută cetățenii în dezvoltarea lor personală și profesională. Educația și formarea de înaltă calitate, favorabile incluziunii, precum și învățarea informală și nonformală conferă, în ultimă instanță, tinerilor și participanților de toate vârstele, calificările și competențele necesare pentru participarea lor semnificativă la societatea democratică, pentru înțelegerea interculturală și pentru tranziția de succes către piața muncii. Patru priorități generale – incluziunea, transformarea digitală, combaterea schimbărilor climatice și participarea democratică – sunt distribuite egal în toate acțiunile și sectoarele programului Erasmus+ pentru perioada 2021-2027.\n\n" +
        "Europenii din toate mediile beneficiază de oportunitățile oferite de programul Erasmus+, acestea fiind experiențe care le schimbă cu adevărat viața, având efecte pozitive asupra dezvoltării profesionale, sociale, educaționale și personale. [...]\n\n" +
        "Programul în cifre\n" +
        "Programul Erasmus a fost lansat în 1987 și a vizat la început doar domeniul învățământului superior. Structura actuală a programului a fost creată în 2014 pentru a include toate programele UE pentru educație, formare, tineret și sport. Este unul dintre programele emblematice ale Comisiei Europene și o poveste de succes încă de la început. Din 1987 și până la sfârșitul anului 2022, numărul participanților la activități de mobilitate a ajuns la 13,7 milioane.\n\n" +
        "În ceea ce privește mobilitatea transfrontalieră în scopul învățării, anul 2020 și prima jumătate a anului 2021 au reprezentat o perioadă atipică, întrucât numărul participanților la activitățile de mobilitate Erasmus+ a fost afectat de criza sanitară și de izbucnirea pandemiei. Impactul pandemiei de COVID-19 asupra activităților de mobilitate sprijinite de Erasmus+ a fost deosebit de puternic în 2020, înregistrându-se cu aproximativ 60% mai puține activități de mobilitate decât media anilor 2016-2019. În al doilea an al programului actual, peste 1,2 milioane de participanți și-au desfășurat activitatea de mobilitate, având în vedere că programul a început să funcționeze la capacitate normală.\n\n" +
        "(Raport anual privind programul Erasmus+ pe 2022, www.op.europa.eu)\n\n" +
        "Figura 1 – Perioadele de mobilitate (cumulate) ale programului Erasmus, numărul participanților (graficul este afișat la întrebarea A.3).",
    },
  ],
  items: [
    // ── A. Lectură (38p) ──
    {
      section: "I.A", label: "A.1", type: "FILL", points: 2, autoGradable: false,
      passageRef: "Textul 1",
      content: "Completează spațiile libere cu informațiile din textul 1: „În anul ___, Ion pleacă din satul natal, ___, la școala de la Socola pentru a deveni preot.”",
      correctAnswer: "1855; Humulești",
      rubric: [{ label: "completare", points: 2, answer: "1855; Humulești (2×1p)." }],
    },
    {
      section: "I.A", label: "A.2", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 1",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 1. Cel care duce băieții cu căruța la Socola este",
      options: [{ key: "a", text: "Gheorghe Trăsnea." }, { key: "b", text: "Luca Moșneagu." }, { key: "c", text: "Nică Oșlobanu." }, { key: "d", text: "Zaharia lui Gâtlan." }],
      correctAnswer: "b",
    },
    {
      section: "I.A", label: "A.3", type: "MCQ", points: 2, autoGradable: false,
      passageRef: "Textul 2",
      hasFigure: true,
      figureUrl: "/exam-figures/en-viii-2025-ro-model-fig1.png",
      figureNote: "Figura 1 — grafic cu coloane: 1987-2013=7,1; 2014=7,4; 2015=8,0; 2016=8,8; 2017=9,6; 2018=10,5; 2019=11,5; 2020=11,8; 2021=12,5; 2022=13,7 (milioane de participanți, cumulat).",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2 (graficul de mai jos). Conform graficului, numărul participanților din programul Erasmus a ajuns la 8 milioane în anul",
      options: [{ key: "a", text: "2014." }, { key: "b", text: "2015." }, { key: "c", text: "2017." }, { key: "d", text: "2022." }],
      correctAnswer: "b",
    },
    {
      section: "I.A", label: "A.4", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. În anii ’90, programul Erasmus era destinat persoanelor din învățământul",
      options: [{ key: "a", text: "preșcolar." }, { key: "b", text: "primar." }, { key: "c", text: "gimnazial." }, { key: "d", text: "superior." }],
      correctAnswer: "d",
    },
    {
      section: "I.A", label: "A.5", type: "TF_GRID", points: 6, autoGradable: true,
      passageRef: "Textul 1, Textul 2",
      content: "Notează „X” în dreptul fiecărui enunț pentru a marca dacă acesta este adevărat sau fals, bazându-te pe informațiile din cele două texte.",
      rubric: [
        { label: "Textul 1 — Imaginea Cetății Neamțului se reflectă în apa Ozanei.", points: 1, answer: "Adevărat" },
        { label: "Textul 1 — Mama este indecisă în privința plecării fiului ei la școală.", points: 1, answer: "Fals" },
        { label: "Textul 1 — Distanța dintre Neamț și Iași este mai mică decât distanța de la Neamț la Fălticeni.", points: 1, answer: "Fals" },
        { label: "Textul 2 — O prioritate a programului Erasmus+ este combaterea schimbărilor climatice.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Figura 1 reprezintă evoluția numărului de participanți la Erasmus între anii 1987 și 2024.", points: 1, answer: "Fals" },
        { label: "Textul 2 — La programul Erasmus+ pot participa doar tinerii.", points: 1, answer: "Fals" },
      ],
      correctAnswer: "Textul 1: A, F, F | Textul 2: A, F, F",
    },
    {
      section: "I.A", label: "A.6", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Precizează, în unu – trei enunțuri, o trăsătură a tatălui, personajul din textul 1, identificată în fragmentul de mai jos, și mijlocul de caracterizare utilizat, ilustrându-l cu o secvență relevantă: „— Mai rămâne vorbă despre asta? zise tata posomorât. [...] Dar eu mă lupt cu gândul cum să-i port de cheltuială, căci banii nu se culeg de la trunchiu, ca surcelele. [...] trebuie să căutăm a-l zburătăci, căci nu se știu zilele omului!”.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea unei trăsături (ex.: înțelept, responsabil, ferm) + 1p mijlocul de caracterizare (ex.: caracterizare indirectă, prin fapte/atitudini/relația cu alte personaje) + 1p ilustrarea cu o secvență + 1p norme + 1p numărul de enunțuri." }],
    },
    {
      section: "I.A", label: "A.7", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1, Textul 2",
      content: "Prezintă, în minimum 30 de cuvinte, o diferență între limbajul utilizat în textul 1 și cel din textul 2, valorificând câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea unei diferențe de limbaj (ex.: text 1 – limbaj popular/expresiv; text 2 – limbaj specializat/termeni științifici) + 2×1p prezentarea trăsăturii din fiecare text (secvență relevantă) + 1p norme + 1p numărul minim de cuvinte." }],
    },
    {
      section: "I.A", label: "A.8", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Ce simte băiatul înaintea plecării la Socola? Justifică-ți, în 50 – 100 de cuvinte, răspunsul la întrebarea dată, prin referire la o emoție, valorificând textul 1.",
      rubric: [{ label: "barem", points: 6, answer: "1p menționarea răspunsului + 1p justificarea prin referire la o emoție din text + 2p valorificarea textului 1 + 1p norme + 1p încadrarea în numărul de cuvinte." }],
    },
    {
      section: "I.A", label: "A.9", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Asociază fragmentul din opera literară „Amintiri din copilărie” de Ion Creangă cu un alt text literar studiat la clasă sau citit ca lectură suplimentară, prezentând, în 50 – 100 de cuvinte, o valoare comună, prin referire la câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "1p numirea unei valori (ex.: familia, educația, tradițiile) + 1p titlul și autorul textului asociat + 2p prezentarea valorii comune (secvență din fiecare text) + 1p norme + 1p numărul de cuvinte." }],
    },
    // ── B. Limbă (32p) ──
    {
      section: "I.B", label: "B.1", type: "MCQ", points: 2, autoGradable: true,
      topic: "Despărțirea în silabe",
      content: "Sunt corect despărțite în silabe ambele cuvinte din seria:",
      options: [
        { key: "a", text: "vârs-te-le; pe-ri-oa-dă." },
        { key: "b", text: "vâr-ste-le; pe-ri-oa-dă." },
        { key: "c", text: "vârs-te-le; pe-rioa-dă." },
        { key: "d", text: "vâr-ste-le; pe-rioa-dă." },
      ],
      correctAnswer: "b",
    },
    {
      section: "I.B", label: "B.2", type: "MCQ", points: 2, autoGradable: true,
      topic: "Mijloace de îmbogățire a vocabularului",
      content: "Cuvintele subliniate în secvența „Dragu-mi era satul nostru cu Ozana cea frumos (1) curgătoare (2) și limpede ca cristalul” s-au format prin:",
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
      topic: "Forme de plural",
      content: "Seria care cuprinde formele corecte de plural pentru sensul din text al următoarelor cuvinte subliniate: „țarinile cu holdele, câmpul cu florile și mândrele dealuri” și „Raport anual privind programul Erasmus+ pe 2022” este:",
      options: [
        { key: "a", text: "câmpii, raporturi." },
        { key: "b", text: "câmpuri, raporturi." },
        { key: "c", text: "câmpiile, rapoarte." },
        { key: "d", text: "câmpurile, rapoarte." },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.4", type: "MCQ", points: 2, autoGradable: true,
      topic: "Sensul cuvintelor în context",
      content: "Sensul secvenței subliniate în enunțul „Spune-i și d-ta băiatului, omule, ce se cuvine, ca să-și ia nădejdea și să-și caute de drum” este:",
      options: [
        { key: "a", text: "să nu-și piardă credința." },
        { key: "b", text: "să primească ajutor." },
        { key: "c", text: "să renunțe la speranță." },
        { key: "d", text: "să spere în continuare." },
      ],
      correctAnswer: "c",
    },
    {
      section: "I.B", label: "B.5", type: "OPEN", points: 6, autoGradable: false,
      content: "Selectează, din fragmentul următor, trei forme verbale nepersonale diferite, pe care le vei preciza: „și tocmai când eram hotărât a spune mamei aceste, iaca și soarele răsare, vestind o zi frumoasă, și Luca Moșneagu [...] se și aude strigând afară: «Gata sunteți? Haidem! că eu vă aștept cu caii înhămați.». Mama atunci mă și ia răpede-răpede la pornit, fără să am când îi spune de călugărie.”",
      rubric: [{ label: "barem", points: 6, answer: "3×1p selectarea fiecărei forme verbale nepersonale + 3×1p precizarea formei. Ex.: „a spune” – infinitiv; „vestind” (sau „strigând”) – gerunziu; „la pornit” – supin." }],
    },
    {
      section: "I.B", label: "B.6", type: "OPEN", points: 6, autoGradable: false,
      content: "Alcătuiește o propoziție afirmativă, în care substantivul „minte” să fie complement direct (1) și o propoziție negativă, în care adverbul „mâine” să fie atribut (2).",
      rubric: [{ label: "barem", points: 6, answer: "2×1p alcătuirea fiecărui tip de propoziție + 2×1p respectarea funcției sintactice (complement direct; atribut) + 2×1p norme. Ex.: (1) Andrei are o minte sclipitoare.; (2) Nu am emoții pentru testul de mâine." }],
    },
    {
      section: "I.B", label: "B.7", type: "OPEN", points: 6, autoGradable: false,
      content: "Transcrie propozițiile subordonate din fraza următoare, precizând felul acestora: „Dar eu mă lupt cu gândul cum să-i port de cheltuială, căci banii nu se culeg de la trunchiu, ca surcelele.”.",
      rubric: [{ label: "barem", points: 6, answer: "2×1p transcrierea fiecărei propoziții subordonate + 2×2p precizarea felului: „cum să-i port de cheltuială” – atributivă; „căci banii nu se culeg de la trunchiu, ca surcelele” – circumstanțială de cauză." }],
    },
    {
      section: "I.B", label: "B.8", type: "OPEN", points: 6, autoGradable: false,
      content: "Rescrie corect mesajul de mai jos, preluat din comentariul unui participant la o activitate Erasmus: „Prefer mai bine să discutăm despre cele peste douăzeci și două mii de activități organizate în ultimele decenii pentru tinerii Europeni, solitari cu cei afectați de schimbările climatice. Vorbim, așadar, decât de un procent de 60% din totalul activităților.”",
      correctAnswer: "Prefer să discutăm despre cele peste douăzeci și două de mii de activități organizate în ultimele decenii pentru tinerii europeni, solidari cu cei afectați de schimbările climatice. Vorbim, așadar, doar de 60% din totalul activităților.",
      rubric: [{ label: "barem", points: 6, answer: "Rescriere corectă (model: „Prefer să discutăm despre cele peste douăzeci și două de mii de activități organizate în ultimele decenii pentru tinerii europeni, solidari cu cei afectați de schimbările climatice. Vorbim, așadar, doar de 60% din totalul activităților.”). Punctare după numărul de greșeli: 0 greșeli – 6p; câte 1p scăzut per greșeală, până la 0p la 6 sau mai multe greșeli." }],
    },
    // ── SUBIECTUL al II-lea (20p) ──
    {
      section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 20, autoGradable: false,
      passageRef: "Textul 1",
      content:
        "Crezi că deciziile importante pentru viitorul unui copil trebuie luate exclusiv de către părinți? Scrie un text argumentativ, de minimum 150 de cuvinte, în care să susții, prin două argumente, răspunsul la întrebarea dată, valorificând textul 1 și experiența personală sau de lectură. Compunerea nu va fi precedată de titlu sau de motto.",
      rubric: [
        { label: "Conținut", points: 12, answer: "2p formularea opiniei + 2×3p prezentarea a două argumente (1p enunțare + 1p dezvoltare + 1p valorificarea textului 1 și a unei experiențe personale/de lectură, fiecare) + 2p concluzie + 2p utilizarea corectă a conectorilor." },
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
      if (it.hasFigure && !it.figureUrl)
        errors.push(`[${tag}] item ${it.label} hasFigure but missing figureUrl`);
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
    const figCount = p.items.filter((i) => i.hasFigure).length;
    console.log(
      `  ${tag.padEnd(14)} items=${p.items.length} passages=${p.passages.length} ` +
        `pts=${sum}(+${p.officeBonus} oficiu=${sum + p.officeBonus}) autoGradable=${autoCount} figures=${figCount}`
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
  console.log(`\n=== import-exam-ro-2025-model (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
