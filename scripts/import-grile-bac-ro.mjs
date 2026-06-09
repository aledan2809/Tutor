#!/usr/bin/env node
/**
 * import-grile-bac-ro.mjs — BAC Limba și literatura română → GRILE (MCQ)
 *
 * BAC RO has NO official MCQ (it is essays + open comprehension). But each official paper
 * ships a BAREM with the official model answers. These grile are built FROM that ground truth:
 *   • the question is the official cerință (reformulated as a direct MCQ),
 *   • the CORRECT option is the official barem answer (verbatim sense),
 *   • the distractors are plausible-but-wrong options.
 * No AI generation of content; correctness is barem-anchored (per L07a — generation only where
 * no official source exists; here the official answer key IS the source). The supporting text is
 * reused verbatim from the already-imported ExamPaper passage (no duplication).
 *
 * Target: domain `romana-ix-xii` (slug → Bacalaureat in the public dropdown classifier),
 * subject "Română — Bacalaureat", source MANUAL, status PUBLISHED → visible in Grile + homepage
 * demo (under the "Bacalaureat" group). Idempotent: deletes prior bac-grile:% rows then recreates.
 *
 * Modes: --validate / --dry / (apply). DB: DATABASE_URL din env (VPS2 local PG).
 */

const MODE = process.argv.includes("--validate") ? "validate" : process.argv.includes("--dry") ? "dry" : "apply";

const SUBJECT = "Română — Bacalaureat";
const DOMAIN_SLUG = "romana-ix-xii";
const TEXT = "Înțelegerea textului";
const VOCAB = "Vocabular și semantică";

