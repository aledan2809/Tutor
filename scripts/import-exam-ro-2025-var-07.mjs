#!/usr/bin/env node
/**
 * import-exam-ro-2025-var-07.mjs — Exam-Bank · Limba și literatura română
 *
 * EN VIII 2025 Varianta 7 (anul școlar 2024–2025). Subiect + barem oficiale
 * (Ministerul Educației și Cercetării / CNPEE — publice). Texte verbatim;
 * chei ground-truth din BAREM. Fără figuri.
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
  source: "EN VIII 2025 Varianta 7 — Limba și literatura română (CNPEE)",
  examType: "EN_VIII",
  year: 2025,
  subjectKey: "limba_romana",
  subjectName: "Limba și literatura română",
  grade: 8,
  variant: "varianta-07",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)",
  passages: [
    {
      ref: "Textul 1",
      title: "Toate pânzele sus!",
      author: "Radu Tudoran",
      sourceNote: "Fragment. (*maidan – teren deschis, loc viran; *a intra cu oiștea-n gard – a face o prostie; *cioareci – pantaloni țărănești strânși pe picior; *nojițe – șireturi; *marangoz – dulgher pe o navă; *caic – ambarcațiune îngustă cu vele)",
      orderIndex: 1,
      body:
        "Ajungând în marginea maidanului*, unde mulțimea se rărea, Anton Lupan întoarse capul spre însoțitorul său și-l întrebă:\n" +
        "— Cum te cheamă, flăcăule?\n" +
        "Acesta vru să mârâie, arțăgos: „Da' ce treabă ai dumneata?”, însă ridicând ochii întâlni un zâmbet atât de deschis și de frățesc, încât se simți câștigat pe loc.\n" +
        "— Ieremia mă cheamă! răspunse încrezător.\n" +
        "— Ăi fi cel care a intrat cu oiștea în gard*.\n" +
        "Omul râse cu gura până la urechi, din ce în ce mai voios:\n" +
        "— Nu. Ăla e frate-miu, că ne-am nimerit doi frați să ne cheme la fel.\n" +
        "Acum fu rândul lui Anton Lupan să izbucnească în râs. Așa, orice urmă de gheață dispăru dintre ei.\n" +
        "— Prin urmare, am să-ți zic Ieremia. Om vedea ce-om face dacă ne-om întâlni și cu fratele tău. Pe mine mă cheamă Anton Lupan. [...]\n" +
        "— Ia spune, Ieremie, ai vreo treabă aici în târg?\n" +
        "— Până una alta nu, da' acu, dac-or înverzi copacii, gândesc să-mi cumpăr o foarfecă și să m-apuc de tăiat frunză la câini. [...]\n" +
        "La aceste vorbe, Anton Lupan îl privi mai iscoditor. Omul de lângă el, înalt din cale afară, să fi zis că-i deșirat dacă n-ar fi fost destul de spătos, avea un cap cam micuț pentru trupul lui, un cap de păsăroi, cu nasul ascuțit, cu ochii apropiați, când vicleni, când glumeți, cu bărbia îngustă și cu obrazul plin de țepi. Purta un fel de cioareci* zdrențuiți, strânși cu nojițele* opincilor până sub genunchi, dar în sus avea o haină de marinar, peticită cam peste tot, care nu se potrivea nici cu cioarecii, nici cu căciula de oaie din cap. [...]\n" +
        "— Vreo meserie ai învățat?\n" +
        "— Sunt marangoz*, domnule, numai că, de când cu războiul, nu găsesc de lucru defel. Înainte mai veneau turcii, grecii și mai ciocăneam câte ceva la bărcile lor. Ori mă duceam la Tulcea și lucram bărci pentru pescari. Acu' grecii vin mai rar că-s cam speriați, iar turcii, de, or fi supărați pe noi.\n" +
        "— Ceva carte ai învățat?\n" +
        "— Câtă a uitat meșterul meu.\n" +
        "— Știi să citești, să scrii, să socotești?\n" +
        "— Taman cât trebuie ca să nu zică lumea că-s prea prost.\n" +
        "Anton Lupan tăcu un timp, gânditor, apoi întoarse capul spre el și-l întrebă, fără înconjur:\n" +
        "— Ascultă, Ieremie, ai vrea să pornești cu mine la drum? După cât bag de seamă, rosturi prea multe nu ai aici în târg.\n" +
        "— Și nici în altă parte, domnule. Încotro s-o pornim?\n" +
        "— Așa, spre capătul lumii...\n" +
        "Ieremia micșoră pasul fără voia lui și, dându-și căciula pe spate, se scărpină în creștet, îndoit.\n" +
        "— N-o fi prea departe? zise, uitându-se cam chiorâș la vecinul său, cu teama că acesta îl lua peste picior.\n" +
        "— Departe, e drept! răspunse Anton Lupan, hotărât să nu umble cu amăgeli.\n" +
        "Or, pe Ieremia tocmai răspunsul lui îl zgândări, fiindcă părea cu totul și cu totul serios, și îl făcea să simtă furnicături peste tot, și-n inimă, și-n creier, și-n trup.\n" +
        "Bănuind ce se întâmplă cu el, Anton Lupan zâmbi mulțumit și-l lăsă un timp să fiarbă așa, în zeama lui, apoi îl întrebă, parcă într-o doară, ca și când ar fi vrut să schimbe vorba de la început:\n" +
        "— Pe mare ai fost vreodată? Ți-o fi teamă de ea?\n" +
        "— Teamă?... Iacă zău că nu știu. Da' de cunoscut o cunosc. Doi ani am fost dulgher pe un caic* turcesc și-am tot umblat, pe la Stambul, pe la Salonic, ba am ajuns chiar și la Pireu.\n" +
        "Anton Lupan tresări, surprins, și chipul i se lumină mai mult. Omul era chiar mai încercat decât bănuise el. Se cuvenea să nu-l mai scape din mâini, altul pe măsura lui fiind greu de găsit.",
    },
    {
      ref: "Textul 2",
      title: "Spre Polul Sud",
      author: "Emil Racoviță",
      sourceNote: "Fragment. (*proră – partea din față a unei nave; *cală – încăpere sub puntea inferioară a unei nave)",
      orderIndex: 2,
      body:
        "Și în ținuturile antarctice sunt animale. Ca să ajungi la ele, trebuie să străbați Oceanul Atlantic în tot lungul lui. Această distanță enormă a fost parcursă de Belgica fără să se zorească; măsură înțeleaptă, de vreme ce vasul nostru mai avea nevoie de multe ca să fie un „pachebot” transatlantic. Era o corăbioară trainică de felul pescuitoarelor de foci norvegiene, lungă de treizeci și patru de metri și cu o capacitate de două sute șaptezeci de tone. [...] Înspre cârmă erau mici cabine destinate ofițerilor și oamenilor de știință. Înspre proră* era locuința marinarilor și a mecanicilor, iar la mijloc, o chiliuță neîncăpătoare, împărțită în două printr-un perete, slujea ca laborator pentru oceanograful meteorolog și pentru naturalistul expediției. Calele* erau ticsite de cărbuni, provizie necesară pentru o mașină de 150 de cai, în stare să dea vasului o iuțeală de șase până la șapte noduri, și de mare folos, mai cu seamă în timpul navigării printre ghețuri. Pe punte și în calele vasului stăteau îngrămădite lăzi de toate formele, pline cu blănuri, mâncare pe doi ani și jumătate și materii prime de tot soiul: lemn, fier, piei și altele din care, după trebuință, se puteau face obiectele cerute de nevoi.\n\n" +
        "La această expediție au luat parte nouăsprezece persoane. [...] Aveam aparate de sondaj și pescuit la toate adâncimile, un observator meteorologic complet cu aparate înregistratoare și de citire directă, termometre și butelii submarine, microscoape și sticlăria necesară pentru conservarea animalelor. Fiecare specialist avea o mică bibliotecă trebuitoare studiilor sale și, afară de aceasta, aveam o colecție de opere literare în multe limbi, ce era menită a ne distra în momentele de osteneală și de urât.\n\n" +
        "Ținta expediției nu era să atingă cu orice preț Polul Sud, în paguba observațiilor științifice. Firește că trebuia să înaintăm înspre sud cât se putea mai mult, fără să ne găsim însă vreodată în neputința de a face acele cercetări științifice, care sunt singurul, dar marele câștig pe care poate să-l dea o expediție. Ca program, era vorba să studiem îndeosebi regiunea antarctică sud-americană, cu toate mijloacele pe care știința le pune azi la îndemâna cercetătorilor, și să iernăm cât s-ar fi putut mai înspre sud, ca să aducem tot felul de observații pe timp de cel puțin un an de zile.\n\n" +
        "Nu vreau să stăruiesc asupra călătoriei Belgicăi până la capătul cel mai de jos al Americii de Sud și voi începe povestirea pățaniilor noastre din ziua de 13 ianuarie 1898, când părăsirăm golful San Juan din Pământul Statelor. Numaidecât ne-a fost dat să ne încredințăm că faima de care se bucură vecinătățile Capului Horn era îndreptățită. Vântul de apus sufla întruna vijelios și Belgica fu zguduită cu violență de către uriașele valuri care se formează în Strâmtoarea lui Drake. Din fericire, prevăzusem aceasta: tot materialul și toate borcanele mele fuseseră fixate cu grijă în rafturi anume făcute și chiar microscopul meu fusese înșurubat pe masa din laborator.",
    },
  ],
  items: [
    // ── A. Lectură (38p) ──
    {
      section: "I.A", label: "A.1", type: "SHORT", points: 2, autoGradable: false,
      passageRef: "Textul 1",
      content: "Notează, din textul 1, doi termeni care denumesc localități prin care a trecut Ieremia.",
      correctAnswer: "Două localități dintre: Tulcea, Stambul, Salonic, Pireu.",
      rubric: [{ label: "barem", points: 2, answer: "2×1p pentru oricare doi termeni care denumesc localități prin care a trecut Ieremia (ex.: Tulcea, Salonic, Stambul, Pireu)." }],
    },
    {
      section: "I.A", label: "A.2", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 1",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 1. Meseria lui Ieremia este cea de",
      options: [{ key: "a", text: "cioban." }, { key: "b", text: "dulgher." }, { key: "c", text: "negustor." }, { key: "d", text: "pescar." }],
      correctAnswer: "b",
    },
    {
      section: "I.A", label: "A.3", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. La expediție au participat",
      options: [{ key: "a", text: "șase persoane." }, { key: "b", text: "șapte persoane." }, { key: "c", text: "nouăsprezece persoane." }, { key: "d", text: "treizeci și patru de persoane." }],
      correctAnswer: "c",
    },
    {
      section: "I.A", label: "A.4", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. Pentru a face față furtunilor, Racoviță prinde, în șuruburi, de masa din laborator",
      options: [{ key: "a", text: "borcanele." }, { key: "b", text: "buteliile." }, { key: "c", text: "microscopul." }, { key: "d", text: "termometrele." }],
      correctAnswer: "c",
    },
    {
      section: "I.A", label: "A.5", type: "TF_GRID", points: 6, autoGradable: true,
      passageRef: "Textul 1, Textul 2",
      content: "Notează „X” în dreptul fiecărui enunț pentru a marca dacă acesta este adevărat sau fals, bazându-te pe informațiile din cele două texte.",
      rubric: [
        { label: "Textul 1 — Anton Lupan și Ieremia fac cunoștință pe un vapor.", points: 1, answer: "Fals" },
        { label: "Textul 1 — Ieremia mărturisește că nu știe carte deloc.", points: 1, answer: "Fals" },
        { label: "Textul 1 — Anton Lupan ajunge să îl aprecieze pe Ieremia pentru experiența lui.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Belgica străbate Oceanul Atlantic fără grabă.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Scopul expediției este de a atinge cu orice preț Polul Sud.", points: 1, answer: "Fals" },
        { label: "Textul 2 — Corabia pleacă din golful San Juan în 13 ianuarie 1898.", points: 1, answer: "Adevărat" },
      ],
      correctAnswer: "Textul 1: F, F, A | Textul 2: A, F, A",
    },
    {
      section: "I.A", label: "A.6", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Precizează, în unu-trei enunțuri, o trăsătură a unui personaj, identificată în fragmentul de mai jos, și mijlocul de caracterizare utilizat, ilustrându-l cu o secvență relevantă: „La aceste vorbe, Anton Lupan îl privi mai iscoditor. Omul de lângă el, înalt din cale afară, să fi zis că-i deșirat dacă n-ar fi fost destul de spătos, avea un cap cam micuț pentru trupul lui, un cap de păsăroi, cu nasul ascuțit, cu ochii apropiați, când vicleni, când glumeți [...]”.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea unei trăsături (ex.: înalt) + 1p mijlocul de caracterizare (ex.: caracterizare directă, de către narator) + 1p ilustrarea cu o secvență + 1p norme + 1p numărul de enunțuri." }],
    },
    {
      section: "I.A", label: "A.7", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1, Textul 2",
      content: "Prezintă, în minimum 30 de cuvinte, un element de conținut comun celor două texte, valorificând câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea unui element comun (ex.: corabia, călătoria, marea) + 2×1p prezentarea din fiecare text + 1p norme + 1p numărul minim de cuvinte." }],
    },
    {
      section: "I.A", label: "A.8", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 2",
      content: "Crezi că reușita unei călătorii depinde de pregătirea atentă a acesteia? Motivează-ți răspunsul, în 50-100 de cuvinte, valorificând textul 2.",
      rubric: [{ label: "barem", points: 6, answer: "1p menționarea răspunsului + 1p motivarea răspunsului + 2p valorificarea textului 2 + 1p norme + 1p încadrarea în numărul de cuvinte." }],
    },
    {
      section: "I.A", label: "A.9", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Asociază fragmentul din opera „Toate pânzele sus!” de Radu Tudoran cu un alt text literar studiat la clasă sau citit ca lectură suplimentară, prezentând, în 50-100 de cuvinte, o valoare comună, prin referire la câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "1p numirea unei valori (ex.: curajul, sinceritatea, perseverența) + 1p titlul și autorul textului asociat + 2p prezentarea valorii comune (secvență din fiecare text) + 1p norme + 1p numărul de cuvinte." }],
    },
    // ── B. Limbă (32p) ──
    {
      section: "I.B", label: "B.1", type: "MCQ", points: 2, autoGradable: true,
      topic: "Despărțirea în silabe",
      content: "Sunt despărțite corect în silabe ambele cuvinte din seria:",
      options: [
        { key: "a", text: "mij-loa-ce-le; spe-ri-ați." },
        { key: "b", text: "mij-loa-ce-le; spe-riați." },
        { key: "c", text: "mi-jloa-ce-le; spe-ri-ați." },
        { key: "d", text: "mi-jloa-ce-le; spe-riați." },
      ],
      correctAnswer: "a",
    },
    {
      section: "I.B", label: "B.2", type: "MCQ", points: 2, autoGradable: true,
      topic: "Cuvinte derivate",
      content: "Seria care conține doar cuvinte derivate este:",
      options: [
        { key: "a", text: "„iuțeală”, „printre”." },
        { key: "b", text: "„măsura”, „animale”." },
        { key: "c", text: "„micuț”, „corăbioară”." },
        { key: "d", text: "„vreodată”, „întruna”." },
      ],
      correctAnswer: "c",
    },
    {
      section: "I.B", label: "B.3", type: "MCQ", points: 2, autoGradable: true,
      topic: "Sensul cuvintelor în context",
      content: "Secvența subliniată în fragmentul „gândesc să-mi cumpăr o foarfecă și să m-apuc de tăiat frunză la câini” are sensul de:",
      options: [{ key: "a", text: "a decupa hârtia." }, { key: "b", text: "a hrăni câinii." }, { key: "c", text: "a munci din greu." }, { key: "d", text: "a pierde vremea." }],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.4", type: "MCQ", points: 2, autoGradable: true,
      topic: "Omonime",
      content: "Sunt omonime ambele cuvinte din seria:",
      options: [
        { key: "a", text: "„aveam o colecție de opere literare în multe limbi”; Nu știa să facă decât traduceri literale." },
        { key: "b", text: "„iar turcii, de, or fi supărați pe noi”; Toți copiii erau fericiți, aflând programul excursiei." },
        { key: "c", text: "„părăsirăm golful San Juan”; Golful este un joc sportiv desfășurat pe un teren special." },
        { key: "d", text: "„Vântul de apus sufla întruna vijelios”; El sufla emoționat în lumânările de pe tortul cu fructe." },
      ],
      correctAnswer: "c",
    },
    {
      section: "I.B", label: "B.5", type: "OPEN", points: 6, autoGradable: false,
      content: "Selectează, din fragmentul următor, trei substantive aflate în cazuri diferite, pe care le vei preciza: „Înspre cârmă erau mici cabine destinate ofițerilor [...]. Înspre proră era locuința marinarilor și a mecanicilor”.",
      rubric: [{ label: "barem", points: 6, answer: "3×1p selectarea fiecărui substantiv + 3×1p precizarea cazului. Ex.: „cabine” – nominativ; „ofițerilor” – dativ; „marinarilor” – genitiv." }],
    },
    {
      section: "I.B", label: "B.6", type: "OPEN", points: 6, autoGradable: false,
      content: "Alcătuiește o propoziție afirmativă, în care verbul „a fi” să aibă valoare predicativă (1) și o propoziție negativă, în care adjectivul „greu” să fie nume predicativ (2).",
      rubric: [{ label: "barem", points: 6, answer: "2×1p alcătuirea fiecărui tip de propoziție + 1p verbul „a fi” cu valoare predicativă + 1p respectarea funcției sintactice a adjectivului (nume predicativ) + 2×1p norme. Ex.: (1) Corabia este în portul Constanța.; (2) Ghiozdanul nu este greu." }],
    },
    {
      section: "I.B", label: "B.7", type: "OPEN", points: 6, autoGradable: false,
      content: "Transcrie propozițiile din fraza următoare, precizând felul acestora: „Fiecare specialist avea o mică bibliotecă trebuitoare studiilor sale și, afară de aceasta, aveam o colecție de opere literare în multe limbi, ce era menită a ne distra în momentele de osteneală și de urât”.",
      rubric: [{ label: "barem", points: 6, answer: "3×1p transcrierea fiecărei propoziții + 3×1p precizarea felului: „Fiecare specialist avea o mică bibliotecă trebuitoare studiilor sale” – principală; „(și) aveam o colecție de opere literare în multe limbi” – principală; „ce era menită a ne distra în momentele de osteneală și de urât” – subordonată atributivă." }],
    },
    {
      section: "I.B", label: "B.8", type: "FILL", points: 6, autoGradable: false,
      content: "Scrie, pe spațiile punctate, forma corectă a cuvintelor subliniate în următorul enunț, preluat dintr-un jurnal de călătorie: „După-amiază, deodată / de odată (1), cerul s-a înnorat / înorat (2), căpătând culoarea înspăimântătoare a cenuși / cenușii (3), iar marea s-a / sa (4) tulburat, aruncându-și / aruncânduși (5) valurile până în mijlocul plajei / plăjii (6) noastre.”",
      correctAnswer: "deodată, înnorat, cenușii, s-a, aruncându-și, plajei",
      rubric: [{ label: "barem", points: 6, answer: "6×1p: deodată, înnorat, cenușii, s-a, aruncându-și, plajei." }],
    },
    // ── SUBIECTUL al II-lea (20p) ──
    {
      section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 20, autoGradable: false,
      content:
        "Scrie un text narativ, de minimum 150 de cuvinte, în care să prezinți o întâmplare dintr-o excursie, incluzând o secvență descriptivă, de minimum 30 de cuvinte, și o secvență dialogată, de minimum patru replici. Compunerea nu va fi precedată de titlu sau de motto.",
      rubric: [
        { label: "Conținut", points: 12, answer: "4p adecvarea conținutului la cerință (prezentarea unei întâmplări din excursie) + 4p respectarea trăsăturilor textului narativ (succesiune logică, personaje, încadrare în timp și spațiu) + 2p includerea secvenței descriptive (min. 30 de cuvinte) + 2p includerea secvenței dialogate (min. patru replici)." },
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
  console.log(`\n=== import-exam-ro-2025-var-07 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
