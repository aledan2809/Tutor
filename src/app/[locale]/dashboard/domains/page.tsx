"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  SubjectAddonOffer,
  takePaidSubjectFromUrl,
  watchPaidSubject,
  type SubjectAddon,
} from "@/components/plan/subject-addon-offer";

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

  /** The lists again; answers the subjects the learner has (empty when they couldn't be read). */
  const fetchDomains = (): Promise<EnrolledDomain[]> =>
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        setEnrolled(d.enrolled || []);
        setAvailable(d.available || []);
        return (d.enrolled || []) as EnrolledDomain[];
      })
      .catch(() => [] as EnrolledDomain[])
      .finally(() => setLoading(false));

  useEffect(() => { void fetchDomains(); }, []);

  const [enrollError, setEnrollError] = useState("");
  // Past the subjects a card subscription pays for, a learner who pays for themselves gets the price of
  // one more and pays it on its own subscription; the subject is turned on when the payment is confirmed.
  const [addon, setAddon] = useState<SubjectAddon | null>(null);
  const [paidBack, setPaidBack] = useState<{ domainId: string | null } | null>(null);
  const [payment, setPayment] = useState<"waiting" | "late" | null>(null);
  useEffect(() => {
    const back = takePaidSubjectFromUrl();
    if (back) setPaidBack(back);
  }, []);
  useEffect(() => {
    if (!paidBack) return;
    setPayment("waiting");
    // Look again while the payment is confirmed, until the subject bought is among the learner's.
    return watchPaidSubject(
      async () => !!paidBack.domainId && (await fetchDomains()).some((d) => d.id === paidBack.domainId),
      (found) => setPayment(found || !paidBack.domainId ? null : "late"),
    );
  }, [paidBack]);

  // Access code → a private subject that is not (and must not be) in the catalog.
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinMsg(null);
    try {
      const res = await fetch("/api/domains/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });
      if (res.ok) {
        const data = await res.json();
        setJoinMsg({
          ok: true,
          text: t(data.alreadyEnrolled ? "domains.joinAlready" : "domains.joinSuccess", {
            name: data.domain?.name ?? "",
          }),
        });
        setJoinCode("");
        fetchDomains();
      } else {
        setJoinMsg({ ok: false, text: t("domains.joinInvalid") });
      }
    } catch {
      setJoinMsg({ ok: false, text: t("domains.networkError") });
    } finally {
      setJoining(false);
    }
  };

  const handleEnroll = async (domainId: string) => {
    setEnrolling(domainId);
    setEnrollError("");
    setAddon(null);
    try {
      const res = await fetch(`/api/student/domains/${domainId}`, { method: "POST" });
      if (res.ok) {
        fetchDomains();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 402 && data.code === "SUBJECT_ADDON" && data.quote) {
          setAddon({ domainId, name: available.find((d) => d.id === domainId)?.name ?? "", quote: data.quote });
        } else {
          setEnrollError(data.error || t("domains.enrollFailed"));
        }
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
      {payment === "waiting" && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 p-3 text-sm text-emerald-300">{t("subjectAddon.paidDomains")}</div>
      )}
      {payment === "late" && (
        <div className="rounded-lg border border-amber-800 bg-amber-900/20 p-3 text-sm text-amber-300">{t("subjectAddon.paidLate")}</div>
      )}
      {enrollError && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">{enrollError}</div>
      )}
      {addon && (
        <SubjectAddonOffer addon={addon} onClose={() => setAddon(null)} onError={(message) => setEnrollError(message ?? "")} />
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

      {/* Access code — the only self-service way into a private subject */}
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-1 text-lg font-semibold text-white">{t("domains.joinTitle")}</h2>
        <p className="mb-3 text-xs text-gray-400">{t("domains.joinHint")}</p>
        <form onSubmit={handleJoin} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder={t("domains.joinPlaceholder")}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-label={t("domains.joinTitle")}
            className="min-h-[44px] w-40 rounded-lg border border-gray-700 bg-gray-800 px-3 font-mono uppercase tracking-widest text-white focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={joining || !joinCode.trim()}
            className="min-h-[44px] rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {joining ? t("domains.joining") : t("domains.joinButton")}
          </button>
        </form>
        {joinMsg && (
          <p
            role="status"
            className={`mt-2 text-sm ${joinMsg.ok ? "text-green-400" : "text-red-400"}`}
          >
            {joinMsg.text}
          </p>
        )}
      </section>
    </div>
  );
}
