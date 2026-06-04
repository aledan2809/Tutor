#!/usr/bin/env node
/**
 * import-exam-ro-2025-sesiune-speciala.mjs — Exam-Bank · Limba și literatura română
 *
 * EN VIII 2025 Sesiune specială (2 iulie 2025; anul școlar 2024–2025). Subiect + barem
 * oficiale (Ministerul Educației și Cercetării / CNCE — publice). Texte verbatim; chei ground-truth.
 *
 * Subiectul al II-lea = caracterizare de personaj. Fără figuri.
 * Idempotent · Modes: --validate / --dry / (apply). DB: DATABASE_URL din env (VPS2 local PG).
 */

const MODE = process.argv.includes("--validate")
  ? "validate"
  : process.argv.includes("--dry")
    ? "dry"
    : "apply";

const RO = {
  source: "EN VIII 2025 Sesiune specială (2 iulie 2025) — Limba și literatura română (CNCE)",
  examType: "EN_VIII",
  year: 2025,
  subjectKey: "limba_romana",
  subjectName: "Limba și literatura română",
  grade: 8,
  variant: "sesiune-speciala",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2025/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNCE)",
  passages: [
    {
      ref: "Textul 1",
      title: "Toate pânzele sus!",
      author: "Radu Tudoran",
      sourceNote: "Fragment. (*căprar – grad militar; *zăltat – aiurit, trăsnit; *barcaz – ambarcațiune pescărească, barcă cu pânze)",
      orderIndex: 1,
      body:
        "Cristea Busuioc era un român năzdrăvan. El umbla cu plutele de la șaisprezece ani și încă de pe-atunci se arătase mai altfel decât ceilalți. Când ajungeau la Dunăre, ceilalți își luau traista, toiagul și-o porneau. El zăbovea pe mal. Cunoștea Bistrița, cunoștea Siretul ca și cum apele acestea ar fi șerpuit prin ograda sa. În fața Dunării rămânea mirat.\n" +
        "— Unde se duc? se întreba, privind corăbiile și vapoarele. [...]\n" +
        "Își lăsase barbă, iar părul de la tâmple îi încărunțea. Era flăcău la douăzeci și cinci de ani. [...]\n" +
        "Dar, cu toate acestea, cât ținea valea Bistriței, Cristea Busuioc rămânea cel mai bun plutaș. Lumea îl socotea oleacă sărit, oleacă năzdrăvan. [...]\n" +
        "Așa se făcea că la acest sfârșit de mai, cu cerul înnorat, când ceilalți abia soseau la gura Siretului, el cobora a doua oară, aducând doi pini înalți, cum îl rugase acum șase săptămâni, în portul Galațiului, căprarul* Ieremia, cunoscut de la Grivița, unde regimentele lor luptaseră cot la cot împotriva pașei Osman. [...]\n" +
        "Așa se hotărî să coboare până la Sulina, drum încă neîncercat de vreun plutaș. Fârtații lui de pe țărm îl urmăreau din ochi și-l căinau amar:\n" +
        "— Zăltat* rău! Pesemne vrea să se sfârșească, s-a săturat de trai.\n" +
        "Dar iată că pluta, în loc să se piardă în vârtejuri, să se dea peste cap, merse pieziș până la firul apei, săltând ușor pe val, iar acolo se roti supusă și porni spre Galați. Cristea Busuioc stătea la partea ei din urmă și o mânuia, trăgând de frânghiile pânzei, luptându-se cu cârma, cu îndrăzneală și pricepere de vechi marinar.\n" +
        "Nu de pomană privise el ani și ani corăbiile străine care se duceau la vale sau urcau la deal! Nu-i spusese nimeni o vorbă, nimeni nu-i dăduse un sfat, dar tot uitându-se așa la ele, le dibuise rosturile ascunse și-acum le folosea. [...]\n" +
        "Iacă în ce chip naviga la vale Cristea Busuioc, spre uimirea pescarilor, a grădinarilor și a celorlalți oameni aflați pe uscat. Unii chiuiau, alții își aruncau căciulile pe sus, alții căscau gura și se minunau: se întâmpla prima oară ca o plută să meargă pe Dunăre, de parcă ar fi fost barcaz*.\n" +
        "Uneori întâlnea vapoare sau remorchere cu convoaie de șlepuri care urcau la deal. Căpitanii trăgeau de fluier speriați, dar pluta îi ocolea cum ocolea grindurile, răgăliile și buștenii duși de ape, iar plutașul își scotea căciula, salutându-i pe căpitani cu buna-cuviință a lui de țăran.\n" +
        "Așa trecu pe la Galați, trecu de Cotul Pisicii, o luă spre răsărit, lăsă Tulcea într-o parte și se duse pe brațul de mijloc al Dunării. [...] Și deodată, în fața plutașului, se deschise un hău înspumat. Gemea marea, amestecându-și apele cenușii cu apele vinete ale cerului adumbrit, iar Cristea Busuioc o privea buimac. [...] Plutașul se prăvăli în apă cu spuma valurilor fierbând peste cap, dar nu-și pierdu cumpătul, ci porni să înoate spre mal. Câțiva oameni alergau speriați în întâmpinarea sa. Pe cel din frunte, mai înalt, ciolănos și rășchirat, ar fi zis că-l știe de undeva. Să juri că-i căprarul Ieremia întâlnit la Galați.\n" +
        "— Tu erai, măi Busuioace? strigă lunganul, oprindu-se țeapăn, când fu la vreo zece pași.\n" +
        "— Eu, dom' căprar! Iacă, ți-am adus pin de catarg! [...]\n" +
        "Ceva mai sus se ridica o corabie, prima corabie pe care o vedea trasă pe uscat, și el, fără să se mai uite la nimeni, cu apa șiroindu-i pe trup, mustind în opinci, porni către ea. [...]\n" +
        "Întorcându-se din port, Anton Lupan fu mirat să vadă între ai săi un străin.\n" +
        "— El e omul de care ți-am vorbit, domnule, îl lămuri Ieremia. Eu îi spusesem să lase pinii la Galați și să ne dea de veste prin cineva, da' uite că ni i-a adus la nas!... [...]\n" +
        "— Am auzit că plecați pe mări, domnule, zise arătându-și pieptul voinic. Iacă, nu-ți cer nicio plată pe lemnul adus și mă leg să-ți fiu de folos și cu ascultare la tot ce mi-i porunci, numai ia-mă și pe mine!",
    },
    {
      ref: "Textul 2",
      title: "Apă-Vie, Apă-Moartă",
      author: "Alexandru N. Stermin",
      sourceNote: "În vol. „Jocuri și jucării”.",
      orderIndex: 2,
      body:
        "Am copilărit într-un sat din sudul Transilvaniei, la Viștea de Sus. Acolo e buricul pământului. Vă spun și de ce! De la mine din curte, dacă mergi spre sud, în șapte ceasuri ajungi la cei mai înalți munți de la noi din țară – Munții Făgăraș. Sunt aici de când lumea, țin cerul pe vârfurile lor. Așa falnici cum îi vedeam, am crezut mereu că nimic nu-i poate străbate. Asta până am descoperit Oltul. La Olt ajungi în două ceasuri dacă mergi încet. Dacă mergi repede, într-o oră ești la malul lui. E un râu care m-a învățat că apa e mai puternică decât stânca, decât munții. Așa încet cum curge, și-a făcut cale prin ei și a reușit să-i treacă.\n\n" +
        "Dacă iei drumul spre răsărit, ajungi la Templul Ursitelor, un loc magic săpat în stâncă. Dacă mergi spre apus, ajungi la Râpa Roșie, unde, povestește Lucian Blaga, e o văgăună mare în care se adăpostește un căpcăun. În spatele grădinii joacă măiestrele, un fel de iele, fete cu părul despletit ce se învârt în horă noaptea și binecuvântează pe toți cei care le văd și nu spun nimănui. Câți oameni din sat nu le-or fi văzut, dar păstrează secretul de teamă să nu le atragă blestemul! Sigur aici este centrul lumii: locul unde joacă măiestrele, unde se întâlnesc ursitele și unde dorm căpcăunii. Mai este însă ceva, la fel de important – o fântână secretă.\n\n" +
        "Cu această fântână începe povestea jocului meu. De fapt, plecând de la joc, o să descoperim împreună fântâna. Joc îi spuneau oamenii mari, dar noi, copiii, știam că nu ne jucăm, era treabă serioasă. Când mă gândesc la cum ne jucam, atunci îmi dau seama că ne luam mult mai mult în serios jocul decât își luau mulți adulți propria viață. [...]\n\n" +
        "Tovarășii mei s-au prins repede de regulile lui și am început să-l jucăm toți, toți copiii de pe ulița mea. L-am numit „Apă-Vie, Apă-Moartă”. Prin fața casei mele trecea un șanț pavat frumos cu pietre, care strângea apa ploilor și o conducea în drumul ei spre locuri neștiute. Între șanț și zidul casei era un trotuar făcut din plăci de beton. Ei bine, toți copiii stăteau în drum, la marginea șanțului, iar pe plăcile de lângă casă stătea un zmeu. Oricare dintre noi putea să fie zmeu. [...]\n\n" +
        "„Apă-Vie, Apă-Moartă” a fost unul dintre cele mai frumoase jocuri ale copilăriei mele. În adolescență, deși nu-l mai jucam, a căpătat și mai multă valoare pentru că, într-o zi, bunicul mi-a povestit că se afla o fântână chiar sub plăcile pe care stătea zmeul. Era acolo, mi-a spus, de mult timp, de pe vremea în care oamenii aveau fântâna în afara curții, la poartă, astfel ca orice călător însetat să poată bea apă.",
    },
  ],
  items: [
    // ── A. Lectură (38p) ──
    {
      section: "I.A", label: "A.1", type: "SHORT", points: 2, autoGradable: false,
      passageRef: "Textul 1",
      content: "Notează, din textul 1, denumirea a două mijloace de transport pe apă.",
      correctAnswer: "Două mijloace dintre: corabie, vapor, plută, barcaz, remorcher, șlep.",
      rubric: [{ label: "barem", points: 2, answer: "2×1p pentru oricare două mijloace de transport pe apă (ex.: corabie, vapor, plută, barcaz, remorcher, șlep)." }],
    },
    {
      section: "I.A", label: "A.2", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 1",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 1. Ieremia i-a cerut lui Cristea să îi aducă",
      options: [{ key: "a", text: "busuioc verde." }, { key: "b", text: "căciuli de lână." }, { key: "c", text: "frânghii noi." }, { key: "d", text: "lemn de pin." }],
      correctAnswer: "d",
    },
    {
      section: "I.A", label: "A.3", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. Se spune că la Râpa Roșie se ascunde",
      options: [{ key: "a", text: "o prințesă." }, { key: "b", text: "o zmeoaică." }, { key: "c", text: "un călător." }, { key: "d", text: "un căpcăun." }],
      correctAnswer: "d",
    },
    {
      section: "I.A", label: "A.4", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Încercuiește litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. Bunicul îi spune nepotului că, pe vremuri, oamenii își construiau fântâna",
      options: [
        { key: "a", text: "în afara satului, într-o râpă." },
        { key: "b", text: "în mijlocul curții, sub pomi." },
        { key: "c", text: "în afara curții, la poartă." },
        { key: "d", text: "în spatele casei, în grădină." },
      ],
      correctAnswer: "c",
    },
    {
      section: "I.A", label: "A.5", type: "TF_GRID", points: 6, autoGradable: true,
      passageRef: "Textul 1, Textul 2",
      content: "Notează „X” în dreptul fiecărui enunț pentru a marca dacă acesta este adevărat sau fals, bazându-te pe informațiile din cele două texte.",
      rubric: [
        { label: "Textul 1 — Ieremia și Cristea Busuioc se știu de pe front, de la Grivița.", points: 1, answer: "Adevărat" },
        { label: "Textul 1 — Oamenii de pe mal sunt uimiți să vadă o plută coborând pe Dunăre.", points: 1, answer: "Adevărat" },
        { label: "Textul 1 — Conform zvonurilor, corabia lui Anton Lupan nu mai pleacă în larg.", points: 1, answer: "Fals" },
        { label: "Textul 2 — Munții Făgăraș se află la sud de Viștea de Sus.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Toți oamenii care văd ielele se grăbesc să povestească despre această experiență.", points: 1, answer: "Fals" },
        { label: "Textul 2 — Jocul copiilor de pe uliță se numește „Apă-Vie, Apă-Moartă”.", points: 1, answer: "Adevărat" },
      ],
      correctAnswer: "Textul 1: A, A, F | Textul 2: A, F, A",
    },
    {
      section: "I.A", label: "A.6", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Transcrie, din secvența următoare, două figuri de stil, pe care le vei preciza: „Așa trecu pe la Galați, trecu de Cotul Pisicii, o luă spre răsărit, lăsă Tulcea într-o parte și se duse pe brațul de mijloc al Dunării. [...] Și deodată, în fața plutașului, se deschise un hău înspumat. Gemea marea, amestecându-și apele cenușii cu apele vinete ale cerului adumbrit, iar Cristea Busuioc o privea buimac”.",
      rubric: [{ label: "barem", points: 6, answer: "2×1p transcrierea a două figuri de stil + 2×2p precizarea felului. Ex.: „gemea marea” – personificare; „apele vinete ale cerului adumbrit” – metaforă." }],
    },
    {
      section: "I.A", label: "A.7", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1, Textul 2",
      content: "Prezintă, în minimum 30 de cuvinte, un element de conținut comun celor două texte date, valorificând câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea unui element comun (ex.: apa, râul) + 2×1p prezentarea din fiecare text + 1p norme + 1p numărul minim de cuvinte." }],
    },
    {
      section: "I.A", label: "A.8", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 2",
      content: "Crezi că lumea din jur poate fi cunoscută prin povești și prin joc? Motivează-ți răspunsul, în 50-100 de cuvinte, valorificând textul 2.",
      rubric: [{ label: "barem", points: 6, answer: "1p menționarea răspunsului + 1p motivarea răspunsului + 2p valorificarea textului 2 + 1p norme + 1p încadrarea în numărul de cuvinte." }],
    },
    {
      section: "I.A", label: "A.9", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Asociază fragmentul din opera literară „Toate pânzele sus!” de Radu Tudoran cu un alt text literar studiat la clasă sau citit ca lectură suplimentară, prezentând, în 50-100 de cuvinte, o valoare comună, prin referire la câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "1p numirea unei valori (ex.: curajul, perseverența, călătoria ca mod de cunoaștere) + 1p titlul și autorul textului asociat + 2p prezentarea valorii comune (secvență din fiecare text) + 1p norme + 1p numărul de cuvinte." }],
    },
    // ── B. Limbă (32p) ──
    {
      section: "I.B", label: "B.1", type: "MCQ", points: 2, autoGradable: true,
      topic: "Diftong",
      content: "Conțin diftong ambele cuvinte din seria:",
      options: [
        { key: "a", text: "„serioasă”, „ploilor”." },
        { key: "b", text: "„abia”, „ajungeau”." },
        { key: "c", text: "„ceasuri”, „corăbiile”." },
        { key: "d", text: "„eu”, „sălbăticiunea”." },
      ],
      correctAnswer: "b",
    },
    {
      section: "I.B", label: "B.2", type: "MCQ", points: 2, autoGradable: true,
      topic: "Cuvinte derivate",
      content: "Seria care cuprinde doar cuvinte derivate este:",
      options: [
        { key: "a", text: "„călător”, „șaisprezece”." },
        { key: "b", text: "„ceilalți”, „cineva”." },
        { key: "c", text: "„copilăriei”, „ciolănos”." },
        { key: "d", text: "„vârfurile”, „plutaș”." },
      ],
      correctAnswer: "c",
    },
    {
      section: "I.B", label: "B.3", type: "MCQ", points: 2, autoGradable: true,
      topic: "Sensul cuvintelor în context",
      content: "Sensul secvenței subliniate în fragmentul „Am copilărit într-un sat din sudul Transilvaniei, la Viștea de Sus. Acolo e buricul pământului.” este:",
      options: [
        { key: "a", text: "loc foarte important." },
        { key: "b", text: "persoană modestă." },
        { key: "c", text: "margine a satului." },
        { key: "d", text: "parte a corpului uman." },
      ],
      correctAnswer: "a",
    },
    {
      section: "I.B", label: "B.4", type: "MCQ", points: 2, autoGradable: true,
      topic: "Omonime",
      content: "Sunt omonime ambele cuvinte din seria:",
      options: [
        { key: "a", text: "„cum îl rugase acum șase săptămâni, în portul Galațiului”; Și ia face parte din portul național." },
        { key: "b", text: "„dar păstrează secretul de teamă să nu atragă blestemul”; Iepurașul tremura de spaimă." },
        { key: "c", text: "„Plutașul se prăvăli în apă cu spuma valurilor”; Nu îmi place să mănânc spuma laptelui." },
        { key: "d", text: "„soseau la gura Siretului, el cobora a doua oară”; „se duceau la vale sau urcau la deal!”." },
      ],
      correctAnswer: "a",
    },
    {
      section: "I.B", label: "B.5", type: "OPEN", points: 6, autoGradable: false,
      content: "Selectează, din secvența următoare, trei substantive în cazuri diferite, pe care le vei preciza: „Între șanț și zidul casei era un trotuar făcut din plăci de beton.”",
      rubric: [{ label: "barem", points: 6, answer: "3×1p selectarea fiecărui substantiv + 3×1p precizarea cazului. Ex.: „(între) șanț” – acuzativ; „casei” – genitiv; „un trotuar” – nominativ." }],
    },
    {
      section: "I.B", label: "B.6", type: "OPEN", points: 6, autoGradable: false,
      content: "Alcătuiește o propoziție negativă, în care verbul la infinitiv „a conduce” să fie complement direct (1), și o propoziție afirmativă, în care pronumele personal „ea” să fie în cazul genitiv (2).",
      rubric: [{ label: "barem", points: 6, answer: "2×1p alcătuirea fiecărui tip de propoziție + 1p verbul la infinitiv cu funcție de complement direct + 1p pronumele „ea” în cazul genitiv + 2×1p norme. Ex.: (1) Nu pot conduce mașina.; (2) Citesc din cartea ei." }],
    },
    {
      section: "I.B", label: "B.7", type: "OPEN", points: 6, autoGradable: false,
      content: "Transcrie propozițiile din fraza următoare, precizând felul acestora: „E un râu care m-a învățat că apa e mai puternică decât stânca, decât munții”.",
      rubric: [{ label: "barem", points: 6, answer: "3×1p transcrierea fiecărei propoziții + 3×1p precizarea felului: „E un râu” – principală; „care m-a învățat” – subordonată atributivă; „că apa e mai puternică decât stânca, decât munții” – subordonată completivă directă." }],
    },
    {
      section: "I.B", label: "B.8", type: "FILL", points: 6, autoGradable: false,
      content: "Scrie, în spațiile libere, forma corectă a cuvintelor subliniate în următorul enunț, reprezentând mesajul unui participant la o competiție nautică: „Dacă ar apărea / ar apare (1) ocazia, prieteni / prietenii (2) tăi, care sunt mândri / mândrii (3) de tine și al căror / a căror (4) părere este importantă, vor ca tu să nu fii / să nu fi (5) un simplu concurent, ci căpitanul echipei, fiindcă / fiind că (6) își doresc să câștige competiția.”",
      correctAnswer: "ar apărea, prietenii, mândri, a căror, să nu fii, fiindcă",
      rubric: [{ label: "barem", points: 6, answer: "6×1p: ar apărea, prietenii, mândri, a căror, să nu fii, fiindcă." }],
    },
    // ── SUBIECTUL al II-lea (20p) — caracterizare ──
    {
      section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 20, autoGradable: false,
      passageRef: "Textul 1",
      content:
        "Scrie o compunere, de minimum 150 de cuvinte, în care să îl caracterizezi pe Busuioc, personajul din textul lui Radu Tudoran. Vei avea în vedere: notarea a două date de identificare a personajului (vârstă, ocupație, portret fizic etc.); prezentarea, prin câte o secvență comentată, a două trăsături morale ale personajului; precizarea a două mijloace de caracterizare diferite, prin care se evidențiază trăsăturile morale prezentate; corelarea unei valori personale cu una dintre valorile personajului. Compunerea nu va fi precedată de titlu sau de motto.",
      rubric: [
        { label: "Conținut", points: 12, answer: "2×1p notarea a două date de identificare + 2×3p prezentarea a două trăsături morale prin câte o secvență comentată (1p precizarea trăsăturii + 2p comentarea, fiecare) + 2×1p precizarea a două mijloace de caracterizare diferite + 2p corelarea unei valori personale cu una dintre valorile personajului (1p identificare + 1p corelare)." },
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
  console.log(`\n=== import-exam-ro-2025-sesiune-speciala (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
