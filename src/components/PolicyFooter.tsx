import Link from "next/link";

// Minimal, always-reachable policy links for internal pages (dashboard, auth,
// pricing, etc.). The marketing landing has its own rich footer, so this strip is
// suppressed there (see [locale]/layout.tsx). Closes the gap where a user who
// already dismissed the cookie banner had no way to reach the policies.

const LABELS = {
  ro: { privacy: "Confidențialitate", terms: "Termeni", cookies: "Cookie-uri" },
  en: { privacy: "Privacy", terms: "Terms", cookies: "Cookies" },
} as const;

export function PolicyFooter({ locale }: { locale: string }) {
  const L = LABELS[locale === "en" ? "en" : "ro"];
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-4">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-xs text-gray-500">
        <Link href="/privacy" className="hover:text-gray-300">{L.privacy}</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className="hover:text-gray-300">{L.terms}</Link>
        <span aria-hidden="true">·</span>
        <Link href="/cookies" className="hover:text-gray-300">{L.cookies}</Link>
      </nav>
    </footer>
  );
}
