import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getSubject, listSubjects } from "@/lib/seo-subjects";
import { SampleQuiz } from "@/components/sample-quiz";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://etutor.ro";

export function generateStaticParams() {
  return listSubjects().map((s) => ({ subject: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; subject: string }>;
}): Promise<Metadata> {
  const { locale, subject } = await params;
  const s = getSubject(subject);
  if (!s) return {};
  const url = `${BASE}/${locale}/grile/${s.slug}`;
  return {
    title: s.title,
    description: s.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: s.title, description: s.metaDescription, url, type: "website" },
    twitter: { card: "summary", title: s.title, description: s.metaDescription },
  };
}

export default async function SubjectLandingPage({
  params,
}: {
  params: Promise<{ locale: string; subject: string }>;
}) {
  const { locale, subject } = await params;
  const ro = locale !== "en";
  const s = getSubject(subject);
  if (!s) notFound();

  const others = listSubjects().filter((x) => x.slug !== s.slug).slice(0, 6);

  const T = ro
    ? {
        topics: "Ce acoperă",
        sample: "Test grilă de probă",
        faq: "Întrebări frecvente",
        explore: "Alte materii",
        backHome: "← Acasă",
        ctaTitle: "Vrei grile din propriul material?",
        ctaText: "Lipește o pagină de teorie și AI-ul generează grile în 10 secunde.",
        ctaBtn: "Încearcă demo-ul gratuit",
      }
    : {
        topics: "What it covers",
        sample: "Sample quiz",
        faq: "FAQ",
        explore: "Other subjects",
        backHome: "← Home",
        ctaTitle: "Want a quiz from your own material?",
        ctaText: "Paste a page of theory and the AI generates a quiz in 10 seconds.",
        ctaBtn: "Try the free demo",
      };

  // FAQ structured data for Google rich results.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-blue-500">
          etutor.ro
        </Link>
        <Link href="/try" className="text-sm text-gray-400 hover:text-gray-200">
          {ro ? "Demo gratuit" : "Free demo"}
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <p className="mt-4 text-sm font-medium text-blue-400">{s.examType}</p>
        <h1 className="mt-1 text-3xl font-bold">{s.h1}</h1>
        <p className="mt-4 text-gray-300">{s.intro}</p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">{T.topics}</h2>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {s.topics.map((t) => (
              <li key={t} className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300">
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">{T.sample}</h2>
          <SampleQuiz questions={s.sampleQuestions} ro={ro} />
        </section>

        <section className="mt-10 rounded-xl border border-blue-500/40 bg-blue-500/10 p-6 text-center">
          <p className="text-lg font-semibold text-white">{T.ctaTitle}</p>
          <p className="mt-1 text-sm text-gray-300">{T.ctaText}</p>
          <Link
            href="/try"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
          >
            {T.ctaBtn}
          </Link>
        </section>

        {s.faq.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">{T.faq}</h2>
            <div className="mt-3 space-y-3">
              {s.faq.map((f) => (
                <div key={f.q} className="rounded-md border border-gray-800 bg-gray-900 p-4">
                  <p className="font-medium text-gray-100">{f.q}</p>
                  <p className="mt-1 text-sm text-gray-400">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-semibold">{T.explore}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/grile/${o.slug}`}
                  className="inline-block rounded-full border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:border-blue-500 hover:text-blue-300"
                >
                  {o.examType} — {o.subject}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">
            {T.backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
