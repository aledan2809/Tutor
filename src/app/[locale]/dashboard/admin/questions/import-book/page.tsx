"use client";

import { useState, useEffect } from "react";

interface Domain { id: string; name: string; slug: string; }

export default function ImportScannedBookPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainId, setDomainId] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; total: number; fromScannedPDF?: boolean; fromImage?: boolean; ocrPages?: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/domains")
      .then(r => r.json())
      .then(d => {
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
    if (!file || !domainId) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("domainId", domainId);
    if (subject) formData.append("subject", subject);
    if (topic) formData.append("topic", topic);
    formData.append("difficulty", String(difficulty));

    try {
      const res = await fetch("/api/admin/questions/bulk-import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Import failed");
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
        <h1 className="text-2xl font-bold text-white">Import Scanned Book</h1>
        <p className="mt-1 text-sm text-gray-400">
          Upload a scanned PDF (printed pages, not text-selectable), a DOCX, CSV, or image with quiz questions.
          The system auto-detects the format, runs OCR if needed, AI-structures questions, and saves with{" "}
          <span className="text-amber-400">bookOrder</span> preserved for correct display sequence.
        </p>
      </div>

      {result && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-4">
          <p className="text-sm font-medium text-green-400">
            Imported {result.imported} / {result.total} questions
          </p>
          <ul className="mt-2 text-xs text-gray-400 space-y-0.5">
            {result.fromScannedPDF && <li>✓ Scanned PDF processed via OCR ({result.ocrPages || "?"} pages)</li>}
            {result.fromImage && <li>✓ Image processed via 2-step AI Vision</li>}
            <li>✓ Saved as DRAFT — review in Review Queue</li>
            <li>✓ bookOrder + qNumberInBook fields populated</li>
          </ul>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Domain *</label>
          <select value={domainId} onChange={(e) => setDomainId(e.target.value)} required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Subject (fallback)</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              placeholder="e.g., Drept Penal" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Topic (fallback)</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
              placeholder="e.g., Partea Generală" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Default Difficulty (1-5)</label>
          <select value={difficulty} onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
            {[1, 2, 3, 4, 5].map(d => (
              <option key={d} value={d}>{d} — {["Trivial", "Easy", "Medium", "Hard", "Very Hard"][d - 1]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">File *</label>
          <input type="file" accept=".pdf,.docx,.csv,.png,.jpg,.jpeg,.jfif,.webp,.bmp,.tiff"
            onChange={(e) => setFile(e.target.files?.[0] || null)} required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:text-white" />
          <p className="mt-1 text-xs text-gray-500">
            PDF (scanned or text), DOCX, CSV, or single image page.
          </p>
        </div>

        <button type="submit" disabled={loading || !file || !domainId}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
          {loading ? "Processing (OCR + AI — may take several minutes)..." : "Import Book"}
        </button>
      </form>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-xs text-gray-500">
        <p className="font-medium text-gray-400">How it works:</p>
        <ol className="mt-2 ml-4 space-y-1 list-decimal">
          <li>File is saved to <code>uploads/</code> for reprocessing safety</li>
          <li>PDF → parsed as text; if <strong>&lt; 200 chars</strong> extracted, flagged as <strong>scanned</strong></li>
          <li>Scanned PDF → sent to OCR service (4uPDF) for full-page transcription</li>
          <li>OCR text → AI structures questions with Q number + page from book</li>
          <li>Questions saved as <strong>DRAFT</strong> with <code>bookOrder</code>, <code>pdfPage</code>, <code>bookPage</code>, <code>qNumberInBook</code></li>
          <li>Instructor reviews in Review Queue, corrects pages if needed</li>
        </ol>
      </div>
    </div>
  );
}
