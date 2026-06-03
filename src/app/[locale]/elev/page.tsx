import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Pentru elevi și studenți — ține-te de ritm, vezi-ți progresul | etutor.ro",
  description:
    "Înveți pe cont propriu? Exersezi zilnic pe grile reale, îți salvezi progresul și streak-urile, și primești remindere blânde ca să nu pierzi ritmul. Începe gratuit, fără card.",
};

type Copy = {
  badge: string;
  hero: string;
  subtitle: string;
  howTitle: string;
  steps: { t: string; d: string }[];
  planTitle: string;
  planLead: string;
  planPoints: string[];
  parentTitle: string;
  parentSub: string;
  parentLink: string;
  trialTitle: string;
  trialPoints: string[];
  trialNote: string;
  ctaTitle: string;
  ctaSub: string;
  ctaButton: string;
};

const RO: Copy = {
  badge: "Pentru elevi și studenți",
  hero: "Înveți pe cont propriu? Ține-te de ritm și vezi-ți progresul.",
  subtitle:
    "Tu ești pe cont propriu — exersezi zilnic pe grile reale, îți salvezi progresul și streak-urile, și primești remindere blânde ca să nu pierzi ritmul. Fără părinte, fără presiune.",
  howTitle: "Cum funcționează",
  steps: [
    { t: "1. Alegi materia", d: "BAC, Evaluare Națională, admitere sau pe clase — sute de grile reale pe materia ta." },
    { t: "2. Exersezi zilnic", d: "Grile cu variante și explicații. Puncte, niveluri și streak-uri care te țin în priză." },
    { t: "3. Îți vezi progresul", d: "Scoruri, evoluție în timp și unde greșești — ca să știi exact pe ce să insiști." },
    { t: "4. Remindere blânde", d: "Dacă vrei, primești un mesaj prietenos ca să nu pierzi streak-ul. Tu controlezi notificările." },
  ],
  planTitle: "Plata o faci tu (Self)",
  planLead: "Plan pentru elevi și studenți responsabili, care își gestionează singuri învățatul.",
  planPoints: [
    "Cont propriu — îți urmărești singur progresul",
    "De la 19,90 lei / materie / lună (orientativ, set în panou)",
    "A 2-a materie −15%; plată anuală ≈ −2 luni; oferte sezoniere pe parcurs",
    "Remindere și notificări configurate de tine",
  ],
  parentTitle: "Te susține un părinte sau un meditator?",
  parentSub: "Dacă vrei ca un părinte să-ți vadă progresul (și să plătească el), sau să lucrezi cu un meditator, există pachetele Family / Trio.",
  parentLink: "Vezi pagina pentru părinți →",
  trialTitle: "Începe gratuit, fără card",
  trialPoints: [
    "7 zile gratuit",
    "2 materii pe zi, câte 5 întrebări / materie — și astea contează la puncte și streak",
    "Îți alegi cele 2 materii cu un cont gratuit",
    "−30% dacă plătești orice materie în perioada de probă (cronometru afișat)",
  ],
  trialNote: "Vrei mai mult de atât? Treci la Premium oricând, cu un click.",
  ctaTitle: "Gata să-ți iei învățatul în mâini?",
  ctaSub: "Îți faci cont, alegi materiile și pornești proba gratuită în câteva minute.",
  ctaButton: "Începe gratuit",
};

const EN: Copy = {
  badge: "For students",
  hero: "Studying on your own? Keep the pace and see your progress.",
  subtitle:
    "You're on your own — practice daily on real questions, save your progress and streaks, and get gentle reminders so you don't lose the rhythm. No parent, no pressure.",
  howTitle: "How it works",
  steps: [
    { t: "1. Pick your subject", d: "Bac, National Exam, admissions or by grade — hundreds of real questions on your subject." },
    { t: "2. Practice daily", d: "Questions with options and explanations. Points, levels and streaks keep you going." },
    { t: "3. See your progress", d: "Scores, progress over time and where you get it wrong — so you know exactly what to focus on." },
    { t: "4. Gentle reminders", d: "If you want, get a friendly message so you don't lose your streak. You control the notifications." },
  ],
  planTitle: "You pay (Self)",
  planLead: "A plan for responsible students who manage their own learning.",
  planPoints: [
    "Your own account — you track your own progress",
    "From 19.90 lei / subject / month (indicative, set in the panel)",
    "2nd subject −15%; annual ≈ −2 months; seasonal offers along the way",
    "Reminders and notifications configured by you",
  ],
  parentTitle: "Backed by a parent or a tutor?",
  parentSub: "If you want a parent to see your progress (and pay), or to work with a tutor, there are the Family / Trio plans.",
  parentLink: "See the parents page →",
  trialTitle: "Start free, no card",
  trialPoints: [
    "7 days free",
    "2 subjects per day, 5 questions / subject — and these count toward points and streaks",
    "Pick your 2 subjects with a free account",
    "−30% if you pay for any subject during the trial (countdown shown)",
  ],
  trialNote: "Want more than that? Upgrade to Premium anytime, in one click.",
  ctaTitle: "Ready to take your learning into your own hands?",
  ctaSub: "Create an account, pick your subjects and start the free trial in minutes.",
  ctaButton: "Start free",
};

export default async function ElevPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = locale === "en" ? EN : RO;
  const lp = locale === "en" ? "en" : "ro";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-5xl px-4 py-16">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full bg-blue-500/15 px-3 py-1 text-sm font-medium text-blue-400">
            {c.badge}
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold">{c.hero}</h1>
          <p className="mt-4 text-lg text-gray-400">{c.subtitle}</p>
          <div className="mt-7">
            <Link
              href={`/${lp}/auth/signin`}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
            >
              {c.ctaButton}
            </Link>
          </div>
        </div>

        {/* How it works */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-center">{c.howTitle}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.steps.map((s) => (
              <div key={s.t} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
                <p className="font-semibold text-blue-400">{s.t}</p>
                <p className="mt-2 text-sm text-gray-400">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Plan */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-center">{c.planTitle}</h2>
          <p className="mt-2 text-center text-sm text-gray-400 max-w-2xl mx-auto">{c.planLead}</p>
          <div className="mt-6 mx-auto max-w-xl rounded-2xl border border-blue-500 bg-gray-900 p-6 ring-1 ring-blue-500/40">
            <ul className="space-y-2">
              {c.planPoints.map((pt) => (
                <li key={pt} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Parent/tutor pointer */}
        <section className="mt-10 rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center">
          <h2 className="text-lg font-semibold">{c.parentTitle}</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-xl mx-auto">{c.parentSub}</p>
          <Link href={`/${lp}/parinte`} className="mt-3 inline-block text-sm text-blue-400 hover:underline">
            {c.parentLink}
          </Link>
        </section>

        {/* Free trial */}
        <section className="mt-16 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
          <h2 className="text-2xl font-semibold">{c.trialTitle}</h2>
          <ul className="mt-5 mx-auto max-w-xl space-y-2 text-left">
            {c.trialPoints.map((pt) => (
              <li key={pt} className="flex gap-2 text-sm text-gray-300">
                <span className="text-green-400">✓</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-gray-400">{c.trialNote}</p>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <h2 className="text-2xl font-semibold">{c.ctaTitle}</h2>
          <p className="mt-2 text-gray-400">{c.ctaSub}</p>
          <Link
            href={`/${lp}/auth/signin`}
            className="mt-6 inline-block rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-500"
          >
            {c.ctaButton}
          </Link>
        </section>
      </main>
    </div>
  );
}
