"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { SessionSelector } from "@/components/session/session-selector";
import { EXAM_LEVELS, classifyDomainSlug, stripLevelSuffix, type ExamLevel } from "@/lib/exam-level";

type DomainOpt = { slug: string; name: string; level: ExamLevel; count: number };

interface SessionNextResponse {
  recommended: {
    type: string;
    reason: string;
    label: string;
    duration: number;
    questionCount: number;
  };
  availableTypes: {
    type: string;
    label: string;
    duration: number;
    questionCount: number;
  }[];
  stats: {
    totalQuestions: number;
    topicsStudied: number;
    weakAreas: number;
  };
}

export default function PracticePage() {
  const t = useTranslations();
  const router = useRouter();
  const [data, setData] = useState<SessionNextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [domains, setDomains] = useState<DomainOpt[]>([]);

  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        if (d.enrolled) {
          // Only school-curriculum subjects with grile, grouped by exam level (non-curriculum
          // verticals like Aviation/Drept and empty subjects are hidden).
          const list: DomainOpt[] = (d.enrolled as { slug: string; name: string; stats?: { questionsAvailable?: number } }[])
            .map((e) => ({
              slug: e.slug,
              name: e.name,
              level: classifyDomainSlug(e.slug),
              count: e.stats?.questionsAvailable ?? 0,
            }))
            .filter((e): e is DomainOpt => e.level !== null && e.count > 0);
          setDomains(list);
          if (list.length > 0 && !list.find((l) => l.slug === selectedDomain)) {
            setSelectedDomain(list[0].slug);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDomain) return;
    setLoading(true);
    fetch(`/api/${selectedDomain}/session/next`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDomain]);

  const handleSelect = async (type: string) => {
    setStarting(true);
    try {
      const res = await fetch(`/api/${selectedDomain}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const session = await res.json();
      if (session.sessionId) {
        localStorage.setItem(
          `session_${session.sessionId}`,
          JSON.stringify({ ...session, domainSlug: selectedDomain })
        );
        router.push(`/dashboard/practice/${session.sessionId}`);
      }
    } catch {
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-white">{t("nav.practice")}</h1>

      {domains.length === 0 && !loading ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-center text-gray-400">
          {t("grile.noSubjects")}
        </div>
      ) : (
        <>
          {/* Subject selector — only the subjects in the student's package */}
          {domains.length > 1 && (
            <div className="mb-6">
              <label className="mb-2 block text-sm text-gray-400">{t("grile.subject")}</label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              >
                {EXAM_LEVELS.filter((lvl) => domains.some((d) => d.level === lvl.key)).map((lvl) => (
                  <optgroup key={lvl.key} label={lvl.label}>
                    {domains
                      .filter((d) => d.level === lvl.key)
                      .map((d) => (
                        <option key={d.slug} value={d.slug}>
                          {stripLevelSuffix(d.name)}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-500">{t("grile.loading")}</div>
          ) : data && data.stats.totalQuestions > 0 ? (
            <SessionSelector
              availableTypes={data.availableTypes}
              recommended={data.recommended}
              stats={data.stats}
              onSelect={handleSelect}
              loading={starting}
            />
          ) : data ? (
            <div className="py-12 text-center text-gray-500">{t("grile.noGrile")}</div>
          ) : (
            <div className="py-12 text-center text-gray-500">{t("grile.loadError")}</div>
          )}
        </>
      )}
    </div>
  );
}
