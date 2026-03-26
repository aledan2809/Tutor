export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tutor - Adaptive Learning Platform",
  description: "AI-driven adaptive learning platform",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
