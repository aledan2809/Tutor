"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type SubjectRow = {
  domainId: string;
  name: string;
  slug: string;
  icon: string | null;
  managedElsewhere: boolean;
  setBy: "child" | "you" | "guardian";
  setByName: string | null;
};
type Available = { id: string; name: string; slug: string; icon: string | null };

/**
 * The child's subjects on the parent's page: the parent adds or removes them, and what they decide
 * stays that way (the child can't add back a subject the parent removed). See
 * /api/dashboard/watcher/[id]/subjects.
 */
export function SubjectManager({ childId, onChange }: { childId: string; onChange?: () => void }) {
  const t = useTranslations("watcher.subjectManager");
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [removed, setRemoved] = useState<SubjectRow[]>([]);
  const [available, setAvailable] = useState<Available[]>([]);
  const [pick, setPick] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = `/api/dashboard/watcher/${childId}/subjects`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(api);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setSubjects(d.subjects ?? []);
      setRemoved(d.removed ?? []);
      setAvailable(d.available ?? []);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (init: RequestInit, url = api) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error ?? t("saveError"));
      } else {
        onChange?.();
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const add = (domainId: string) =>
    act({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domainId }) });
  const remove = (s: SubjectRow) => {
    if (!window.confirm(t("confirmRemove", { name: s.name }))) return;
    void act({ method: "DELETE" }, `${api}?domainId=${encodeURIComponent(s.domainId)}`);
  };

  const origin = (s: SubjectRow) =>
    s.setBy === "you"
      ? t("originYou")
      : s.setBy === "guardian"
        ? t("originGuardian", { name: s.setByName?.trim() || t("otherAdult") })
        : t("originChild");

  if (loading) return <p className="text-sm text-gray-500">{t("loading")}</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">{t("intro")}</p>
      {error && <p className="text-sm text-amber-400">{error}</p>}

      {subjects.length === 0 ? (
        <p className="text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-gray-800 rounded-lg border border-gray-800 bg-gray-900">
          {subjects.map((s) => (
            <li key={s.domainId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <span className="text-sm text-white">
                {s.icon ? `${s.icon} ` : ""}
                {s.name} <span className="text-xs text-gray-500">· {s.managedElsewhere ? t("managedElsewhere") : origin(s)}</span>
              </span>
              {!s.managedElsewhere && (
                <button
                  type="button"
                  onClick={() => remove(s)}
                  disabled={busy}
                  className="min-h-[36px] text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
                >
                  {t("remove")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {removed.length > 0 && (
        <div className="text-xs text-gray-400">
          {t("removedLabel")}{" "}
          {removed.map((s, i) => (
            <span key={s.domainId}>
              {i > 0 && " · "}
              {s.name} ({s.setBy === "you" ? t("removedByYou") : t("removedBy", { name: s.setByName?.trim() || t("otherAdult") })}){" "}
              <button type="button" onClick={() => void add(s.domainId)} disabled={busy} className="text-blue-400 hover:text-blue-300">
                {t("addBack")}
              </button>
            </span>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`add-subject-${childId}`} className="sr-only">
            {t("pickLabel")}
          </label>
          <select
            id={`add-subject-${childId}`}
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            className="min-h-[40px] rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            <option value="">{t("pickPlaceholder")}</option>
            {available
              .filter((d) => !removed.some((r) => r.domainId === d.id))
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (!pick) return;
              void add(pick).then(() => setPick(""));
            }}
            disabled={!pick || busy}
            className="min-h-[40px] rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50"
          >
            {t("addSubject")}
          </button>
        </div>
      )}
    </div>
  );
}
