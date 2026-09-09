import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Brand } from "@/components/Brand";

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

type Copy = {
  badge: string;
  hero: string;
  subtitle: string;
  ctaIn: string;
  ctaCont: string;
  avertismentTitlu: string;
  avertisment: string;
  cursuriTitlu: string;
  cursuriLead: string;
  cursuri: { titlu: string; rol: string; descriere: string; module: string[] }[];
  cumTitlu: string;
  cumLead: string;
  pasi: { t: string; d: string }[];
  conducereTitlu: string;
  conducere: string[];
  deCeTitlu: string;
  deCe: { text: string; sursa: string }[];
  pilotTitlu: string;
  pilotLead: string;
  pilot: string[];
  contactTitlu: string;
  contactLead: string;
  contactMailEticheta: string;
  contactTelEticheta: string;
  pdfCta: string;
  furnizorEticheta: string;
  finalTitlu: string;
  finalSub: string;
};

/** Datele firmei, așa cum le ține Legal Hub pentru aplicația `tutor` (biller + controller). */
const FURNIZOR = "Class RDA Impex SRL";
const CONTACT_MAIL = "office@etutor.ro";
const CONTACT_TEL_AFISAT = "0712 383 492";
const CONTACT_TEL_LINK = "+40712383492";

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
  [data-posta] section { break-inside: avoid; }

  @page { margin: 14mm; }
}
`;

const RO: Copy = {
  badge: "Demonstrație · eTutor pentru Poșta Română",
  hero: "Sistemele se schimbă în ani. Oamenii de la ușă și de la ghișeu, în săptămâni.",
  subtitle:
    "Clientul nu vede sistemul informatic. Vede factorul de la ușă și casiera de la geam — și pe ei îi compară, fără să vrea, cu ce a primit marți de la altcineva. Pagina asta arată cum se instruiesc oamenii aceia: pe telefon, în zece minute, cu dovadă că s-a făcut.",
  ctaIn: "Autentificare",
  ctaCont: "Creează cont",
  avertismentTitlu: "Conținut simulat",
  avertisment:
    "Cele trei cursuri de mai jos sunt scrise de noi, din surse publice, fără acces la procedurile Poștei Române. Fiecare loc în care a trebuit să presupunem ceva este marcat vizibil în text, cu numele procedurii care lipsește. Nu sunt regulamente oficiale și nu se pot folosi ca atare. Exact asta e propunerea: dați-ne procedurile voastre și presupunerile devin frazele voastre.",
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
  cumTitlu: "Cum arată pentru un angajat",
  cumLead: "Fără sală, fără dosar, fără o zi luată din program.",
  pasi: [
    {
      t: "1. Primește un cod",
      d: "Codul e al rolului lui. Materia e privată: pentru cine nu are cod, nu apare nicăieri și nu poate fi găsită — nici măcar dacă îi ghicește numele.",
    },
    {
      t: "2. Citește lecția pe telefon",
      d: "Șapte-zece minute. Text simplu, cu replici exacte de spus clientului. Se poate relua oricând, de la capătul turei.",
    },
    {
      t: "3. Testul se deschide după lecție",
      d: "Nimeni nu e testat din ce n-a apucat să citească. Modulul intră în test abia după ce lecția lui e terminată.",
    },
    {
      t: "4. Rămâne dovada",
      d: "Cine a parcurs ce, când, și cu ce rezultat. Nu o listă de prezență la o sală, ci urma fiecărui om.",
    },
  ],
  conducereTitlu: "Ce vede conducerea",
  conducere: [
    "Cine a parcurs fiecare modul și când — pe om, nu pe listă de prezență.",
    "Pe ce modul se greșește cel mai mult — platforma ține rata de eroare pe fiecare temă, deci se vede ce n-a fost înțeles, nu doar cine n-a citit.",
    "Materia rămâne privată. Nu apare în catalog, nu se poate căuta, nu există pentru cine nu are cod.",
    "Conținutul se schimbă din panou, fără să depindeți de noi pentru fiecare corectură.",
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
    "Scrieți-ne sau sunați și vă trimitem codurile de acces pentru câte oameni vreți să vadă materialul, plus răspunsul la orice întrebare din pagina asta.",
  contactMailEticheta: "E-mail",
  contactTelEticheta: "Telefon",
  pdfCta: "Descarcă prezentarea (PDF)",
  furnizorEticheta: "Furnizor",
  finalTitlu: "Aveți deja un cod de acces?",
  finalSub: "Intrați în cont și deschideți traseul rolului dumneavoastră.",
};

const EN: Copy = {
  badge: "Demo · eTutor for Poșta Română",
  hero: "Systems change in years. The people at the door and at the counter change in weeks.",
  subtitle:
    "The customer never sees the IT system. They see the postman at the door and the clerk at the counter — and they compare them, without meaning to, with what arrived on Tuesday from someone else. This page shows how those people are trained: on a phone, in ten minutes, with proof that it happened.",
  ctaIn: "Sign in",
  ctaCont: "Create account",
  avertismentTitlu: "Simulated content",
  avertisment:
    "The three courses below were written by us from public sources, without access to Poșta Română's own procedures. Every place where we had to assume something is marked in the text, naming the procedure that is missing. These are not official regulations and must not be used as such. That is precisely the offer: give us your procedures and the assumptions become your own wording.",
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
  cumTitlu: "What it looks like for an employee",
  cumLead: "No classroom, no binder, no day taken out of the schedule.",
  pasi: [
    {
      t: "1. They get a code",
      d: "The code belongs to their role. The subject is private: for anyone without a code it appears nowhere and cannot be found — not even by guessing its name.",
    },
    {
      t: "2. They read on their phone",
      d: "Seven to ten minutes. Plain text, with exact lines to say to the customer. It can be reopened any time, at the end of a shift.",
    },
    {
      t: "3. The test opens after the lesson",
      d: "Nobody is tested on what they have not read. A module enters the test only once its lesson is finished.",
    },
    {
      t: "4. The proof stays",
      d: "Who covered what, when, and with what result. Not an attendance sheet, but a trace for each person.",
    },
  ],
  conducereTitlu: "What management sees",
  conducere: [
    "Who completed each module and when — per person, not per attendance list.",
    "Which module people get wrong most: the platform keeps an error rate per topic, so you see what was not understood, not just who did not read.",
    "The subject stays private. It is not in the catalogue, cannot be searched, and does not exist for anyone without a code.",
    "Content is edited from the admin panel, without depending on us for every correction.",
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
  pdfCta: "Download the presentation (PDF)",
  furnizorEticheta: "Provider",
  finalTitlu: "Already have an access code?",
  finalSub: "Sign in and open the track for your role.",
};

export default async function PostaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = locale === "en" ? EN : RO;

  return (
    <div data-posta className="min-h-screen bg-gray-950 text-gray-100">
      <style>{PRINT_CSS}</style>
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" aria-label="eTUTOR.ro" className="inline-flex min-h-[44px] items-center">
            <Brand className="text-xl" />
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 print:hidden"
          >
            {c.ctaIn}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-14">
        <div className="max-w-3xl">
          <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-300">
            {c.badge}
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-5xl">{c.hero}</h1>
          <p className="mt-4 text-lg text-gray-400">{c.subtitle}</p>
          <div className="mt-7 flex flex-wrap gap-3 print:hidden">
            <Link
              href="/auth/signin"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
            >
              {c.ctaIn}
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-gray-700 px-6 py-3 font-semibold text-gray-200 hover:border-gray-500"
            >
              {c.ctaCont}
            </Link>
            {/*
              Rută API, nu `Link` cu prefix de limbă. Omul de la Poșta ia fișierul
              și îl trimite mai departe conducerii — de-asta există pagina.
            */}
            <a
              href={`/api/posta/pdf?locale=${locale === "en" ? "en" : "ro"}`}
              className="inline-flex min-h-[44px] items-center rounded-xl border border-gray-700 px-6 py-3 font-semibold text-gray-200 hover:border-gray-500"
            >
              {c.pdfCta}
            </a>
          </div>
        </div>

        <section role="note" aria-label={c.avertismentTitlu} className="mt-10 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6">
          <h2 className="text-lg font-semibold text-amber-300">{c.avertismentTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-300">{c.avertisment}</p>
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

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">{c.cumTitlu}</h2>
          <p className="mt-2 text-sm text-gray-400">{c.cumLead}</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.pasi.map((p) => (
              <div key={p.t} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
                <p className="font-semibold text-blue-400">{p.t}</p>
                <p className="mt-2 text-sm text-gray-400">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="text-xl font-semibold">{c.conducereTitlu}</h2>
            <ul className="mt-4 space-y-2">
              {c.conducere.map((x) => (
                <li key={x} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="text-xl font-semibold">{c.deCeTitlu}</h2>
            <ul className="mt-4 space-y-3">
              {c.deCe.map((x) => (
                <li key={x.text} className="text-sm text-gray-300">
                  {x.text} <span className="text-gray-500">({x.sursa})</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

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
          Contactul stă imediat după pilot, nu în subsol: acolo termină de citit decidentul,
          iar secțiunea de mai jos („Aveți deja un cod de acces?") e pentru cursant, nu pentru el.
          `mailto:`/`tel:` merg pe `<a>` simplu, NU pe `Link`-ul din `@/i18n/navigation` — acela
          prefixează limba și ar strica schema (exact defectul reparat în `9c6a851`).
        */}
        <section className="mt-16 rounded-2xl border border-blue-900/60 bg-blue-950/20 p-8">
          <h2 className="text-2xl font-semibold">{c.contactTitlu}</h2>
          <p className="mt-2 text-sm text-gray-400">{c.contactLead}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:gap-8">
            <a
              href={`mailto:${CONTACT_MAIL}`}
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

        {/* Secțiunea asta se adresează cursantului cu cod, nu decidentului — în PDF n-are rost. */}
        <section className="mt-16 text-center print:hidden">
          <h2 className="text-2xl font-semibold">{c.finalTitlu}</h2>
          <p className="mt-2 text-gray-400">{c.finalSub}</p>
          <Link
            href="/auth/signin"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-500"
          >
            {c.ctaIn}
          </Link>
        </section>

        {/*
          Doar în PDF: cine primește documentul îl dă mai departe la juridic și achiziții,
          iar acolo un text fără furnizor și fără contact se oprește.
        */}
        <section className="mt-12 hidden border-t border-gray-300 pt-4 text-sm print:block">
          <p>
            <span className="text-gray-500">{c.furnizorEticheta}:</span>{" "}
            <span className="font-semibold">eTUTOR.ro — {FURNIZOR}</span>
          </p>
          <p className="mt-1">
            {CONTACT_MAIL} · {CONTACT_TEL_AFISAT}
          </p>
        </section>
      </main>
    </div>
  );
}
