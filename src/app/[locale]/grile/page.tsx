import type { Metadata } from "next";
import { Brand } from "@/components/Brand";
import { TrackedLink } from "@/components/TrackedLink";
import { Link } from "@/i18n/navigation";
import { listSubjects } from "@/lib/seo-subjects";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://etutor.ro";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ro = locale !== "en";
  const title = ro
    ? "Grile online — Bacalaureat, Evaluare Națională, Admitere"
    : "Online quizzes — Bacalaureat, National Eval, Admissions";
  const description = ro
    ? "Teste grilă online gratuite pe materii: Bacalaureat, Evaluare Națională și admitere. Sau generează-ți propriul test din orice material."
    : "Free online quizzes by subject: Bacalaureat, National Evaluation and admissions. Or generate your own quiz from any material.";
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/${locale}/grile` },
    openGraph: { title, description, url: `${BASE}/${locale}/grile`, type: "website" },
  };
}

export default async function GrileIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ro = locale !== "en";
  const subjects = listSubjects();

  // Group by exam type for a tidy, scannable index.
  const groups = subjects.reduce<Record<string, typeof subjects>>((acc, s) => {
    (acc[s.examType] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="flex items-center justify-between px-4 py-2 sm:px-6">
        <Link href="/" aria-label="eTutor.ro" className="inline-flex min-h-[44px] items-center">
          <Brand className="text-xl" />
        </Link>
        <TrackedLink
          href="/try"
          event="cta_try"
          data={{ from: "grile_header" }}
          className="inline-flex min-h-[44px] items-center text-sm text-gray-300 hover:text-white"
        >
          {ro ? "Demo gratuit" : "Free demo"}
        </TrackedLink>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h1 className="mt-4 text-3xl font-bold">{ro ? "Grile online pe materii" : "Online quizzes by subject"}</h1>
        <p className="mt-3 text-gray-300">
          {ro
            ? "Alege materia și exersează cu teste grilă, sau generează-ți propriul test din orice material."
            : "Pick a subject and practice with quizzes, or generate your own from any material."}
        </p>
        {/* The no-account demo as the page's main button (it was only a 20 px header link — True E2E 2026-10-05, leak 2). */}
        <TrackedLink
          href="/try"
          event="cta_try"
          data={{ from: "grile" }}
          className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700 sm:inline-flex sm:w-auto sm:text-lg"
        >
          {ro ? "Încearcă o grilă acum — fără cont" : "Try a quiz now — no account"}
        </TrackedLink>

        {Object.entries(groups).map(([examType, items]) => (
          <section key={examType} className="mt-8">
            <h2 className="text-lg font-semibold text-blue-400">{examType}</h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/grile/${s.slug}`}
                    className="block rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm font-medium text-gray-100 transition-colors hover:border-blue-500 hover:text-blue-300"
                  >
                    {s.subject}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="mt-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">
            {ro ? "← Acasă" : "← Home"}
          </Link>
        </div>
      </main>
    </div>
  );
}
