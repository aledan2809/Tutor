"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface EnrolledDomain {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  roles: string[];
  stats: {
    questionsAvailable: number;
    totalStudents: number;
    xp: number;
    level: string;
  };
}

interface AvailableDomain {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  questionsAvailable: number;
  totalStudents: number;
}

export default function DomainsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [enrolled, setEnrolled] = useState<EnrolledDomain[]>([]);
  const [available, setAvailable] = useState<AvailableDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const fetchDomains = () => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        setEnrolled(d.enrolled || []);
        setAvailable(d.available || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDomains(); }, []);

  const [enrollError, setEnrollError] = useState("");

  const handleEnroll = async (domainId: string) => {
    setEnrolling(domainId);
    setEnrollError("");
    try {
      const res = await fetch(`/api/student/domains/${domainId}`, { method: "POST" });
      if (res.ok) {
        fetchDomains();
      } else {
        const data = await res.json().catch(() => ({}));
        setEnrollError(data.error || t("domains.enrollFailed"));
      }
    } catch {
      setEnrollError(t("domains.networkError"));
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">{t("common.loading")}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-white">{t("domains.title")}</h1>
      {enrollError && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">{enrollError}</div>
      )}

      {/* Enrolled */}
      {enrolled.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t("domains.yourDomains")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {enrolled.map((d) => {
              const isAdmin = d.roles.includes("ADMIN");
              const isInstructor = d.roles.includes("INSTRUCTOR");
              return (
                <div key={d.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {d.icon && <span className="text-lg">{d.icon}</span>}
                    <h3 className="font-medium text-white">{d.name}</h3>
                    <div className="ml-auto flex gap-1">
                      {d.roles.map((r) => (
                        <span key={r} className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">{r}</span>
                      ))}
                    </div>
                  </div>
                  {d.description && <p className="mb-3 text-xs text-gray-400">{d.description}</p>}
                  <div className="mb-3 flex gap-4 text-xs text-gray-500">
                    <span>{d.stats.questionsAvailable} {t("domains.questions")}</span>
                    <span>{d.stats.level}</span>
                    <span>{d.stats.xp} XP</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/practice`)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      {t("domains.practice")}
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/exams`)}
                      className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
                    >
                      {t("domains.exams")}
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/bibliography?domain=${d.slug}`)}
                      className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
                    >
                      {t("domains.bibliography")}
                    </button>
                    {(isAdmin || isInstructor) && (
                      <button
                        onClick={() => router.push(`/dashboard/admin/questions?domain=${d.slug}`)}
                        className="rounded-lg bg-purple-600/20 border border-purple-600/50 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-600/30"
                      >
                        {t("domains.questionsCount", { n: d.stats.questionsAvailable })}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => router.push(`/dashboard/admin/domains/${d.id}`)}
                        className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-700"
                      >
                        {t("domains.editDomain")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available */}
      {available.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t("domains.availableDomains")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {available.map((d) => (
              <div key={d.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div className="mb-2 flex items-center gap-2">
                  {d.icon && <span className="text-lg">{d.icon}</span>}
                  <h3 className="font-medium text-white">{d.name}</h3>
                </div>
                {d.description && <p className="mb-3 text-xs text-gray-400">{d.description}</p>}
                <div className="mb-3 flex gap-4 text-xs text-gray-500">
                  <span>{d.questionsAvailable} {t("domains.questions")}</span>
                  <span>{d.totalStudents} {t("domains.students")}</span>
                </div>
                <button
                  onClick={() => handleEnroll(d.id)}
                  disabled={enrolling === d.id}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {enrolling === d.id ? t("domains.enrolling") : t("domains.enroll")}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {enrolled.length === 0 && available.length === 0 && (
        <div className="py-12 text-center text-gray-500">{t("domains.noDomains")}</div>
      )}
    </div>
  );
}
