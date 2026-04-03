import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gamification - Tutor",
  description: "View your achievements, levels, and stats. Track your learning streaks, XP progress, and compete on leaderboards.",
};

export default function GamificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
