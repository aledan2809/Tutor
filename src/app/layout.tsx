export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import { OfflineIndicator } from "@/components/offline-indicator";
import { UmamiScript } from "@aledan/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tutor - Adaptive Learning Platform",
    template: "%s | Tutor",
  },
  description: "Adaptive learning platform with spaced repetition, gamification, and exam simulation. Multi-domain education for aviation and more.",
  keywords: ["learning", "education", "adaptive learning", "spaced repetition", "aviation", "exam preparation", "tutoring"],
  authors: [{ name: "Tutor Platform" }],
  creator: "Tutor Platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://etutor.ro"),
  openGraph: {
    type: "website",
    title: "Tutor - Adaptive Learning Platform",
    description: "Adaptive learning platform with spaced repetition and gamification",
    siteName: "Tutor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tutor - Adaptive Learning Platform",
    description: "Adaptive learning platform",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.json",
  // iOS home-screen install (prerequisite for "Add to Home Screen" + web push on
  // iOS 16.4+). Without capable:true + a real apple-touch-icon, Safari (esp.
  // iOS 18 / iPhone 16) silently refuses to add the app.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tutor",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
        <UmamiScript websiteId="7cc3296f-5e08-49ad-adca-b161dc7400d0" />
      </body>
    </html>
  );
}
