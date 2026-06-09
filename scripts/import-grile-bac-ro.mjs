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
  {
    year: 2024, variant: "model",
    passage:
      "Eu m-am simțit viața mea întreagă mai presus de toate dascăl. A le da altora învățături a fost pentru mine totdeauna o mulțumire, și cele mai vii mulțumiri le-am avut stând de vorbă cu oameni prin care mă puteam dumiri ori plimbându-mă cu elevii mei. Mai ales ca dascăl mi-am câștigat și pânea de toate zilele, și nu-mi aduc aminte să mi se fi-ntâmplat vreodată ca să fiu nemulțumit de-nvățăturile ce-am dat.\n" +
      "Nu tot așa ca ziarist.\n" +
      "Fiind adecă vorba de interesele obștești, îmi dădeam totdeauna silința să spun ceea ce simt, gândesc și vor cei mulți, și nu o dată mi se-ntâmpla să stau la-ndoială dacă nu cumva greșesc. Abia târziu de tot am ajuns să mă-ncredințez că sunt puțini oamenii care au convingeri. Cei mai mulți nici nu știu ce va să zică a fi convins. Ei au numai păreri, pe care le schimbă după împrejurări și după impulsiuni momentane.\n" +
      "Partea individuală deci în scrisa mea ca ziarist erau îndrumările pe care le dădeam, iar aceste adeseori nu se potriveau cu felul de a gândi al celor mai mulți.\n" +
      "Cu atât mai vârtos ieșea la iveală această râvnă dăscălească în scrierile mele literare.\n" +
      "Nu puteam să mă-mpac cu gândul că lectura de orișice fel e numai o plăcută pierdere de vreme. În gândul meu, rostul scrierii a fost totdeauna îndrumarea spre o viețuire potrivită cu firea omenească.\n" +
      "Din onorariul pe care-l aveam la Sibiu ca director al ziarului Tribuna ori din cel ce mi se dedea în urmă la București ca director al ziarului Minerva nu aveam să trăiesc. Cu atât mai puțin aș fi putut să trăiesc din onorariile ce am primit pentru scrierile mele literare. [...] Scriam deci pentru mulțumirea mea sufletească și-mi era destul că le făceam prin aceasta plăcere unora dintre prietenii și binevoitorii mei.\n" +
      "Scriam pentru că nu eram în stare să mă stăpânesc. [...] Așa se adeverea în ceea ce mă privește că lucrarea literară se desfășoară sub înrâurirea publicului cititor.\n" +
      "La Viena și la Iași am scris sub înrâurirea lui Eminescu, în primii ani ai petrecerii mele la București, sub a lui Titu Maiorescu, iar în urmă nu am publicat decât ceea ce am citit mai nainte soției mele. [...]\n" +
      "(Ioan Slavici, „Scrietor”, în volumul „Amintiri”)",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Sensul din text al cuvântului „totdeauna” este:",
        options: ["mereu", "niciodată", "uneori", "îndată"], correct: "mereu" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al secvenței „nu eram în stare” (în „nu eram în stare să mă stăpânesc”) este:",
        options: ["nu puteam", "nu voiam", "nu știam", "nu îndrăzneam"], correct: "nu puteam" },
      { label: "A.2", topic: TEXT, content: "Publicațiile pe care le-a condus Ioan Slavici, conform textului, sunt:",
        options: ["Tribuna și Minerva", "Tribuna și Convorbiri literare", "Minerva și Gândirea", "Viața românească și Tribuna"], correct: "Tribuna și Minerva" },
      { label: "A.3", topic: TEXT, content: "O personalitate culturală sub a cărei înrâurire a scris Ioan Slavici la Viena și la Iași este:",
        options: ["Eminescu", "Caragiale", "Creangă", "Coșbuc"], correct: "Eminescu" },
      { label: "A.4", topic: TEXT, content: "Un motiv pentru care Ioan Slavici se consideră împlinit mai ales prin activitatea didactică este:",
        options: ["are ocazia de a le oferi altora învățături", "câștigă foarte mulți bani", "devine celebru", "evită munca de ziarist"], correct: "are ocazia de a le oferi altora învățături" },
      { label: "A.5", topic: TEXT, content: "O trăsătură a lui Ioan Slavici, așa cum reiese din text, este:",
        options: ["sinceritatea", "trufia", "indiferența", "superficialitatea"], correct: "sinceritatea" },
    ],
  },
  {
    year: 2024, variant: "simulare",
    passage:
      "În fiecare dimineață, când ies, oricât aș fi de grăbit, mă oprește un răstimp librăria de alături. E un local modest, ca mai toate librăriile pariziene, cu vitrinele întinse afară, pe tejghele ieftine, până în mijlocul trotuarului. Farmecul ei, și al tuturor, tocmai asta îl face. Astfel poate întâmpina și pe trecătorii cei mai indiferenți. Jumătate din deverul cotidian de-aici iese, din vânzările de pe trotuar oamenilor grăbiți care altminteri n-ar fi cumpărat. Printre tejghele mișună veșnic curioșii. Cei ce zăbovesc mai îndelung sunt studenți care n-au mijloace să cumpere și care citesc aici cartea pe care le-o poftește inima. Și mai sunt alți însetați de carte, tineri și bătrâni, săraci care-și hrănesc astfel sufletul cu lectura ce le trebuie. [...]\n" +
      "Cartierul Latin e plin de librării, trotuarele lui oferă cărți la fiece pas. [...] Parcă e o cetate a cărții subt oblăduirea Institutului, a Sorbonei și a celorlalte uzine de cultură. [...]\n" +
      "Nicăieri în lume cartea nu e mai prețuită ca în Franța. În alte țări poate să se citească mai mult, să se tipărească mai multe cărți. Aici, cartea e o realitate vie, un factor social cu o influență covârșitoare.\n" +
      "Numai la Paris cartea devine un eveniment monden care interesează nu doar cercurile literare, ci și saloanele, pe oamenii de stat, colectivitățile. [...] Mândria presei franceze, de orice nuanță, continuă a fi rubrica literară, care nu e întâmplătoare, ci organică. [...] Adevărat că acolo cititorii se interesează de faptele literare, ca și de cele diverse, și le reclamă, pe când ziarele noastre au scuza că rubrica literară e loc mort, fiindcă nimeni, afară de scriitorii înșiși, ba uneori nici chiar ei, nu se pasionează de soarta ei, pe când pentru sporturi, de pildă, se manifestă un interes tot mai viu, ceea ce justifică permanentizarea și sporirea cronicii respective. [...] Ziaristul francez se consideră scriitor înainte de toate [...]. Scriitorii înșiși îi consideră drept colegi adevărați pe ziariști și nu disprețuiesc suveran scrisul destinat să trăiască o singură zi. Asemenea cordialitate de relații nu se mai întâlnește aiurea.\n" +
      "(Liviu Rebreanu, „Metropole”) [dever = volumul vânzărilor pe o perioadă dată; a tăia = a desface filele unei cărți necitite; buchinist = vânzător de cărți vechi]",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Sensul din text al cuvântului „sforțări” este:",
        options: ["eforturi", "renunțări", "ezitări", "plăceri"], correct: "eforturi" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al secvenței „la fiece pas” (în „trotuarele lui oferă cărți la fiece pas”) este:",
        options: ["pretutindeni", "rareori", "cu greutate", "la întâmplare"], correct: "pretutindeni" },
      { label: "A.2", topic: TEXT, content: "Soluția găsită de persoanele interesate de lectură care nu au bani să cumpere cărți este, conform textului:",
        options: ["lectura în librărie, pe trotuar", "împrumutul de la bibliotecă", "copierea cărților de mână", "renunțarea la lectură"], correct: "lectura în librărie, pe trotuar" },
      { label: "A.3", topic: TEXT, content: "Un efect al creșterii interesului față de sport în spațiul românesc, conform textului, este:",
        options: ["dezvoltarea jurnalismului sportiv", "dispariția rubricii literare", "scăderea vânzărilor de cărți", "creșterea numărului de librării"], correct: "dezvoltarea jurnalismului sportiv" },
      { label: "A.4", topic: TEXT, content: "Un motiv pentru care tejghelele librăriilor din Paris sunt amplasate până în mijlocul trotuarului este:",
        options: ["pentru a atrage atenția trecătorilor", "din lipsă de spațiu în interior", "pentru a feri cărțile de soare", "pentru a respecta o lege locală"], correct: "pentru a atrage atenția trecătorilor" },
      { label: "A.5", topic: TEXT, content: "Relația dintre jurnaliștii francezi și scriitori, așa cum reiese din text, este una de:",
        options: ["colegialitate și respect", "rivalitate", "indiferență", "dispreț"], correct: "colegialitate și respect" },
    ],
  },
  {
    year: 2024, variant: "var-02",
    passage:
      "Eram, în 1960, tânăr redactor la Gazeta literară, când colega mea Andriana Fianu mi-a propus pe neașteptate, într-o după-amiază, s-o însoțesc acasă la Tudor Arghezi, de unde urma să luăm un text pe care poetul îl pregătise pentru revistă. [...]\n" +
      "I-am fost recunoscător Andrianei Fianu pentru ideea de-a mă lua cu ea la Arghezi, asta în primul moment, după care m-au copleșit emoțiile și mai c-aș fi renunțat. [...] Ce era să fac? Am urmat-o fără murmur, pe drum tot gândindu-mă cum să mă comport când mă voi afla în fața marelui om. Voi fi ochi și urechi, dar mut, am decis până la urmă. [...] Înainte de-a ne urca în troleibuz, în Piața Romană, am cumpărat flori, căci ne aflam în preajma zilei de 21 mai, când era aniversarea lui Arghezi. Și nu o aniversare oarecare, poetul împlinind chiar atunci optzeci de ani.\n" +
      "În epoca de care vorbesc, familia Arghezi ocupa un apartament la parterul unui mic bloc de pe Bulevardul Aviatorilor [...]. Am sunat, cineva ne-a deschis, conducându-ne într-un living cu ferestre mari, unde, după ce am așteptat câteva minute, a intrat poetul, neînsoțit. Ce m-a izbit îndată au fost pașii repezi făcuți de Arghezi, siguranța mișcărilor de om în toată puterea. Imaginea contrasta frapant cu aceea a neajutorării fizice pe care-o aveam despre poet de la cele câteva apariții în săli publice. Acolo pășea încet, ezitant, sprijinit în baston [...]. Aici, în schimb, în spațiul intim, Arghezi se mișca dezinvolt, fără baston [...].\n" +
      "De ce mi-era teamă, n-am scăpat. Adi m-a prezentat [...], dar a adăugat, rea inspirație, că sunt critic literar [...]. Arghezi a reacționat, săgetându-mă cu o întrebare care m-a descumpănit: „Și ce vrei dumneata să critici?”. M-am pierdut, cred că roșisem, după care totuși am încercat să articulez un răspuns [...]. Că eu de fapt nu vreau să critic ceva sau pe cineva, că mai mult decât să scriu îmi place să citesc [...]. „Așa mai merge”, mi-a oprit Arghezi chinuita perorație, schițând parcă și un zâmbet [...].\n" +
      "(Gabriel Dimisianu, „O vizită la Tudor Arghezi”, în vol. „Amintiri și portrete literare”) [Mițura și Baruțu = fiica și fiul lui Tudor Arghezi; perorație = vorbire însuflețită, care caută să convingă]",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Sensul din text al secvenței „pe neașteptate” este:",
        options: ["deodată", "treptat", "cu greu", "în glumă"], correct: "deodată" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al cuvântului „împrejurare” este:",
        options: ["circumstanță", "vecinătate", "explicație", "amintire"], correct: "circumstanță" },
      { label: "A.2", topic: TEXT, content: "Revista la care lucrează Andriana Fianu, conform textului, este:",
        options: ["Gazeta literară", "Viața românească", "Contemporanul", "România literară"], correct: "Gazeta literară" },
      { label: "A.3", topic: TEXT, content: "Modul în care Gabriel Dimisianu își propune să se comporte în timpul vizitei la Arghezi este:",
        options: ["să rămână tăcut, doar să asculte și să observe", "să poarte o discuție aprinsă", "să-i critice opera", "să-i ceară un autograf"], correct: "să rămână tăcut, doar să asculte și să observe" },
      { label: "A.4", topic: TEXT, content: "Motivul pentru care Gabriel Dimisianu este surprins când Tudor Arghezi intră în cameră este:",
        options: ["vioiciunea și siguranța mișcărilor poetului", "vârsta înaintată a poetului", "îmbrăcămintea elegantă a poetului", "prezența familiei poetului"], correct: "vioiciunea și siguranța mișcărilor poetului" },
      { label: "A.5", topic: TEXT, content: "O trăsătură morală a lui Gabriel Dimisianu, care se desprinde din text, este:",
        options: ["emotivitatea", "aroganța", "nepăsarea", "cruzimea"], correct: "emotivitatea" },
    ],
  },
  {
    year: 2024, variant: "var-04",
    passage:
      "Ne alăturăm cu însuflețire la inițiativa luată de scriitori, în frunte cu președintele Liviu Rebreanu, pentru a sărbători pe I. Al. Brătescu-Voinești cu prilejul împlinirii vârstei de 60 de ani. Această săptămână de ovații nu-i numai a autorului intrat în istorie, ea reprezintă pentru breasla scriitoricească o ridicare în conștiința profesională [...].\n" +
      "L-am găsit pe prozator într-o cameră din locuința sa amenajată în atelier, lucrând la un banc de tâmplărie. [...]\n" +
      "— Deși știu că fugiți de interviuri, v-aș ruga, din partea cititorilor Vieții literare, să ne acordați câteva cuvinte în această săptămână consacrată dvs.\n" +
      "— Simt o adâncă jenă. Îți mărturisesc sincer, îmi pare rău că se începe cu mine. Aș fi luat parte bucuros, împreună cu dvs., la această serbare, dar să fi fost vorba de altul. Uite, mă gândesc la ceilalți din generația mea, care ar fi meritat mai mult ca mine această onoare: Caragiale, Vlahuță etc. [...]\n" +
      "Este puternică impresia când scriitorul, care este o fabrică de bucurii pentru alții, simte el însuși întorcându-se dintre oameni recunoștința, răsplătindu-i durerile măcar la bătrânețe. [...]\n" +
      "Dar pentru că veni vorba de preferință, îți voi spune câteva cuvinte despre pasiunea pe care mi-o cunoști: pescuitul. [...] Stând nemișcat cu undița pe malul apei, gândurile curg la vale în voie și sufletul ți se purifică. [...]\n" +
      "Când nu plec la pescuit, divertismentul de la munca intelectuală mi-l procur cu lucrul tâmplăriei. Aici găsesc ritmul sufletesc care-mi trebuie pentru scris. [...] Pasiunea florilor am moștenit-o de la tata, mic boiernaș la Târgoviște. [...] Florile oferă o sursă perpetuă de fericire. Idealul meu este să mă retrag undeva la țară. [...]\n" +
      "(I. Valerian, interviu cu I. Al. Brătescu-Voinești, în vol. „Cu scriitorii prin veac”)",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Sensul din text al cuvântului „pildă” este:",
        options: ["exemplu", "poveste", "greșeală", "pedeapsă"], correct: "exemplu" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al secvenței „din când în când” este:",
        options: ["uneori", "mereu", "niciodată", "imediat"], correct: "uneori" },
      { label: "A.2", topic: TEXT, content: "Durata evenimentului în cadrul căruia a fost sărbătorit I. Al. Brătescu-Voinești este, conform textului:",
        options: ["o săptămână", "o zi", "o lună", "un an"], correct: "o săptămână" },
      { label: "A.3", topic: TEXT, content: "Un rol pe care tâmplăria îl are în viața lui I. Al. Brătescu-Voinești este:",
        options: ["de relaxare / divertisment de la munca intelectuală", "de sursă principală de venit", "de obligație impusă de familie", "de pregătire pentru o expoziție"], correct: "de relaxare / divertisment de la munca intelectuală" },
      { label: "A.4", topic: TEXT, content: "Un motiv pentru care I. Al. Brătescu-Voinești consideră potrivită sărbătorirea scriitorilor este:",
        options: ["recunoașterea rolului pe care scriitorii îl au în societate", "creșterea vânzărilor de cărți", "obținerea de premii financiare", "promovarea generației tinere"], correct: "recunoașterea rolului pe care scriitorii îl au în societate" },
      { label: "A.5", topic: TEXT, content: "O trăsătură morală a lui I. Al. Brătescu-Voinești, așa cum reiese din text, este:",
        options: ["modestia", "vanitatea", "lăcomia", "indiferența"], correct: "modestia" },
    ],
  },
  {
    year: 2024, variant: "var-09",
    passage:
      "Lui Sadoveanu nu-i plăceau oamenii care vorbeau mult. Îi suporta cât îi suporta înverșunat în tăcere și dacă aceștia, la toate semnele lui – tăcere, uitatul pe fereastră, la ceas –, nu-și dădeau seama că au întrecut măsura, le-o spunea în față. Am asistat o dată la o scenă de acest fel plină de pitoresc.\n" +
      "Într-o zi, aflându-mă la Sadoveanu [...] a venit la dânsul un cunoscut publicist, celebru prin performanțele lui în vorbire. Era în stare să vorbească, fără să obosească, douăzeci și patru de ore în șir, ba poate și mai mult. Sărea de la un subiect la altul cu ușurința cu care o veveriță sare de pe o creangă pe alta. Era un om foarte deștept și foarte cult, dar suferea de boala asta – vorbea prea mult și într-un ritm obositor pentru cel care-l asculta. [...]\n" +
      "Intrând în salonul vast [...], noul oaspete, mic și pirpiriu, se afundă într-un fotoliu și începu să vorbească… Și a vorbit… Și a vorbit… [...]\n" +
      "La început, vreo jumătate de ceas, Sadoveanu l-a ascultat atent, în tăcere, apoi și-a trimis privirile afară pe fereastră, apoi s-a uitat la ceas, o dată, de două ori. Constantin Mitru s-a ridicat de câteva ori, a răspuns la telefon, a ieșit de câteva ori pe ușă [...]. Când s-a întors, omul nostru tot mai vorbea…\n" +
      "Dar, cum toate au o limită, a avut-o și această răbdare. La un moment dat [...], Sadoveanu a ridicat mâna și l-a oprit zicându-i: „Gata! Lasă-mă! M-ai obosit!”.\n" +
      "Firul vorbirii s-a rupt brusc. [...] I-a zis lui Sadoveanu, fără să se arate supărat: „Dacă v-am obosit, plec… — Poți să mai șezi, da' vorbește mai puțin și în alt tempo că m-ai obosit... — Nu, lasă, maestre, plec... [...]”. „Bine, să mai vii!”, i-a zis Sadoveanu zâmbind, întinzându-i mâna cu prietenie.\n" +
      "(Mihail Șerban, „Amintiri”)",
    items: [
      { label: "A.1a", topic: VOCAB, content: "Sensul din text al secvenței „în stare” (în „Era în stare să vorbească [...] douăzeci și patru de ore”) este:",
        options: ["capabil", "obligat", "dornic", "nevoit"], correct: "capabil" },
      { label: "A.1b", topic: VOCAB, content: "Sensul din text al cuvântului „oaspete” este:",
        options: ["musafir", "gazdă", "vecin", "prieten"], correct: "musafir" },
      { label: "A.2", topic: TEXT, content: "Două indicii prin care Sadoveanu le sugera celorlalți că vorbesc prea mult sunt, conform textului:",
        options: ["privea pe fereastră și se uita la ceas", "tușea și se ridica în picioare", "ofta și închidea ochii", "ieșea din cameră și telefona"], correct: "privea pe fereastră și se uita la ceas" },
      { label: "A.3", topic: TEXT, content: "Atitudinea lui Sadoveanu în momentul plecării publicistului este una de:",
        options: ["bunăvoință", "furie", "dispreț", "regret"], correct: "bunăvoință" },
      { label: "A.4", topic: TEXT, content: "Motivul pentru care publicistul se oprește brusc din vorbit este:",
        options: ["intervenția lui Sadoveanu", "oboseala proprie", "un telefon primit", "plecarea lui Constantin Mitru"], correct: "intervenția lui Sadoveanu" },
      { label: "A.5", topic: TEXT, content: "O stare manifestată de Constantin Mitru în timp ce vorbește prietenul lui Sadoveanu este:",
        options: ["nerăbdarea", "bucuria", "admirația", "somnolența"], correct: "nerăbdarea" },
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
