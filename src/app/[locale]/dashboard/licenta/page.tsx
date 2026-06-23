"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { LICENTA_DOMAIN_SLUG } from "@/lib/licenta-constants";

interface Doc {
  id: string;
  title: string;
  fileType: string;
  status: string;
  totalPassages: number;
  processedPassages: number;
  questionCount: number;
  createdAt: string;
}

interface Progress {
  id: string;
  processed: number;
  total: number;
  questions: number;
}

export default function LicentaPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocs = async () => {
    const r = await fetch("/api/licenta");
    if (r.status === 403) {
      setForbidden(true);
      return;
    }
    if (r.ok) {
      const d = await r.json();
      setDocs(d.docs ?? []);
    }
  };

  useEffect(() => {
    loadDocs().finally(() => setLoading(false));
  }, []);

  const runGeneration = async (id: string, total: number) => {
    setBusyId(id);
    setError(null);
    try {
      let done = false;
      let last = -1;
      while (!done) {
        const r = await fetch(`/api/licenta/${id}/generate`, { method: "POST" });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          setError(e.error || "Eroare la generare.");
          break;
        }
        const d = await r.json();
        setProgress({ id, processed: d.processed, total: d.total ?? total, questions: d.questionCount });
        done = d.done;
        // No-progress guard: if a batch neither advances nor finishes, stop
        // rather than loop forever (defense in depth against a server regression).
        if (!done && d.processed <= last) {
          setError("Generarea s-a oprit (fără progres). Reîncearcă.");
          break;
        }
        last = d.processed;
      }
    } finally {
      setBusyId(null);
      setProgress(null);
      await loadDocs();
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      const r = await fetch("/api/licenta", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error || "Încărcarea a eșuat.");
        return;
      }
      setTitle("");
      setFile(null);
      await loadDocs();
      await runGeneration(d.id, d.totalPassages);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p className="text-gray-500">Se încarcă…</p>;
  if (forbidden) {
    return <p className="text-gray-400">Această secțiune este privată.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-white">Licență</h1>
      <p className="mb-6 text-sm text-gray-400">
        Încarcă documentul licenței. Generez grile (întrebări cu variante) din tot documentul, ca să îl știi
        exact. Apoi exersezi la „Practică”.
      </p>

      {/* Upload */}
      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-lg font-semibold text-white">Încarcă document</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titlu (opțional — implicit numele fișierului)"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
          />
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
          />
          <p className="text-xs text-gray-500">Acceptat: PDF, DOCX, TXT (max 25 MB).</p>
          <button
            onClick={handleUpload}
            disabled={!file || uploading || busyId !== null}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {uploading ? "Se încarcă…" : "Încarcă și generează grile"}
          </button>
          {progress && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-gray-400">
                <span>
                  Generez grile… {progress.processed}/{progress.total} secțiuni
                </span>
                <span>{progress.questions} întrebări</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${progress.total ? (progress.processed / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      {/* Materials */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Materiale</h2>
        <Link
          href={`/dashboard/practice?start=quick&domain=${LICENTA_DOMAIN_SLUG}`}
          className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-blue-400 hover:bg-gray-800"
        >
          Practică grilele →
        </Link>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-gray-500">Niciun material încă. Încarcă documentul licenței mai sus.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const pct = doc.totalPassages
              ? Math.round((doc.processedPassages / doc.totalPassages) * 100)
              : 0;
            const isBusy = busyId === doc.id;
            return (
              <div key={doc.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{doc.title}</p>
                    <p className="text-xs text-gray-500">
                      {doc.fileType.toUpperCase()} · {doc.questionCount} întrebări ·{" "}
                      {doc.status === "ready" ? "gata" : doc.status === "error" ? "eroare" : `${pct}%`}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {doc.status !== "ready" && doc.processedPassages < doc.totalPassages && (
                      <button
                        onClick={() => runGeneration(doc.id, doc.totalPassages)}
                        disabled={busyId !== null}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isBusy ? "Generez…" : "Continuă"}
                      </button>
                    )}
                  </div>
                </div>
                {doc.status !== "ready" && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
