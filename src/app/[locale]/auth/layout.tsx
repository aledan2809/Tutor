import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Tutor",
  description:
    "Sign in to Tutor to access your personalized adaptive learning dashboard. Use Google or email magic link.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
