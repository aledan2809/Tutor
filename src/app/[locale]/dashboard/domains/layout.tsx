import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Domains - Tutor",
  description: "Explore available learning domains and manage your enrollments.",
};

export default function DomainsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
