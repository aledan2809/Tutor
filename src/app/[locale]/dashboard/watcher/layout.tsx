import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watcher - Tutor",
  description: "Monitor student activity and learning progress in real-time.",
};

export default function WatcherLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
