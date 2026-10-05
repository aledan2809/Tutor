import type { Metadata } from "next";

// The demo is a client page: its title lives here (it used to show „Tutor - Adaptive Learning Platform").
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const ro = (await params).locale !== "en";
  return {
    title: ro ? "Încearcă o grilă — gratuit, fără cont" : "Try a quiz — free, no account",
    description: ro
      ? "Alege o materie și rezolvă grile reale pe loc, fără cont."
      : "Pick a subject and answer real practice questions right away, no account needed.",
  };
}

export default function TryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
