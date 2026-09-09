import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Brand } from "@/components/Brand";
import {
  XP_REWARDS,
  ON_TIME_BONUS,
  DEFAULT_LEVELS,
  STREAK_RECOVERY,
  LEADERBOARD_TOP,
  FAST_ANSWER_THRESHOLD_MS,
} from "@/lib/gamification-constants";
import { ESCALATION_LEVELS } from "@/lib/escalation/config";
import type { EscalationChannel } from "@prisma/client";

/**
 * Pagina de demonstrație pentru Poșta Română.
 *
 * Antet propriu, nu `SiteHeader`: acolo scrie „Ești ELEV / PĂRINTE / PROFESOR", ceea ce
 * la un client instituțional sună a altă adresă. Aici rămân două lucruri — marca și
 * autentificarea.
 *
 * Caseta „conținut simulat" e obligatorie și stă sus, nu în subsol: cursurile sunt scrise
 * fără acces la procedurile lor, iar un factor care le-ar citi crezând că sunt regulament
 * ar face rău, nu bine.
 *
 * ── Despre cifrele din pagină ────────────────────────────────────────────────
 * Regula, fără excepție: nimic din ce scrie aici nu e o promisiune de listă de funcții.
 * Numerele mecanismului (puncte, praguri de nivel, treptele cascadei) se IMPORTĂ din
 * codul care le aplică — `gamification-constants.ts` și `escalation/config.ts` — ca să
 * nu poată aluneca de la ce face produsul. Dacă cineva schimbă pragul unui nivel,
 * pagina asta se schimbă odată cu el.
 *
 * Cifrele de utilizare (817 lanțuri de memento-uri duse până la capăt, pe patru canale)
 * au fost NUMĂRATE în baza de producție la 09.09.2026, nu estimate. Sunt scrise ca
 * literali cu data lângă ele, tocmai fiindcă îmbătrânesc: o cifră fără dată devine o
 * minciună tăcută. Nu se citesc live — pagina asta e publică și necachabilă pe user,
 * iar o interogare de numărare la fiecare afișare ar plăti cu latență un lucru pe care
 * un decident îl citește o dată.
 *
 * ── Ce NU scrie în pagină, deși ar suna bine ─────────────────────────────────
 * Denumirile treptelor de nivel NU sunt prezentate ca reglabile din panou: `LevelConfig`
 * există în bază, dar nu are nicio cale de scriere în cod (verificat 09.09.2026) — deci
 * ar fi fost o funcție inventată, exact genul care se rupe la prima întrebare a
 * clientului.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "eTutor for Poșta Română — demo"
      : "eTutor pentru Poșta Română — demonstrație",
    description: isEn
      ? "Three role-based course tracks — postman, counter clerk, post office manager. Demo materials written from public sources, with every assumption marked in the text."
      : "Trei trasee de curs pe roluri — factor poștal, ghișeu, diriginte de oficiu. Materiale demonstrative, scrise din surse publice, cu fiecare presupunere marcată în text.",
    robots: { index: false, follow: false },
  };
}

/** Un rând din tabloul managerului, reprodus pentru captura demonstrativă. */
type RandTablou = {
  nume: string;
  detaliu: string;
  stare: string;
  stareNota: string;
  module: { lectie: string | null; scor: [number, number] | null; zi: string | null }[];
};

type PasFlux = {
  titlu: string;
  text: string;
  /** Ce se întâmplă fără ca cineva să apese ceva. Se marchează vizibil în grafic. */
  automat?: boolean;
};

type Copy = {
  badge: string;
  hero: string;
  subtitle: string;
  ctaPdf: string;
  ctaScrie: string;
  ctaIn: string;
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
  contactSubiect: string;

  finalTitlu: string;
  finalSub: string;
  finalCta: string;
  finalCursant: string;
};

