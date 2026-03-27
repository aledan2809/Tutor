import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lessons - Tutor",
  description: "Browse and study structured lessons organized by topic and difficulty level.",
};

export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
