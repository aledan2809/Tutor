/**
 * Textele paginii `/posta` — separate de randare.
 *
 * De ce stau aici și nu în pagină: userul a cerut să poată edita el textele din panou,
 * fără să depindă de o livrare de cod pentru fiecare virgulă. Ca să existe UN singur
 * adevăr, atât pagina cât și formularul de admin citesc din fișierul ăsta: textele de
 * mai jos sunt valoarea IMPLICITĂ, iar ce se salvează în baza de date le suprascrie.
 *
 * Fișierul e PUR — fără Prisma, fără `fs`, fără nimic de server. Formularul de admin e
 * o componentă de browser și îl importă direct ca să știe ce câmpuri să deseneze și care
 * e originalul fiecăruia; dacă ar atinge Prisma aici, ar trage baza de date în pachetul
 * trimis către browser. Citirea din bază stă separat, în `posta-copy.server.ts`.
 *
 * Cifrele mecanismului (puncte, praguri, treptele cascadei) rămân IMPORTATE din codul
 * care le aplică. Sunt scrise în text prin interpolare, deci un text editat din panou le
 * îngheață la valoarea de la momentul editării — vezi nota de la `Copy.motor`.
 */
import {
  XP_REWARDS,
  ON_TIME_BONUS,
  DEFAULT_LEVELS,
  STREAK_RECOVERY,
  LEADERBOARD_TOP,
  FAST_ANSWER_THRESHOLD_MS,
} from "@/lib/gamification-constants";
import type { EscalationChannel } from "@prisma/client";

/** Cheia sub care stau textele editate, în tabela `PageCopy`. */
export const CHEIE_POSTA = "posta";

/** Un rând din tabloul managerului, reprodus pentru captura demonstrativă. */
export type RandTablou = {
  nume: string;
  detaliu: string;
  stare: string;
  stareNota: string;
  module: { lectie: string | null; scor: [number, number] | null; zi: string | null }[];
};

export type PasFlux = {
  titlu: string;
  text: string;
  /** Ce se întâmplă fără ca cineva să apese ceva. Se marchează vizibil în grafic. */
  automat?: boolean;
};

export type Copy = {
  badge: string;
  hero: string;
  subtitle: string;
  ctaPdf: string;
  /*
   * NU mai există `ctaScrie`, `ctaIn` și `contactSubiect`. Toate trei au dispărut odată
   * cu ce comandau: butonul „Trimiteți-ne procedurile" din capul paginii (scos — la
   * începutul lecturii e prea devreme pentru el), butonul de autentificare din antet
   * (înlocuit de logo-ul clientului) și subiectul e-mailului precompletat (procedurile
   * se încarcă acum, nu se trimit pe mail). Un câmp rămas în editor după ce comanda lui
   * a dispărut e mai rău decât unul lipsă: userul îl completează și nu se întâmplă nimic.
   */
  avertismentTitlu: string;
  avertisment: string;

  scaraTitlu: string;
  scaraLead: string;
  scaraCifre: { valoare: string; eticheta: string }[];
  scaraConcluzie: string;
  scaraSursa: string;

  fluxTitlu: string;
  fluxLead: string;
  flux: PasFlux[];
  fluxAutomatEticheta: string;

  cursuriTitlu: string;
  cursuriLead: string;
  cursuri: { titlu: string; rol: string; descriere: string; module: string[] }[];

  motorTitlu: string;
  motorLead: string;
  motor: { titlu: string; text: string }[];
  motorNota: string;

  scorTitlu: string;
  scorLead: string;
  /** Legenda punctajului: cât valorează fiecare situație și de ce. */
  scorLegenda: { valoare: string; cand: string }[];
  /*
   * Capul de tabel, aplatizat în patru texte simple. A fost o clipă un obiect — dar
   * formularul de admin desenează fie text, fie listă repetabilă, și ar fi făcut `.map`
   * pe el, adică ar fi aruncat la randare. Patru șiruri se editează la fel de bine și nu
   * cer formularului să învețe un al treilea fel de câmp.
   */
  scorCapCaz: string;
  scorCapCalcul: string;
  scorCapPuncte: string;
  scorCapRaport: string;
  scorCazuri: { caz: string; calcul: string; puncte: string; raport: string }[];
  scorConcluzie: string;
  scorNota: string;

  cascadaTitlu: string;
  cascadaLead: string;
  /**
   * Doar ETICHETELE canalelor. Treptele, ordinea lor și minutele dintre ele se citesc
   * din `ESCALATION_LEVELS` — adică din fișierul pe care îl execută motorul. Dacă
   * cineva mută WhatsApp înaintea e-mailului, pagina se mută odată cu el.
   */
  /*
   * `Record<EscalationChannel, …>` — TOTAL peste enum, nu `Record<string, …>`. Cu varianta
   * laxă, o treaptă nouă (enum-ul are deja `CALL`, iar motorul o are în plan ca L6) ar fi
   * căzut pe o rezervă care tipărea tokenul brut „CALL" în mijlocul unei fraze românești,
   * pe documentul care ajunge la conducerea clientului — fără nicio eroare de compilare.
   * Acum lipsa unei etichete oprește build-ul.
   */
  cascadaCanale: Record<EscalationChannel, string>;
  cascadaImediat: string;
  /** Șablon cu `{n}` — minutele vin din configurarea cascadei, nu din text. */
  cascadaDupaMin: string;
  cascadaOprire: string;
  cascadaDovadaTitlu: string;
  cascadaDovada: string;
  cascadaRitm: string;

  tabloTitlu: string;
  tabloLead: string;
  tabloCapCursant: string;
  tabloCapStare: string;
  tabloModule: string[];
  tabloLectie: string;
  tabloTest: string;
  tabloRanduri: RandTablou[];
  tabloLegenda: string;
  tabloConducere: string[];

  obiectiiTitlu: string;
  obiectiiLead: string;
  obiectii: { intrebare: string; raspuns: string }[];

  costTitlu: string;
  costLead: string;
  cost: { titlu: string; text: string }[];

  deCeTitlu: string;
  deCe: { text: string; sursa: string }[];

  pilotTitlu: string;
  pilotLead: string;
  pilot: string[];

  contactTitlu: string;
  contactLead: string;
  contactMailEticheta: string;
  contactTelEticheta: string;

  finalTitlu: string;
  finalSub: string;
  finalCta: string;
  finalCursant: string;
};

/** Grupul din care face parte furnizorul, cerut în subsol. */
export const CONSORTIU = "part of Know How Consortium";

