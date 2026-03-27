import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Tutor",
  description: "Customize your learning preferences, notification settings, and study schedule.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
