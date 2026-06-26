"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Parent control: restrict a child to the calmer encouragement tones (disables the
 * upbeat "playful" tone). Written to the child's `toneRestriction` setting via a
 * guardian-only endpoint.
 */
export function ChildToneControl({ childId }: { childId: string }) {
  const t = useTranslations("remarks");
  const [restrict, setRestrict] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/family/${childId}/tone`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRestrict(d?.restrictPlayful === true))
      .catch(() => setRestrict(false));
  }, [childId]);

  const toggle = async () => {
    if (restrict === null || busy) return;
    const next = !restrict;
    setRestrict(next);
    setBusy(true);
    try {
      await fetch(`/api/family/${childId}/tone`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restrictPlayful: next }),
      });
    } catch {
      setRestrict(!next); // revert on failure
    } finally {
      setBusy(false);
    }
  };

  if (restrict === null) return null;

  return (
    <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-gray-400">
      <input type="checkbox" checked={restrict} onChange={toggle} disabled={busy} className="accent-blue-600" />
      <span>
        <span className="text-gray-300">{t("parentRestrict")}</span> — {t("parentRestrictHint")}
      </span>
    </label>
  );
}
