import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { consentLinkOwner } from "@/lib/parent-consent-server";
import { ParentConsentAnswer } from "@/components/consent/parent-consent-answer";

export const metadata: Metadata = { title: "Acordul părintelui", robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-8">
        {children}
      </div>
    </main>
  );
}

/** The page a parent opens from the consent email (no account needed). */
export default async function ParentConsentPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  const ro = locale !== "en";
  const userId = await consentLinkOwner(token);
  const child = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, username: true } })
    : null;

  if (!child) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{ro ? "Linkul nu mai e valid" : "This link is no longer valid"}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {ro
            ? "A fost deja folosit sau a expirat. Copilul îți poate trimite altul din contul lui de pe eTutor.ro."
            : "It was already used or has expired. Your child can send you a new one from their eTutor.ro account."}
        </p>
      </Shell>
    );
  }

  const who = child.name?.trim() || child.username || child.email || "";
  return (
    <Shell>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{ro ? "Acordul părintelui" : "A parent's consent"}</h1>
      <p className="mt-3 text-gray-700 dark:text-gray-300">
        {ro ? (
          <>
            <strong>{who}</strong>
            {child.email || child.username ? ` (${child.email ?? child.username})` : ""} și-a făcut cont pe eTutor.ro și a dat
            adresa ta ca părinte. Sub 16 ani, legea cere acordul unui părinte.
          </>
        ) : (
          <>
            <strong>{who}</strong>
            {child.email || child.username ? ` (${child.email ?? child.username})` : ""} made an account on eTutor.ro and gave
            your address as a parent&apos;s. Under 16, the law asks for a parent&apos;s consent.
          </>
        )}
      </p>
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-gray-600 dark:text-gray-400">
        {ro ? (
          <>
            <li>Folosim numele, emailul și ce lucrează pe platformă, ca să-i dăm exercițiile potrivite și să-i arătăm progresul.</li>
            <li>Copilului nu-i arătăm prețuri și nu-i trimitem oferte.</li>
            <li>Poți retrage acordul oricând, scriindu-ne; contul se oprește atunci.</li>
          </>
        ) : (
          <>
            <li>We use the name, the email and what they practise, to give them the right exercises and show their progress.</li>
            <li>We show your child no prices and send them no offers.</li>
            <li>You can withdraw your consent at any time by writing to us; the account then stops.</li>
          </>
        )}
      </ul>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        {ro ? "Detalii în " : "Details in the "}
        <Link href={`/${locale}/privacy`} className="text-blue-600 underline dark:text-blue-400">
          {ro ? "Politica de confidențialitate" : "Privacy policy"}
        </Link>
        .
      </p>
      <ParentConsentAnswer token={token} locale={ro ? "ro" : "en"} />
    </Shell>
  );
}
