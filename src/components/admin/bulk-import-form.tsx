"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  domains: { id: string; name: string }[];
}

export function BulkImportForm({ domains }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [domainId, setDomainId] = useState(domains[0]?.id || "");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; total: number; fromImage?: boolean } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("domainId", domainId);
    formData.append("subject", subject);
    formData.append("topic", topic);
    formData.append("difficulty", difficulty.toString());

    try {
      const res = await fetch("/api/admin/questions/bulk-import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
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
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-3 text-sm text-green-400">
          {result.fromImage
            ? `${result.imported} questions extracted from image, saved as DRAFT for review.`
            : `Successfully imported ${result.imported} of ${result.total} questions.`}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-gray-400">File (PDF, DOCX, CSV, or Image)</label>
        <input
          type="file"
          accept=".pdf,.docx,.csv,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:text-white"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          CSV format: content,correctAnswer,options (pipe-separated). PDF/DOCX: numbered questions. Images: OCR + AI extraction.
        </p>
      </div>

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
          <label className="mb-1 block text-sm text-gray-400">Difficulty (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
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
      </div>

      <button
        type="submit"
        disabled={loading || !file}
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Importing..." : "Import Questions"}
      </button>
    </form>
  );
}
