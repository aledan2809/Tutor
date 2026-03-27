"use client";

import { useState } from "react";

export function SeedDemoButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/domain/aviation/seed-demo", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Seeding failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  }

  return (
    <div className="space-y-4">
      {!confirmed ? (
        <button
          onClick={() => setConfirmed(true)}
          className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-700"
        >
          Seed Aviation Demo Data
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={loading}
            className="rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Seeding..." : "Confirm — Seed Now"}
          </button>
          <button
            onClick={() => setConfirmed(false)}
            className="rounded-lg bg-gray-700 px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-800 bg-green-950 p-4">
          <h3 className="mb-2 font-semibold text-green-300">Seeding Complete</h3>
          <pre className="max-h-96 overflow-auto text-xs text-green-200">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
