import type { Metadata } from "next";
import Link from "next/link";
import { getMagicQuizPublic } from "@/lib/magic-quiz";

export const dynamic = "force-dynamic";

const BASE = process.env.AUTH_URL || "https://etutor.ro";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const ro = locale !== "en";
  const quiz = await getMagicQuizPublic(id);
  const s = quiz?.sharerScore ?? 0;
  const t = quiz?.total ?? 5;
  const title = ro ? `Certificat: ${s}/${t} la un quiz 🎓` : `Certificate: ${s}/${t} on a quiz 🎓`;
  const description = ro
    ? `Quiz generat din propriile materiale pe etutor.ro.`
    : `Quiz generated from your own materials on etutor.ro.`;
  const ogUrl = `${BASE}/api/og/score?s=${s}&t=${t}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const ro = locale !== "en";
  const quiz = await getMagicQuizPublic(id);

  const T = ro
    ? {
        notFound: "Certificatul nu există sau a expirat.",
        makeOwn: "Fă-ți propriul quiz",
        heading: "Certificat de rezultat",
        by: "Obținut de",
        anon: "un cursant",
        scored: "Scor",
        share: "📲 Distribuie pe WhatsApp",
        download: "⬇️ Descarcă imaginea",
        cta: "Învață cu un tutor — creează cont",
      }
    : {
        notFound: "Certificate not found or expired.",
        makeOwn: "Make your own quiz",
        heading: "Result certificate",
        by: "Earned by",
        anon: "a learner",
        scored: "Score",
        share: "📲 Share on WhatsApp",
        download: "⬇️ Download image",
        cta: "Learn with a tutor — sign up",
      };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <p className="text-lg text-gray-300">{T.notFound}</p>
          <Link
            href={`/${ro ? "ro" : "en"}/try`}
            className="mt-4 inline-block rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-500"
          >
            {T.makeOwn}
          </Link>
        </div>
      </div>
    );
  }

  const ogUrl = `${BASE}/api/og/score?s=${quiz.sharerScore}&t=${quiz.total}`;
  const certUrl = `${BASE}/${ro ? "ro" : "en"}/certificat/${id}`;
  const msg = ro
    ? `Am luat ${quiz.sharerScore}/${quiz.total} la un quiz pe etutor.ro 🎓`
    : `I scored ${quiz.sharerScore}/${quiz.total} on a quiz at etutor.ro 🎓`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(msg + " " + certUrl)}`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-blue-500">
          etutor.ro
        </Link>
        <Link href={`/${ro ? "ro" : "en"}/try`} className="text-sm text-gray-400 hover:text-gray-200">
          {T.makeOwn}
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 text-center sm:px-6">
        <h1 className="mt-6 text-2xl font-bold">{T.heading}</h1>
        <p className="mt-1 text-gray-400">
          {T.by} {quiz.creatorName || T.anon} · {T.scored} {quiz.sharerScore}/{quiz.total}
        </p>

        {/* The shareable artifact (same branded card used for OG previews) */}
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ogUrl} alt="Certificate" width={1200} height={630} className="w-full" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-md bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-500"
          >
            {T.share}
          </a>
          <a
            href={ogUrl}
            download
            className="inline-flex min-h-[44px] items-center rounded-md border border-gray-700 px-5 py-3 text-sm text-gray-200 hover:border-gray-500"
          >
            {T.download}
          </a>
          <Link
            href={`/${ro ? "ro" : "en"}/auth/register`}
            className="mt-2 inline-flex min-h-[44px] items-center rounded-md border border-blue-500 px-5 py-3 font-medium text-blue-300 hover:bg-blue-500/10"
          >
            {T.cta}
          </Link>
        </div>
      </main>
    </div>
  );
}
