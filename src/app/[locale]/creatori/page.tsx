import type { Metadata } from "next";
import { CreatorWaitlistForm } from "@/components/creator-waitlist-form";

export const metadata: Metadata = {
  title: "Program pentru creatori — venit recurent din predare",
  description:
    "Adaugă conținut educațional pe materia ta și câștigă comision perpetuu din cât e folosit. Înscrie-te pe lista creatorilor.",
};

type Copy = {
  badge: string;
  hero: string;
  subtitle: string;
  howTitle: string;
  steps: { t: string; d: string }[];
  commTitle: string;
  commPoints: string[];
  subjectsTitle: string;
  subjects: string[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  formTitle: string;
  formLead: string;
  labels: {
    name: string; email: string; subject: string; subjectPlaceholder: string;
    experience: string; experiencePlaceholder: string; submit: string; submitting: string;
    successTitle: string; successBody: string; error: string;
  };
};

const RO: Copy = {
  badge: "Program pentru creatori de conținut",
  hero: "Predai? Transformă-ți expertiza în venit recurent.",
  subtitle:
    "Adaugă conținut pe materia ta — grile, lecții, bibliografie — și câștigi comision perpetuu din cât este folosit. Tu pregătești o dată; câștigi cât timp alții învață din el.",
  howTitle: "Cum funcționează",
  steps: [
    { t: "1. Adaugi conținut", d: "Pui grile, lecții și materiale pe materia ta de expertiză." },
    { t: "2. Cursanții îl folosesc", d: "Elevii rezolvă grilele și parcurg lecțiile tale, lună de lună." },
    { t: "3. Câștigi perpetuu", d: "Primești comision lunar proporțional cu cât e folosit conținutul tău — atâta timp cât e folosit." },
  ],
  commTitle: "Modelul de comision (transparent)",
  commPoints: [
    "~40% din venitul atribuibil conținutului tău",
    "Perpetuu — câștigi cât timp materialul e folosit, nu o singură dată",
    "Calcul pro-rata lunar, după consum real (grile rezolvate / lecții parcurse)",
    "Plăți lunare (Stripe), peste un prag minim",
    "Conținut validat înainte de publicare — calitatea contează",
  ],
  subjectsTitle: "Materii deschise acum",
  subjects: [
    "Drept — INM / Barou / Admitere",
    "Medicină — Rezidențiat / Admitere UMF",
    "Bacalaureat (Mate, Română, Istorie, Bio, Info)",
    "Permis auto — legislație",
    "Certificări IT / Limbi străine",
  ],
  faqTitle: "Întrebări frecvente",
  faq: [
    { q: "Cum se calculează comisionul?", a: "Lunar, pro-rata: venitul fiecărui abonat se împarte între creatori proporțional cu cât din conținutul fiecăruia a folosit în acea lună." },
    { q: "Când și cum sunt plătit?", a: "Lunar prin Stripe, peste un prag minim. Îți conectezi contul la onboarding." },
    { q: "E exclusiv?", a: "Nu. Îți păstrezi materialele; ne dai dreptul să le folosim pe platformă și câștigi din utilizare." },
    { q: "Cine poate aplica?", a: "Profesori și experți pe materiile de mai sus. Conținutul trece printr-o validare de calitate înainte de publicare." },
  ],
  formTitle: "Înscrie-te pe lista creatorilor",
  formLead: "Locuri limitate per materie la lansare. Te contactăm pe rând.",
  labels: {
    name: "Nume și prenume", email: "Email", subject: "Materia ta",
    subjectPlaceholder: "Alege materia", experience: "Experiență (opțional)",
    experiencePlaceholder: "Ex: 8 ani pregătire INM, autor culegere de grile…",
    submit: "Vreau să fiu creator", submitting: "Se trimite…",
    successTitle: "Te-ai înscris!", successBody: "Ești pe lista creatorilor. Te contactăm când deschidem materia ta.",
    error: "A apărut o eroare. Încearcă din nou.",
  },
};

const EN: Copy = {
  badge: "Content creator program",
  hero: "You teach? Turn your expertise into recurring income.",
  subtitle:
    "Add content for your subject — question banks, lessons, bibliography — and earn a perpetual commission from how much it's used. Prepare it once; earn while others learn from it.",
  howTitle: "How it works",
  steps: [
    { t: "1. Add content", d: "Put questions, lessons and materials for your subject of expertise." },
    { t: "2. Learners use it", d: "Students solve your questions and follow your lessons, month after month." },
    { t: "3. Earn perpetually", d: "You get a monthly commission proportional to how much your content is used — for as long as it's used." },
  ],
  commTitle: "Commission model (transparent)",
  commPoints: [
    "~40% of the revenue attributable to your content",
    "Perpetual — you earn while the material is used, not once",
    "Monthly pro-rata calculation based on real consumption",
    "Monthly payouts (Stripe), above a minimum threshold",
    "Content reviewed before publishing — quality matters",
  ],
  subjectsTitle: "Subjects open now",
  subjects: [
    "Law — INM / Bar / Admission",
    "Medicine — Residency / Med-school admission",
    "Baccalaureate (Math, Romanian, History, Bio, CS)",
    "Driving licence — legislation",
    "IT certifications / Languages",
  ],
  faqTitle: "FAQ",
  faq: [
    { q: "How is the commission computed?", a: "Monthly, pro-rata: each subscriber's revenue is split among creators in proportion to how much of each one's content they used that month." },
    { q: "When and how am I paid?", a: "Monthly via Stripe, above a minimum threshold. You connect your account at onboarding." },
    { q: "Is it exclusive?", a: "No. You keep your materials; you grant us the right to use them on the platform and earn from usage." },
    { q: "Who can apply?", a: "Teachers and experts in the subjects above. Content goes through a quality review before publishing." },
  ],
  formTitle: "Join the creator waitlist",
  formLead: "Limited spots per subject at launch. We reach out one by one.",
  labels: {
    name: "Full name", email: "Email", subject: "Your subject",
    subjectPlaceholder: "Choose a subject", experience: "Experience (optional)",
    experiencePlaceholder: "E.g. 8 years prepping for the Bar, author of a question book…",
    submit: "I want to be a creator", submitting: "Sending…",
    successTitle: "You're in!", successBody: "You're on the creator waitlist. We'll contact you when your subject opens.",
    error: "Something went wrong. Please try again.",
  },
};

export default async function CreatoriPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = locale === "en" ? EN : RO;

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
        </div>

        {/* How it works */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-center">{c.howTitle}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {c.steps.map((s) => (
              <div key={s.t} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
                <p className="font-semibold text-blue-400">{s.t}</p>
                <p className="mt-2 text-sm text-gray-400">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Commission + subjects */}
        <section className="mt-16 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">{c.commTitle}</h2>
            <ul className="mt-4 space-y-2">
              {c.commPoints.map((p) => (
                <li key={p} className="flex gap-2 text-gray-300">
                  <span className="text-blue-400">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{c.subjectsTitle}</h2>
            <ul className="mt-4 space-y-2">
              {c.subjects.map((s) => (
                <li key={s} className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-gray-300">{s}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Form */}
        <section className="mt-16 grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="text-2xl font-semibold">{c.formTitle}</h2>
            <p className="mt-2 text-gray-400">{c.formLead}</p>
            <div className="mt-6">
              <h3 className="text-lg font-semibold">{c.faqTitle}</h3>
              <dl className="mt-3 space-y-4">
                {c.faq.map((f) => (
                  <div key={f.q}>
                    <dt className="font-medium text-gray-200">{f.q}</dt>
                    <dd className="mt-1 text-sm text-gray-400">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <CreatorWaitlistForm locale={locale === "en" ? "en" : "ro"} subjects={c.subjects} labels={c.labels} />
        </section>
      </main>
    </div>
  );
}
