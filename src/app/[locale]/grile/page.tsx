import type { Metadata } from "next";
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
    ? "Grile online — Bacalaureat, Evaluare Națională, Admitere | etutor.ro"
    : "Online quizzes — Bacalaureat, National Eval, Admissions | etutor.ro";
  const description = ro
    ? "Teste grilă online gratuite pe materii: Bacalaureat, Evaluare Națională și admitere. Sau generează-ți propriul test din orice material cu AI."
    : "Free online quizzes by subject: Bacalaureat, National Evaluation and admissions. Or generate your own quiz from any material with AI.";
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
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-blue-500">
          etutor.ro
        </Link>
        <Link href="/try" className="text-sm text-gray-400 hover:text-gray-200">
          {ro ? "Demo gratuit" : "Free demo"}
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h1 className="mt-4 text-3xl font-bold">{ro ? "Grile online pe materii" : "Online quizzes by subject"}</h1>
        <p className="mt-3 text-gray-300">
          {ro
            ? "Alege materia și exersează cu teste grilă, sau generează-ți propriul test din orice material."
            : "Pick a subject and practice with quizzes, or generate your own from any material."}
        </p>

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
