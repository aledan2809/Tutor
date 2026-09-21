import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { isPromoActive, normalFromPromo, fmtPrice } from "@/lib/pricing";
import { MONTHS_PAID_PER_YEAR, TELEGRAM_PERCENT, TRIAL_PAYMENT_PERCENT } from "@/lib/checkout-price";
import { childDiscountPercent, subjectDiscountPercent } from "@/lib/family";

export const metadata: Metadata = {
  title: "Prețuri — gratuit la start, plătești când vrei | eTutor.ro",
  description:
    `Începe gratuit 7 zile, fără card. Apoi alegi planul: Elev/Student, Părinte + copil, Părinți + copil sau cu meditator. −${TRIAL_PAYMENT_PERCENT}% dacă plătești în primele 7 zile, −${TELEGRAM_PERCENT}% cu Telegram, anual plătești ${MONTHS_PAID_PER_YEAR} luni.`,
};

// Displayed amounts are the −25% promo price; normal = amount / 0.75. See @/lib/pricing.
type Plan = {
  name: string;
  tag: string;
  amount: number; // promo price (RON / subject / month)
  from?: boolean; // prefix "de la" / "from"
  points: string[];
  cta: string;
  accent: string; // tailwind text color
  featured?: boolean;
};

// Stable plan identity per card, in the same order the RO and EN `plans` arrays
// use (Elev → Family → Duo → Trio → Family Trio). Passed as `?plan=<key>` so the
// visitor lands on /dashboard/packages with the chosen plan pre-highlighted after
// signup — the pricing page must lead to checkout, not a generic signup dead end.
const PLAN_KEYS = ["ELEV", "FAMILY", "FAMILY_DUO", "TRIO", "FAMILY_TRIO"] as const;

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
  discountsTitle: string;
  annualLink: string;
  discountsList: string[];
  note: string;
  promo: string;
  priceSuffix: string;
  fromLabel: string;
};

const RO: Copy = {
  hero: "Gratuit la start. Plătești când vezi că merită.",
  sub: "Începi gratuit 7 zile, fără card. Apoi alegi planul potrivit — pentru tine ca elev, sau pentru copilul tău, cu sau fără meditator.",
  freeTitle: "Gratuit",
  freeTag: "Ca să te convingi",
  freePrice: "0 lei",
  freePoints: [
    "Demo public oricând — alegi o materie și faci un test din grile reale, fără cont",
    "7 zile cu tot pachetul (în afară de WhatsApp și SMS), cu un cont gratuit, fără card",
    "Apoi alegi un plan — tot ce ai lucrat rămâne salvat",
  ],
  freeCta: "Începe gratuit",
  paidTitle: "Planuri plătite",
  plans: [
    {
      name: "Elev / Student",
      tag: "Plătești singur",
      amount: 19.9,
      from: true,
      accent: "text-blue-400",
      points: [
        "Pentru elevi și studenți responsabili, care pot plăti singuri online",
        "Îți urmărești singur progresul și streak-urile",
        "Acces complet la grile + simulări",
      ],
      cta: "Alege Elev/Student",
    },
    {
      name: "Părinte + copil",
      tag: "Family",
      amount: 24.9,
      accent: "text-emerald-400",
      points: [
        "Cont separat pentru copil + cont de părinte",
        "Vezi progresul, scorurile și unde greșește",
        "Remindere pe WhatsApp + escaladare către tine",
      ],
      cta: "Alege Family",
    },
    {
      name: "Părinți + copil",
      tag: "Family Duo",
      amount: 29.9,
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
      amount: 39.9,
      accent: "text-emerald-400",
      featured: true,
      points: [
        "Tot ce e în Family / Duo",
        "Meditatorul are cont propriu: vede progresul, testele și unde a greșit copilul",
        "Transparent: tu plătești inclusiv accesul meditatorului — el nu plătește nimic",
      ],
      cta: "Alege Trio",
    },
    {
      name: "Ambii părinți + copil + meditator",
      tag: "Family Trio",
      amount: 49.9,
      accent: "text-emerald-400",
      points: [
        "Tot ce e în Trio",
        "Ambii părinți au cont propriu, fiecare cu notificările lui",
        "Meditatorul are cont propriu: vede progresul și greșelile copilului",
      ],
      cta: "Alege Family Trio",
    },
  ],
  discountsTitle: "Reduceri:",
  // Delivery 2 (Alex 16–17.09.2026); the figures are the ones checkout charges by (checkout-price.ts).
  discountsList: [
    `Plătești în primele 7 zile: −${TRIAL_PAYMENT_PERCENT}% cât timp rămâi abonat.`,
    `Telegram conectat la plată, de oricine din familie: încă −${TELEGRAM_PERCENT}%, rămâne și după.`,
    `A doua materie −${subjectDiscountPercent(2)}%, de la a treia −${subjectDiscountPercent(3)}%; reducerile de mai sus se aplică tuturor materiilor.`,
    `Pentru copii: al 2-lea copil −${childDiscountPercent(2)}%, începând cu al 3-lea copil −${childDiscountPercent(3)}%.`,
    `Anual: plătești ${MONTHS_PAID_PER_YEAR} luni și primești 12, cu aceleași reduceri.`,
    "Reducerile nu se adună: se aplică cea mai mare dintre plata în probă și un cod de reducere, plus Telegram.",
  ],
  annualLink: "Vezi cât economisești plătind anual →",
  note: "O singură factură pe familie.",
  promo:
    "🎁 Prețuri promoționale până la 31.08.2026 — toate pachetele au o reducere suplimentară de 25%. De la 1 septembrie 2026, prețurile revin la normal.",
  priceSuffix: "lei / materie / lună",
  fromLabel: "de la",
};

