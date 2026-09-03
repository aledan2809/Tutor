"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CurriculumChecklist } from "@/components/session/curriculum-checklist";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { SessionSelector } from "@/components/session/session-selector";
import { SprintCard, type SprintInfo } from "@/components/session/sprint-card";
import { EXAM_LEVELS, classifyDomainSlug, stripLevelSuffix, type ExamLevel } from "@/lib/exam-level";
import { canSeeRestrictedDomains } from "@/lib/domain-access";

type DomainOpt = { slug: string; name: string; level: ExamLevel | null; count: number };
type AvailOpt = { id: string; slug: string; name: string; level: ExamLevel | null; count: number };

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
  /** Present only on the aptitude domain — describes the next timed sprint. */
  sprint?: SprintInfo | null;
  stats: {
    totalQuestions: number;
    topicsStudied: number;
    weakAreas: number;
  };
}

export default function PracticePage() {
  const t = useTranslations();
  const tCur = useTranslations("curriculum");
  const router = useRouter();
  const [data, setData] = useState<SessionNextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [curriculumSetupNeeded, setCurriculumSetupNeeded] = useState(false);
  const [gateReason, setGateReason] = useState<"setup" | "empty" | null>(null);
  const [domains, setDomains] = useState<DomainOpt[]>([]);
  // A1: when the student has no practiceable subject, offer the catalog inline so
  // they pick + start on the spot instead of being sent "to your account".
  const [available, setAvailable] = useState<AvailOpt[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [pendingStart, setPendingStart] = useState(false);

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
        // Catalog of subjects the student could pick (same curriculum/allowed gate).
        const avail: AvailOpt[] = Array.isArray(d?.available)
          ? (d.available as { id: string; slug: string; name: string; questionsAvailable?: number }[])
              .map((e) => ({
                id: e.id,
                slug: e.slug,
                name: e.name,
                level: classifyDomainSlug(e.slug),
                count: e.questionsAvailable ?? 0,
              }))
              .filter((e) => e.count > 0 && (e.level !== null || canSeeRestricted))
          : [];
        setAvailable(avail);
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
    // Semnalul de "deschide checklistul" e al domeniului care a dat 409 — nu-l
    // purtăm peste alt domeniu din dropdown (finding review).
    setCurriculumSetupNeeded(false);
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
      // The sprint route refuses to start a new run while the previous one's
      // mandatory debrief is outstanding — send the student there instead.
      if (res.status === 409 && session.pendingFeedbackSessionId) {
        goToSprintFeedback(session.pendingFeedbackSessionId);
        return;
      }
      // Curriculum gate: the start route refuses until the two-row checklist
      // (programa parcursă) is filled in — open it instead of starting.
      if (res.status === 409 && (session.needsCurriculumSetup || session.emptyBecauseCurriculum)) {
        // Say WHY. The checklist used to just appear: the session did not start and
        // nothing explained that it could not, which reads as the app being broken.
        setGateReason(session.needsCurriculumSetup ? "setup" : "empty");
        setCurriculumSetupNeeded(true);
        setStarting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (session.sessionId) {
        localStorage.setItem(
          `session_${session.sessionId}`,
          JSON.stringify({ ...session, domainSlug: selectedDomain })
        );
        router.push(`/dashboard/practice/${session.sessionId}`);
      } else {
        setStarting(false);
      }
    } catch {
      setStarting(false);
    }
  };

  const goToSprintFeedback = (pendingSessionId: string) => {
    router.push(`/dashboard/practice/${pendingSessionId}?feedback=1`);
  };

  // A1: enroll in a picked subject + start practicing immediately (one tap → question).
  const enrollAndStart = async (dom: AvailOpt) => {
    if (enrolling) return;
    setEnrolling(dom.id);
    try {
      const res = await fetch(`/api/student/domains/${dom.id}`, { method: "POST" });
      // 201 created / 200 reactivated / 409 already-enrolled → all fine to proceed.
      if (res.ok || res.status === 409) {
        setDomains((prev) =>
          prev.some((p) => p.slug === dom.slug)
            ? prev
            : [...prev, { slug: dom.slug, name: dom.name, level: dom.level, count: dom.count }]
        );
        setSelectedDomain(dom.slug); // triggers the session/next fetch
        setPendingStart(true); // auto-start once that data is ready
      } else {
        setEnrolling(null);
      }
    } catch {
      setEnrolling(null);
    }
  };

  // Auto-start the recommended session right after a subject is picked.
  useEffect(() => {
    if (!pendingStart || starting) return;
    if (!data || !selectedDomain) return;
    if (data.stats.totalQuestions === 0) {
      // Nothing to start (shouldn't happen — catalog is filtered to count>0).
      setPendingStart(false);
      setEnrolling(null);
      return;
    }
    setPendingStart(false);
    handleSelect(data.recommended?.type ?? data.availableTypes[0]?.type ?? "quick");
  }, [pendingStart, data, selectedDomain, starting]); // eslint-disable-line react-hooks/exhaustive-deps

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
        available.length > 0 ? (
          <div>
            <p className="mb-4 text-gray-300">{t("grile.pickToStart")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {available.map((dom) => (
                <button
                  key={dom.id}
                  onClick={() => enrollAndStart(dom)}
                  disabled={enrolling !== null}
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-4 text-left transition-colors hover:border-blue-500 hover:bg-gray-800/70 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div>
                    <p className="font-medium text-white">{stripLevelSuffix(dom.name)}</p>
                    <p className="text-xs text-gray-400">
                      {dom.count} {t("grile.questionsLabel")}
                    </p>
                  </div>
                  <span className="text-lg text-blue-400">
                    {enrolling === dom.id ? "…" : "→"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-center text-gray-400">
            {t("grile.noSubjects")}
          </div>
        )
      ) : (
        <>
          {/* Subject selector — only the subjects in the student's package */}
          {domains.length > 1 && (
            <div className="mb-6">
              <label htmlFor="practice-subject" className="mb-2 block text-sm text-gray-400">{t("grile.subject")}</label>
              <select
                id="practice-subject"
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

          {/* Programa parcursă — checklistul celor două rânduri; obligatoriu
              înaintea primei sesiuni pe domeniile cu programă (EN VIII / BAC). */}
          {/* Above the checklist, not inside it: the checklist renders null until it
              has state, so a message placed inside would be invisible exactly when
              it is needed. */}
          {gateReason && (
            <div
              role="status"
              className="mb-3 rounded-lg border border-amber-800 bg-amber-950/20 px-3 py-2 text-sm text-amber-200"
            >
              {tCur(gateReason === "setup" ? "gateSetup" : "gateEmpty")}
            </div>
          )}

          {selectedDomain && (
            <CurriculumChecklist
              key={selectedDomain}
              domainSlug={selectedDomain}
              forceOpen={curriculumSetupNeeded}
              onSaved={() => {
                setCurriculumSetupNeeded(false);
                setGateReason(null);
              }}
            />
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-500">{t("grile.loading")}</div>
          ) : (
            <>
              {/* The sprint generates its own questions, so it stays available
                  even when the ordinary bank for this subject is empty — it is
                  deliberately outside the totalQuestions gate below. */}
              {data?.sprint && (
                <SprintCard
                  sprint={data.sprint}
                  onStart={() => handleSelect("sprint")}
                  onResolveFeedback={goToSprintFeedback}
                  loading={starting}
                />
              )}
              {data && data.stats.totalQuestions > 0 ? (
              <SessionSelector
                availableTypes={data.availableTypes.filter((t) => t.type !== "sprint")}
                recommended={data.recommended}
                stats={data.stats}
                onSelect={handleSelect}
                loading={starting}
              />
              ) : data ? (
                !data.sprint && (
                  <div className="py-12 text-center text-gray-500">{t("grile.noGrile")}</div>
                )
              ) : (
                <div className="py-12 text-center text-gray-500">{t("grile.loadError")}</div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