/**
 * Firma care semnează contractul B2B și emite factura separată.
 *
 * NU e firma din Legal Hub pentru aplicația `tutor` — aceea rămâne Class RDA Impex SRL,
 * pentru B2C (abonamente cu cardul prin broker, /privacy, /terms). Class nu e plătitoare
 * de TVA, ceea ce e un avantaj pe consumator și o problemă pe un client instituțional,
 * deci B2B merge pe Fabulosos. Decizie din 11.09.2026, înaintea întâlnirii cu Poșta.
 */
export const FURNIZOR = "Fabulosos SRL";
export const CONTACT_MAIL = "office@etutor.ro";
export const CONTACT_TEL_AFISAT = "0712 383 492";
export const CONTACT_TEL_LINK = "+40712383492";

/**
 * Numărate în baza de producție la 09.09.2026 (`EscalationEvent`, grupat pe canal și
 * stare). Data stă lângă cifră în pagină — vezi nota lungă din capul fișierului.
 */
const DOVADA_LANTURI = 817;
const DOVADA_DATA_RO = "9 septembrie 2026";
const DOVADA_DATA_EN = "9 September 2026";

/** Cadența cronului care duce cascada mai departe (crontab VPS2, la fiecare 15 minute). */
const CRON_MINUTE = 15;

const PRAG_RASPUNS_RAPID_SEC = Math.round(FAST_ANSWER_THRESHOLD_MS / 1000);
const RECUPERARE_MINUTE = Math.round(STREAK_RECOVERY.timeLimitMs / 60_000);
const NIVELE_PRAGURI = DEFAULT_LEVELS.map((n) => n.minXp.toLocaleString("ro-RO")).join(" · ");
const NIVELE_PRAGURI_EN = DEFAULT_LEVELS.map((n) => n.minXp.toLocaleString("en-US")).join(" · ");

