import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { prisma } from "@/lib/prisma";
import { fmtPrice } from "@/lib/pricing";
import { subjectDiscountPercent } from "@/lib/family";
import { FREE_TRIAL_DAYS } from "@/lib/free-trial";
import {
  forInterval,
  lifetimeDiscount,
  MONTHS_PAID_PER_YEAR,
  subjectMonthlyMinor,
  TELEGRAM_PERCENT,
  TRIAL_PAYMENT_PERCENT,
} from "@/lib/checkout-price";

/**
 * eTutor.ro/anual — paying a year at once, with example figures (Alex 17.09.2026: the annual offer gets
 * a public page for ads, and one in the account with the family's own figures). The example is the
 * best case the site can promise to anyone: paying during the free trial with Telegram connected, one
 * subject. Prices are read from the database and computed by the checkout rules (checkout-price.ts),
 * so the page can't promise a figure checkout wouldn't charge.
 */
export const dynamic = "force-dynamic";

const PLAN_ORDER = ["ELEV", "FAMILY", "FAMILY_DUO", "TRIO", "FAMILY_TRIO"] as const;

// The figures of the rules (checkout-price.ts, family.ts, free-trial.ts): a changed discount changes the page.
const TRIAL = TRIAL_PAYMENT_PERCENT;
const TG = TELEGRAM_PERCENT;
const MONTHS = MONTHS_PAID_PER_YEAR;
const DAYS = FREE_TRIAL_DAYS;
const SUBJECT_2 = subjectDiscountPercent(2);
const SUBJECT_3 = subjectDiscountPercent(3);

const COPY = {
  ro: {
    title: "Plătești anual — economisești și mai mult | eTutor.ro",
    description: `Anual plătești ${MONTHS} luni și primești 12, cu aceleași reduceri ca la lunar: −${TRIAL}% dacă plătești în primele ${DAYS} zile, −${TG}% cu Telegram conectat.`,
    pill: `Anual = ${MONTHS} luni, primești 12`,
    hero: "Plătești pe un an. Economisești și mai mult.",
    sub: `Anualul pornește de la prețul lunar cu reducerile tale (−${TRIAL}% dacă plătești în primele ${DAYS} zile, −${TG}% cu Telegram conectat) și îl plătești doar pentru ${MONTHS} luni.`,
    exampleHead: "O materie · exemplu cu probă + Telegram",
    monthlyYear: "Lunar × 12",
    yearly: "Anual",
    saving: "Economisești",
    normalNote: (plan: string, normal: string, yearly: string) =>
      `La preț normal, ${plan} costă ${normal} lei pe an plătit lunar; anual, cu probă și Telegram, ${yearly} lei.`,
    honest: `Cifrele sunt un exemplu: cu plata în primele ${DAYS} zile și Telegram conectat, pentru o materie. În cont vezi cifrele familiei tale (materiile alese, codul, Telegram).`,
    rules: [
      `A doua materie −${SUBJECT_2}%, de la a treia −${SUBJECT_3}%, din prețul normal; reducerile de mai sus se aplică tuturor materiilor.`,
      "Zilele gratuite rămase se păstrează: prima plată vine după probă.",
      "Reducerile rămân la fiecare an de abonament.",
    ],
    ctaFree: `Începe gratuit, ${DAYS} zile fără card`,
    ctaAccount: "Am cont · vezi Abonament",
    lei: "lei",
  },
  en: {
    title: "Pay yearly — save even more | eTutor.ro",
    description: `Yearly you pay ${MONTHS} months and get 12, with the same discounts as monthly: −${TRIAL}% if you pay in the first ${DAYS} days, −${TG}% with Telegram connected.`,
    pill: `Yearly = pay ${MONTHS} months, get 12`,
    hero: "Pay for a year. Save even more.",
    sub: `Yearly starts from the monthly price with your discounts (−${TRIAL}% if you pay in the first ${DAYS} days, −${TG}% with Telegram connected) and you pay only ${MONTHS} months of it.`,
    exampleHead: "One subject · example with trial offer + Telegram",
    monthlyYear: "Monthly × 12",
    yearly: "Yearly",
    saving: "You save",
    normalNote: (plan: string, normal: string, yearly: string) =>
      `At the normal price, ${plan} costs ${normal} lei a year paid monthly; yearly, with the trial offer and Telegram, ${yearly} lei.`,
    honest: `The figures are an example: paying in the first ${DAYS} days with Telegram connected, for one subject. In your account you see your family's own figures (chosen subjects, code, Telegram).`,
    rules: [
      `2nd subject −${SUBJECT_2}%, from the 3rd −${SUBJECT_3}%, from the normal price; the discounts above apply to every subject.`,
      "Your remaining free days are kept: the first payment comes after the trial.",
      "The discounts stay for every year of the subscription.",
    ],
    ctaFree: `Start free, ${DAYS} days without a card`,
    ctaAccount: "I have an account · see Subscription",
    lei: "lei",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const c = locale === "en" ? COPY.en : COPY.ro;
  return {
    title: { absolute: c.title },
    description: c.description,
    alternates: { canonical: `/${locale === "en" ? "en" : "ro"}/anual` },
  };
}

export default async function AnnualPublicPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = locale === "en" ? COPY.en : COPY.ro;
  // Read on every visit: an ad sends people here, and the figures must be today's prices.
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true, interval: "MONTH", familyPlanKey: { in: [...PLAN_ORDER] } },
    orderBy: { price: "asc" },
    select: { familyPlanKey: true, name: true, price: true },
  });
  const best = lifetimeDiscount({ trialActive: true, codePercent: null, telegram: true });
  const fmt = (minor: number) => fmtPrice(minor / 100, locale);

  const rows = PLAN_ORDER.map((key) => plans.find((p) => p.familyPlanKey === key))
    .filter((p): p is (typeof plans)[number] => Boolean(p))
    .map((p) => {
      const monthly = subjectMonthlyMinor(p.price, 1, best.percent);
      const yearly = forInterval(monthly, "YEAR");
      return { key: p.familyPlanKey as string, name: p.name, normal: p.price, monthlyYear: monthly * 12, yearly, saving: monthly * 12 - yearly };
    });
  const family = rows.find((r) => r.key === "FAMILY");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <span className="inline-block rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          {c.pill}
        </span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{c.hero}</h1>
        <p className="mt-3 text-gray-400">{c.sub}</p>

        {rows.length > 0 && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full min-w-[440px] text-sm">
              <thead className="bg-gray-900 text-xs text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{c.exampleHead}</th>
                  <th className="px-4 py-3 text-right font-medium">{c.monthlyYear}</th>
                  <th className="px-4 py-3 text-right font-medium">{c.yearly}</th>
                  <th className="px-4 py-3 text-right font-medium">{c.saving}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t border-gray-800">
                    <td className="px-4 py-3 text-gray-200">{r.name}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{fmt(r.monthlyYear)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">{fmt(r.yearly)}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{fmt(r.saving)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {family && <p className="mt-3 text-xs text-gray-500">{c.normalNote(family.name, fmt(family.normal * 12), fmt(family.yearly))}</p>}
        <p className="mt-2 text-xs text-gray-500">{c.honest}</p>

        <ul className="mt-6 space-y-1.5 text-sm text-gray-300">
          {c.rules.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/register?plan=FAMILY" className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500">
            {c.ctaFree}
          </Link>
          <Link href="/dashboard/packages/anual?plan=FAMILY" className="rounded-xl border border-gray-700 px-5 py-3 font-semibold text-gray-200 hover:bg-gray-900">
            {c.ctaAccount}
          </Link>
        </div>
      </main>
    </div>
  );
}
