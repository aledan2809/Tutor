import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

const BASE = "https://etutor.ro";

function parseScore(sp: Record<string, string | string[] | undefined>) {
  const s = Math.max(0, Math.min(50, parseInt(String(sp.s ?? "0"), 10) || 0));
  const t = Math.max(1, Math.min(50, parseInt(String(sp.t ?? "5"), 10) || 5));
  return { s, t };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const { s, t } = parseScore(sp);
  const ogUrl = `${BASE}/api/og/score?s=${s}&t=${t}`;
  const title = `Am luat ${s}/${t} pe etutor.ro`;
  const description = "Test generat în 10 secunde. Bați scorul meu?";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE}/scor?s=${s}&t=${t}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

export default async function ScorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const ro = locale !== "en";
  const { s, t } = parseScore(await searchParams);
  const pct = Math.round((s / t) * 100);

  const T = ro
    ? {
        friend: "Cineva a luat",
        of: "din",
        beat: "Bați scorul?",
        sub: "Lipești orice text — manual, curs, notițe — și primești un test pe care îl dai pe loc. Fără cont.",
        cta: "Încearcă acum, gratuit ✨",
        home: "← etutor.ro",
      }
    : {
        friend: "Someone scored",
        of: "of",
        beat: "Can you beat it?",
        sub: "Paste any text — a textbook, notes, a course — and a quiz is built for you to take right away. No account.",
        cta: "Try now, free ✨",
        home: "← etutor.ro",
      };

  const accent = pct >= 80 ? "text-green-400" : pct >= 50 ? "text-blue-400" : "text-amber-400";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-center">
      <span className="text-sm font-bold text-blue-500">etutor.ro</span>
      <p className="mt-6 text-lg text-gray-400">{T.friend}</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className={`text-7xl font-extrabold ${accent}`}>{s}</span>
        <span className="text-4xl font-bold text-gray-500">
          {T.of} {t}
        </span>
        <span className={`ml-2 text-3xl font-bold ${accent}`}>{pct}%</span>
      </p>
      <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">{T.beat}</h1>
      <p className="mt-3 max-w-md text-base text-gray-300">{T.sub}</p>
      <Link
        href="/try"
        className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-10 py-3.5 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
      >
        {T.cta}
      </Link>
      <Link href="/" className="mt-8 text-sm text-gray-500 hover:text-gray-300">
        {T.home}
      </Link>
    </div>
  );
}
