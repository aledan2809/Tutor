import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { consentLinkOwner } from "@/lib/parent-consent-server";
import { getLegalDocument } from "@/lib/legal-doc";
import { ParentConsentAnswer } from "@/components/consent/parent-consent-answer";
import { moneyFacts, stillMoving } from "@/lib/account-erasure";

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

/**
 * The page a parent opens from the consent email (no account needed). The text is the Legal Hub's
 * „Acordul părintelui” (PARENTAL_CONSENT), versioned there; the answer is recorded against the exact
 * version shown. Without the text there is nothing to agree to, so no buttons either.
 */
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
            ? "A fost folosit, a expirat sau l-a înlocuit unul mai nou. Deschide cel mai recent e-mail de la eTutor.ro."
            : "It was used, has expired, or a newer one replaced it. Open the most recent email from eTutor.ro."}
        </p>
      </Shell>
    );
  }

  const doc = await getLegalDocument("parental_consent", ro ? "ro" : "en");
  // The page has its own title; the document's heading would repeat it.
  const html = doc.html.replace(/^\s*<h1>[\s\S]*?<\/h1>\s*/, "");
  const who = child.name?.trim() || child.username || child.email || "";
  // A „no” on an account something was paid on is finished within 30 days, not at once: the parent is told before choosing.
  const money = await moneyFacts(userId as string);
  const paid = !!money && (money.payments > 0 || stillMoving(money));
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

      {doc.ok && doc.versionId ? (
        <>
          <div
            className="prose prose-sm prose-gray mt-4 max-h-[55vh] max-w-none overflow-y-auto rounded-lg border border-gray-200 p-4 dark:prose-invert dark:border-gray-700"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {ro ? "Toate detaliile, în " : "All the details are in the "}
            <Link href={`/${locale}/privacy`} className="text-blue-600 underline dark:text-blue-400">
              {ro ? "Politica de confidențialitate" : "Privacy policy"}
            </Link>
            .
          </p>
          <ParentConsentAnswer token={token} versionId={doc.versionId} locale={ro ? "ro" : "en"} paid={paid} />
        </>
      ) : (
        <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          {ro
            ? "Nu putem încărca acum textul acordului, așa că nu-ți putem cere încă răspunsul. Linkul rămâne valabil: încearcă din nou peste câteva minute."
            : "We can't load the consent text right now, so we can't ask for your answer yet. The link stays valid: please try again in a few minutes."}
        </p>
      )}
    </Shell>
  );
}
