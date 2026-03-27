"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

interface Props {
  domains: { id: string; name: string }[];
}

export function AIGenerateForm({ domains }: Props) {
  const router = useRouter();
  const [domainId, setDomainId] = useState(domains[0]?.id || "");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState(3);
  const [type, setType] = useState<"MULTIPLE_CHOICE" | "OPEN">("MULTIPLE_CHOICE");
  const [language, setLanguage] = useState<"en" | "ro">("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ generated: number; provider: string; model: string } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/questions/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, subject, topic, count, difficulty, type, language }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }

      setResult(data);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="rounded-lg border border-blue-800/50 bg-blue-900/10 p-4 text-sm text-blue-300">
        AI-generated questions will be saved as <strong>drafts</strong> and appear in the
        review queue for approval.
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-3 text-sm text-green-400">
          Generated {result.generated} questions via {result.provider} ({result.model}).
          <Link href="/dashboard/admin/questions/review" className="ml-2 underline">
            Review now
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Domain</label>
          <select
            value={domainId}
            onChange={(e) => setDomainId(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            required
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Question Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "MULTIPLE_CHOICE" | "OPEN")}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="OPEN">Open Question</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Aviation Safety"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Emergency Procedures"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Number of Questions</label>
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Difficulty (1-5)</label>
          <input
            type="range"
            min={1}
            max={5}
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1</span>
            <span className="text-white font-medium">{difficulty}</span>
            <span>5</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en" | "ro")}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="en">English</option>
            <option value="ro">Romanian</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Questions"}
      </button>
    </form>
  );
}