// Per paper: barem-anchored MCQ. `correct` MUST equal one option verbatim.
const GRILE = [
  {
    year: 2025, variant: "model",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Valorificând textul, sensul din text al cuvântului „depășit” (în secvența „un obicei depășit de a te fotografia”) este:",
        options: ["învechit", "modern", "obositor", "costisitor"], correct: "învechit" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al secvenței „pe larg” (în „îi relata pe larg măicuței întâmplările de peste zi”) este:",
        options: ["în detaliu", "pe scurt", "cu voce tare", "în glumă"], correct: "în detaliu" },
      { label: "A.2", topic: TEXT, content: "Conform textului, talentul Ilenei Colonel Antonu se manifestă în domeniile:",
        options: ["pictura și muzica", "pictura și sculptura", "muzica și dansul", "literatura și pictura"], correct: "pictura și muzica" },
      { label: "A.3", topic: TEXT, content: "O caracteristică a scrisorii trimise de Radu soției sale, așa cum reiese din text, este:",
        options: ["dimensiunea amplă (optsprezece pagini)", "tonul oficial", "lungimea foarte redusă", "scrisul indescifrabil"], correct: "dimensiunea amplă (optsprezece pagini)" },
      { label: "A.4", topic: TEXT, content: "Un motiv pentru care Liviu Rebreanu scria scrisori imediat după câte un eveniment era:",
        options: ["dorința de a împărtăși detaliat experiența trăită", "o obligație de serviciu", "lipsa altor activități", "teama de a nu uita drumul"], correct: "dorința de a împărtăși detaliat experiența trăită" },
      { label: "A.5", topic: TEXT, content: "Reacția femeilor la vederea portretelor copiilor lor, realizate de pictoriță pornind de la fotografii, este una de:",
        options: ["uimire", "dezamăgire", "indiferență", "teamă"], correct: "uimire" },
    ],
  },
  {
    year: 2025, variant: "simulare",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Sensul din text al cuvântului „reală” (în secvența „o reală istorie a muzicii simfonice clasice”) este:",
        options: ["adevărată", "falsă", "îndelungată", "plictisitoare"], correct: "adevărată" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al secvenței „dădea la o parte” (în „sufleorul dădea la o parte capacul cuștii sale”) este:",
        options: ["îndepărta", "apăsa", "repara", "ascundea"], correct: "îndepărta" },
      { label: "A.2", topic: TEXT, content: "Conform textului, Universitatea „Regele Ferdinand”, refugiată în timpul războiului, a funcționat la:",
        options: ["Sibiu", "Cluj", "Iași", "București"], correct: "Sibiu" },
      { label: "A.3", topic: TEXT, content: "Domeniul artistic în care se manifestă spiritul competitiv al studenților de la Medicină și Litere este:",
        options: ["teatrul", "pictura", "muzica", "dansul"], correct: "teatrul" },
      { label: "A.4", topic: TEXT, content: "Un motiv pentru care spectacolul regizat de Liviu Rusu a atras atenția a fost:",
        options: ["noutatea abordării și soluțiile experimentale", "distribuția foarte numeroasă", "durata neobișnuit de scurtă", "decorul bogat și costisitor"], correct: "noutatea abordării și soluțiile experimentale" },
      { label: "A.5", topic: TEXT, content: "Un efect pe care îl are muzica simfonică asupra tânărului Ștefan Aug. Doinaș, conform textului, este:",
        options: ["descoperirea de sine", "plictiseala", "somnolența", "indiferența"], correct: "descoperirea de sine" },
    ],
  },
  {
    year: 2025, variant: "var-06",
    passage:
      "Fără Ion Pillat n-ar fi întreagă galeria scriitorilor care au trăit și s-au manifestat în spațiul dintre cele două războaie mondiale. Puțin cunoscut și apreciat de confrați, pentru lipsa lui din mijlocul lor, el a trăit totuși intens și a cunoscut o parte din glorie în viață.\n" +
      "Pillat a fost un poet de interior. Departe totdeauna de zgomotul orașelor, a preferat biblioteca, studiul, singurătatea, liniștea, casa, oricăror altor risipiri. A scris mult, a tradus și a umblat. Este, poate, unul dintre singurii scriitori din vremea lui care a călcat cel mai mult țara pas cu pas, a căutat să-i descifreze frumusețile și a iubit-o pentru că a cunoscut-o. I-a colindat mănăstirile, i-a știut monumentele și, mai ales, s-a îmbătat până la extaz de măreția munților și de neliniștea permanentă a mării.\n" +
      "Pe Ion Pillat nu cred că ar putea spune cineva că l-a cunoscut total, și aceasta nu pentru că era un om complicat. Dimpotrivă, amabil, simplu în expunere, scăpa totuși printre degete celui care ar fi vrut să-l cunoască mai de aproape. Era un poet dublat de un cunoscător adânc al sufletului omenesc.\n" +
      "În tinerețea mea, cum am mai mărturisit și cu alte ocazii, m-a interesat să cunosc, să aud, să-mi însemn și, pentru că nu voiam să rămân numai la cei care frecventau cafeneaua literară, am căutat împrejurări favorabile și pentru cunoașterea acelora pe care nu-i puteam întâlni decât în drum. [...]\n" +
      "Găsisem la anticariat o plachetă din poezia lui Francis Jammes, în traducerea lui și a lui N. I. Herescu. Am cumpărat-o și am alergat din nou la Constantin Stelian, rugându-l să-mi înlesnească un autograf, dar cum acesta era tocmai în perioada unor examene, a trebuit să-mi amân bucuria.\n" +
      "Prilejul s-a ivit tocmai la Ziua Cărții, în anul 1938. Era într-o convorbire cu Horia Furtună și Ion Minulescu. Vorbeau despre traduceri și Ion Pillat tocmai voia să demonstreze că traducerile sunt o necesitate și că apariția lor masivă dovedește lipsa literaturii autohtone de calitate, de unde și dezinteresul cititorului român față de lucrările scriitorilor români.\n" +
      "— Este adevărat, susținea el, că traducerea umple un gol, dar ea trebuie să completeze, nu să înlocuiască.\n" +
      "M-a întrebat de ce vreau autograful. Răspunsul că aveam o bibliotecă frumoasă și că voiam s-o fac mai frumoasă se părea că l-a încântat. După ce mi-a scris câteva rânduri pe prima pagină a cărții, a scos din buzunar placheta „Satul meu”, apărută în colecția „Cartea vremii”, în anul 1923, și-a semnat pe ea numele, a pus data și mi-a întins-o.\n" +
      "— Tot pentru biblioteca dumitale!\n" +
      "M-am dus repede, am cumpărat „Scrisori către Plante”, carte care îmi apăruse cu un an mai înainte [...], am scris pe ea câteva rânduri și m-am grăbit să i-o dau.\n" +
      "L-am mai întâlnit după aceea de multe ori la „Gândirea”. Acum, de câte ori îl salutam, îmi zâmbea, iar când se ivea prilejul, îmi întindea mâna ca unui vechi cunoscut.\n" +
      "(Virgil Carianopol, „Ion Pillat”, în volumul „Scriitori care au devenit amintiri”)",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Sensul din text al cuvântului „glorie” (în „a cunoscut o parte din glorie în viață”) este:",
        options: ["faimă", "rușine", "sărăcie", "tristețe"], correct: "faimă" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al secvenței „din nou” (în „am alergat din nou la Constantin Stelian”) este:",
        options: ["iarăși", "repede", "încet", "deloc"], correct: "iarăși" },
      { label: "A.2", topic: TEXT, content: "Cei doi traducători ai poeziilor lui Francis Jammes, conform textului, sunt:",
        options: ["Ion Pillat și N. I. Herescu", "Horia Furtună și Ion Minulescu", "Virgil Carianopol și Constantin Stelian", "Constantin Stelian și Ion Pillat"], correct: "Ion Pillat și N. I. Herescu" },
      { label: "A.3", topic: TEXT, content: "O pasiune a scriitorului Ion Pillat, așa cum reiese din text, este:",
        options: ["călătoria și colindarea țării", "vânătoarea", "pictura", "jocul de cărți"], correct: "călătoria și colindarea țării" },
      { label: "A.4", topic: TEXT, content: "Virgil Carianopol cumpără volumul „Scrisori către Plante” pentru:",
        options: ["a i-l dărui lui Ion Pillat", "a-l citi în tren", "a-l vinde la anticariat", "a-l traduce în franceză"], correct: "a i-l dărui lui Ion Pillat" },
      { label: "A.5", topic: TEXT, content: "Opinia lui Ion Pillat despre traduceri, conform textului, este că acestea:",
        options: ["sunt necesare, dar trebuie să completeze, nu să înlocuiască", "sunt complet inutile", "sunt mai bune decât originalele", "trebuie interzise"], correct: "sunt necesare, dar trebuie să completeze, nu să înlocuiască" },
    ],
  },
  {
    year: 2025, variant: "var-07",
    passage:
      "Era în anul universitar 1926-1927, prin octombrie, la Facultatea de Filozofie și Litere din București. Toți profesorii începuseră să-și inaugureze cursurile și, la unii dintre ei, sălile erau pline până la refuz. Cea mai mare afluență o găseai la cursurile lui N. Iorga, Vasile Pârvan, Mihail Dragomirescu, C.C. Giurescu, Charles Drouhet, Ovid Densusianu și I. Aurel Candrea; la unii, pentru talentul oratoric; la alții, pentru știința pură, iar la cei din a treia categorie, și pentru oratorie, și pentru știință.\n" +
      "Profesorul Vasile Pârvan, care preda „Arheologia”, era și un foarte bun vorbitor, și un excepțional om de știință [...].\n" +
      "La deschiderea cursului său, sala „Odobescu” era ticsită nu numai de studenți, ci și de îndrăgostiții de rara măiestrie a profesorului de a prezenta arheologia, cu un neîntrecut farmec poetic. [...]\n" +
      "În sală stăpânea rumoarea obișnuită în toate sălile de conferințe în asemenea ocazii. Lumea își împărtășește păreri, face aprecieri, caracterizări și pronosticuri, nu se poate abține să nu vorbească și este firesc să fie așa.\n" +
      "Deodată, orice șoaptă încetă brusc și asistența se ridică în picioare, începând să aplaude.\n" +
      "La început n-am putut zări pe nimeni. Soarele de toamnă, în crepuscul, străbătea palid și delicat pe ferestrele largi ale sălii de curs, prefirându-și ultimele raze [...]. Părea o aureolă estompată, care totuși îmi luă ochii pentru o clipă numai. Privirea mi se obișnui instantaneu și, în spatele catedrei, zării un omuleț, cu o figură nespus de simpatică, așteptând momentul prielnic să-și înceapă alocuțiunea. Ochii-i, extrem de vioi, îi străluceau de o neobișnuită inteligență. Și, cu toate că de statură mică, bărbatul de la catedră îți impunea, de la început chiar, prin atitudinea sa hotărâtă, dârză, așa cum pe timpuri probabil, impresionaseră faimoșii conducători de oști: Alexandru Macedon, Ștefan cel Mare și Napoleon, nici ei prea mari de statură.\n" +
      "Plecându-și ușor capul, în semn de răspuns la salutul ce-i fusese adresat prin ridicarea în picioare și aplauze, profesorul se adresă asistenței cu voce caldă și pătrunzătoare:\n" +
      "— Cei care mă cunosc din anii trecuți s-au obișnuit cu mine; cei noi vor fi surprinși să constate că au în fața dumnealor un om cu înfățișare modestă, mic de stat… un om care-și ilustrează perfect numele: Pârvan… numele vine de la „parvus”, adică mic, biet… fără o înfățișare arătoasă, deci „parvus” – „parvanus” – „pârvan”...!\n" +
      "Un ropot de aplauze pornite din suflet răsplăti din plin gluma strălucitului profesor. [...]\n" +
      "Toți îl ascultam într-o tăcere desăvârșită, religioasă, într-o admirație deosebită. Eu îi sorbeam cuvintele și aș fi dorit ca alocuțiunea lui, ce mă fermecase ca nicio alta până atunci, să dureze ore întregi, dacă ar fi fost posibil. Căci în fața noastră, a studenților săi extaziați de maestrul lor, nu vorbea un profesor universitar oarecare, ci un bărbat care, până la vârsta de 45 de ani neîmpliniți, urcase cu strălucire toate treptele gloriei științifice și universitare și se afla acum în vârful piramidei, încununarea prodigioasei sale activități istorice fiind faimoasa lucrare „Getica” – o protoistorie a Daciei.\n" +
      "(Grigore Băjenaru, „Părintele «Geticei»”) [alocuțiune = scurtă cuvântare ocazională]",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Sensul din text al cuvântului „prielnic” (în „așteptând momentul prielnic”) este:",
        options: ["favorabil", "nefavorabil", "întâmplător", "neașteptat"], correct: "favorabil" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al secvenței „pe timpuri” (în „așa cum pe timpuri probabil, impresionaseră”) este:",
        options: ["odinioară", "în viitor", "niciodată", "mereu"], correct: "odinioară" },
      { label: "A.2", topic: TEXT, content: "O caracteristică a profesorilor la al căror curs de inaugurare sălile erau pline, conform textului, este:",
        options: ["talentul oratoric", "severitatea", "indiferența", "lipsa de experiență"], correct: "talentul oratoric" },
      { label: "A.3", topic: TEXT, content: "Momentul zilei în care are loc cursul de inaugurare susținut de Vasile Pârvan este:",
        options: ["la asfințit", "în zori", "la prânz", "la miezul nopții"], correct: "la asfințit" },
      { label: "A.4", topic: TEXT, content: "Un motiv pentru care Vasile Pârvan face referire la originea numelui său este:",
        options: ["pentru a capta atenția publicului printr-o glumă", "pentru a se lăuda cu studiile sale", "pentru a-și cere scuze", "pentru a începe lecția de limba latină"], correct: "pentru a capta atenția publicului printr-o glumă" },
      { label: "A.5", topic: TEXT, content: "Atmosfera din sala „Odobescu”, înainte de începerea cursului susținut de Vasile Pârvan, este:",
        options: ["animată", "tristă", "ostilă", "plictisitoare"], correct: "animată" },
    ],
  },
  {
    year: 2025, variant: "var-08",
    passage:
      "Am ajuns cu trenul într-o seară de toamnă. E o mică localitate minieră, unde lumea e obișnuită cu vizitatori străini. Casă arătoasă, iar în față un rând de dalii înalte, roșii, violete și galbene care, la lumina becului electric, arătau feeric. Soțul, funcționar public; ea, absolventă de liceu și un băiețaș de cinci ani și jumătate, care avea să fie prietenul meu. Mă cunoșteau din casa învățătoarei și știau că sunt unchiul lor din Bucovina. M-au primit prietenos ca pe o rudă despre care nu știau mare lucru [...].\n" +
      "La puțin timp după sosirea mea, stăpâna casei a căzut bolnavă și avea să zacă o lună și jumătate, îngrijită de medicul circumscripției locale. M-am oferit să duc eu gospodăria, aducându-mi aminte că, la mama acasă, deși copil încă, făcusem lucrul acesta cu îndemânare. Când părinții plecau la muncă, lăsau totul în seama mea, îngrijeam un frate și surorile mai mici, vedeam de orătănii spre bucuria mamei [...].\n" +
      "Întâia grijă era să pregătesc hrana porcilor, fierbând cartofii, dozând cantitatea de urluială, răcind fiertura, fiindcă nu te jucai cu foamea furibundă a indivizilor acestora, care altfel și-ar fi ars gâtlejul. Apoi aruncam grăunțele la păsări, căci, dacă n-o făceam la timp, năvăleau peste mine în bucătărie. Fierbeam laptele și pregăteam cafeaua. Laptele e cel mai hoț aliment; te pândește cum nu ești atent, sare din oală spumegând și s-aruncă în foc ca un călugăr budist. Se scula băiețașul [...]. Eram o atracție pentru el, fiindcă aveam o barbă căruntă și o lulea grozavă, cum nu mai avea nimeni în sat. Îl puneam în rânduială și luam împreună micul-dejun. Tata pleca prea de dimineață. Era foarte dificil la masă. Ca mulți copii de vârsta lui, nu voia să mănânce. Atunci a trebuit să mâncăm în joacă. Toate numele politice le cunoștea și toate personagiile din cărțile ce i se citiseră. Îl luam pe genunchi și-i spuneam: Acum mâncăm pe Roosevelt, acum mâncăm pe Churchill [...]. Îi mânca pe toți cu unt și marmeladă de măceșe pe pâine și cafea cu lapte. De unde mai înainte aceste delicii erau fade, că nu merita să pună gurița pe ele, acum, condimentate cu celebrități, aveau un gust extraordinar, spre hazul părinților. [...]\n" +
      "După asta, cu hârtie și creion, mergeam la bolnavă, stabileam meniul zilei și scriam amănunțit cum se prepară fiecare mâncare. Cum multe le știam, n-am greșit mai niciodată. Am descoperit că vocația mea adevărată era aceea de bucătar. [...] Bineînțeles, asistentul meu în noua meserie, care îmi plăcea, și colaboratorul meu la bucătărie era băiețașul, nelipsit de lângă mine. La masă, ne simțeam obligați ca noi să mâncăm mai cu poftă bunătățile pregătite de amândoi.\n" +
      "Mai avea și alte cusururi băiețașul. În vecinătate, nu era niciun copil de seama lui cu care să se joace. Și cum duduia de energie și cum n-avea ce face cu ea, o ștergea de-acasă și colinda prin tot satul, fără să spună când și unde a plecat. Deștept foc și umblăreț, toată lumea îl cunoștea. Părinții nu înțelegeau acest vagabondaj. Tatăl n-avea timp să se ocupe de el, deși amândoi îl adorau. Pe maică-sa, dispariția lui în necunoscut o băga în groază. Doamne ferește, cine știe ce putea să i se întâmple.\n" +
      "(Nichifor Crainic, „Pribeag în țara mea. Sub mască. Memorii”) [orătănii = păsări de curte; urluială = boabe de cereale măcinate, folosite ca hrană pentru animale]",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Sensul din text al cuvântului „arătoasă” (în „Casă arătoasă”) este:",
        options: ["frumoasă", "urâtă", "mică", "veche"], correct: "frumoasă" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al secvenței „băga în groază” (în „dispariția lui în necunoscut o băga în groază”) este:",
        options: ["înspăimânta", "enerva", "bucura", "liniștea"], correct: "înspăimânta" },
      { label: "A.2", topic: TEXT, content: "Vocația pe care și-o descoperă Nichifor Crainic în timpul șederii la familia care îl găzduiește este cea de:",
        options: ["bucătar", "medic", "învățător", "grădinar"], correct: "bucătar" },
      { label: "A.3", topic: TEXT, content: "Reacția părinților la schimbarea comportamentului copilului la micul-dejun este una de:",
        options: ["amuzament", "supărare", "indiferență", "teamă"], correct: "amuzament" },
      { label: "A.4", topic: TEXT, content: "Un motiv pentru care băiatul obișnuiește să plece de acasă este:",
        options: ["lipsa altor copii de seama lui cu care să se joace", "frica de părinți", "foamea", "dorința de a merge la școală"], correct: "lipsa altor copii de seama lui cu care să se joace" },
      { label: "A.5", topic: TEXT, content: "O trăsătură morală a lui Nichifor Crainic, așa cum reiese din text, este:",
        options: ["hărnicia", "lenea", "egoismul", "lăcomia"], correct: "hărnicia" },
    ],
  },
];

