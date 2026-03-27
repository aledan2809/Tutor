"use client";

import { useState, useEffect } from "react";

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

  const handleEnroll = async (domainId: string) => {
    setEnrolling(domainId);
    try {
      const res = await fetch(`/api/student/domains/${domainId}`, { method: "POST" });
      if (res.ok) {
        fetchDomains();
      }
    } catch {
      // ignore
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-white">Domains</h1>

      {/* Enrolled */}
      {enrolled.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">Your Domains</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {enrolled.map((d) => (
              <div key={d.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div className="mb-2 flex items-center gap-2">
                  {d.icon && <span className="text-lg">{d.icon}</span>}
                  <h3 className="font-medium text-white">{d.name}</h3>
                </div>
                {d.description && <p className="mb-3 text-xs text-gray-400">{d.description}</p>}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{d.stats.questionsAvailable} questions</span>
                  <span>{d.stats.level}</span>
                  <span>{d.stats.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available */}
      {available.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">Available Domains</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {available.map((d) => (
              <div key={d.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div className="mb-2 flex items-center gap-2">
                  {d.icon && <span className="text-lg">{d.icon}</span>}
                  <h3 className="font-medium text-white">{d.name}</h3>
                </div>
                {d.description && <p className="mb-3 text-xs text-gray-400">{d.description}</p>}
                <div className="mb-3 flex gap-4 text-xs text-gray-500">
                  <span>{d.questionsAvailable} questions</span>
                  <span>{d.totalStudents} students</span>
                </div>
                <button
                  onClick={() => handleEnroll(d.id)}
                  disabled={enrolling === d.id}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {enrolling === d.id ? "Enrolling..." : "Enroll"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {enrolled.length === 0 && available.length === 0 && (
        <div className="py-12 text-center text-gray-500">No domains available.</div>
      )}
    </div>
  );
}
