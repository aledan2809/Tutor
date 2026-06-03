import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pentru părinți — copilul tău învață constant, tu vezi progresul | etutor.ro",
  description:
    "Plătești ca să ai liniște: copilul exersează zilnic pe grile reale, îl împingem noi pe WhatsApp dacă se lasă, iar tu vezi progresul și unde greșește. Începe gratuit, fără card.",
};

type Plan = { name: string; tag: string; price: string; points: string[]; featured?: boolean };
type Copy = {
  badge: string;
  hero: string;
  subtitle: string;
  howTitle: string;
  steps: { t: string; d: string }[];
  plansTitle: string;
  plansLead: string;
  plans: Plan[];
  priceNote: string;
  trialTitle: string;
  trialPoints: string[];
  trialNote: string;
  ctaTitle: string;
  ctaSub: string;
  ctaButton: string;
  ctaStudent: string;
};

const RO: Copy = {
  badge: "Pentru părinți",
  hero: "Copilul tău învață constant. Tu vezi exact cum.",
  subtitle:
    "Plătești ca să ai liniște: copilul exersează zilnic pe grile reale, tu vezi progresul real, iar dacă se lasă îl împingem noi — nu trebuie să-l bați tu la cap.",
  howTitle: "Cum funcționează",
  steps: [
    { t: "1. Copilul exersează", d: "Grile reale pe materia lui, în fiecare zi. Streak-uri și puncte care îl țin motivat." },
    { t: "2. Îl împingem noi (WhatsApp)", d: "Dacă se lasă, primește un mesaj prietenos pe WhatsApp ca să-și facă exercițiile. Tu stai liniștit." },
    { t: "3. Escaladăm la tine", d: "Dacă tot nu reacționează, primești tu o notificare. La pachetul Trio, escaladăm și către meditator." },
    { t: "4. Vezi tot progresul", d: "Scoruri, evoluție în timp și — mai ales — unde greșește copilul, fără să-l hărțuiești tu." },
  ],
  plansTitle: "Alege pachetul",
  plansLead: "O singură factură pe familie. Cu cât adaugi mai mulți copii, cu atât e mai ieftin per copil.",
  plans: [
    {
      name: "Family",
      tag: "1 părinte + copil",
      price: "de la 19,90 lei / materie / lună",
      points: [
        "Cont separat pentru copil + cont de părinte",
        "Vezi progresul, scorurile și unde greșește",
        "Chasing pe WhatsApp + escaladare către tine",
      ],
    },
    {
      name: "Family Duo",
      tag: "2 părinți + copil",
      price: "+ mic supliment fix",
      points: [
        "Tot ce e în Family",
        "Al doilea părinte are cont propriu",
        "Fiecare părinte își configurează singur notificările",
      ],
    },
    {
      name: "Trio",
      tag: "Părinte + copil + meditator",
      price: "+ supliment premium",
      featured: true,
      points: [
        "Tot ce e în Family / Duo",
        "Meditatorul are cont propriu: vede progresul, testele și unde a greșit copilul",
        "Meditatorul își configurează notificările (escaladări, sumar de progres)",
        "Transparent: tu plătești inclusiv accesul meditatorului — meditatorul nu plătește nimic",
      ],
    },
    {
      name: "Self (elev)",
      tag: "Elevul plătește singur",
      price: "de la 19,90 lei / materie / lună",
      points: [
        "Pentru elevi/studenți responsabili, fără părinte",
        "Își urmărește singur progresul",
        "Vezi pagina dedicată pentru elevi",
      ],
    },
  ],
  priceNote:
    "Prețurile sunt orientative și se setează în panou. Reduceri: al 2-lea copil −25%, al 3-lea+ −40%; a 2-a materie −15%; plată anuală ≈ −2 luni. Oferte sezoniere pe parcurs.",
  trialTitle: "Începe gratuit, fără card",
  trialPoints: [
    "7 zile gratuit",
    "2 materii pe zi, câte 5 întrebări / materie — și astea contează la puncte și streak",
    "Îți alegi cele 2 materii cu un cont gratuit",
    "−30% dacă plătești orice materie în perioada de probă (cronometru afișat)",
  ],
  trialNote: "Vrei mai mult de atât? Treci la Premium oricând, cu un click.",
  ctaTitle: "Gata să-i dai copilului un start în plus?",
  ctaSub: "Îți faci cont, adaugi copilul și pornești proba gratuită în câteva minute.",
  ctaButton: "Înrolează-ți copilul",
  ctaStudent: "Sunt elev și plătesc singur →",
};