function validate() {
  const errors = [];
  const labels = new Set();
  for (const p of GRILE) {
    for (const it of p.items) {
      const k = `${p.year}-${p.variant}-${it.label}`;
      if (labels.has(k)) errors.push(`duplicate ${k}`); labels.add(k);
      if (!it.content?.trim()) errors.push(`${k} empty content`);
      if (!Array.isArray(it.options) || it.options.length < 3) errors.push(`${k} needs >=3 options`);
      if (new Set(it.options).size !== it.options.length) errors.push(`${k} duplicate options`);
      if (!it.options.includes(it.correct)) errors.push(`${k} correct '${it.correct}' not in options`);
    }
  }
  const total = GRILE.reduce((n, p) => n + p.items.length, 0);
  console.log(`  papers=${GRILE.length} grile=${total}`);
  if (errors.length) { console.error(`\n❌ VALIDATE FAILED (${errors.length}):`); errors.forEach((e) => console.error("   - " + e)); process.exit(1); }
  console.log("\n✅ VALIDATE OK — every grilă has a barem-anchored correct option present.");
}

async function run(dry) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const domain = await prisma.domain.findUnique({ where: { slug: DOMAIN_SLUG } });
    if (!domain) throw new Error(`domain ${DOMAIN_SLUG} not found`);

    const rows = [];
    for (const p of GRILE) {
      // Passage source: inline `p.passage` (self-contained grile, preferred for new papers)
      // → else fetch from the (inactive) ExamPaper text store (model/simulare legacy path).
      let passage = p.passage ?? null;
      if (!passage) {
        const paper = await prisma.examPaper.findUnique({
          where: { examType_year_subjectKey_variant: { examType: "BAC", year: p.year, subjectKey: "limba_romana", variant: p.variant } },
          include: { passages: { orderBy: { orderIndex: "asc" } } },
        });
        if (!paper) console.warn(`  ⚠️ no inline passage + ExamPaper BAC ${p.year} ${p.variant} not found — grile vor avea passage null`);
        const body = paper?.passages?.[0]?.body ?? null;
        const header = paper?.passages?.[0]
          ? [paper.passages[0].title, paper.passages[0].author ? `de ${paper.passages[0].author}` : null].filter(Boolean).join(" — ")
          : null;
        passage = body ? (header ? `${header}\n\n${body}` : body) : null;
      }
      for (const it of p.items) {
        rows.push({
          domainId: domain.id, subject: SUBJECT, topic: it.topic, difficulty: 3,
          type: "MULTIPLE_CHOICE", content: it.content, passage,
          options: it.options, correctAnswer: it.correct, imageUrl: null,
          sourceReference: `bac-grile:${p.year}-${p.variant}-${it.label}`, source: "MANUAL", status: "PUBLISHED",
        });
      }
    }

    console.log(`  domain=${DOMAIN_SLUG} grile to create=${rows.length}`);
    if (dry) { console.log("\n🔎 DRY — no writes."); return; }

    const del = await prisma.question.deleteMany({ where: { domainId: domain.id, sourceReference: { startsWith: "bac-grile:" } } });
    let created = 0;
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH);
      await prisma.question.createMany({ data: slice });
      created += slice.length;
    }
    const pub = await prisma.question.count({ where: { domainId: domain.id, status: "PUBLISHED", type: "MULTIPLE_CHOICE" } });
    console.log(`  ✅ deleted ${del.count} prior bac-grile, created ${created}. Domain PUBLISHED MCQ now=${pub}`);
    console.log("\n✅ APPLIED.");
  } finally { await prisma.$disconnect(); }
}

(async () => { console.log(`\n=== import-grile-bac-ro (mode=${MODE}) ===`); validate(); if (MODE === "validate") return; await run(MODE === "dry"); })().catch((e) => { console.error("FATAL:", e); process.exit(1); });
