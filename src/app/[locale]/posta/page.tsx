import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Brand } from "@/components/Brand";
import { ESCALATION_LEVELS } from "@/lib/escalation/config";
import {
  CONSORTIU,
  CONTACT_MAIL,
  CONTACT_TEL_AFISAT,
  CONTACT_TEL_LINK,
  FURNIZOR,
} from "@/lib/posta-copy";
import { resolvePostaCopy } from "@/lib/posta-copy.server";

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
/*
  Pe ECRAN foaia tipărită nu există: tabelul curge ca blocuri obișnuite, iar antetul și
  subsolul de tipar stau ascunse. Regulile astea sunt ÎN AFARA lui @media print dinadins.
*/
.posta-foi, .posta-foi > thead, .posta-foi > tfoot, .posta-foi > tbody,
.posta-foi > * > tr, .posta-foi > * > tr > td { display: block; }
.posta-print-header-in, .posta-print-footer-in { display: none; }

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
    margin: 0 7px; display: inline-block;
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
  @page { margin: 14mm; }

  /*
    Comutarea foii. Regulile de dinainte au fost ȘTERSE, nu comentate: \`position: fixed\`
    repeta dar acoperea primul rând, iar grupul de tabel pe un \`div\` nu repeta deloc —
    și, rămase amândouă, subsolul se repeta din motivul greșit.
  */
  .posta-foi { display: table !important; width: 100% !important; }
  .posta-foi > thead { display: table-header-group !important; }
  .posta-foi > tfoot { display: table-footer-group !important; }
  .posta-foi > tbody { display: table-row-group !important; }
  .posta-foi > * > tr { display: table-row !important; }
  .posta-foi > * > tr > td { display: table-cell !important; padding: 0 !important; border: 0 !important; }

  /*
   * Antetul de ecran (cel lipicios, cu logo-uri mari) nu are ce căuta pe hârtie: pe
   * prima pagină se tipărea DEASUPRA antetului repetat, deci logo-urile apăreau de două
   * ori. Antetul repetat din <thead> acoperă singur fiecare foaie, inclusiv prima.
   */
  .posta-ecran-header { display: none !important; }

  .posta-print-header-in {
    display: flex !important;
    align-items: center; justify-content: space-between;
    border-bottom: 1px solid #d1d5db !important;
    padding-bottom: 5px; margin-bottom: 12px;
  }
  .posta-print-marca { font-size: 11pt; font-weight: 700; color: #111827 !important; }
  .posta-print-header-logo { height: 22px; width: auto; }

  .posta-print-footer-in {
    display: block !important;
    border-top: 1px solid #d1d5db !important;
    padding-top: 5px; margin-top: 12px;
    font-size: 8.5pt; line-height: 1.35;
  }
  .posta-print-footer-in, .posta-print-footer-in * { color: #4b5563 !important; }
  .posta-print-footer-in strong { color: #1f2937 !important; }
  .posta-print-logo { height: 13px; width: auto; vertical-align: -2px; margin: 0 7px; display: inline-block; }
}
`;

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
  const c = await resolvePostaCopy(locale);
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
      <header className="posta-ecran-header sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
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

      {/*
        Foaia tipărită, ca TABEL REAL.

        Antetul cu cele două mărci trebuie să apară pe FIECARE pagină a PDF-ului. Am probat
        pe un fișier minimal ce repetă motorul de tipărire:
          · position: fixed              — repetă, DAR se așază peste primul rând al paginii
          · display: table-header-group pe un div — NU repetă deloc
          · thead al unui TABEL REAL     — repetă ȘI lasă textul să curgă dedesubt
        Doar a treia face amândouă lucrurile.

        Pe ecran tabelul e făcut display:block, deci așezarea nu se schimbă cu nimic;
        redevine tabel doar la tipar. role="presentation" îl scoate din arborele de
        accesibilitate — e unealtă de paginare, nu date tabelare.
      */}
      <table className="posta-foi" role="presentation">
        <thead>
          <tr>
            <td>
              <div className="posta-print-header-in">
        <span className="posta-print-marca">eTUTOR.ro</span>
        {logoPosta ? (
          /* eslint-disable-next-line @next/next/no-img-element -- fișier statuar din public/ */
          <img src={logoPosta} alt="Poșta Română" className="logo-posta posta-print-header-logo" />
        ) : (
          <span className="posta-print-marca">Poșta Română</span>
        )}
        </div>
            </td>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <td>
              <div className="posta-print-footer-in">
        {/*
          Subsolul repetat: doar firma noastră și datele de contact. Marca Poștei stă
          EXCLUSIV în antet, dreapta sus — cerut explicit și repetat de user. O variantă
          anterioară o punea și aici, în dreapta jos, ca soluție de rezervă pentru un
          antet care nu se repeta; de când antetul e `<thead>` real, se repetă singur.
        */}
        <strong>{FURNIZOR}</strong>
        {" · "}
        {CONSORTIU}
        {logoKnowHow ? (
          /* eslint-disable-next-line @next/next/no-img-element -- fișier statuar din public/ */
          <img src={logoKnowHow} alt="" className="posta-print-logo" />
        ) : null}
        {" · "}
        {CONTACT_MAIL}
        {" · "}
        {CONTACT_TEL_AFISAT}
        </div>
            </td>
          </tr>
        </tfoot>
        <tbody>
          <tr>
            <td>
      <main className="mx-auto max-w-5xl px-4 py-14">
        <div className="max-w-3xl">
          <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-300">
            {c.badge}
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-5xl">{c.hero}</h1>
          <p className="mt-4 text-lg text-gray-400">{c.subtitle}</p>
          {/*
            UN singur buton sus: descărcarea PDF-ului.
            „Trimiteți-ne procedurile" a fost aici și a fost scos la cererea userului — la
            începutul lecturii e prea devreme pentru el. Omul abia a deschis pagina; nu are
            de ce să trimită ceva înainte să afle despre ce e vorba. Îndemnul rămâne unde
            e câștigat: la capătul lecturii.
          */}
          <div className="mt-7 flex flex-wrap gap-3 print:hidden">
            <a
              href={`/api/posta/pdf?locale=${locale === "en" ? "en" : "ro"}`}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
            >
              {c.ctaPdf}
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
          Punctajul reluării. Stă imediat după gamificare fiindcă e răspunsul la
          întrebarea pe care secțiunea de dinainte o ridică: „bine, dar ce se întâmplă cu
          cine NU nimerește din prima?".

          Tabelul are coloană de calcul dinadins — un punctaj fără aritmetică vizibilă
          e o promisiune, iar decidentul are dreptul să verifice singur că cel care se
          întoarce nu e păcălit.
        */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">{c.scorTitlu}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">{c.scorLead}</p>

          <ul className="mt-6 space-y-2.5">
            {c.scorLegenda.map((l) => (
              <li key={l.valoare} className="flex gap-3 text-sm">
                <span className="w-16 shrink-0 font-semibold tabular-nums text-blue-400">{l.valoare}</span>
                <span className="text-gray-400">{l.cand}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-800">
            <table className="tablou w-full min-w-[42rem] border-collapse text-sm">
              <thead>
                <tr className="bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2.5 font-semibold">{c.scorCapCaz}</th>
                  <th className="px-3 py-2.5 font-semibold">{c.scorCapCalcul}</th>
                  <th className="px-3 py-2.5 text-right font-semibold">{c.scorCapPuncte}</th>
                  <th className="px-3 py-2.5 font-semibold">{c.scorCapRaport}</th>
                </tr>
              </thead>
              <tbody>
                {c.scorCazuri.map((x) => (
                  <tr key={x.caz} className="border-t border-gray-800 align-top">
                    <td className="px-3 py-2.5 text-gray-200">{x.caz}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-400">{x.calcul}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-blue-400">{x.puncte}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400">{x.raport}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">{c.scorConcluzie}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">{c.scorNota}</p>
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

        {/*
          Un singur îndemn, același ca sus, la capătul lecturii — al DECIDENTULUI.
          Linia pentru cursant a rămas, dar mică și fără buton: ea nu are ce concura cu el.
        */}
        <section className="mt-16 text-center">
          <h2 className="text-2xl font-semibold">{c.finalTitlu}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-400">{c.finalSub}</p>
          {/*
            Duce la o pagină de ÎNCĂRCARE, nu la un `mailto:`. Cerut de user, și are
            dreptate: omul are documentele pe calculator, iar un `mailto:` îl scoate din
            pagină, îi deschide alt program și îl lasă să se descurce cu atașamentele —
            exact în clipa în care tocmai s-a hotărât.
          */}
          <Link
            href="/posta/proceduri"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-500 print:hidden"
          >
            {c.finalCta}
          </Link>
          <p className="mt-8 text-xs text-gray-600 print:hidden">
            <Link href="/auth/signin" className="hover:text-gray-400 hover:underline">
              {c.finalCursant}
            </Link>
          </p>
        </section>

      </main>
            </td>
          </tr>
        </tbody>
      </table>

      {/*
        Subsolul paginii. NU e un `<footer>`: eticheta aia e ascunsă la tipar de regula
        din PRINT_CSS (subsolul de politici al site-ului ieșea ca o bandă neagră), iar
        blocul ăsta trebuie să apară ȘI pe hârtie.

        Fără marca noastră, cerut de user: aici vorbește FIRMA — cea care semnează
        contractul și emite factura — nu produsul.
      */}
      <div className="posta-subsol border-t border-gray-800">
        <div className="mx-auto max-w-5xl px-4 py-8 text-center">
          <p className="font-semibold text-gray-200">{FURNIZOR}</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            <p className="text-sm text-gray-500">{CONSORTIU}</p>
            {logoKnowHow ? (
              /*
                Plăcuță albă: scrisul logo-ului e închis la culoare, deci pe subsolul
                întunecat ar fi fost invizibil. La tipar plăcuța devine transparentă
                singură (regula generală din PRINT_CSS), iar pe hârtie albă iese la fel.
              */
              <span className="inline-flex items-center rounded bg-white px-2 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- fișier statuar din public/ */}
                <img src={logoKnowHow} alt="Know How Consortium" className="h-8 w-auto object-contain" />
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {CONTACT_MAIL}
            <span className="mx-2 text-gray-700">·</span>
            {CONTACT_TEL_AFISAT}
          </p>
        </div>
      </div>

    </div>
  );
}
