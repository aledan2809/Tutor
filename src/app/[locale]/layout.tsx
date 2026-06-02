import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SessionProvider } from "@/components/session-provider";
import WhatsAppCta from "@/components/WhatsAppCta";
import GoogleOneTap from "@/components/GoogleOneTap";

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

  return (
    <SessionProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
        <WhatsAppCta />
        <GoogleOneTap clientId={process.env.AUTH_GOOGLE_ID} />
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