export const RO: Copy = {
  badge: "Demonstrație · eTutor pentru Poșta Română",
  hero: "Sistemele se schimbă în ani. Oamenii de la ușă și de la ghișeu, în săptămâni.",
  subtitle:
    "Clientul nu vede sistemul informatic. Vede factorul de la ușă și casiera de la geam — și pe ei îi compară, fără să vrea, cu ce a primit marți de la altcineva. Pagina asta arată cum se instruiesc oamenii aceia: pe telefon, în zece minute, cu dovadă că s-a făcut.",
  ctaPdf: "Descarcă prezentarea (PDF)",

  avertismentTitlu: "Conținut simulat",
  avertisment:
    "Cele trei cursuri de mai jos sunt scrise de noi, din surse publice, fără acces la procedurile Poștei Române. Fiecare loc în care a trebuit să presupunem ceva este marcat vizibil în text, cu numele procedurii care lipsește. Nu sunt regulamente oficiale și nu se pot folosi ca atare. Exact asta e propunerea: dați-ne procedurile voastre și presupunerile devin frazele voastre.",

  scaraTitlu: "De ce nu se poate face în sală",
  scaraLead:
    "Nu e o obiecție de principiu față de sala de curs. E o problemă de aritmetică, făcută cu cifrele voastre publice.",
  scaraCifre: [
    { valoare: "19.931", eticheta: "salariați la finalul lui 2025" },
    { valoare: "~5.600", eticheta: "unități în rețeaua teritorială" },
    { valoare: "~1.000", eticheta: "grupe de câte 20 de oameni" },
  ],
  scaraConcluzie:
    "O singură zi de sală pentru toți înseamnă circa o mie de grupe. Cu zece săli în paralel, sunt o sută de zile lucrătoare — aproape jumătate de an în care oamenii sunt scoși din tură, cu deplasări plătite. Iar la capăt aveți o listă de prezență, nu răspunsul la întrebarea care contează: cine a înțeles ce.",
  scaraSursa:
    "primele două cifre din raportări publice ale companiei (2025) și din prezentarea rețelei teritoriale; a treia e aritmetica noastră — 19.931 împărțit la grupe de câte 20",

  fluxTitlu: "Drumul complet, de la lista voastră până la raport",
  fluxLead:
    "Șapte pași. Trei dintre ei se întâmplă singuri, fără ca cineva de la voi să apese ceva — sunt marcați ca atare.",
  fluxAutomatEticheta: "se întâmplă singur",
  flux: [
    {
      titlu: "Ne dați o listă",
      text: "Un Excel sau un CSV cu nume și număr de telefon. Se încarcă din panou, în doi timpi: întâi vedeți ce s-a citit, apoi confirmați. Dacă nu aveți listă, se poate și fără: un cod comun, scris pe o foaie la avizier.",
    },
    {
      titlu: "Pleacă invitația",
      text: "Pe WhatsApp, pe loc, de la un buton. Fiecare om primește linkul lui, care nu merge decât o dată și numai pentru el.",
    },
    {
      titlu: "Omul intră de pe telefonul lui",
      text: "Apasă linkul, își alege o parolă și e înăuntru. Nu instalează nimic. Nu are nevoie de adresă de e-mail.",
      automat: true,
    },
    {
      titlu: "Citește lecția",
      text: "Șapte-zece minute. Text simplu, cu replici exacte de spus clientului, nu cu principii. La capătul turei, în pauză, în autobuz — se reia de unde a rămas.",
    },
    {
      titlu: "Testul se deschide după lecție",
      text: "Nimeni nu e întrebat din ce n-a apucat să citească. Un modul intră în test abia după ce lecția lui e terminată.",
      automat: true,
    },
    {
      titlu: "Cine se oprește este căutat",
      text: "După o zi fără nicio activitate pornește o cascadă de memento-uri, pe patru canale, una după alta. Se oprește singură în clipa în care omul reia. Nimeni de la voi nu ține evidența celor rămași în urmă.",
      automat: true,
    },
    {
      titlu: "Rămâne urma",
      text: "Cine, ce modul, în ce zi, cu ce scor. Nu o listă de prezență la o sală — urma fiecărui om, pe care o vedeți în tabloul de mai jos.",
    },
  ],

  cursuriTitlu: "Trei trasee, pe cele trei roluri care ating clientul",
  cursuriLead:
    "Fiecare curs are trei module. Fiecare modul are o lecție de citit în șapte-zece minute și un test care se deschide după ea. Fiecare curs se termină cu un singur număr pe care omul îl urmărește o săptămână — pentru el, nu pentru raport.",
  cursuri: [
    {
      titlu: "Ultima sută de metri",
      rol: "Factor poștal",
      descriere:
        "Prima încercare care reușește, banii din mână și dovada că ai făcut treaba, și ce spui omului supărat care te întâmpină la ușă. Cu replici exacte, nu cu principii.",
      module: ["Prima încercare care reușește", "Banii din mână și dovada", "Ești singurul om de la Poștă pe care clientul îl vede"],
    },
    {
      titlu: "La geam",
      rol: "Lucrător de ghișeu",
      descriere:
        "Primele zece secunde ale unei cozi, coletul preluat în două minute, și cum explici un preț, un termen sau un refuz astfel încât omul să plece lămurit, nu supărat.",
      module: ["Sala, nu doar geamul", "Coletul în două minute", "Prețul, termenul și omul supărat"],
    },
    {
      titlu: "Oficiul tău, în cinci numere",
      rol: "Diriginte de oficiu",
      descriere:
        "Cinci numere scrise dimineața pe o singură foaie, coada de la prânz citită ca informație, și primul client de curierat adus din propriul oraș.",
      module: ["Cinci numere pe o singură foaie", "Coada de la prânz și reclamația", "Primul client din oraș"],
    },
  ],

  motorTitlu: "Ce-l face să deschidă a doua oară",
  motorLead:
    "Un curs trimis nu e un curs făcut. Diferența o face ce se întâmplă între lecția întâi și lecția a treia — și asta e construit în platformă, nu lăsat pe seama șefului direct.",
  motor: [
    {
      titlu: "Puncte pentru ce face, nu pentru cât stă",
      text: `${XP_REWARDS.CORRECT_ANSWER} de puncte pentru fiecare răspuns corect, plus ${XP_REWARDS.FAST_ANSWER_BONUS} dacă răspunde în mai puțin de ${PRAG_RASPUNS_RAPID_SEC} secunde — semnul că știe, nu că a căutat. ${XP_REWARDS.SESSION_COMPLETE} la terminarea unei sesiuni, ${XP_REWARDS.PERFECT_SCORE} la scor perfect, ${ON_TIME_BONUS} dacă a făcut-o în fereastra în care i s-a cerut.`,
    },
    {
      titlu: "Seria zilnică, cu drept la greșeală",
      text: `Zilele la rând contează. Dar dacă a sărit până la ${STREAK_RECOVERY.maxMissedDays} zile — a fost în concediu, a fost bolnav — își recuperează seria: ${STREAK_RECOVERY.questions} întrebări, din care ${STREAK_RECOVERY.requiredCorrect} corecte, în ${RECUPERARE_MINUTE} minute. Nu pierde tot pentru o săptămână grea.`,
    },
    {
      titlu: `${DEFAULT_LEVELS.length} trepte și un clasament`,
      text: `Trepte la ${NIVELE_PRAGURI} de puncte, și un clasament al primilor ${LEADERBOARD_TOP} din grupa lui. Nu al întregii companii — competiția cu 19.000 de necunoscuți nu motivează pe nimeni; cea cu colegii de oficiu, da.`,
    },
    {
      titlu: "Provocarea zilei",
      text: `O întrebare pe zi, la care punctele se ${XP_REWARDS.DAILY_CHALLENGE_MULTIPLIER === 2 ? "dublează" : `înmulțesc cu ${XP_REWARDS.DAILY_CHALLENGE_MULTIPLIER}`}. E motivul pentru care omul deschide aplicația într-o zi în care n-avea nimic de făcut acolo.`,
    },
  ],
  motorNota:
    "Cifrele de mai sus nu sunt scrise de mână în pagina asta: se citesc din același fișier de configurare pe care îl folosește motorul care acordă punctele. Dacă se schimbă regula, se schimbă și pagina.",

  scorTitlu: "Cine se întoarce să învețe e răsplătit, nu penalizat",
  scorLead:
    "Un curs nu e o fotografie a ce știai din prima, e ce știi la sfârșit. Majoritatea platformelor pedepsesc reluarea fără să vrea: adună toate încercările, deci cine greșește și apoi învață apare mai prost decât cine s-a oprit. La noi nu. Iar cine se întoarce primește puncte pentru asta — mai puține decât dacă știa din prima, ca greșeala să nu devină strategie, dar destule cât să merite drumul înapoi.",
  scorLegenda: [
    { valoare: "10", cand: "răspuns corect din prima (plus 5 dacă vine în mai puțin de cinci secunde — doar la prima întâlnire, fiindcă a doua oară viteza e așteptată și n-ar dovedi nimic)" },
    { valoare: "7", cand: "a greșit, s-a întors și a corectat. Sub 10 dinadins: a ști din prima rămâne mai bun, altfel greșeala ar deveni strategie" },
    { valoare: "3 · 2 · 1", cand: "exersarea a ceva deja știut, descrescător, cel mult de trei ori pe zi la aceeași întrebare. Exersarea rămâne gratuită, dar nu se poate măcina un clasament din ea" },
  ],
  scorCapCaz: "Pe un modul de patru întrebări",
  scorCapCalcul: "Cum se calculează",
  scorCapPuncte: "Puncte",
  scorCapRaport: "Ce vede managementul",
  scorCazuri: [
    { caz: "Știe din prima", calcul: "4 × 10", puncte: "40", raport: "Știe 4/4 · din prima 4/4" },
    { caz: "Greșește 2, apoi le învață", calcul: "2 × 10 + 2 × 7", puncte: "34", raport: "Știe 4/4 · din prima 2/4 · 2 recuperări" },
    { caz: "Greșește 3, apoi le învață", calcul: "1 × 10 + 3 × 7", puncte: "31", raport: "Știe 4/4 · din prima 1/4 · 3 recuperări" },
    { caz: "Face 2 din 4 și se oprește", calcul: "2 × 10", puncte: "20", raport: "Știe 2/4 · din prima 2/4" },
    { caz: "Greșește tot, apoi învață tot", calcul: "4 × 7", puncte: "28", raport: "Știe 4/4 · din prima 0/4 · 4 recuperări" },
    { caz: "Repetă mecanic de nouă ori", calcul: "4 × 10 + 4 × (3+2+1+0+0+0+0+0+0)", puncte: "64", raport: "Știe 4/4 · exersat" },
  ],
  scorConcluzie:
    "Citiți rândul doi lângă rândul patru: amândoi au răspuns corect la exact două întrebări din prima. Cel care s-a întors ia 34, cel care s-a oprit ia 20 — cele paisprezece puncte diferență sunt strict determinarea de a reveni. Iar cel care repetă mecanic ia 64, nu 400: numărați termenii din paranteză — sunt nouă, câte unul pentru fiecare reluare, dar doar primele trei din zi valorează ceva (3, apoi 2, apoi 1). De la a patra încolo, fiecare repetare aduce zero. Exersarea rămâne liberă; clasamentul nu se poate măcina din ea.",
  scorNota:
    "De-aia managementul vede trei numere, nu unul: ce știe omul acum, cât a nimerit din prima, și de câte ori s-a întors. Un procent singur le-ar ascunde pe toate trei.",
  cascadaTitlu: "Cine rămâne în urmă nu rămâne uitat",
  cascadaLead:
    "Partea pe care niciun curs trimis pe e-mail n-o are. După o zi fără activitate, platforma începe să-l caute pe om singură, urcând treptele una câte una.",
  cascadaCanale: {
    PUSH: "Notificare pe telefon",
    TELEGRAM: "Telegram",
    EMAIL: "E-mail",
    WHATSAPP: "WhatsApp",
    SMS: "SMS",
    CALL: "Apel telefonic",
  },
  cascadaImediat: "imediat",
  cascadaDupaMin: "după încă {n} minute",
  cascadaOprire:
    "Cascada se oprește în clipa în care omul reia — nu la sfârșitul listei. Cine s-a apucat nu mai primește nimic; cine n-a deschis niciodată ajunge, treaptă cu treaptă, pe canalul la care chiar răspunde.",
  cascadaRitm:
    "Ritmul îl fixați voi. Implicit treptele sunt apropiate, fiindcă mecanismul a fost construit pentru un elev care ratează o ședință în seara aceea; pentru un curs de serviciu se așază pe zile.",
  cascadaDovadaTitlu: "Nu e o funcție de pe listă",
  cascadaDovada: `Mecanismul rulează la fiecare ${CRON_MINUTE} minute și a dus până la capăt ${DOVADA_LANTURI.toLocaleString("ro-RO")} de lanțuri de memento-uri pe cealaltă latură a platformei, pe toate cele patru canale — notificare pe telefon, Telegram, e-mail și WhatsApp. Cifră numărată în baza de producție la ${DOVADA_DATA_RO}, nu estimată.`,

  tabloTitlu: "Ce primiți voi: tabloul, nu o promisiune",
  tabloLead:
    "Asta e chiar structura ecranului pe care îl deschide un diriginte sau un director de rețea. Numele și mărcile de mai jos sunt inventate; coloanele, treptele și felul în care se colorează scorul sunt cele reale.",
  tabloCapCursant: "Cursant",
  tabloCapStare: "Stare",
  tabloModule: ["M1 · Prima încercare", "M2 · Banii și dovada", "M3 · Omul de la ușă"],
  tabloLectie: "lecția",
  tabloTest: "test",
  tabloRanduri: [
    {
      nume: "Ionescu Marian",
      detaliu: "marca 41207 · Of. Buzău 3",
      stare: "A terminat",
      stareNota: "a apăsat 02.09",
      module: [
        { lectie: "02.09", scor: [7, 7], zi: "02.09" },
        { lectie: "04.09", scor: [6, 7], zi: "04.09" },
        { lectie: "05.09", scor: [7, 7], zi: "05.09" },
      ],
    },
    {
      nume: "Dobre Elena",
      detaliu: "marca 38914 · Of. Buzău 1",
      stare: "Învață",
      stareNota: "a apăsat 02.09",
      module: [
        { lectie: "03.09", scor: [7, 7], zi: "03.09" },
        { lectie: "08.09", scor: [4, 7], zi: "08.09" },
        { lectie: null, scor: null, zi: null },
      ],
    },
    {
      nume: "Vasilache Petru",
      detaliu: "marca 40556 · Of. Râmnicu Sărat",
      stare: "Cont creat",
      stareNota: "a apăsat 03.09",
      module: [
        { lectie: null, scor: null, zi: null },
        { lectie: null, scor: null, zi: null },
        { lectie: null, scor: null, zi: null },
      ],
    },
    {
      nume: "Neagu Cristina",
      detaliu: "marca 39880 · Of. Pogoanele",
      stare: "Invitație trimisă",
      stareNota: "trimisă 02.09",
      module: [
        { lectie: null, scor: null, zi: null },
        { lectie: null, scor: null, zi: null },
        { lectie: null, scor: null, zi: null },
      ],
    },
  ],
  tabloLegenda:
    "Scorul se colorează singur: verde peste 70%, chihlimbar între 50 și 70, roșu sub. Rândul Elenei spune ceva ce o listă de prezență n-ar fi spus niciodată — a citit tot, dar la modulul cu banii a picat sub prag. Aia nu e o problemă de disciplină, e un modul prost înțeles.",
  tabloConducere: [
    "Cine a parcurs fiecare modul și când — pe om, nu pe listă de prezență.",
    "Pe ce modul se greșește cel mai mult: platforma ține rata de eroare pe fiecare temă, deci se vede ce n-a fost înțeles, nu doar cine n-a citit.",
    "Fișa fiecărui om, în care greșelile stau înaintea răspunsurilor bune — fiindcă alea sunt de citit.",
    "Materia rămâne privată. Nu apare în catalog, nu se poate căuta, nu există pentru cine nu are cod.",
    "Conținutul se schimbă din panou, fără să depindeți de noi pentru fiecare corectură.",
  ],

  obiectiiTitlu: "Ce ne-ați întreba, dacă am fi în aceeași cameră",
  obiectiiLead:
    "Le scriem noi, înainte să le puneți voi. Fiecare are un răspuns care există deja în produs, nu unul pe care l-am construi după semnătură.",
  obiectii: [
    {
      intrebare: "„Oamenii mei n-au adresă de e-mail.”",
      raspuns:
        "Nu e nevoie de niciuna. Omul intră pe un cod și își spune numele, prenumele și telefonul; contul se face acolo. Iar dacă își uită parola, primește un cod pe WhatsApp și îl tastează în aplicație — fără nicio adresă de e-mail în tot drumul.",
    },
    {
      intrebare: "„Nu vor să-și instaleze nimic pe telefon.”",
      raspuns:
        "Nu se instalează nimic. E o pagină web, se deschide din linkul primit pe WhatsApp. Nici pe telefoanele lor, nici pe serverele voastre.",
    },
    {
      intrebare: "„Nu toți au telefon bun.”",
      raspuns:
        "Lecția e text, nu video: se încarcă pe orice telefon cu un browser și nu consumă trafic cât un film. Iar pentru cei care nu au deloc, codul comun merge de pe orice telefon — inclusiv de pe al dirigintelui, la oficiu.",
    },
    {
      intrebare: "„Unde ajung datele oamenilor noștri?”",
      raspuns: `Pentru oamenii voștri, operatorul datelor sunteți voi. ${FURNIZOR} le prelucrează în numele vostru, pe baza unui acord de prelucrare semnat odată cu contractul. Materia voastră e privată: nu apare în catalog, nu se poate căuta și nu există pentru cine nu are cod — nici măcar dacă îi ghicește numele.`,
    },
    {
      intrebare: "„N-avem timp să scoatem oamenii din tură.”",
      raspuns:
        "Nici nu-i scoateți. Șapte-zece minute pe lecție, când poate el: la capătul turei, în pauză. Nicio zi luată din program, nicio deplasare plătită.",
    },
    {
      intrebare: "„Și dacă materialul nu e corect pentru noi?”",
      raspuns:
        "Astăzi chiar nu este, și scrie asta sus, cu litere mari. E scris din surse publice, cu fiecare presupunere marcată în text și cu numele procedurii care lipsește. Primul lucru pe care îl facem împreună este să înlocuim presupunerile cu frazele voastre.",
    },
  ],

  costTitlu: "Cât vă costă să porniți",
  costLead: "Întrebarea nerostită a oricărui decident e cât îl costă pe el, ca timp. Răspunsul, pe față:",
  cost: [
    { titlu: "De la voi", text: "O listă cu nume și telefon. Un Excel sau un CSV. Atât." },
    { titlu: "De instalat", text: "Nimic. Nici pe telefoanele oamenilor, nici pe serverele voastre." },
    { titlu: "De integrat", text: "Nimic. Nu ne conectăm la niciun sistem al vostru ca să porniți." },
    { titlu: "Până când intră primul om", text: "Ziua în care primim lista. Invitațiile pleacă de la un buton." },
  ],

  deCeTitlu: "De ce acum",
  deCe: [
    {
      text: "În 2024, pentru prima dată, în România s-au mișcat mai multe colete decât trimiteri de corespondență — circa 335 de milioane față de circa 267 de milioane.",
      sursa: "date publice ANCOM, raportul pe 2025 pentru anul 2024",
    },
    {
      text: "9 din 10 colete interne ajung în prima zi, media pieței fiind de circa 1,2 zile. Asta e bara cu care vă compară clientul, chiar dacă nu spune nimic.",
      sursa: "date publice ANCOM, raportul pe 2025 pentru anul 2024",
    },
    {
      text: "Aparatul pe care se citește lecția e deja în mâna oamenilor: 7.000 de terminale mobile cu Android, 7.000 de abonamente de date și 8.600 de imprimante mobile.",
      sursa: "comunicat Poșta Română",
    },
  ],

  pilotTitlu: "Ce urmează, dacă mergem mai departe",
  pilotLead: "Un pilot mărginit, cu măsurători înainte și după — nu un contract-cadru.",
  pilot: [
    "Ne dați procedurile care lipsesc: livrare și avizare, gestiune, utilizarea terminalului, preluarea reclamațiilor. În locul fiecărei presupuneri intră fraza voastră.",
    "Trei-cinci factori și un diriginte citesc materialul o oră, cu o singură întrebare: „unde nu e adevărat la voi?”. Ce spun ei intră în text înainte de pilot.",
    "Un județ, câteva oficii de tipuri diferite, douăsprezece săptămâni, cu un grup care nu face cursul — ca să se vadă dacă diferența e reală.",
    "Instructorii sunt dirigenții voștri, nu noi. Mecanismul care schimbă obiceiuri e șeful direct care predă, nu furnizorul din afară.",
  ],

  contactTitlu: "Cui răspundeți",
  contactLead:
    "Scrieți-ne sau sunați și vă trimitem codurile de acces pentru câți oameni vreți să vadă materialul, plus răspunsul la orice întrebare din pagina asta.",
  contactMailEticheta: "E-mail",
  contactTelEticheta: "Telefon",

  finalTitlu: "Un singur pas mai departe",
  finalSub:
    "Trimiteți-ne o procedură — una singură, cea de livrare și avizare. Vă returnăm modulul rescris cu frazele voastre, ca să vedeți diferența dintre ce e în pagina asta și ce ar fi la voi. Nu costă nimic și nu obligă la nimic.",
  finalCta: "Trimiteți-ne procedurile",
  finalCursant: "Sunteți cursant și aveți deja un cod de acces? Intrați în cont.",
};

