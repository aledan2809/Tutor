export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tutor - Adaptive Learning Platform",
    template: "%s | Tutor",
  },
  description: "AI-driven adaptive learning platform with spaced repetition, gamification, and exam simulation. Multi-domain education for aviation and more.",
  keywords: ["learning", "education", "adaptive learning", "spaced repetition", "aviation", "exam preparation", "tutoring"],
  authors: [{ name: "Tutor Platform" }],
  creator: "Tutor Platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://tutor.knowbest.ro"),
  openGraph: {
    type: "website",
    title: "Tutor - Adaptive Learning Platform",
    description: "AI-driven adaptive learning platform with spaced repetition and gamification",
    siteName: "Tutor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tutor - Adaptive Learning Platform",
    description: "AI-driven adaptive learning platform",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <OfflineIndicator />
        {children}
        <PwaRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