/**
 * Logo-urile din antet și subsol.
 *
 * Se randează DOAR dacă fișierul chiar există în `public/`. Motivul e practic: la
 * scrierea paginii nu aveam niciunul dintre cele două fișiere, iar un `<img>` către
 * un fișier absent afișează pictograma de imagine ruptă — exact pe documentul care
 * ajunge la conducerea clientului. Cu verificarea de mai jos, pagina arată curat cu
 * text până când cineva copiază fișierul, și se schimbă singură în clipa în care îl
 * copiază. Nicio altă modificare de cod.
 *
 * E o citire de disc la randare, într-o componentă de server, pe o pagină publică și
 * rar cerută — nu merită complicație în plus.
 */
const LOGO_POSTA = "/posta/logo-posta-romana.png";
const LOGO_KNOWHOW = "/posta/logo-know-how.png";

/** Adevărat dacă fișierul public chiar e pe disc. Alternativele acceptate: .png, .svg, .webp. */
function logoExistent(caleaPublica: string): string | null {
  const fara = caleaPublica.replace(/\.[a-z0-9]+$/i, "");
  for (const ext of [".svg", ".png", ".webp", ".jpg"]) {
    const cale = fara + ext;
    if (existsSync(path.join(process.cwd(), "public", cale.replace(/^\//, "")))) return cale;
  }
  return null;
}

/** Grupul din care face parte furnizorul, cerut în subsol. */
const CONSORTIU = "part of Know How Consortium";

/** Datele firmei, așa cum le ține Legal Hub pentru aplicația `tutor` (biller + controller). */
const FURNIZOR = "Class RDA Impex SRL";
const CONTACT_MAIL = "office@etutor.ro";
const CONTACT_TEL_AFISAT = "0712 383 492";
const CONTACT_TEL_LINK = "+40712383492";

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

/**
 * Stratul de tipărire. Pagina rămâne întunecată pe ecran — doar PDF-ul iese alb,
 * fiindcă ajunge la conducerea unui client instituțional, care îl tipărește.
 *
 * Regulile au fost scrise după ce am generat PDF-ul brut și m-am uitat la el:
 * bannerul de cookie-uri acoperea începutul secțiunii cu cursurile, iar cele
 * patru pagini negre arătau a captură de ecran, nu a propunere comercială.
 *
 * E CSS scris de noi, nu conținut din baza de date — dacă textele paginii ajung
 * vreodată editabile din admin, ele NU au voie să treacă pe calea asta.
 */
const PRINT_CSS = `
@media print {
  /* Banner de cookie-uri, CTA WhatsApp, bara mobilă — plutesc peste conținut. */
  .fixed { display: none !important; }

  /* Subsolul cu politici vine din layout, deci stă în afara zonei albite mai jos și
     ieșea ca o bandă neagră în document. Pe hârtie, linkurile alea nu duc nicăieri.
     Pe pagina asta nu există alt <footer>, iar regulile astea se încarcă doar aici. */
  footer { display: none !important; }

  html, body { background: #ffffff !important; }
  [data-posta] { background: #ffffff !important; color: #111827 !important; }
  [data-posta] * {
    background-color: transparent !important;
    background-image: none !important;
    color: #1f2937 !important;
    border-color: #d1d5db !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
  }
  [data-posta] h1, [data-posta] h2, [data-posta] h3 { color: #0f172a !important; }
  /* Accentele rămân, altfel documentul devine o masă cenușie. */
  [data-posta] .text-blue-400, [data-posta] .text-blue-300 { color: #1d4ed8 !important; }
  [data-posta] .text-amber-300 { color: #92400e !important; }
  /*
    Verde și roșu, nu doar chihlimbar. Legenda de sub tablou PROMITE trei culori
    („verde peste 70%, chihlimbar între 50 și 70, roșu sub") — fără liniile astea,
    pe hârtie 7/7 și 2/7 ies amândouă gri și legenda devine o afirmație falsă
    exact în locul unde documentul cere să fie crezut. Prins uitându-mă la PDF.
  */
  [data-posta] .text-emerald-300 { color: #047857 !important; }
  [data-posta] .text-red-300 { color: #b91c1c !important; }

  /*
    Logo-ul Poștei, așa cum îl publică ei, e ALB pe fond transparent — făcut pentru un
    antet închis. Pe pagina noastră (întunecată) arată corect; pe hârtia albă a PDF-ului
    ar fi dispărut complet, iar antetul ar fi rămas cu marca noastră singură, exact pe
    documentul care ajunge la ei.

    Măsurat înainte de a alege soluția: fișierul e monocrom, 32.576 de pixeli opaci de o
    singură culoare, alb pur. Deci \`brightness(0)\` îl face negru fără să strice nimic —
    ceea ce la un logo colorat NU ar fi fost adevărat.
  */
  [data-posta] .logo-posta { filter: brightness(0) !important; }

  /*
    Subsolul de sfârșit. Fără regula asta se rupea între foi — numele firmei rămânea
    pe ultima pagină de conținut, iar consorțiul, contactul și logo-ul treceau singure
    pe o foaie nouă, aproape goală. Un bloc de semnătură rupt în două arată a greșeală
    de tipar, nu a document îngrijit. Prins uitându-mă la PDF, la pagina 11.
  */
  /*
    Blocul mare de semnătură e pentru ECRAN. La tipar se ascunde: subsolul repetat de
    mai jos spune deja firma, consorțiul și contactul pe FIECARE pagină, iar blocul
    mare mai cerea o foaie întreagă pentru un rând de text — a 11-a pagină a PDF-ului
    era goală în proporție de 90%. Logo-ul, ca să nu se piardă, a trecut în subsolul
    repetat, deci acum apare pe toate paginile, nu pe una.
  */
  [data-posta] .posta-subsol { display: none !important; }

  .posta-print-logo {
    height: 13px; width: auto; vertical-align: -2px;
    margin-right: 7px; display: inline-block;
  }
  /*
    Așezarea în pagini. Regula de dinainte era \`section { break-inside: avoid }\`, care
    arunca o secțiune ÎNTREAGĂ pe foaia următoare dacă nu încăpea — măsurat pe PDF-ul
    generat: pagini pe jumătate goale, iar al treilea card de curs oricum se rupea,
    fiindcă interdicția era pe secțiune, nu pe card.

    Inversat: secțiunile au voie să se rupă, dar CARDUL, PASUL din grafic și RÂNDUL din
    tablou nu — alea sunt unitățile pe care ochiul le citește ca întreg. Plus titlul nu
    rămâne singur la baza foii.
  */
  [data-posta] h2, [data-posta] h3 { break-after: avoid; }
  [data-posta] .rounded-2xl,
  [data-posta] .rounded-xl,
  [data-posta] .flux-pas,
  [data-posta] .tablou tr { break-inside: avoid; }

  /*
    Graficul fluxului. Pe ecran traseul se vede prin culoare; pe hârtie, culoarea
    dispare sub regula de mai sus, deci desenul trebuie să se țină din LINIE și
    CONTUR, nu din umplere. Cele trei reguli de mai jos sunt tot ce-l ține în viață
    alb-negru: șina verticală, cercul cu numărul, și marcajul „automat".

    Ordinea contează — stau după \`[data-posta] *\` ca să-l bată la specificitate egală.
  */
  [data-posta] .flux-sina { background-color: #9ca3af !important; }
  [data-posta] .flux-nod {
    background-color: #ffffff !important;
    border: 1.5px solid #374151 !important;
    color: #111827 !important;
    font-weight: 700;
  }
  [data-posta] .flux-auto {
    border: 1px dashed #6b7280 !important;
    color: #374151 !important;
  }
  /* Un pas nu are voie să se rupă între două pagini: numărul pe o foaie și textul
     pe următoarea transformă traseul în listă. */
  [data-posta] .flux-pas { break-inside: avoid; }

  /*
    Tabloul demonstrativ. Fără liniile astea rămâne text aliniat în coloane invizibile,
    adică exact impresia de „captură de ecran lipită" pe care o evită restul paginii.
  */
  [data-posta] .tablou th, [data-posta] .tablou td {
    border: 1px solid #d1d5db !important;
    padding: 4px 6px !important;
  }
  /*
    Lățimea. Pe ecran tabloul are \`min-w-[44rem]\` și se derulează lateral în containerul
    lui; pe hârtie nu există derulare, deci coloana din dreapta ieșea tăiată — măsurat:
    antetul ultimului modul se citea „OMUL DE L UȘĂ". Scoatem lățimea minimă și
    deschidem containerul, ca tabelul să se strângă în foaie.
  */
  [data-posta] .tablou { font-size: 8pt !important; min-width: 0 !important; width: 100% !important; }
  [data-posta] .overflow-x-auto { overflow: visible !important; }
  [data-posta] .tablou thead th { background-color: #f3f4f6 !important; font-weight: 700; }

  /* Marginea de jos e mărită ca să încapă subsolul repetat de mai jos.
     Fără ea, textul ar trece pe sub el pe fiecare pagină. */
  @page { margin: 14mm 14mm 22mm 14mm; }

  /*
    Datele firmei pe FIECARE pagină, nu doar pe ultima: paginile unui document
    se despart — se tipăresc, se scanează, se trimit una singură mai departe.
    \`position: fixed\` e mecanismul prin care motorul de tipărire repetă un
    element pe toate paginile. Regulile stau la final ca să bată \`[data-posta] *\`
    la specificitate egală.
  */
  .posta-print-footer {
    display: block !important;
    position: fixed !important;
    bottom: 0; left: 0; right: 0;
    border-top: 1px solid #d1d5db !important;
    padding-top: 5px;
    font-size: 8.5pt;
    line-height: 1.35;
  }
  .posta-print-footer, .posta-print-footer * { color: #4b5563 !important; }
  .posta-print-footer strong { color: #1f2937 !important; }
}
`;

const RO: Copy = {
  badge: "Demonstrație · eTutor pentru Poșta Română",
  hero: "Sistemele se schimbă în ani. Oamenii de la ușă și de la ghișeu, în săptămâni.",
  subtitle:
    "Clientul nu vede sistemul informatic. Vede factorul de la ușă și casiera de la geam — și pe ei îi compară, fără să vrea, cu ce a primit marți de la altcineva. Pagina asta arată cum se instruiesc oamenii aceia: pe telefon, în zece minute, cu dovadă că s-a făcut.",
  ctaPdf: "Descarcă prezentarea (PDF)",
  ctaScrie: "Trimiteți-ne procedurile",
  ctaIn: "Autentificare",

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
      raspuns: `Operatorul de date este ${FURNIZOR}, iar politicile sunt publice și versionate. Materia voastră e privată: nu apare în catalog, nu se poate căuta și nu există pentru cine nu are cod — nici măcar dacă îi ghicește numele.`,
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
  contactSubiect: "Poșta Română — procedurile pentru pilot",

  finalTitlu: "Un singur pas mai departe",
  finalSub:
    "Trimiteți-ne o procedură — una singură, cea de livrare și avizare. Vă returnăm modulul rescris cu frazele voastre, ca să vedeți diferența dintre ce e în pagina asta și ce ar fi la voi. Nu costă nimic și nu obligă la nimic.",
  finalCta: "Trimiteți-ne procedurile",
  finalCursant: "Sunteți cursant și aveți deja un cod de acces? Intrați în cont.",
};

const EN: Copy = {
  badge: "Demo · eTutor for Poșta Română",
  hero: "Systems change in years. The people at the door and at the counter change in weeks.",
  subtitle:
    "The customer never sees the IT system. They see the postman at the door and the clerk at the counter — and they compare them, without meaning to, with what arrived on Tuesday from someone else. This page shows how those people are trained: on a phone, in ten minutes, with proof that it happened.",
  ctaPdf: "Download the presentation (PDF)",
  ctaScrie: "Send us your procedures",
  ctaIn: "Sign in",

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
      raspuns: `The data controller is ${FURNIZOR}, and the policies are public and versioned. Your subject stays private: it is not in the catalogue, cannot be searched, and does not exist for anyone without a code — not even if they guess its name.`,
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
  contactSubiect: "Poșta Română — procedures for the pilot",

  finalTitlu: "One step further",
  finalSub:
    "Send us one procedure — just one, the delivery-and-notice one. We will send back the module rewritten in your own wording, so you can see the difference between what is on this page and what it would be at your place. It costs nothing and commits you to nothing.",
  finalCta: "Send us your procedures",
  finalCursant: "Are you a learner with an access code already? Sign in.",
};

/** Aceleași praguri ca în tabloul real (`admin/cursanti/roster.tsx`). */
function culoareScor(corecte: number, total: number): string {
  if (total === 0) return "text-gray-500";
  const p = (corecte / total) * 100;
  if (p >= 70) return "text-emerald-300";
  if (p >= 50) return "text-amber-300";
  return "text-red-300";
}

export default async function PostaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = locale === "en" ? EN : RO;
  const mailto = `mailto:${CONTACT_MAIL}?subject=${encodeURIComponent(c.contactSubiect)}`;
  const logoPosta = logoExistent(LOGO_POSTA);
  const logoKnowHow = logoExistent(LOGO_KNOWHOW);

  return (
    <div data-posta className="min-h-screen bg-gray-950 text-gray-100">
      <style>{PRINT_CSS}</style>
      {/*
        Antetul e al ÎNTÂLNIRII, nu al site-ului: marca noastră în stânga, a clientului
        în dreapta — cerut de user, ca omul de la Poșta să-și vadă casa pe document.
        „Autentificare" a coborât la finalul paginii: aici concura cu logo-ul clientului
        și oricum nu e pentru decident.
      */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label="eTUTOR.ro" className="inline-flex min-h-[44px] items-center">
            <Brand className="text-xl" />
          </Link>
          {logoPosta ? (
            /* eslint-disable-next-line @next/next/no-img-element -- fișier statuar din public/, fără optimizare */
            <img src={logoPosta} alt="Poșta Română" className="logo-posta h-9 w-auto object-contain" />
          ) : (
            <span className="text-sm font-semibold tracking-wide text-gray-300">Poșta Română</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-14">
        <div className="max-w-3xl">
          <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-300">
            {c.badge}
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-5xl">{c.hero}</h1>
          <p className="mt-4 text-lg text-gray-400">{c.subtitle}</p>
          {/*
            Cele două butoane sunt pentru DECIDENT, nu pentru cursant: el nu-și face cont
            de pe pagina asta, el ia fișierul și scrie un e-mail. „Autentificare" a rămas
            doar în antet, unde nu concurează cu îndemnul care contează.
          */}
          <div className="mt-7 flex flex-wrap gap-3 print:hidden">
            <a
              href={`/api/posta/pdf?locale=${locale === "en" ? "en" : "ro"}`}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
            >
              {c.ctaPdf}
            </a>
            <a
              href={mailto}
              className="inline-flex min-h-[44px] items-center rounded-xl border border-gray-700 px-6 py-3 font-semibold text-gray-200 hover:border-gray-500"
            >
              {c.ctaScrie}
            </a>
          </div>
        </div>

        <section role="note" aria-label={c.avertismentTitlu} className="mt-10 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6">
          <h2 className="text-lg font-semibold text-amber-300">{c.avertismentTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-300">{c.avertisment}</p>
        </section>

        {/* Aritmetica lor, nu a pieței: singura secțiune din pagină despre EI. */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">{c.scaraTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">{c.scaraLead}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {c.scaraCifre.map((x) => (
              <div key={x.eticheta} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-3xl font-bold tabular-nums text-blue-400">{x.valoare}</p>
                <p className="mt-1 text-sm text-gray-400">{x.eticheta}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-gray-300">{c.scaraConcluzie}</p>
          <p className="mt-2 text-xs text-gray-500">({c.scaraSursa})</p>
        </section>

        {/*
          Elementul grafic cerut: traseul pe VERTICALĂ, cu șina în stânga și textul lateral.
          E HTML, nu o imagine — deci se așază singur pe telefon, iese text selectabil în
          PDF, și nu se învechește ca o captură de ecran. Alb-negru se ține din șină,
          contur și marcajul punctat (vezi `.flux-*` din PRINT_CSS).
        */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">{c.fluxTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">{c.fluxLead}</p>
          {/*
            Șina stă în DIV-ul de poziționare, nu în <ol>: modelul de conținut al unei
            liste ordonate admite doar <li>, iar un <div> acolo strică numărătoarea
            anunțată de cititoarele de ecran și pică auditul de accesibilitate.
          */}
          <div className="relative mt-8">
            <div aria-hidden className="flux-sina absolute bottom-4 left-[15px] top-4 w-px bg-gray-700" />
            <ol>
            {c.flux.map((p, i) => (
              <li key={p.titlu} className="flux-pas relative flex gap-5 pb-8 last:pb-0">
                <span className="flux-nod z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-700 bg-gray-950 text-sm font-semibold text-blue-300">
                  {i + 1}
                </span>
                <div className="pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{p.titlu}</h3>
                    {p.automat && (
                      <span className="flux-auto rounded-full border border-dashed border-gray-700 px-2 py-0.5 text-[11px] text-gray-400">
                        {c.fluxAutomatEticheta}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-400">{p.text}</p>
                </div>
              </li>
            ))}
            </ol>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">{c.cursuriTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">{c.cursuriLead}</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {c.cursuri.map((k) => (
              <div key={k.titlu} className="flex flex-col rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">{k.rol}</p>
                <h3 className="mt-1 text-xl font-semibold">{k.titlu}</h3>
                <p className="mt-3 text-sm text-gray-400">{k.descriere}</p>
                <ul className="mt-4 space-y-1.5 border-t border-gray-800 pt-4 text-sm text-gray-300">
                  {k.module.map((m, i) => (
                    <li key={m} className="flex gap-2">
                      <span className="text-gray-500">{i + 1}.</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Gamificarea, spusă ca răspuns la „ce-i face să continue", nu ca listă de funcții. */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">{c.motorTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">{c.motorLead}</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {c.motor.map((m) => (
              <div key={m.titlu} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="font-semibold text-blue-400">{m.titlu}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{m.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">{c.motorNota}</p>
        </section>

        {/*
          Cascada. Treptele se citesc din `ESCALATION_LEVELS` — fișierul pe care îl execută
          motorul — nu din text scris aici, tocmai ca să nu poată ajunge să spună altceva
          decât face produsul.
        */}
        <section className="mt-16 rounded-2xl border border-gray-800 bg-gray-900/60 p-8">
          <h2 className="text-2xl font-semibold">{c.cascadaTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">{c.cascadaLead}</p>
          <ol className="mt-6 space-y-2.5">
            {ESCALATION_LEVELS.map((l, i) => (
              <li key={l.level} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="flux-nod inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-700 text-xs font-semibold text-blue-300">
                  {i + 1}
                </span>
                <span className="font-medium text-gray-200">{c.cascadaCanale[l.channel]}</span>
                <span className="text-gray-500">
                  {l.delayMinutes === 0
                    ? c.cascadaImediat
                    : c.cascadaDupaMin.replace("{n}", String(l.delayMinutes))}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-gray-300">{c.cascadaOprire}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">{c.cascadaRitm}</p>
          <div className="mt-6 rounded-xl border border-blue-900/60 bg-blue-950/20 p-5">
            <h3 className="text-sm font-semibold text-blue-300">{c.cascadaDovadaTitlu}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-300">{c.cascadaDovada}</p>
          </div>
        </section>

        {/*
          Dovada în locul promisiunii. NU e o captură de ecran — e tabloul reconstruit cu
          aceleași coloane, aceleași trepte și aceleași praguri de culoare ca
          `admin/cursanti/roster.tsx`. O captură ar fi îmbătrânit tăcut și ar fi ieșit
          ilizibilă pe hârtie; asta se așază singură și rămâne text în PDF.
        */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">{c.tabloTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">{c.tabloLead}</p>
          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-800">
            <table className="tablou w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2.5 font-semibold">{c.tabloCapCursant}</th>
                  <th className="px-3 py-2.5 font-semibold">{c.tabloCapStare}</th>
                  {c.tabloModule.map((m) => (
                    <th key={m} className="px-3 py-2.5 font-semibold">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.tabloRanduri.map((r) => (
                  <tr key={r.nume} className="border-t border-gray-800 align-top">
                    <td className="px-3 py-3">
                      <div className="font-medium text-white">{r.nume}</div>
                      <div className="text-xs text-gray-500">{r.detaliu}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-block rounded border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                        {r.stare}
                      </span>
                      <div className="mt-1 text-[11px] text-gray-600">{r.stareNota}</div>
                    </td>
                    {r.module.map((m, i) => (
                      <td key={i} className="px-3 py-3">
                        <div className="text-xs">
                          {m.lectie ? (
                            <span className="text-emerald-300">✓ {c.tabloLectie} {m.lectie}</span>
                          ) : (
                            <span className="text-gray-600">{c.tabloLectie} −</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs font-medium tabular-nums">
                          {m.scor ? (
                            <span className={culoareScor(m.scor[0], m.scor[1])}>
                              {m.scor[0]}/{m.scor[1]} · {m.zi}
                            </span>
                          ) : (
                            <span className="text-gray-600">{c.tabloTest} −</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">{c.tabloLegenda}</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {c.tabloConducere.map((x) => (
              <li key={x} className="flex gap-2 text-sm text-gray-300">
                <span className="text-blue-400">✓</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">{c.obiectiiTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">{c.obiectiiLead}</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {c.obiectii.map((o) => (
              <div key={o.intrebare} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="font-semibold text-gray-200">{o.intrebare}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{o.raspuns}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">{c.costTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">{c.costLead}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.cost.map((x) => (
              <div key={x.titlu} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">{x.titlu}</p>
                <p className="mt-2 text-sm text-gray-300">{x.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-gray-800 bg-gray-900 p-8">
          <h2 className="text-2xl font-semibold">{c.deCeTitlu}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {c.deCe.map((x) => (
              <li key={x.text} className="text-sm text-gray-300">
                {x.text} <span className="text-gray-500">({x.sursa})</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-2xl border border-gray-800 bg-gray-900/60 p-8">
          <h2 className="text-2xl font-semibold">{c.pilotTitlu}</h2>
          <p className="mt-2 text-sm text-gray-400">{c.pilotLead}</p>
          <ol className="mt-5 space-y-3">
            {c.pilot.map((x, i) => (
              <li key={x} className="flex gap-3 text-sm text-gray-300">
                <span className="font-semibold text-blue-400">{i + 1}.</span>
                <span>{x}</span>
              </li>
            ))}
          </ol>
        </section>

        {/*
          Contactul stă imediat după pilot, nu în subsol: acolo termină de citit decidentul.
          `mailto:`/`tel:` merg pe `<a>` simplu, NU pe `Link`-ul din `@/i18n/navigation` — acela
          prefixează limba și ar strica schema (exact defectul reparat în `9c6a851`).
        */}
        <section className="mt-16 rounded-2xl border border-blue-900/60 bg-blue-950/20 p-8">
          <h2 className="text-2xl font-semibold">{c.contactTitlu}</h2>
          <p className="mt-2 text-sm text-gray-400">{c.contactLead}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:gap-8">
            <a
              href={mailto}
              className="inline-flex min-h-[44px] items-center gap-2 text-blue-300 hover:text-blue-200 hover:underline"
            >
              <span className="text-gray-500">{c.contactMailEticheta}:</span>
              <span className="font-semibold">{CONTACT_MAIL}</span>
            </a>
            <a
              href={`tel:${CONTACT_TEL_LINK}`}
              className="inline-flex min-h-[44px] items-center gap-2 text-blue-300 hover:text-blue-200 hover:underline"
            >
              <span className="text-gray-500">{c.contactTelEticheta}:</span>
              <span className="font-semibold">{CONTACT_TEL_AFISAT}</span>
            </a>
          </div>
        </section>

        {/*
          Un singur îndemn, același ca sus, la capătul lecturii — al DECIDENTULUI.
          Linia pentru cursant a rămas, dar mică și fără buton: ea nu are ce concura cu el.
        */}
        <section className="mt-16 text-center">
          <h2 className="text-2xl font-semibold">{c.finalTitlu}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-400">{c.finalSub}</p>
          <a
            href={mailto}
            className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-500 print:hidden"
          >
            {c.finalCta}
          </a>
          <p className="mt-8 text-xs text-gray-600 print:hidden">
            <Link href="/auth/signin" className="hover:text-gray-400 hover:underline">
              {c.finalCursant}
            </Link>
          </p>
        </section>

      </main>

      {/*
        Subsolul paginii. NU e un `<footer>`: eticheta aia e ascunsă la tipar de regula
        din PRINT_CSS (subsolul de politici al site-ului ieșea ca o bandă neagră), iar
        blocul ăsta trebuie să apară ȘI pe hârtie.

        Fără marca noastră, cerut de user: aici vorbește FIRMA — cea care semnează
        contractul și emite factura — nu produsul.
      */}
      <div className="posta-subsol border-t border-gray-800">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-semibold text-gray-200">{FURNIZOR}</p>
            <p className="mt-0.5 text-sm text-gray-500">{CONSORTIU}</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">
              {CONTACT_MAIL}
              <span className="mx-2 text-gray-700">·</span>
              {CONTACT_TEL_AFISAT}
            </p>
            {logoKnowHow ? (
              /* eslint-disable-next-line @next/next/no-img-element -- fișier statuar din public/ */
              /*
                Plăcuță albă: scrisul logo-ului e închis la culoare, deci pe subsolul
                întunecat ar fi fost invizibil. La tipar plăcuța devine transparentă
                singură (regula generală din PRINT_CSS), iar pe hârtie albă iese exact
                la fel — deci o singură soluție ține pentru ambele.
              */
              <span className="inline-flex items-center rounded bg-white px-2 py-1">
                <img src={logoKnowHow} alt="Know How Consortium" className="h-9 w-auto object-contain" />
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/*
        Doar în PDF, repetat pe fiecare pagină (vezi `.posta-print-footer` din PRINT_CSS).
        Cine primește documentul îl dă mai departe la juridic și achiziții, iar paginile
        se despart pe drum — o singură foaie ruptă din teanc trebuie să spună tot cine e
        furnizorul și pe cine sună.
      */}
      <div className="posta-print-footer hidden">
        {logoKnowHow ? (
          /* eslint-disable-next-line @next/next/no-img-element -- fișier statuar din public/ */
          <img src={logoKnowHow} alt="" className="posta-print-logo" />
        ) : null}
        <strong>{FURNIZOR}</strong>
        {" · "}
        {CONSORTIU}
        {" · "}
        {CONTACT_MAIL}
        {" · "}
        {CONTACT_TEL_AFISAT}
      </div>
    </div>
  );
}
