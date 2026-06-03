import { getTranslations, getLocale } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import SubjectQuizDemo from "@/components/SubjectQuizDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutor - Mii de grile reale pe materia ta | etutor.ro",
  description:
    "Lipești orice text → primești un test în 10 secunde, gratuit și fără cont. Apoi: 1.400+ grile reale (BAC, Evaluare Națională, INM/Barou), streak-uri și învățare adaptivă.",
};

// The page renders dynamically (locale/i18n config), so a page-level
// `revalidate` wouldn't gate the DB query. Cache the social-proof counts
// themselves for 1h instead — keeps the DB off the per-request hot path while
// the numbers stay fresh enough for proof.
const getStats = unstable_cache(
  async (): Promise<{ questionCount: number; quizCount: number }> => {
    try {
      const [questionCount, quizCount] = await Promise.all([
        prisma.question.count(),
        prisma.magicQuiz.count(),
      ]);
      return { questionCount, quizCount };
    } catch {
      return { questionCount: 0, quizCount: 0 };
    }
  },
  ["homepage-social-proof-stats"],
  { revalidate: 3600 }
);

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const locale = await getLocale();
  const ro = locale === "ro";
  const { questionCount, quizCount } = await getStats();

  // Floor the real question-bank count to the nearest hundred so the headline
  // stays honest and stable ("1.400+") instead of a fragile exact figure.
  const bankFloor = Math.max(100, Math.floor(questionCount / 100) * 100);
  const bankLabel = `${bankFloor.toLocaleString(ro ? "ro-RO" : "en-US")}+`;
  // Only surface the visitor-generated counter once it's meaningful — a "0" (or
  // tiny) counter is worse than none. It self-reveals as the demo gets used.
  const showQuizCounter = quizCount >= 50;

  const L = ro
    ? {
        navDemo: "Demo",
        navGrile: "Grile pe materie",
        navCreatori: "Pentru profesori",
        signIn: "Autentificare",
        badge: "Mii de grile reale · pe materia ta · gratuit",
        bubbleParent: "Ești părinte? Vezi dacă cel mic chiar învață",
        headline: "Mii de grile reale, pe materia ta — gata de exersat",
        sub: "Grile verificate pe BAC, Evaluare Națională și admitere — exersezi pe loc, îți salvezi progresul și primești streak-uri zilnice. Ai și material propriu? Îți faci instant un test din el.",
        demoHeading: "Încearcă chiar acum 👇",
        ctaPrimary: "Fă-ți cont gratuit",
        ctaSecondary: "Vezi demo-ul complet",
        proofTitle: "De ce aleg elevii, părinții și profesorii etutor.ro",
        proofLead:
          "Progresul nu rămâne ascuns: elevul îl vede, părintele îl vede — iar la pachetul cu meditator, îl vede și el. Aceleași scoruri, aceeași evoluție, aceleași greșeli de lucrat. Crește pas cu pas și te ține în priză.",
        proofBank: "grile reale verificate",
        proofExams: "BAC · Evaluare Națională · INM/Barou",
        proofExamsLabel: "examene acoperite",
        proofSpeed: "~10 secunde",
        proofSpeedLabel: "de la text la test",
        proofFree: "Gratuit, fără card*",
        proofFreeLabel: "demo public oricând",
        freeFootnote:
          "* Demo public: mereu gratuit, fără cont. Cont gratuit: 7 zile, 2 materii/zi × 5 întrebări — apoi alegi un plan.",
        proofGdpr: "Date protejate (GDPR)",
        proofGdprLabel: "conform, transparent",
        quizCounter: "teste generate de vizitatori",
        stepsTitle: "Cum funcționează",
        step1Title: "1. Alege materia sau examenul",
        step1Desc: "BAC, Evaluare Națională, admitere sau pe clase — sute de grile reale te așteaptă.",
        step2Title: "2. Exersezi cu grile reale",
        step2Desc: "Grile cu variante și explicații, verificate. Dai testul pe loc, fără cont.",
        step3Title: "3. Îți salvezi progresul",
        step3Desc: "Faci cont și îți salvezi scorul, streak-urile și progresul — vezi cum crește pas cu pas. Sau provoci un prieten la duel.",
        featuresTitle: "Ce primești cu un cont gratuit",
        ownerNote: "",
        ctaBandTitle: "Gata să înveți mai deștept?",
        ctaBandSub: "Începe să exersezi acum — gratuit, în 10 secunde.",
        ctaBandButton: "Încearcă gratuit ✨",
        footerProduct: "Produs",
        footerCompany: "Companie",
        footerTry: "Demo gratuit",
        footerGrile: "Grile pe materie",
        footerCreatori: "Pentru profesori",
        footerPrivacy: "Confidențialitate",
        footerTerms: "Termeni",
        rights: "Toate drepturile rezervate.",
      }
    : {
        navDemo: "Demo",
        navGrile: "Quizzes by subject",
        navCreatori: "For teachers",
        signIn: "Sign in",
        badge: "Thousands of real questions · on your subject · free",
        bubbleParent: "A parent? See if your child is really learning",
        headline: "Thousands of real practice questions, on your subject",
        sub: "Verified questions for Bac, National Exam and admissions — practice right away, save your progress and earn daily streaks. Got your own material? Turn it into a quiz instantly.",
        demoHeading: "Try it right now 👇",
        ctaPrimary: "Create a free account",
        ctaSecondary: "See the full demo",
        proofTitle: "Why students, parents and teachers choose etutor.ro",
        proofLead:
          "Progress doesn't stay hidden: the student sees it, the parent sees it — and on the plan with a tutor, the tutor sees it too. Same scores, same trajectory, same mistakes to work on. It grows step by step and keeps you hooked.",
        proofBank: "real, verified questions",
        proofExams: "Romanian Bac · National Exam · Law",
        proofExamsLabel: "exams covered",
        proofSpeed: "~10 seconds",
        proofSpeedLabel: "from text to quiz",
        proofFree: "Free, no card*",
        proofFreeLabel: "public demo anytime",
        freeFootnote:
          "* Public demo: always free, no account. Free account: 7 days, 2 subjects/day × 5 questions — then pick a plan.",
        proofGdpr: "Data protected (GDPR)",
        proofGdprLabel: "compliant, transparent",
        quizCounter: "quizzes generated by visitors",
        stepsTitle: "How it works",
        step1Title: "1. Pick your subject or exam",
        step1Desc: "Bac, National Exam, admissions or by grade — hundreds of real questions await.",
        step2Title: "2. Practice with real questions",
        step2Desc: "Multiple-choice questions with explanations, verified. Take it right away, no account.",
        step3Title: "3. Save your progress",
        step3Desc: "Create an account to save your score, streaks and progress — watch it grow step by step. Or challenge a friend to a duel.",
        featuresTitle: "What you get with a free account",
        ownerNote: "",
        ctaBandTitle: "Ready to learn smarter?",
        ctaBandSub: "Start practicing now — free, in 10 seconds.",
        ctaBandButton: "Try it free ✨",
        footerProduct: "Product",
        footerCompany: "Company",
        footerTry: "Free demo",
        footerGrile: "Quizzes by subject",
        footerCreatori: "For teachers",
        footerPrivacy: "Privacy",
        footerTerms: "Terms",
        rights: "All rights reserved.",
      };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <span className="text-xl font-bold text-blue-500">Tutor</span>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/try" className="hidden text-sm text-gray-300 hover:text-white sm:inline">
              {L.navDemo}
            </Link>
            <Link href="/grile" className="hidden text-sm text-gray-300 hover:text-white sm:inline">
              {L.navGrile}
            </Link>
            <Link href="/creatori" className="hidden text-sm text-gray-300 hover:text-white sm:inline">
              {L.navCreatori}
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {L.signIn}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — interactive demo above the fold */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
          <div className="text-center lg:text-left">
            <span className="inline-block rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
              {L.badge}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {L.headline}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-gray-300 lg:mx-0 mx-auto">
              {L.sub}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start justify-center">
              <Link
                href="/auth/register"
                className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {L.ctaPrimary}
              </Link>
              <Link
                href="/try"
                className="rounded-lg border border-gray-700 bg-gray-900 px-8 py-3 text-lg font-medium text-white hover:bg-gray-800 transition-colors"
              >
                {L.ctaSecondary}
              </Link>
            </div>

            {/* Comic-style speech bubble that nudges parents toward /parinte.
                Centered on mobile (parent is text-center), left-aligned on lg.
                Float animation respects prefers-reduced-motion (see globals.css). */}
            <Link
              href="/parinte"
              className="group mt-6 inline-flex animate-float-bubble items-center gap-2 align-middle"
            >
              <span className="text-2xl" aria-hidden>👨‍👩‍👧</span>
              <span className="relative rounded-2xl rounded-bl-sm border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-left text-sm font-medium text-blue-200 transition-colors group-hover:bg-blue-500/20">
                <span
                  className="absolute -left-1.5 bottom-2 h-3 w-3 rotate-45 border-b border-l border-blue-500/40 bg-blue-500/10 transition-colors group-hover:bg-blue-500/20"
                  aria-hidden
                />
                {L.bubbleParent}{" "}
                <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </Link>

            {showQuizCounter && (
              <p className="mt-5 text-sm text-gray-400">
                🔥 <span className="font-semibold text-white">{quizCount.toLocaleString(ro ? "ro-RO" : "en-US")}</span> {L.quizCounter}
              </p>
            )}
          </div>

          {/* Live demo card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 shadow-2xl shadow-blue-950/30 sm:p-6">
            <p className="mb-4 text-center text-sm font-semibold text-blue-300">
              {L.demoHeading}
            </p>
            <SubjectQuizDemo locale={locale} />
          </div>
        </section>

        {/* Social proof — real, verifiable signals */}
        <section className="border-y border-gray-800 bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="text-center text-2xl font-bold text-white">{L.proofTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-400">{L.proofLead}</p>
            <div className="mt-8 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <div className="text-3xl font-bold text-blue-400">{bankLabel}</div>
                <div className="mt-1 text-sm text-gray-400">{L.proofBank}</div>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <div className="text-lg font-bold text-blue-400">{L.proofExams}</div>
                <div className="mt-1 text-sm text-gray-400">{L.proofExamsLabel}</div>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <div className="text-3xl font-bold text-blue-400">{L.proofSpeed}</div>
                <div className="mt-1 text-sm text-gray-400">{L.proofSpeedLabel}</div>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <div className="text-lg font-bold text-blue-400">{L.proofFree}</div>
                <div className="mt-1 text-sm text-gray-400">{L.proofFreeLabel}</div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-gray-500">{L.freeFootnote}</p>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-white">{L.stepsTitle}</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <div className="text-3xl">📋</div>
              <h3 className="mt-3 text-lg font-semibold text-white">{L.step1Title}</h3>
              <p className="mt-1 text-sm text-gray-400">{L.step1Desc}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <div className="text-3xl">✨</div>
              <h3 className="mt-3 text-lg font-semibold text-white">{L.step2Title}</h3>
              <p className="mt-1 text-sm text-gray-400">{L.step2Desc}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <div className="text-3xl">🎯</div>
              <h3 className="mt-3 text-lg font-semibold text-white">{L.step3Title}</h3>
              <p className="mt-1 text-sm text-gray-400">{L.step3Desc}</p>
            </div>
          </div>
        </section>

        {/* What you get — product capabilities.
            OWNER: when real product screenshots / a 15s screen-capture video are
            available, drop them here (e.g. a <video> or <Image> per capability).
            Built to stand on its own without imagery so nothing is faked. */}
        <section className="border-t border-gray-800 bg-gray-950">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="text-center text-2xl font-bold text-white">{L.featuresTitle}</h2>
            <div className="mt-10 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
                <h3 className="mb-2 text-lg font-semibold text-white">{t("adaptiveLearning")}</h3>
                <p className="text-sm text-gray-400">{t("adaptiveDesc")}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
                <h3 className="mb-2 text-lg font-semibold text-white">{t("examSimulator")}</h3>
                <p className="text-sm text-gray-400">{t("examDesc")}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
                <h3 className="mb-2 text-lg font-semibold text-white">{t("multiDomain")}</h3>
                <p className="text-sm text-gray-400">{t("multiDomainDesc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA band */}
        <section className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">{L.ctaBandTitle}</h2>
          <p className="mt-3 text-lg text-gray-400">{L.ctaBandSub}</p>
          <Link
            href="/try"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-10 py-4 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {L.ctaBandButton}
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <span className="text-lg font-bold text-blue-500">Tutor</span>
              <p className="mt-2 text-sm text-gray-500">etutor.ro</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">{L.footerProduct}</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-400">
                <li><Link href="/try" className="hover:text-white">{L.footerTry}</Link></li>
                <li><Link href="/grile" className="hover:text-white">{L.footerGrile}</Link></li>
                <li><Link href="/creatori" className="hover:text-white">{L.footerCreatori}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">{L.footerCompany}</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">{L.footerPrivacy}</Link></li>
                <li><Link href="/terms" className="hover:text-white">{L.footerTerms}</Link></li>
              </ul>
            </div>
          </div>
          <p className="mt-10 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Tutor. {L.rights}
          </p>
          <p className="mt-2 text-center text-xs text-gray-600">🔒 {L.proofGdpr} · {L.proofGdprLabel}</p>
        </div>
      </footer>
    </div>
  );
}