export const EN: Copy = {
  badge: "Demo · eTutor for Poșta Română",
  hero: "Systems change in years. The people at the door and at the counter change in weeks.",
  subtitle:
    "The customer never sees the IT system. They see the postman at the door and the clerk at the counter — and they compare them, without meaning to, with what arrived on Tuesday from someone else. This page shows how those people are trained: on a phone, in ten minutes, with proof that it happened.",
  ctaPdf: "Download the presentation (PDF)",

  avertismentTitlu: "Simulated content",
  avertisment:
    "The three courses below were written by us from public sources, without access to Poșta Română's own procedures. Every place where we had to assume something is marked in the text, naming the procedure that is missing. These are not official regulations and must not be used as such. That is precisely the offer: give us your procedures and the assumptions become your own wording.",

  scaraTitlu: "Why a classroom cannot do this",
  scaraLead:
    "This is not an objection to classroom training in principle. It is an arithmetic problem, worked out with your own public figures.",
  scaraCifre: [
    { valoare: "19,931", eticheta: "employees at the end of 2025" },
    { valoare: "~5,600", eticheta: "units in the territorial network" },
    { valoare: "~1,000", eticheta: "groups of twenty people" },
  ],
  scaraConcluzie:
    "One single classroom day for everyone means roughly a thousand groups. With ten rooms running in parallel that is a hundred working days — close to half a year of pulling people off their rounds, with travel paid. And at the end you hold an attendance sheet, not the answer to the question that matters: who understood what.",
  scaraSursa:
    "the first two figures come from the company's public reporting (2025) and its territorial-network presentation; the third is our own arithmetic — 19,931 divided into groups of twenty",

  fluxTitlu: "The whole path, from your list to the report",
  fluxLead:
    "Seven steps. Three of them happen on their own, without anyone on your side pressing anything — those are marked.",
  fluxAutomatEticheta: "happens on its own",
  flux: [
    {
      titlu: "You give us a list",
      text: "An Excel or CSV file with names and phone numbers. It uploads from the admin panel in two stages: first you see what was read, then you confirm. If you have no list, that works too — one shared code, written on a sheet on the notice board.",
    },
    {
      titlu: "The invitation goes out",
      text: "Over WhatsApp, on the spot, from a button. Each person gets their own link, which works once and only for them.",
    },
    {
      titlu: "They come in on their own phone",
      text: "They tap the link, choose a password, and they are in. Nothing is installed. No email address needed.",
      automat: true,
    },
    {
      titlu: "They read the lesson",
      text: "Seven to ten minutes. Plain text, with exact lines to say to the customer rather than principles. At the end of a shift, on a break, on the bus — it resumes where they left off.",
    },
    {
      titlu: "The test opens after the lesson",
      text: "Nobody is asked about what they have not read. A module enters the test only once its lesson is finished.",
      automat: true,
    },
    {
      titlu: "Whoever stops gets chased",
      text: "After a day with no activity a cascade of reminders starts, across four channels, one after another. It stops by itself the moment the person resumes. Nobody on your side keeps a list of who fell behind.",
      automat: true,
    },
    {
      titlu: "The trace stays",
      text: "Who, which module, on which day, with what score. Not an attendance sheet — a trace for each person, which you read in the table below.",
    },
  ],

  cursuriTitlu: "Three tracks, for the three roles that touch the customer",
  cursuriLead:
    "Each course has three modules. Each module has a lesson you read in seven to ten minutes and a test that opens after it. Each course ends with a single number the person tracks for a week — for themselves, not for a report.",
  cursuri: [
    {
      titlu: "The last hundred metres",
      rol: "Postman",
      descriere:
        "The first delivery attempt that works, cash in hand and the proof you did the job, and what you say to the angry person who meets you at the door. With exact lines, not principles.",
      module: ["The first attempt that works", "Cash in hand, and proof", "You are the only person from the post office the customer ever sees"],
    },
    {
      titlu: "At the counter",
      rol: "Counter clerk",
      descriere:
        "The first ten seconds of a queue, a parcel taken in two minutes, and how to explain a price, a deadline or a refusal so the person leaves clear rather than annoyed.",
      module: ["The room, not just the window", "A parcel in two minutes", "Price, deadline, and the angry customer"],
    },
    {
      titlu: "Your office, in five numbers",
      rol: "Post office manager",
      descriere:
        "Five numbers written each morning on a single sheet, the lunchtime queue read as information, and the first courier customer won from your own town.",
      module: ["Five numbers on one sheet", "The lunchtime queue and the complaint", "The first customer in town"],
    },
  ],

  motorTitlu: "What makes them open it a second time",
  motorLead:
    "A course that was sent is not a course that was taken. The difference is what happens between the first lesson and the third — and that is built into the platform, not left to the line manager.",
  motor: [
    {
      titlu: "Points for what they do, not for how long they sit",
      text: `${XP_REWARDS.CORRECT_ANSWER} points for each correct answer, plus ${XP_REWARDS.FAST_ANSWER_BONUS} if they answer in under ${PRAG_RASPUNS_RAPID_SEC} seconds — the sign that they knew it rather than looked it up. ${XP_REWARDS.SESSION_COMPLETE} for finishing a session, ${XP_REWARDS.PERFECT_SCORE} for a perfect score, ${ON_TIME_BONUS} for doing it inside the window they were given.`,
    },
    {
      titlu: "A daily streak, with the right to slip",
      text: `Consecutive days count. But if they missed up to ${STREAK_RECOVERY.maxMissedDays} days — leave, illness — they win the streak back: ${STREAK_RECOVERY.questions} questions, ${STREAK_RECOVERY.requiredCorrect} of them correct, within ${RECUPERARE_MINUTE} minutes. One hard week does not cost them everything.`,
    },
    {
      titlu: `${DEFAULT_LEVELS.length} tiers and a leaderboard`,
      text: `Tiers at ${NIVELE_PRAGURI_EN} points, and a leaderboard of the top ${LEADERBOARD_TOP} in their own group. Not the whole company — competing against 19,000 strangers motivates nobody; competing with the colleagues in your office does.`,
    },
    {
      titlu: "The challenge of the day",
      text: `One question a day, where the points are ${XP_REWARDS.DAILY_CHALLENGE_MULTIPLIER === 2 ? "doubled" : `multiplied by ${XP_REWARDS.DAILY_CHALLENGE_MULTIPLIER}`}. It is the reason someone opens the app on a day when they had nothing there to do.`,
    },
  ],
  motorNota:
    "The figures above are not typed into this page: they are read from the same configuration file the engine uses to award the points. Change the rule and the page changes with it.",

  scorTitlu: "Coming back to learn is rewarded, not penalised",
  scorLead:
    "A course is not a photograph of what you knew on the first try; it is what you know at the end. Most platforms punish repetition without meaning to: they average every attempt, so someone who gets it wrong and then learns looks worse than someone who stopped. Ours does not. And whoever comes back earns points for it — fewer than knowing it outright, so a wrong answer never becomes a strategy, but enough to make the trip back worth it.",
  scorLegenda: [
    { valoare: "10", cand: "correct on the first try (plus 5 under five seconds — first encounter only, because the second time speed is expected and proves nothing)" },
    { valoare: "7", cand: "got it wrong, came back and fixed it. Deliberately under 10: knowing it outright stays better, otherwise a wrong answer becomes a strategy" },
    { valoare: "3 · 2 · 1", cand: "practising something already known, decreasing, at most three times a day per question. Practice stays free, but a leaderboard cannot be ground out of it" },
  ],
  scorCapCaz: "On a four-question module",
  scorCapCalcul: "How it adds up",
  scorCapPuncte: "Points",
  scorCapRaport: "What management sees",
  scorCazuri: [
    { caz: "Knows it on the first try", calcul: "4 × 10", puncte: "40", raport: "Knows 4/4 · first try 4/4" },
    { caz: "Gets 2 wrong, then learns them", calcul: "2 × 10 + 2 × 7", puncte: "34", raport: "Knows 4/4 · first try 2/4 · 2 recoveries" },
    { caz: "Gets 3 wrong, then learns them", calcul: "1 × 10 + 3 × 7", puncte: "31", raport: "Knows 4/4 · first try 1/4 · 3 recoveries" },
    { caz: "Gets 2 of 4 and stops", calcul: "2 × 10", puncte: "20", raport: "Knows 2/4 · first try 2/4" },
    { caz: "Gets everything wrong, then learns it all", calcul: "4 × 7", puncte: "28", raport: "Knows 4/4 · first try 0/4 · 4 recoveries" },
    { caz: "Repeats mechanically nine times", calcul: "4 × 10 + 4 × (3+2+1+0+0+0+0+0+0)", puncte: "64", raport: "Knows 4/4 · practised" },
  ],
  scorConcluzie:
    "Read row two against row four: both answered exactly two questions correctly on the first try. The one who came back gets 34, the one who stopped gets 20 — those fourteen points are purely the determination to return. And the one who repeats mechanically gets 64, not 400: count the terms in the bracket — there are nine, one per repetition, but only the first three of the day are worth anything (3, then 2, then 1). From the fourth on, every repeat earns zero. Practice stays free; a leaderboard cannot be ground out of it.",
  scorNota:
    "That is why management sees three numbers rather than one: what the person knows now, how much they got on the first try, and how many times they came back. A single percentage would hide all three.",
  cascadaTitlu: "Whoever falls behind is not forgotten",
  cascadaLead:
    "The part no course emailed as an attachment has. After a day without activity, the platform starts looking for the person by itself, climbing the rungs one at a time.",
  cascadaCanale: {
    PUSH: "Phone notification",
    TELEGRAM: "Telegram",
    EMAIL: "Email",
    WHATSAPP: "WhatsApp",
    SMS: "SMS",
    CALL: "Phone call",
  },
  cascadaImediat: "immediately",
  cascadaDupaMin: "{n} minutes later",
  cascadaOprire:
    "The cascade stops the moment the person resumes — not at the end of the list. Whoever got going hears nothing more; whoever never opened it reaches, rung by rung, the channel they actually answer on.",
  cascadaRitm:
    "You set the pace. By default the rungs sit close together, because the mechanism was built for a pupil missing a study session that evening; for a workplace course you space them out in days.",
  cascadaDovadaTitlu: "Not a line on a feature list",
  cascadaDovada: `The mechanism runs every ${CRON_MINUTE} minutes and has carried ${DOVADA_LANTURI.toLocaleString("en-US")} reminder chains through to the end on the other side of the platform, across all four channels — phone notification, Telegram, email and WhatsApp. Counted in the production database on ${DOVADA_DATA_EN}, not estimated.`,

  tabloTitlu: "What you get: the table, not a promise",
  tabloLead:
    "This is the actual structure of the screen an office manager or a network director opens. The names and badge numbers below are invented; the columns, the stages and the way the score colours itself are the real ones.",
  tabloCapCursant: "Learner",
  tabloCapStare: "Stage",
  tabloModule: ["M1 · The first attempt", "M2 · Cash and proof", "M3 · The person at the door"],
  tabloLectie: "lesson",
  tabloTest: "test",
  tabloRanduri: [
    {
      nume: "Ionescu Marian",
      detaliu: "badge 41207 · Buzău 3 office",
      stare: "Finished",
      stareNota: "tapped 02.09",
      module: [
        { lectie: "02.09", scor: [7, 7], zi: "02.09" },
        { lectie: "04.09", scor: [6, 7], zi: "04.09" },
        { lectie: "05.09", scor: [7, 7], zi: "05.09" },
      ],
    },
    {
      nume: "Dobre Elena",
      detaliu: "badge 38914 · Buzău 1 office",
      stare: "Learning",
      stareNota: "tapped 02.09",
      module: [
        { lectie: "03.09", scor: [7, 7], zi: "03.09" },
        { lectie: "08.09", scor: [4, 7], zi: "08.09" },
        { lectie: null, scor: null, zi: null },
      ],
    },
    {
      nume: "Vasilache Petru",
      detaliu: "badge 40556 · Râmnicu Sărat office",
      stare: "Account created",
      stareNota: "tapped 03.09",
      module: [
        { lectie: null, scor: null, zi: null },
        { lectie: null, scor: null, zi: null },
        { lectie: null, scor: null, zi: null },
      ],
    },
    {
      nume: "Neagu Cristina",
      detaliu: "badge 39880 · Pogoanele office",
      stare: "Invitation sent",
      stareNota: "sent 02.09",
      module: [
        { lectie: null, scor: null, zi: null },
        { lectie: null, scor: null, zi: null },
        { lectie: null, scor: null, zi: null },
      ],
    },
  ],
  tabloLegenda:
    "The score colours itself: green above 70%, amber between 50 and 70, red below. Elena's row says something an attendance sheet never could — she read everything, but on the module about cash she fell under the line. That is not a discipline problem, it is a module that was not understood.",
  tabloConducere: [
    "Who completed each module and when — per person, not per attendance list.",
    "Which module people get wrong most: the platform keeps an error rate per topic, so you see what was not understood, not just who did not read.",
    "Each person's own page, where the mistakes come before the right answers — because those are the ones worth reading.",
    "The subject stays private. It is not in the catalogue, cannot be searched, and does not exist for anyone without a code.",
    "Content is edited from the admin panel, without depending on us for every correction.",
  ],

  obiectiiTitlu: "What you would ask us, if we were in the same room",
  obiectiiLead:
    "We write them down before you have to. Each one has an answer that already exists in the product, not one we would build after signature.",
  obiectii: [
    {
      intrebare: "“My people do not have email addresses.”",
      raspuns:
        "None is needed. The person enters with a code and gives their first name, last name and phone number; the account is created there. And if they forget the password, they get a code over WhatsApp and type it into the app — with no email address anywhere along the way.",
    },
    {
      intrebare: "“They do not want to install anything on their phones.”",
      raspuns:
        "Nothing gets installed. It is a web page, opened from the link that arrived over WhatsApp. Not on their phones, and not on your servers.",
    },
    {
      intrebare: "“Not all of them have a good phone.”",
      raspuns:
        "The lesson is text, not video: it loads on any phone with a browser and does not eat data like a film. And for those who have none at all, the shared code works from any phone — including the office manager's, at the counter.",
    },
    {
      intrebare: "“Where does our people's data end up?”",
      raspuns: `For your people, you are the data controller. ${FURNIZOR} processes their data on your behalf, under a data processing agreement signed together with the contract. Your subject stays private: it is not in the catalogue, cannot be searched, and does not exist for anyone without a code — not even if they guess its name.`,
    },
    {
      intrebare: "“We have no time to pull people off their rounds.”",
      raspuns:
        "You do not pull them off. Seven to ten minutes per lesson, whenever they can: at the end of a shift, on a break. No day taken out of the schedule, no travel paid.",
    },
    {
      intrebare: "“And if the material is not right for us?”",
      raspuns:
        "Today it genuinely is not, and this page says so at the top, in large type. It is written from public sources, with every assumption marked in the text and the missing procedure named. The first thing we do together is replace the assumptions with your own wording.",
    },
  ],

  costTitlu: "What it costs you to start",
  costLead: "The unspoken question of any decision-maker is what it costs them, in time. The answer, plainly:",
  cost: [
    { titlu: "From you", text: "A list of names and phone numbers. An Excel or CSV file. That is all." },
    { titlu: "To install", text: "Nothing. Not on your people's phones, not on your servers." },
    { titlu: "To integrate", text: "Nothing. We connect to none of your systems in order to start." },
    { titlu: "Until the first person is in", text: "The day we receive the list. Invitations go out from a button." },
  ],

  deCeTitlu: "Why now",
  deCe: [
    {
      text: "In 2024, for the first time, Romania moved more parcels than letters — roughly 335 million against roughly 267 million.",
      sursa: "public ANCOM data, 2025 report covering 2024",
    },
    {
      text: "9 out of 10 domestic parcels arrive on the first day, with a market average of about 1.2 days. That is the bar your customer measures you against, even if they never say it.",
      sursa: "public ANCOM data, 2025 report covering 2024",
    },
    {
      text: "The device the lesson is read on is already in your people's hands: 7,000 Android handhelds, 7,000 data plans and 8,600 mobile printers.",
      sursa: "Poșta Română press release",
    },
  ],

  pilotTitlu: "What happens next",
  pilotLead: "A bounded pilot, measured before and after — not a framework contract.",
  pilot: [
    "You give us the missing procedures: delivery and notice slips, cash handling, handheld use, complaint intake. Each assumption is replaced by your own wording.",
    "Three to five postmen and one office manager read the material for an hour, with a single question: “where is this not true at your place?”. What they say goes into the text before the pilot.",
    "One county, a few offices of different kinds, twelve weeks, with a group that does not take the course — so the difference can be seen.",
    "The instructors are your own office managers, not us. What changes habits is the direct manager who teaches, not the outside supplier.",
  ],

  contactTitlu: "Who to reply to",
  contactLead:
    "Write or call us and we will send access codes for as many people as you want to see the material, plus an answer to any question on this page.",
  contactMailEticheta: "Email",
  contactTelEticheta: "Phone",

  finalTitlu: "One step further",
  finalSub:
    "Send us one procedure — just one, the delivery-and-notice one. We will send back the module rewritten in your own wording, so you can see the difference between what is on this page and what it would be at your place. It costs nothing and commits you to nothing.",
  finalCta: "Send us your procedures",
  finalCursant: "Are you a learner with an access code already? Sign in.",
};


