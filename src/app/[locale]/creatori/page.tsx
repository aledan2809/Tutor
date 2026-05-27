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
  tracks: Record<string, string[]>;
  faqTitle: string;
  faq: { q: string; a: string }[];
  formTitle: string;
  formLead: string;
  labels: {
    name: string; email: string; track: string; trackPlaceholder: string;
    subject: string; subjectPlaceholder: string; experience: string; experiencePlaceholder: string;
    cv: string; cvHint: string; submit: string; submitting: string;
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
    "~50% din venitul atribuibil conținutului tău (sumă brută)",
    "Perpetuu — câștigi cât timp materialul e folosit, nu o singură dată",
    "Calcul pro-rata lunar, după consum real (grile rezolvate / lecții parcurse)",
    "Plăți lunare prin Stripe, peste un prag minim",
    "Plata este brută — taxele rămân în sarcina ta (vezi întrebarea despre taxe)",
    "Conținut validat înainte de publicare — calitatea contează",
  ],
  subjectsTitle: "Pregătiri și materii deschise acum",
  tracks: {
    "Bacalaureat": ["Limba și literatura română", "Matematică", "Istorie", "Biologie", "Informatică", "Fizică", "Chimie", "Geografie", "Logică"],
    "Admitere Medicină (Rezidențiat / UMF)": ["Biologie", "Chimie organică", "Chimie anorganică", "Fizică"],
    "Drept (INM / Barou / Admitere)": ["Drept civil", "Drept penal", "Drept procesual civil", "Drept procesual penal", "Organizare judiciară"],
    "Permis auto": ["Legislație rutieră", "Prim ajutor", "Mecanică"],
    "Certificări IT": ["Cisco / CCNA", "AWS", "Microsoft / Azure", "Programare"],
    "Limbi străine": ["Engleză (Cambridge / IELTS)", "Germană", "Franceză", "Italiană", "Spaniolă"],
  },
  faqTitle: "Întrebări frecvente",
  faq: [
    { q: "Cum se calculează comisionul?", a: "Lunar, pro-rata: venitul fiecărui abonat se împarte între creatori proporțional cu cât din conținutul fiecăruia a folosit în acea lună." },
    { q: "Comisionul de ~50% e brut sau net?", a: "Este brut — adică suma pe care ți-o plătim înainte de taxele tale. Tu decizi forma de impozitare (vezi mai jos)." },
    { q: "Ce taxe plătesc și ce e cel mai avantajos?", a: "Fiscalitatea îți revine. Pentru conținut educațional, cele mai eficiente variante în România sunt: drepturi de autor (impozit ~10% pe venitul net, CASS doar peste plafoane, de regulă fără CAS), PFA (10% + contribuții la plafoane) sau, pentru sume mari, micro-SRL (1-3% + 8% dividende). Îți recomandăm să consulți un contabil." },
    { q: "Când și cum sunt plătit?", a: "Lunar prin Stripe, peste un prag minim. Îți conectezi contul la onboarding." },
    { q: "E exclusiv?", a: "Nu. Îți păstrezi materialele; ne dai dreptul să le folosim pe platformă și câștigi din utilizare." },
    { q: "Cine poate aplica?", a: "Profesori și experți pe pregătirile și materiile de mai sus. Conținutul trece printr-o validare de calitate înainte de publicare." },
  ],
  formTitle: "Înscrie-te pe lista creatorilor",
  formLead: "Locuri limitate per materie la lansare. Te contactăm cât putem de repede.",
  labels: {
    name: "Nume și prenume", email: "Email",
    track: "Pregătire pentru", trackPlaceholder: "Alege ce pregătire predai",
    subject: "Materia", subjectPlaceholder: "Alege materia",
    experience: "Experiență (opțional)",
    experiencePlaceholder: "Ex: 8 ani pregătire BAC la română, autor culegere de grile…",
    cv: "CV (PDF / DOC — opțional, dar recomandat pentru selecție)",
    cvHint: "Ne ajută să-ți evaluăm experiența mai repede. Max 5 MB.",
    submit: "Vreau să fiu creator", submitting: "Se trimite…",
    successTitle: "Te-ai înscris!", successBody: "Ești pe lista creatorilor. Te contactăm cât putem de repede.",
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
    "~50% of the revenue attributable to your content (gross)",
    "Perpetual — you earn while the material is used, not once",
    "Monthly pro-rata calculation based on real consumption",
    "Monthly payouts via Stripe, above a minimum threshold",
    "Payout is gross — your own taxes are your responsibility (see the tax FAQ)",
    "Content reviewed before publishing — quality matters",
  ],
  subjectsTitle: "Tracks & subjects open now",
  tracks: {
    "Baccalaureate": ["Romanian language & literature", "Mathematics", "History", "Biology", "Computer Science", "Physics", "Chemistry", "Geography", "Logic"],
    "Medicine admission (Residency / Med-school)": ["Biology", "Organic chemistry", "Inorganic chemistry", "Physics"],
    "Law (Bar / Magistracy / Admission)": ["Civil law", "Criminal law", "Civil procedure", "Criminal procedure", "Judicial organization"],
    "Driving licence": ["Road legislation", "First aid", "Mechanics"],
    "IT certifications": ["Cisco / CCNA", "AWS", "Microsoft / Azure", "Programming"],
    "Languages": ["English (Cambridge / IELTS)", "German", "French", "Italian", "Spanish"],
  },
  faqTitle: "FAQ",
  faq: [
    { q: "How is the commission computed?", a: "Monthly, pro-rata: each subscriber's revenue is split among creators in proportion to how much of each one's content they used that month." },
    { q: "Is the ~50% gross or net?", a: "It's gross — the amount we pay you before your own taxes. You choose how you're taxed." },
    { q: "What taxes do I pay?", a: "Taxation is your responsibility. In Romania the most efficient routes for educational content are copyright income, sole proprietorship (PFA) or, for larger amounts, a micro-company. Consult an accountant." },
    { q: "When and how am I paid?", a: "Monthly via Stripe, above a minimum threshold. You connect your account at onboarding." },
    { q: "Is it exclusive?", a: "No. You keep your materials; you grant us the right to use them on the platform and earn from usage." },
    { q: "Who can apply?", a: "Teachers and experts in the tracks and subjects above. Content goes through a quality review before publishing." },
  ],
  formTitle: "Join the creator waitlist",
  formLead: "Limited spots per subject at launch. We reach out as fast as we can.",
  labels: {
    name: "Full name", email: "Email",
    track: "Preparing for", trackPlaceholder: "Choose what you teach",
    subject: "Subject", subjectPlaceholder: "Choose the subject",
    experience: "Experience (optional)",
    experiencePlaceholder: "E.g. 8 years prepping students for the Bar, author of a question book…",
    cv: "CV (PDF / DOC — optional, recommended for selection)",
    cvHint: "Helps us evaluate your experience faster. Max 5 MB.",
    submit: "I want to be a creator", submitting: "Sending…",
    successTitle: "You're in!", successBody: "You're on the creator waitlist. We'll contact you as fast as we can.",
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

        {/* Commission + tracks */}
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
            <div className="mt-4 space-y-3">
              {Object.entries(c.tracks).map(([track, subjects]) => (
                <div key={track} className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-100">{track}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {subjects.map((s) => (
                      <span key={s} className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form + FAQ */}
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
          <CreatorWaitlistForm locale={locale === "en" ? "en" : "ro"} tracks={c.tracks} labels={c.labels} />
        </section>
      </main>
    </div>
  );
}
