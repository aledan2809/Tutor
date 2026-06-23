import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ro"],
  defaultLocale: "ro",
  // RO-first product: don't auto-switch to EN from the browser's Accept-Language
  // (that produced the RO-landing-but-EN-locale mismatch). Default is always RO;
  // EN is opt-in via the language switcher (persisted in the NEXT_LOCALE cookie).
  localeDetection: false,
});
