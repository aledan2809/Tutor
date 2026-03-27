import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice - Tutor",
  description: "Start adaptive practice sessions tailored to your skill level. Improve through spaced repetition and intelligent question selection.",
};

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
