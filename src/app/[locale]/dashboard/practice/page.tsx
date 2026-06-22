"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { SessionSelector } from "@/components/session/session-selector";
import { EXAM_LEVELS, classifyDomainSlug, stripLevelSuffix, type ExamLevel } from "@/lib/exam-level";
import { canSeeRestrictedDomains } from "@/lib/domain-access";

type DomainOpt = { slug: string; name: string; level: ExamLevel | null; count: number };

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

  const { data: session, status } = useSession();
  // Admins/superadmins + allowlisted users may practice non-curriculum domains.
  const canSeeRestricted = canSeeRestrictedDomains(session?.user);

  // Deep-link from a reminder: ?start=<sessionType>&domain=<slug> auto-starts.
  const [autoStartType, setAutoStartType] = useState<string | null>(null);
  const [autoStartDomain, setAutoStartDomain] = useState<string | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get("start");
    if (s) {
      setAutoStartType(s);
      setAutoStartDomain(p.get("domain"));
    }
  }, []);

  // Honour the deep-link's target subject once domains are loaded.
  useEffect(() => {
    if (autoStartDomain && domains.some((d) => d.slug === autoStartDomain)) {
      setSelectedDomain(autoStartDomain);
    }
  }, [autoStartDomain, domains]);

  useEffect(() => {
    // Wait until the session resolves so the restricted-domain gate is known.
    if (status === "loading") return;
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        const list: DomainOpt[] = Array.isArray(d?.enrolled)
          ? (d.enrolled as { slug: string; name: string; stats?: { questionsAvailable?: number } }[])
              .map((e) => ({
                slug: e.slug,
                name: e.name,
                level: classifyDomainSlug(e.slug),
                count: e.stats?.questionsAvailable ?? 0,
              }))
              // School-curriculum subjects (grouped by exam level) always; non-curriculum
              // verticals (level null, e.g. aviation) only for allowed users.
              .filter((e) => e.count > 0 && (e.level !== null || canSeeRestricted))
          : [];
        setDomains(list);
        if (list.length > 0) {
          if (!list.find((l) => l.slug === selectedDomain)) {
            setSelectedDomain(list[0].slug);
          }
          // When a domain is selected, the session/next effect manages `loading`.
        } else {
          // No practiceable subject (e.g. only non-curriculum/empty enrollments) →
          // stop the spinner so the "no subjects" message shows instead of hanging.
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    // canSeeRestricted derives from the session, which is stable once status resolves.
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Fire the deep-linked autostart once the target domain's session data is ready.
  useEffect(() => {
    if (autoStarted || !autoStartType || starting) return;
    if (!data || data.stats.totalQuestions === 0 || !selectedDomain) return;
    if (autoStartDomain && selectedDomain !== autoStartDomain) return;
    setAutoStarted(true);
    handleSelect(autoStartType);
  }, [autoStarted, autoStartType, autoStartDomain, data, selectedDomain, starting]); // eslint-disable-line react-hooks/exhaustive-deps

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
                {/* Non-curriculum domains (level null, e.g. aviation) — only present for allowed users. */}
                {domains.some((d) => d.level === null) && (
                  <optgroup label={t("grile.otherSubjects")}>
                    {domains
                      .filter((d) => d.level === null)
                      .map((d) => (
                        <option key={d.slug} value={d.slug}>
                          {d.name}
                        </option>
                      ))}
                  </optgroup>
                )}
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
