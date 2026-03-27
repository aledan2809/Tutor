import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications - Tutor",
  description: "Stay updated with learning reminders, streak alerts, and instructor messages.",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
