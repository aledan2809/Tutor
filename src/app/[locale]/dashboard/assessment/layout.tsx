import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assessment - Tutor",
  description: "Take placement assessments to determine your skill level and get personalized learning paths.",
};

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
