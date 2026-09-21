"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SubjectAddonOffer, watchPaidSubject, type SubjectAddon } from "@/components/plan/subject-addon-offer";

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
 *
 * Past the subjects the card subscription pays for, the paying parent gets the price of one more and
 * pays it on its own subscription; the subject is turned on when the payment is confirmed
 * (subject-addon-checkout). `paid`: back from that payment, and for which subject; `onPaymentSettled`
 * runs once the list has stopped looking for it, so the owner can forget the payment (this list is
 * mounted again after each change, and must not announce it again).
 */
export function SubjectManager({
  childId,
  onChange,
  paid = null,
  onPaymentSettled,
}: {
  childId: string;
  onChange?: () => void;
  paid?: { domainId: string | null } | null;
  onPaymentSettled?: () => void;
}) {
  const t = useTranslations("watcher.subjectManager");
  const ta = useTranslations("subjectAddon");
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [removed, setRemoved] = useState<SubjectRow[]>([]);
  const [available, setAvailable] = useState<Available[]>([]);
  const [pick, setPick] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addon, setAddon] = useState<SubjectAddon | null>(null);
  const [payment, setPayment] = useState<"waiting" | "done" | "late" | null>(paid ? "waiting" : null);
  const api = `/api/dashboard/watcher/${childId}/subjects`;

  /** The lists again; answers the active subjects (null when they couldn't be read). */
  const load = useCallback(async (): Promise<SubjectRow[] | null> => {
    try {
      const res = await fetch(api);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setSubjects(d.subjects ?? []);
      setRemoved(d.removed ?? []);
      setAvailable(d.available ?? []);
      return d.subjects ?? [];
    } catch {
      setError(t("loadError"));
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // The payment service confirms a few seconds after the payment page returns: look again meanwhile,
  // until the subject bought is in the list.
  const paidDomainId = paid?.domainId ?? null;
  useEffect(() => {
    if (!paid) return;
    setPayment("waiting");
    return watchPaidSubject(
      async () => {
        const active = await load();
        return !!paidDomainId && !!active?.some((s) => s.domainId === paidDomainId);
      },
      (found) => {
        setPayment(found || !paidDomainId ? "done" : "late");
        onPaymentSettled?.();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!paid, paidDomainId, load]);

  const act = async (init: RequestInit, url = api, subject?: { domainId: string; name: string }) => {
    setBusy(true);
    setError(null);
    setAddon(null);
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (res.status === 402 && d?.code === "SUBJECT_ADDON" && d.quote && subject) setAddon({ ...subject, quote: d.quote });
        else setError(d?.error ?? t("saveError"));
      } else {
        onChange?.();
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const add = (domainId: string) => {
    const name = available.find((d) => d.id === domainId)?.name ?? removed.find((r) => r.domainId === domainId)?.name ?? "";
    return act({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domainId }) }, api, { domainId, name });
  };

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
      {payment === "waiting" && <p className="text-sm text-emerald-400">{ta("paidList")}</p>}
      {payment === "late" && <p className="text-sm text-amber-400">{ta("paidLate")}</p>}
      {error && <p className="text-sm text-amber-400">{error}</p>}
      {addon && <SubjectAddonOffer addon={addon} childId={childId} onClose={() => setAddon(null)} onError={setError} />}

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
