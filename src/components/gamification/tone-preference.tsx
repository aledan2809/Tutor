"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { REMARK_TONES, type RemarkTone } from "@/lib/remarks";

/**
 * Student-facing picker for the encouragement tone shown after answers.
 * A parent restriction (set elsewhere) can still clamp `playful` at display time.
 */
export function TonePreference() {
  const t = useTranslations("remarks");
  const [tone, setTone] = useState<RemarkTone | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/student/remarks")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTone((d?.studentTone as RemarkTone) ?? "encouraging"))
      .catch(() => setTone("encouraging"));
  }, []);

  const choose = async (next: RemarkTone) => {
    setTone(next);
    setSaving(true);
    try {
      await fetch("/api/student/remarks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: next }),
      });
    } catch {
      /* best-effort */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">{t("toneHint")}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {REMARK_TONES.map((opt) => {
          const active = tone === opt;
          const label = opt === "neutral" ? t("toneNeutral") : opt === "encouraging" ? t("toneEncouraging") : t("tonePlayful");
          const desc = opt === "neutral" ? t("toneNeutralDesc") : opt === "encouraging" ? t("toneEncouragingDesc") : t("tonePlayfulDesc");
          return (
            <button
              key={opt}
              type="button"
              onClick={() => choose(opt)}
              disabled={saving}
              aria-pressed={active}
              className={`rounded-lg border p-3 text-left transition-colors disabled:opacity-60 ${
                active
                  ? "border-blue-500 bg-blue-600/10"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
