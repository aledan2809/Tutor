import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">
        {t("welcome", { name: session?.user?.name || "Learner" })}
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Domains */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            {t("yourDomains")}
          </h2>
          {session?.user?.enrollments?.length ? (
            <ul className="space-y-2">
              {session.user.enrollments.map((enrollment) => (
                <li
                  key={enrollment.domainId}
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3"
                >
                  <span className="text-sm text-gray-200">
                    {enrollment.domainSlug}
                  </span>
                  <div className="flex gap-1">
                    {enrollment.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">{t("noDomains")}</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            {t("recentActivity")}
          </h2>
          <p className="text-sm text-gray-500">No recent activity.</p>
        </div>

        {/* Quick Start */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            {t("quickStart")}
          </h2>
          <p className="text-sm text-gray-500">Start a practice session.</p>
        </div>
      </div>
    </div>
  );
}
