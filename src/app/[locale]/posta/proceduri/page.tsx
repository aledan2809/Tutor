/**
 * Pagina pe care ajunge decidentul când apasă butonul final de pe `/posta`.
 *
 * Înainte, butonul deschidea un `mailto:`. Userul a cerut încărcare directă: omul are
 * documentele pe calculator, iar un `mailto:` îl scoate din pagină, îi deschide alt
 * program și îl lasă să se descurce cu atașamentele — exact când tocmai s-a hotărât.
 */
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Brand } from "@/components/Brand";
import { CONSORTIU, CONTACT_MAIL, CONTACT_TEL_AFISAT, FURNIZOR } from "@/lib/posta-copy";
import { FormularProceduri } from "./formular";

export const metadata: Metadata = {
  title: "Trimiteți-ne procedurile — eTutor pentru Poșta Română",
  robots: { index: false, follow: false },
};

export default async function PaginaProceduri({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/posta" aria-label="eTUTOR.ro" className="inline-flex min-h-[44px] items-center">
            <Brand className="text-xl" />
          </Link>
          <Link href="/posta" className="text-sm text-gray-400 hover:text-gray-200">
            ← Înapoi la prezentare
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold sm:text-4xl">Trimiteți-ne o procedură</h1>
        <p className="mt-4 text-gray-400">
          Una singură e de ajuns ca să vedeți diferența — de exemplu cea de livrare și avizare.
          Vă returnăm modulul rescris cu frazele dumneavoastră, în locul presupunerilor noastre.
          Nu costă nimic și nu obligă la nimic.
        </p>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/60 p-5 text-sm text-gray-400">
          <p className="font-medium text-gray-200">Ce se întâmplă cu fișierele</p>
          <p className="mt-2 leading-relaxed">
            Ajung pe serverul nostru și le citim doar noi, ca să rescriem materialul. Nu ajung la
            niciun alt client și nu se publică nicăieri. Operatorul de date este {FURNIZOR}. Dacă
            vă răzgândiți, scrieți-ne la {CONTACT_MAIL} și le ștergem.
          </p>
        </div>

        <FormularProceduri locale={locale} />

        <p className="mt-10 text-sm text-gray-500">
          Preferați altfel? Scrieți-ne la{" "}
          <a href={`mailto:${CONTACT_MAIL}`} className="text-blue-400 hover:underline">
            {CONTACT_MAIL}
          </a>{" "}
          sau sunați la{" "}
          <a href="tel:+40712383492" className="text-blue-400 hover:underline">
            {CONTACT_TEL_AFISAT}
          </a>
          .
        </p>
      </main>

      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-gray-500">
          <span className="font-semibold text-gray-300">{FURNIZOR}</span> · {CONSORTIU}
        </div>
      </div>
    </div>
  );
}
