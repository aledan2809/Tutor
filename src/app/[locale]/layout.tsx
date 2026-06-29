import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { SessionProvider } from "@/components/session-provider";
import WhatsAppCta from "@/components/WhatsAppCta";
import GoogleOneTap from "@/components/GoogleOneTap";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { PolicyFooter } from "@/components/PolicyFooter";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`../../messages/${locale}.json`)).default;

  // Suppress the minimal policy-footer on the marketing landing (it has its own
  // rich footer). x-pathname is set by middleware.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLanding = pathname.replace(/^\/(en|ro)/, "").replace(/\/$/, "") === "";

  return (
    <SessionProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
        {!isLanding && <PolicyFooter locale={locale} />}
        <WhatsAppCta />
        <GoogleOneTap clientId={process.env.AUTH_GOOGLE_ID} />
        <CookieConsentBanner />
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
