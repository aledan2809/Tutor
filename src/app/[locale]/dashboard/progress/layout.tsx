import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress",
  description: "Track your learning progress, accuracy trends, and subject mastery across all enrolled domains.",
};

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