/**
 * Aduce un element de listă la forma pe care o are originalul.
 *
 * Scris după ce proba a arătat că un rând salvat fără câmpul imbricat `module`
 * dărâmă pagina publică: randarea face `.map()` pe el, iar `undefined.map` aruncă →
 * `/posta` întorcea **500**. Adică exact promisiunea pe care stă tot mecanismul —
 * „editarea textului nu poate strica pagina" — cădea la prima salvare incompletă.
 *
 * Reparat aici, pe calea de CITIRE, nu doar la salvare: în bază se poate ajunge și
 * altfel decât prin formular (o interogare rulată de mână, o restaurare parțială),
 * iar o pagină publică nu are voie să depindă de disciplina celui care scrie.
 *
 * Regula: se pleacă de la șablon și se acceptă din element doar cheile pe care
 * șablonul le are, cu tipul pe care îl are el. Restul rămâne din șablon. Deci
 * elementul rezultat are ÎNTOTDEAUNA toate câmpurile — inclusiv listele imbricate.
 */
function normalizeazaElement(sablon: unknown, element: unknown): unknown {
  if (typeof sablon === "string") return typeof element === "string" ? element : sablon;
  if (!sablon || typeof sablon !== "object") return sablon;

  const sab = sablon as Record<string, unknown>;
  const el = (element && typeof element === "object" && !Array.isArray(element))
    ? (element as Record<string, unknown>)
    : {};
  const iesire: Record<string, unknown> = {};

  for (const [k, implicit] of Object.entries(sab)) {
    const v = el[k];
    if (typeof implicit === "string") {
      iesire[k] = typeof v === "string" ? v : implicit;
    } else if (Array.isArray(implicit)) {
      iesire[k] = Array.isArray(v) ? v : implicit;
    } else if (typeof implicit === "boolean") {
      iesire[k] = typeof v === "boolean" ? v : implicit;
    } else if (implicit === undefined) {
      iesire[k] = v;
    } else {
      iesire[k] = v !== undefined && typeof v === typeof implicit ? v : implicit;
    }
  }
  return iesire;
}

