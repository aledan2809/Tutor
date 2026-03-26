import { useTranslations } from "next-intl";

export default function VerifyPage() {
  const t = useTranslations("auth");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-white">
          {t("checkEmail")}
        </h2>
        <p className="text-sm text-gray-400">{t("checkEmailDescription")}</p>
      </div>
    </div>
  );
}
