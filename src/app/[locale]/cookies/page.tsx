import { getTranslations } from "next-intl/server";
import { getLegalDocument } from "@/lib/legal-doc";

export const metadata = {
  title: "Politica de cookie-uri · eTutor",
  description: "Politica de cookie-uri eTutor (etutor.ro).",
};

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [doc, t] = await Promise.all([
    getLegalDocument("cookies", locale),
    getTranslations("legalPages"),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-white">{t("cookiesTitle")}</h1>

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
              href="https://legal.knowbest.ro/cookies/tutor"
              target="_blank"
              rel="noopener"
              className="text-blue-400 underline hover:text-blue-300"
            >
              legal.knowbest.ro/cookies/tutor
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
