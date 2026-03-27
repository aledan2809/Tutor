"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { SessionSelector } from "@/components/session/session-selector";

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
  const router = useRouter();
  const [data, setData] = useState<SessionNextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>("aviation");
  const [domains, setDomains] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        if (d.enrolled) {
          const list = d.enrolled.map((e: { slug: string; name: string }) => ({
            slug: e.slug,
            name: e.name,
          }));
          setDomains(list);
          if (list.length > 0 && !list.find((l: { slug: string }) => l.slug === selectedDomain)) {
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
      <h1 className="mb-6 text-2xl font-bold text-white">Practice</h1>

      {/* Domain selector */}
      {domains.length > 1 && (
        <div className="mb-6">
          <label className="mb-2 block text-sm text-gray-400">Domain</label>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            {domains.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : data ? (
        <SessionSelector
          availableTypes={data.availableTypes}
          recommended={data.recommended}
          stats={data.stats}
          onSelect={handleSelect}
          loading={starting}
        />
      ) : (
        <div className="py-12 text-center text-gray-500">
          Could not load session data.
        </div>
      )}
    </div>
  );
}
