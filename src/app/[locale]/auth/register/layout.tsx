import type { Metadata } from "next";

// The signup form is a client page: its title lives here (it used to inherit „Sign In - Tutor").
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const ro = (await params).locale !== "en";
  return {
    // Absolute: measured on the QA build, a plain title here came out without the site's suffix.
    title: { absolute: `${ro ? "Cont nou gratuit" : "Create a free account"} | eTutor.ro` },
    description: ro
      ? "Fă-ți cont gratuit pe eTutor.ro și îți salvezi progresul pe grile reale."
      : "Create a free eTutor.ro account and save your progress on real practice questions.",
  };
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