/**
 * O listă venită din bază, adusă la forma originalului. Șablonul e primul element
 * din listă implicită — toate listele paginii au elemente omogene.
 */
export function normalizeazaLista(implicit: unknown[], nou: unknown[]): unknown[] {
  const sablon = implicit[0];
  if (sablon === undefined) return nou;
  return nou.map((el) => normalizeazaElement(sablon, el));
}

/**
 * Suprapune peste textul din cod ce s-a salvat din panou.
 *
 * Reguli, alese ca editarea să nu poată strica pagina:
 *
 * - **Șir gol = revenire la original.** Cine golește un câmp în formular vrea textul
 *   de la început, nu o pagină cu o gaură în ea. Așa, „reset" nu are nevoie de niciun
 *   buton special și nu se poate rata.
 * - **Listele se înlocuiesc întregi**, nu element cu element. Formularul trimite mereu
 *   lista completă; dacă am fi îmbinat pe poziții, ștergerea celei de-a doua obiecții
 *   ar fi făcut-o pe a treia să ia locul ei și apoi să reapară din implicit.
 * - **Lista golită deliberat rămâne goală.** E o alegere validă (o secțiune fără carduri),
 *   spre deosebire de un șir gol, care e aproape mereu o ștergere din greșeală.
 * - **Tipul greșit se ignoră.** Dacă în baza de date ajunge un număr acolo unde codul
 *   are un text, câștigă codul: o pagină publică nu are voie să cadă pentru un rând
 *   stricat de date.
 *
 * Pură: fără citire din bază, deci se poate rula și în browser (previzualizare) și în
 * teste, nu doar pe server.
 */
