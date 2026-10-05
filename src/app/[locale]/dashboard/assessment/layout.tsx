import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assessment",
  description: "Take placement assessments to determine your skill level and get personalized learning paths.",
};

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
