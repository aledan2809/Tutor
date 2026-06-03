import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Prețuri — gratuit la start, plătești când vrei | eTUTOR.ro",
  description:
    "Începe gratuit 7 zile, fără card. Apoi alegi planul: Elev/Student, Părinte + copil, Părinți + copil sau cu meditator. Reduceri pentru mai mulți copii și plată anuală.",
};

type Plan = {
  name: string;
  tag: string;
  price: string;
  points: string[];
  cta: string;
  accent: string; // tailwind text color
  featured?: boolean;
};

type Copy = {
  hero: string;
  sub: string;
  freeTitle: string;
  freeTag: string;
  freePrice: string;
  freePoints: string[];
  freeCta: string;
  paidTitle: string;
  plans: Plan[];
  discounts: string;
  note: string;
};

const RO: Copy = {
  hero: "Gratuit la start. Plătești când vezi că merită.",
  sub: "Începi gratuit 7 zile, fără card. Apoi alegi planul potrivit — pentru tine ca elev, sau pentru copilul tău, cu sau fără meditator.",
  freeTitle: "Gratuit",
  freeTag: "Ca să te convingi",
  freePrice: "0 lei",
  freePoints: [
    "Demo public oricând — alegi o materie și faci un test din grile reale, fără cont",
    "Trial 7 zile cu cont gratuit",
    "2 materii pe zi × 5 întrebări — și astea contează la puncte și streak",
    "−30% dacă plătești orice materie în perioada de probă",
  ],
  freeCta: "Începe gratuit",
  paidTitle: "Planuri plătite",
  plans: [
    {
      name: "Elev / Student",
      tag: "Plătești singur",
      price: "de la 19,90 lei / materie / lună",
      accent: "text-blue-400",
      points: [
        "Pentru elevi și studenți responsabili, fără părinte",
        "Îți urmărești singur progresul și streak-urile",
        "Acces complet la grile + simulări",
      ],
      cta: "Alege Elev/Student",
    },
    {
      name: "Părinte + copil",
      tag: "Family",
      price: "de la 19,90 lei / materie / lună",
      accent: "text-emerald-400",
      points: [
        "Cont separat pentru copil + cont de părinte",
        "Vezi progresul, scorurile și unde greșește",
        "Împingere pe WhatsApp + escaladare către tine",
      ],
      cta: "Alege Family",
    },
    {
      name: "Părinți + copil",
      tag: "Family Duo",
      price: "+ mic supliment fix",
      accent: "text-emerald-400",
      points: [
        "Tot ce e în Family",
        "Al doilea părinte are cont propriu",
        "Fiecare părinte își configurează singur notificările",
      ],
      cta: "Alege Duo",
    },
    {
      name: "Părinte + copil + meditator",
      tag: "Trio",
      price: "+ supliment premium",
      accent: "text-emerald-400",
      featured: true,
      points: [
        "Tot ce e în Family / Duo",
        "Meditatorul are cont propriu: vede progresul, testele și unde a greșit copilul",
        "Transparent: tu plătești inclusiv accesul meditatorului — el nu plătește nimic",
      ],
      cta: "Alege Trio",
    },
  ],
  discounts:
    "Reduceri: al 2-lea copil −25%, al 3-lea+ −40%; a 2-a materie −15%; plată anuală ≈ −2 luni. Oferte sezoniere pe parcurs.",
  note: "Prețurile sunt orientative și se setează în panou. O singură factură pe familie.",
};

const EN: Copy = {
  hero: "Free to start. Pay when you see it's worth it.",
  sub: "Start free for 7 days, no card. Then pick the right plan — for you as a student, or for your child, with or without a tutor.",
  freeTitle: "Free",
  freeTag: "To see for yourself",
  freePrice: "0 lei",
  freePoints: [
    "Public demo anytime — pick a subject and take a real quiz, no account",
    "7-day trial with a free account",
    "2 subjects per day × 5 questions — and they count toward points and streaks",
    "−30% if you pay for any subject during the trial",
  ],
  freeCta: "Start free",
  paidTitle: "Paid plans",
  plans: [
    {
      name: "Student",
      tag: "Self-paid",
      price: "from 19.90 lei / subject / month",
      accent: "text-blue-400",
      points: [
        "For responsible students with no parent involved",
        "Track your own progress and streaks",
        "Full access to questions + simulations",
      ],
      cta: "Choose Student",
    },
    {
      name: "Parent + child",
      tag: "Family",
      price: "from 19.90 lei / subject / month",
      accent: "text-emerald-400",
      points: [
        "Separate account for the child + a parent account",
        "See progress, scores and where they get it wrong",
        "WhatsApp nudging + escalation to you",
      ],
      cta: "Choose Family",
    },
    {
      name: "Parents + child",
      tag: "Family Duo",
      price: "+ small flat add-on",
      accent: "text-emerald-400",
      points: [
        "Everything in Family",
        "The second parent gets their own account",
        "Each parent configures their own notifications",
      ],
      cta: "Choose Duo",
    },
    {
      name: "Parent + child + tutor",
      tag: "Trio",
      price: "+ premium add-on",
      accent: "text-emerald-400",
      featured: true,
      points: [
        "Everything in Family / Duo",
        "The tutor gets their own account: sees progress, tests and mistakes",
        "Transparent: you pay for the tutor's access too — they pay nothing",
      ],
      cta: "Choose Trio",
    },
  ],
  discounts:
    "Discounts: 2nd child −25%, 3rd+ −40%; 2nd subject −15%; annual ≈ −2 months. Seasonal offers along the way.",
  note: "Prices are indicative and set in the panel. One bill per family.",
};

export default async function PreturiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = locale === "en" ? EN : RO;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-6xl px-4 py-16">
        {/* Hero */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">{c.hero}</h1>
          <p className="mt-4 text-lg text-gray-400">{c.sub}</p>
        </div>

        {/* Free vs Paid, side by side */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* FREE — spans 1 col, visually distinct */}
          <div className="rounded-2xl border border-green-500/40 bg-green-500/5 p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-green-400">{c.freeTitle}</h2>
              <span className="text-xs text-gray-500">{c.freeTag}</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{c.freePrice}</p>
            <ul className="mt-4 space-y-2">
              {c.freePoints.map((p) => (
                <li key={p} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-green-400">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="mt-6 block rounded-xl bg-green-600 px-4 py-3 text-center font-semibold text-white hover:bg-green-500"
            >
              {c.freeCta}
            </Link>
          </div>

          {/* PAID — 2 cols of plans */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-center text-xl font-bold text-white lg:text-left">{c.paidTitle}</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {c.plans.map((p) => (
                <div
                  key={p.name}
                  className={`rounded-2xl border bg-gray-900 p-6 ${
                    p.featured ? "border-emerald-500 ring-1 ring-emerald-500/40" : "border-gray-800"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className={`text-lg font-semibold ${p.accent}`}>{p.name}</h3>
                    {p.featured && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        {locale === "en" ? "Most chosen" : "Cel mai ales"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{p.tag}</p>
                  <p className="mt-3 text-sm font-medium text-blue-300">{p.price}</p>
                  <ul className="mt-4 space-y-2">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2 text-sm text-gray-300">
                        <span className={p.accent}>✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/register"
                    className="mt-5 block rounded-xl bg-blue-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-blue-500"
                  >
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-gray-500">{c.discounts}</p>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-gray-600">{c.note}</p>
      </main>
    </div>
  );
}