export function imbinaCopy(baza: Copy, salvat: unknown): Copy {
  if (!salvat || typeof salvat !== "object" || Array.isArray(salvat)) return baza;
  const s = salvat as Record<string, unknown>;
  const iesire: Record<string, unknown> = { ...(baza as unknown as Record<string, unknown>) };

  for (const [cheie, implicit] of Object.entries(baza as unknown as Record<string, unknown>)) {
    if (!(cheie in s)) continue;
    const nou = s[cheie];

    if (typeof implicit === "string") {
      if (typeof nou === "string" && nou.trim() !== "") iesire[cheie] = nou;
      continue;
    }
    if (Array.isArray(implicit)) {
      if (Array.isArray(nou)) iesire[cheie] = normalizeazaLista(implicit, nou);
      continue;
    }
    if (implicit && typeof implicit === "object") {
      if (nou && typeof nou === "object" && !Array.isArray(nou)) {
        const imbinat: Record<string, unknown> = { ...(implicit as Record<string, unknown>) };
        for (const [k, v] of Object.entries(nou as Record<string, unknown>)) {
          if (k in imbinat && typeof v === "string" && v.trim() !== "") imbinat[k] = v;
        }
        iesire[cheie] = imbinat;
      }
      continue;
    }
  }

  return iesire as unknown as Copy;
}
