"use client";

import { useState, useEffect } from "react";

interface Domain {
  id: string;
  name: string;
  slug: string;
}

export default function FromContentPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainId, setDomainId] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState(3);
  const [language, setLanguage] = useState<"ro" | "en">("ro");
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ generated: number; contentLength: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/domains")
      .then((r) => r.json())
      .then((d) => {
        const list = d.domains || d;
        if (Array.isArray(list)) {
          setDomains(list);
          if (list.length > 0) setDomainId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const meta = JSON.stringify({ domainId, subject, topic, count, difficulty, language });
    const formData = new FormData();
    formData.append("meta", meta);

    if (mode === "file" && file) {
      formData.append("file", file);
    } else if (mode === "paste" && textContent) {
      formData.append("content", textContent);
    } else {
      setError("Please provide a file or paste content");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/questions/from-content", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to generate questions");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Generate Questions from Content</h1>
        <p className="mt-1 text-sm text-gray-400">
          Upload theory material (PDF, DOCX, TXT) or paste text. AI will generate exam questions based on the content.
        </p>
      </div>

      {result && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-4">
          <p className="text-sm font-medium text-green-400">
            Generated {result.generated} questions from {Math.round(result.contentLength / 1000)}KB of content
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Questions saved as DRAFT — review and approve them in the Review Queue.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Domain */}
        <div>
          <label className="mb-1 block text-sm text-gray-400">Domain</label>
          <select
            value={domainId}
            onChange={(e) => setDomainId(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Subject + Topic */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              placeholder="e.g., Physics"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              placeholder="e.g., Electromagnetism"
            />
          </div>
        </div>

        {/* Count + Difficulty + Language */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Questions</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 10)}
              min={1}
              max={30}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Difficulty (1-5)</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>{d} — {["Trivial", "Easy", "Medium", "Hard", "Very Hard"][d - 1]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "ro" | "en")}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            >
              <option value="ro">Romanian</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Content input mode */}
        <div>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("file")}
              className={`rounded-lg px-3 py-1.5 text-sm ${mode === "file" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}
            >
              Upload file
            </button>
            <button
              type="button"
              onClick={() => setMode("paste")}
              className={`rounded-lg px-3 py-1.5 text-sm ${mode === "paste" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}
            >
              Paste text
            </button>
          </div>

          {mode === "file" ? (
            <div>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:text-white"
              />
              <p className="mt-1 text-xs text-gray-500">PDF, DOCX, TXT, or MD files</p>
            </div>
          ) : (
            <div>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                placeholder="Paste your theory/study material here..."
              />
              <p className="mt-1 text-xs text-gray-500">{textContent.length} characters</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Generating questions..." : `Generate ${count} questions from content`}
        </button>
      </form>
    </div>
  );
}