const EN: Copy = {
  badge: "For parents",
  hero: "Your child learns consistently. You see exactly how.",
  subtitle:
    "Pay for peace of mind: your child practices daily on real questions, you see real progress, and if they slack off we nudge them — you don't have to nag.",
  howTitle: "How it works",
  steps: [
    { t: "1. Your child practices", d: "Real questions on their subject, every day. Streaks and points keep them motivated." },
    { t: "2. We nudge them (WhatsApp)", d: "If they slack off, they get a friendly WhatsApp message to do their exercises. You stay relaxed." },
    { t: "3. We escalate to you", d: "If they still don't react, you get a notification. On the Trio plan we also escalate to the tutor." },
    { t: "4. You see all progress", d: "Scores, progress over time and — especially — where your child gets it wrong, without you nagging." },
  ],
  plansTitle: "Choose your plan",
  plansLead: "One bill per family. The more children you add, the cheaper it gets per child.",
  plans: [
    {
      name: "Family",
      tag: "1 parent + child",
      price: "from 19.90 lei / subject / month",
      points: [
        "Separate account for the child + a parent account",
        "See progress, scores and where they get it wrong",
        "WhatsApp chasing + escalation to you",
      ],
    },
    {
      name: "Family Duo",
      tag: "2 parents + child",
      price: "+ small flat add-on",
      points: [
        "Everything in Family",
        "The second parent gets their own account",
        "Each parent configures their own notifications",
      ],
    },
    {
      name: "Trio",
      tag: "Parent + child + tutor",
      price: "+ premium add-on",
      featured: true,
      points: [
        "Everything in Family / Duo",
        "The tutor gets their own account: sees progress, the tests and where the child got it wrong",
        "The tutor configures their notifications (escalations, progress summary)",
        "Transparent: you pay for the tutor's access too — the tutor pays nothing",
      ],
    },
    {
      name: "Self (student)",
      tag: "The student pays",
      price: "from 19.90 lei / subject / month",
      points: [
        "For responsible students with no parent involved",
        "They track their own progress",
        "See the dedicated student page",
      ],
    },
  ],
  priceNote:
    "Prices are indicative and set in the panel. Discounts: 2nd child −25%, 3rd+ −40%; 2nd subject −15%; annual ≈ −2 months. Seasonal offers along the way.",
  trialTitle: "Start free, no card",
  trialPoints: [
    "7 days free",
    "2 subjects per day, 5 questions / subject — and these count toward points and streaks",
    "Pick your 2 subjects with a free account",
    "−30% if you pay for any subject during the trial (countdown shown)",
  ],
  trialNote: "Want more than that? Upgrade to Premium anytime, in one click.",
  ctaTitle: "Ready to give your child an extra edge?",
  ctaSub: "Create an account, add your child and start the free trial in minutes.",
  ctaButton: "Enroll your child",
  ctaStudent: "I'm a student paying for myself →",
};

export default async function ParintePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = locale === "en" ? EN : RO;
  const lp = locale === "en" ? "en" : "ro";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <main className="mx-auto max-w-5xl px-4 py-16">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full bg-blue-500/15 px-3 py-1 text-sm font-medium text-blue-400">
            {c.badge}
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold">{c.hero}</h1>
          <p className="mt-4 text-lg text-gray-400">{c.subtitle}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${lp}/auth/signin`}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
            >
              {c.ctaButton}
            </Link>
            <Link href={`/${lp}/elev`} className="text-sm text-blue-400 hover:underline">
              {c.ctaStudent}
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

        {/* Plans */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-center">{c.plansTitle}</h2>
          <p className="mt-2 text-center text-sm text-gray-400 max-w-2xl mx-auto">{c.plansLead}</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {c.plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border bg-gray-900 p-6 ${
                  p.featured ? "border-blue-500 ring-1 ring-blue-500/40" : "border-gray-800"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                  {p.featured && (
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300">
                      {locale === "en" ? "Most chosen" : "Cel mai ales"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{p.tag}</p>
                <p className="mt-3 text-sm font-medium text-blue-400">{p.price}</p>
                <ul className="mt-4 space-y-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-2 text-sm text-gray-300">
                      <span className="text-blue-400">✓</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-gray-500 max-w-2xl mx-auto">{c.priceNote}</p>
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
