import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const ro = (await params).locale !== "en";
  return {
    title: ro ? "Intră în cont" : "Sign in",
    description: ro
      ? "Intră în contul tău eTutor.ro: grilele, progresul și seriile tale."
      : "Sign in to your eTutor.ro account: your quizzes, progress and streaks.",
  };
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
