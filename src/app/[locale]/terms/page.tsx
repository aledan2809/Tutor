import { getTranslations } from "next-intl/server";
import { getLegalDocument } from "@/lib/legal-doc";

export const metadata = {
  title: "Termeni și condiții",
  description: "Termenii și condițiile eTutor (etutor.ro).",
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [doc, t] = await Promise.all([
    getLegalDocument("tos", locale),
    getTranslations("legalPages"),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-white">{t("termsTitle")}</h1>

      {doc.ok ? (
        <>
          {doc.version && (
            <p className="mb-6 text-sm text-gray-500">{t("version", { v: doc.version })}</p>
          )}
          <div
            className="prose prose-invert prose-gray max-w-none space-y-4 text-gray-300"
            dangerouslySetInnerHTML={{ __html: doc.html }}
          />
        </>
      ) : (
        <div className="prose prose-invert prose-gray max-w-none space-y-4 text-gray-300">
          <p>{t("unavailable")}</p>
          <p>
            <a
              href="https://legal.knowbest.ro/terms/tutor"
              target="_blank"
              rel="noopener"
              className="text-blue-400 underline hover:text-blue-300"
            >
              legal.knowbest.ro/terms/tutor
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
