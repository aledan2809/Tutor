import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar - Tutor",
  description: "View and manage your study schedule, upcoming sessions, and learning milestones.",
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
