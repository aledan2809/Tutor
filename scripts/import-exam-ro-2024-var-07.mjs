#!/usr/bin/env node
/**
 * import-exam-ro-2024-var-07.mjs — Exam-Bank · Limba și literatura română
 *
 * EN VIII 2024 Varianta 7 (anul școlar 2023–2024). Subiect + barem oficiale
 * (Ministerul Educației / CNPEE — publice). Texte verbatim; chei ground-truth din BAREM.
 *
 * Textul 1 = poezie (Labiș, „Toamna"). Subiectul al II-lea = mesaj/semnificație. Fără figuri.
 * Idempotent · Modes: --validate / --dry / (apply). DB: DATABASE_URL din env (VPS2 local PG).
 */

const MODE = process.argv.includes("--validate")
  ? "validate"
  : process.argv.includes("--dry")
    ? "dry"
    : "apply";

const RO = {
  source: "EN VIII 2024 Varianta 7 — Limba și literatura română (CNPEE)",
  examType: "EN_VIII",
  year: 2024,
  subjectKey: "limba_romana",
  subjectName: "Limba și literatura română",
  grade: 8,
  variant: "varianta-07",
  maxScore: 100,
  officeBonus: 10,
  timeLimit: 120,
  language: "ro",
  sourceUrl: "https://subiecte.edu.ro/2024/evaluareanationala/",
  license: "edu.ro public (Ministerul Educației și Cercetării / CNPEE)",
  passages: [
    {
      ref: "Textul 1",
      title: "Toamna",
      author: "Nicolae Labiș",
      sourceNote: "*șofran – condiment ce colorează puternic în galben; *tui – steag turcesc ornat cu cozi de cal; *trâmbă – vârtej; *păpușoi – porumb; *bumb – nasture rotund; *strujan – tulpina porumbului, cu tot cu frunze.",
      orderIndex: 1,
      body:
        "Par casele palate sub vraja înserării\n" +
        "Și norii le mângâie cu palme de șofran*.\n" +
        "Și nu-i mai larg și pașnic nici însuși cerul mării\n" +
        "Decât acest cer veșted și-adânc, de Bărăgan.\n\n" +
        "Își saltă roșii tuiuri* în vânturi păpușoii*\n" +
        "Mișcând sub adiere aripe de strujeni*;\n" +
        "Trăgând la care pline merg lung pe drumuri boii\n" +
        "Pe lângă negre garduri mâncate de licheni.\n\n" +
        "Cresc focuri mari de frunze cu scânteieri ușoare\n" +
        "Spre luna încruntată, lipsită de un sfert,\n" +
        "Iar vântul poartă-n trâmbe* miresme-mbietoare\n" +
        "De lapte proaspăt muls și proaspăt fiert.\n\n" +
        "Albastrul cer de seară se despletește-n vară\n" +
        "Și bumbi* de stele roșii la geamuri se aprind,\n" +
        "Ogrăzile arată cu toate în afară\n" +
        "Belșugul lor tăcut ce îl cuprind.",
    },
    {
      ref: "Textul 2",
      title: "Stresul sărbătorilor. Mutat la țară",
      author: "Andy Hertz",
      sourceNote: "În Dilema Veche, nr. 976/2022. (*dubă – (aici) tobă)",
      orderIndex: 2,
      body:
        "Am crescut la casă, în comuna Săvârșin din județul Arad, copilărind pe dealuri și pe văi, până când viața m-a dus la oraș. Dar până atunci, mi-am construit colibe, am distrus vreo cinci biciclete, m-am lovit, m-am pierdut în pădure, am fost mușcat de cal și câte n-au mai fost. Din 2016, după ce m-am întors de la Londra, am ajuns să trăiesc la munte și să fiu liber, iar asta pentru mine înseamnă mult. Dacă viața mea de acum se datorează dealurilor și văilor pe care mi-am tocit călcâiele la un moment dat, nu știu. Dar știu că dealurile nu cresc în spatele blocului și văile nu curg la robinet. Liftul nu e bicicletă. Casa scării nu e curte. Și câinele din desene animate nu e câine.\n\n" +
        "Cum ar fi fost la oraș? Nu vreau să știu. Și nu știe nici fetița mea. Dacă natura ar fi scris câteva recomandări pe certificatul de părinte, cu siguranță asta ar fi fost una dintre ele: să crească la țară!\n" +
        "În Londra, unde am locuit șase ani, mergeam pe stradă printre mii de oameni și eram singur. Aici, la munte, când merg singur pe drum știu că nu sunt singur. Mă văd sătenii și mă invită în casele lor. Mă trezesc adesea cu câte o farfurie de ciorbă în față, chiar dacă destinația mea e cu totul alta. Și asta nu se întâmplă doar de sărbători, ci tot timpul.\n" +
        "Cu toate acestea, Crăciunul e frumos oriunde ai fi, dacă ai oameni dragi în preajmă, pentru că e mai degrabă o stare de spirit, un moment magic al întâlnirii, al iertării, al prieteniei. Și aș vrea să spun că este cea mai minunată perioadă din an, datorită colindătorilor care încă mai vin la uși cântând, datorită aerului de sărbătoare, mirosului de prăjituri, zăpezii și, mai ales, datorită rudelor și prietenilor, dar, de fapt, fiecare perioadă din an are farmecul ei la țară. Primăvara este la fel de frumoasă, odată ce aduce cu ea o resetare a vieții omului, an de an. Vara, care ne lipsește multe luni de zile, e timpul în care consumăm cea mai mare parte din energie, pentru că la țară nu ai concediu, ci profiți de timpul bun ca să îți faci lucrările mari din gospodărie, iar sentimentul de concediu e prezent în fiecare zi, chiar dacă lucrezi. Toamna cu roadele și culorile pe care ni le dăruiește își are rolul ei într-o viață echilibrată de la țară. Așa că nu, iarna nu este cel mai fericit anotimp, ci este unul la fel de fericit.\n" +
        "Aici, acasă, la munte, Crăciunul parcă începe mai repede. Am împodobit un brad deja de la începutul lunii și vom pune podoabe pe cei replantați pe terenul casei – pentru că noi nu aruncăm brazi. Însă nu contează așa de mult ce e pe masă sau cât de mare e bradul împodobit lângă masă, ci contează mai mult cine vine la masă. Familia, prietenii și vecinii care apar colindând prin zăpadă, ei fac ca sărbătorile să fie Sărbători. De cele mai multe ori am petrecut Crăciunul la țară, fie în Apuseni, în ultimii ani, fie la Ghilad, în Banat, la rude, sau în timpul copilăriei, la Săvârșin – despre dubașii de la Săvârșin găsiți o grămadă de articole online. Sunetul dubelor pe văi nu poate fi egalat, parcă le și aud acum, nici nu e nevoie să închid ochii. Am avut o copilărie plină și îmi amintesc de iernile în Săvârșinul acoperit de zăpadă, când zilele își întindeau orele în întunericul nopții și încă ne dădeam drumul cu săniile de pe deal. Poate faptul că eram copil, poate sunetul dubelor, poate prăjiturile mamei… poate că toate la un loc îmi răscolesc sufletul și îmi aduc aminte mereu și mereu de vremea copilăriei în timpul sărbătorilor. Astfel de amintiri vreau să dăruiesc fetiței mele care crește la munte.\n" +
        "Așadar, nu pot face comparație între Crăciunul petrecut la sat și cel de la oraș, însă eu cred că sunt norocos să petrec sărbătorile la țară. Chiar acum, în liniștea satului, ne bucurăm de zăpada care deja a acoperit, aparent, o lume întreagă. De ce e frumos la sat? La sat, oamenii se ajută. La oraș, mulți vecini nu se cunosc între ei. Uneori îi desparte doar un perete, dar nu își cunosc numele. [...]\n" +
        "Orașul oferă diverse oportunități, dar în zilele noastre o fugă până la oraș nu mai înseamnă mare lucru. Pe vremuri își pregătea omul traista și carul pentru un lung drum de câțiva kilometri. Astăzi te sui pur și simplu în mașină, în vârf de munte, și îți duci copilul la teatru de păpuși la oraș. Mă bucur să văd că multe dintre tradițiile și obiceiurile românești sunt mai popularizate ca oricând. Când eram copil n-am văzut sau auzit atâtea despre ele ca acum.\n" +
        "Nu am la îndemână statistici, dar am postările membrilor din comunitatea Mutat la țară – Viața fără ceas, grupul Facebook care a adunat 250.000 de membri în câțiva ani. Sigur, viața la țară are avantaje și dezavantaje, așa cum e peste tot în lume. Aici, pe Pământ, nu trăim în paradis, ci într-un cerc al binelui și al răului. Dar ceea ce văd, ceea ce citesc, ceea ce ascult și ceea ce trăiesc, la un loc, îmi creează un sentiment de bine cu privire la viața în mediul rural.",
    },
  ],
  items: [
    // ── A. Lectură (38p) ──
    {
      section: "I.A", label: "A.1", type: "SHORT", points: 2, autoGradable: false,
      passageRef: "Textul 1",
      content: "Notează, din textul 1, doi termeni care fac parte din câmpul lexical al naturii.",
      correctAnswer: "Doi termeni dintre: nori, lună, păpușoi, frunze, stele, vânt.",
      rubric: [{ label: "barem", points: 2, answer: "2×1p pentru oricare doi termeni din câmpul lexical al naturii (ex.: lună, păpușoi, nori, frunze, stele)." }],
    },
    {
      section: "I.A", label: "A.2", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 1",
      content: "Scrie litera corespunzătoare răspunsului corect, valorificând informațiile din textul 1. În sat miroase a",
      options: [{ key: "a", text: "frunze." }, { key: "b", text: "lapte." }, { key: "c", text: "păpușoi." }, { key: "d", text: "șofran." }],
      correctAnswer: "b",
    },
    {
      section: "I.A", label: "A.3", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Scrie litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. O tradiție de Crăciun specifică zonei Săvârșin este",
      options: [{ key: "a", text: "colindatul dubașilor." }, { key: "b", text: "gătirea prăjiturilor." }, { key: "c", text: "împodobirea brazilor." }, { key: "d", text: "mersul la teatru." }],
      correctAnswer: "a",
    },
    {
      section: "I.A", label: "A.4", type: "MCQ", points: 2, autoGradable: true,
      passageRef: "Textul 2",
      content: "Scrie litera corespunzătoare răspunsului corect, valorificând informațiile din textul 2. În 2016, autorul se întoarce",
      options: [{ key: "a", text: "din Banat." }, { key: "b", text: "de la Săvârșin." }, { key: "c", text: "de la Londra." }, { key: "d", text: "de la Ghilad." }],
      correctAnswer: "c",
    },
    {
      section: "I.A", label: "A.5", type: "TF_GRID", points: 6, autoGradable: true,
      passageRef: "Textul 1, Textul 2",
      content: "Notează „X” în dreptul fiecărui enunț pentru a stabili dacă este adevărat sau fals, bazându-te pe informațiile din cele două texte.",
      rubric: [
        { label: "Textul 1 — Peisajul rural prezentat este observat într-o seară.", points: 1, answer: "Adevărat" },
        { label: "Textul 1 — De la câmp, căruțele se întorc în sat încărcate.", points: 1, answer: "Adevărat" },
        { label: "Textul 1 — Deasupra satului răsare luna plină.", points: 1, answer: "Fals" },
        { label: "Textul 2 — Autorul are convingerea că un copil trebuie să crească la țară.", points: 1, answer: "Adevărat" },
        { label: "Textul 2 — Andy Hertz și-a petrecut toate sărbătorile doar la sat.", points: 1, answer: "Fals" },
        { label: "Textul 2 — Unii dintre cei care se mută la țară formează o comunitate pe Facebook.", points: 1, answer: "Adevărat" },
      ],
      correctAnswer: "Textul 1: A, A, F | Textul 2: A, F, A",
    },
    {
      section: "I.A", label: "A.6", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Precizează, în unu – două enunțuri, rima poeziei și măsura primului vers.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea rimei (încrucișată) + 2p precizarea măsurii primului vers (14 silabe) + 1p norme + 1p numărul de enunțuri." }],
    },
    {
      section: "I.A", label: "A.7", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1, Textul 2",
      content: "Prezintă, în minimum 30 de cuvinte, un element de conținut comun celor două texte date, valorificând câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "2p precizarea unui element comun (ex.: satul, natura, munca) + 2×1p prezentarea din fiecare text + 1p norme + 1p numărul minim de cuvinte." }],
    },
    {
      section: "I.A", label: "A.8", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 2",
      content: "Crezi că viața la sat este mai plăcută decât viața la oraș? Motivează-ți răspunsul, în 50 – 100 de cuvinte, valorificând textul 2.",
      rubric: [{ label: "barem", points: 6, answer: "1p menționarea răspunsului + 1p motivarea răspunsului + 2p valorificarea textului 2 + 1p norme + 1p încadrarea în numărul de cuvinte." }],
    },
    {
      section: "I.A", label: "A.9", type: "OPEN", points: 6, autoGradable: false,
      passageRef: "Textul 1",
      content: "Asociază opera literară „Toamna” de Nicolae Labiș cu un alt text literar studiat la clasă sau citit ca lectură suplimentară, prezentând, în 50 – 100 de cuvinte, o valoare comună, prin referire la câte o secvență relevantă din fiecare text.",
      rubric: [{ label: "barem", points: 6, answer: "1p numirea unei valori (ex.: prețuirea naturii, hărnicia) + 1p titlul și autorul textului asociat + 2p prezentarea valorii comune (secvență din fiecare text) + 1p norme + 1p numărul de cuvinte." }],
    },
    // ── B. Limbă (32p) ──
    {
      section: "I.B", label: "B.1", type: "MCQ", points: 2, autoGradable: true,
      topic: "Diftong",
      content: "Conțin diftong ambele cuvinte din seria:",
      options: [
        { key: "a", text: "„văilor”, „tradițiile”." },
        { key: "b", text: "„mângâie”, „dealurile”." },
        { key: "c", text: "„creează”, „săniile”." },
        { key: "d", text: "„Crăciunul”, „concediu”." },
      ],
      correctAnswer: "b",
    },
    {
      section: "I.B", label: "B.2", type: "MCQ", points: 2, autoGradable: true,
      topic: "Cuvinte derivate cu sufix",
      content: "Seria care cuprinde doar cuvinte derivate cu sufix este:",
      options: [
        { key: "a", text: "„binelui”, „dezavantaje”." },
        { key: "b", text: "„câțiva”, „colindătorilor”." },
        { key: "c", text: "„copilăriei”, „sătenii”." },
        { key: "d", text: "„ultimii”, „frumoasă”." },
      ],
      correctAnswer: "c",
    },
    {
      section: "I.B", label: "B.3", type: "MCQ", points: 2, autoGradable: true,
      topic: "Antonime",
      content: "Antonimele cuvintelor subliniate în secvența „Toamna cu roadele și culorile pe care ni le dăruiește își are rolul ei într-o viață echilibrată de la țară. Așa că nu, iarna nu este cel mai fericit anotimp, ci este unul la fel de fericit.” se regăsesc, în ordine, în seria:",
      options: [
        { key: "a", text: "strictă, luminos." },
        { key: "b", text: "riguroasă, supărat." },
        { key: "c", text: "ordonată, bucuros." },
        { key: "d", text: "haotică, trist." },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.4", type: "MCQ", points: 2, autoGradable: true,
      topic: "Sensul cuvintelor în context",
      content: "Sensul secvenței subliniate în enunțul „Nu am la îndemână statistici, dar am postările membrilor din comunitatea” este:",
      options: [
        { key: "a", text: "nu stric rânduiala." },
        { key: "b", text: "nu prezint asemănări." },
        { key: "c", text: "nu am pus mâna pe." },
        { key: "d", text: "nu am la dispoziție." },
      ],
      correctAnswer: "d",
    },
    {
      section: "I.B", label: "B.5", type: "OPEN", points: 6, autoGradable: false,
      content: "Selectează, din fragmentul următor, trei verbe la moduri diferite, pe care le vei preciza: „Cum ar fi fost la oraș? Nu vreau să știu. Și nu știe nici fetița mea. Dacă natura ar fi scris câteva recomandări pe certificatul de părinte, cu siguranță asta ar fi fost una dintre ele”.",
      rubric: [{ label: "barem", points: 6, answer: "3×1p selectarea a trei verbe + 3×1p precizarea modului (diferit). Ex.: „ar fi fost” – condițional-optativ; „(nu) vreau” – indicativ; „să știu” – conjunctiv." }],
    },
    {
      section: "I.B", label: "B.6", type: "OPEN", points: 6, autoGradable: false,
      content: "Alcătuiește o propoziție negativă, în care pronumele personal, la persoana I, numărul singular să aibă funcția sintactică de atribut (1), și un enunț imperativ, în care substantivul „bunică” să fie în cazul acuzativ (2).",
      rubric: [{ label: "barem", points: 6, answer: "2×1p alcătuirea fiecărui tip de enunț + 1p respectarea funcției sintactice (atribut) + 1p respectarea cazului acuzativ + 2×1p norme. Ex.: (1) Cartea de la mine nu este despre animale.; (2) Sun-o pe bunica!" }],
    },
    {
      section: "I.B", label: "B.7", type: "OPEN", points: 6, autoGradable: false,
      content: "Transcrie propozițiile subordonate din fraza următoare, precizând felul acestora: „Dacă viața mea de acum se datorează dealurilor și văilor pe care mi-am tocit călcâiele la un moment dat, nu știu.”.",
      rubric: [{ label: "barem", points: 6, answer: "2×1p transcrierea fiecărei propoziții subordonate + 2×2p precizarea felului: „Dacă viața mea de acum se datorează dealurilor și văilor” – completivă directă; „pe care mi-am tocit călcâiele la un moment dat” – atributivă." }],
    },
    {
      section: "I.B", label: "B.8", type: "FILL", points: 6, autoGradable: false,
      content: "Scrie, în spațiile libere, forma corectă a cuvintelor subliniate în următorul enunț: „Invitarea vecinilor noștri / noștrii (1) la picnicul din mijlocul livezii / livadei (2) a creat / a creeat (3) imediat raporturi / rapoarte (4) de prietenie, iar ideea / idea (5), ai cărei / a cărei (6) inițiatori suntem noi, s-a dovedit foarte bună.”",
      correctAnswer: "noștri, livezii, a creat, raporturi, ideea, ai cărei",
      rubric: [{ label: "barem", points: 6, answer: "6×1p: noștri, livezii, a creat, raporturi, ideea, ai cărei." }],
    },
    // ── SUBIECTUL al II-lea (20p) — mesaj/semnificație ──
    {
      section: "Subiectul al II-lea", label: "II", type: "OPEN", points: 20, autoGradable: false,
      passageRef: "Textul 1",
      content:
        "Scrie un text de minimum 150 de cuvinte, în care să prezinți mesajul/o semnificație a textului „Toamna” de Nicolae Labiș. În redactarea textului: vei preciza mesajul/o semnificație a textului, prin referire la temă; vei menționa patru elemente ale peisajului descris; vei interpreta două figuri de stil diferite, relevante pentru mesaj/semnificație; vei prezenta o emoție exprimată/un sentiment exprimat în textul poetic. Compunerea nu va fi precedată de titlu sau de motto.",
      rubric: [
        { label: "Conținut", points: 12, answer: "1p mesajul/o semnificație + 1p tema + 4×1p menționarea a patru elemente ale peisajului + 2×2p interpretarea a două figuri de stil diferite + 2p prezentarea unei emoții/unui sentiment." },
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
  console.log(`\n=== import-exam-ro-2024-var-07 (mode=${MODE}) ===`);
  validate();
  if (MODE === "validate") return;
  await run(MODE === "dry");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