const EN: Copy = {
  hero: "Free to start. Pay when you see it's worth it.",
  sub: "Start free for 7 days, no card. Then pick the right plan — for you as a student, or for your child, with or without a tutor.",
  freeTitle: "Free",
  freeTag: "To see for yourself",
  freePrice: "0 lei",
  freePoints: [
    "Public demo anytime — pick a subject and take a real quiz, no account",
    "7 days with the whole package (except WhatsApp and SMS), on a free account, no card",
    "Then pick a plan — everything you did stays saved",
  ],
  freeCta: "Start free",
  paidTitle: "Paid plans",
  plans: [
    {
      name: "Student",
      tag: "Self-paid",
      amount: 19.9,
      from: true,
      accent: "text-blue-400",
      points: [
        "For responsible students who can pay online themselves",
        "Track your own progress and streaks",
        "Full access to questions + simulations",
      ],
      cta: "Choose Student",
    },
    {
      name: "Parent + child",
      tag: "Family",
      amount: 24.9,
      accent: "text-emerald-400",
      points: [
        "Separate account for the child + a parent account",
        "See progress, scores and where they get it wrong",
        "WhatsApp reminders + escalation to you",
      ],
      cta: "Choose Family",
    },
    {
      name: "Parents + child",
      tag: "Family Duo",
      amount: 29.9,
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
      amount: 39.9,
      accent: "text-emerald-400",
      featured: true,
      points: [
        "Everything in Family / Duo",
        "The tutor gets their own account: sees progress, tests and mistakes",
        "Transparent: you pay for the tutor's access too — they pay nothing",
      ],
      cta: "Choose Trio",
    },
    {
      name: "Both parents + child + tutor",
      tag: "Family Trio",
      amount: 49.9,
      accent: "text-emerald-400",
      points: [
        "Everything in Trio",
        "Both parents get their own account, each with their own notifications",
        "The tutor gets their own account: sees progress and the child's mistakes",
      ],
      cta: "Choose Family Trio",
    },
  ],
  discountsTitle: "Discounts:",
  discountsList: [
    `Pay in your first 7 days: −${TRIAL_PAYMENT_PERCENT}% for as long as you stay subscribed.`,
    `Telegram connected at payment, by anyone in the family: another −${TELEGRAM_PERCENT}%, kept afterwards.`,
    `2nd subject −${subjectDiscountPercent(2)}%, from the 3rd −${subjectDiscountPercent(3)}%; the discounts above apply to every subject.`,
    `Per child: 2nd child −${childDiscountPercent(2)}%, from the 3rd child −${childDiscountPercent(3)}%.`,
    `Yearly: pay ${MONTHS_PAID_PER_YEAR} months, get 12, with the same discounts.`,
    "Discounts don't add up: the larger of paying in the trial and a discount code applies, plus Telegram.",
  ],
  annualLink: "See how much you save paying yearly →",
  note: "One bill per family.",
  promo:
    "🎁 Promotional prices until 31.08.2026 — all packages get an extra 25% off. From 1 September 2026, prices return to normal.",
  priceSuffix: "lei / subject / month",
  fromLabel: "from",
};

export default async function PreturiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = locale === "en" ? EN : RO;

  const promoActive = isPromoActive();
  const fmt = (n: number) => fmtPrice(n, locale);

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
              {c.plans.map((p, i) => {
                const normal = normalFromPromo(p.amount);
                return (
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
                  <p className="mt-3 text-sm font-medium text-blue-300">
                    {p.from ? `${c.fromLabel} ` : ""}
                    {promoActive && (
                      <span className="mr-1.5 text-gray-500 line-through">{fmt(normal)}</span>
                    )}
                    <span className="font-semibold text-white">
                      {promoActive ? fmt(p.amount) : fmt(normal)}
                    </span>{" "}
                    {c.priceSuffix}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2 text-sm text-gray-300">
                        <span className={p.accent}>✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/auth/register?plan=${PLAN_KEYS[i] ?? "ELEV"}`}
                    className="mt-5 block rounded-xl bg-blue-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-blue-500"
                  >
                    {p.cta}
                  </Link>
                </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-xl text-xs text-gray-500">
          <p className="font-medium text-gray-400">{c.discountsTitle}</p>
          <ul className="mt-1 space-y-1">
            {c.discountsList.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="text-gray-600">•</span>
                {d}
              </li>
            ))}
          </ul>
          <Link href="/anual" className="mt-2 inline-block text-emerald-400 hover:text-emerald-300">
            {c.annualLink}
          </Link>
        </div>
        <p className="mx-auto mt-3 max-w-xl text-center text-xs text-gray-600">{c.note}</p>

        {promoActive && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-center text-sm font-medium text-amber-200">
            {c.promo}
          </div>
        )}
      </main>
    </div>
  );
}
