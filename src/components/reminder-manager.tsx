"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface Reminder {
  id: string;
  label: string | null;
  window: string;
  sessionType: string;
  daysOfWeek: number[];
  hour: number;
  minute: number;
  domainSlug: string | null;
  isActive: boolean;
  /** Child's view: the parent who set it; the child can't change it (guardian-lock.ts). */
  lockedBy?: { name: string | null } | null;
  /** Parent's view: whose reminder it is. */
  setBy?: "child" | "you" | "guardian" | "tutor";
  setByName?: string | null;
}

const DAYS: { v: number; ro: string }[] = [
  { v: 1, ro: "Lu" },
  { v: 2, ro: "Ma" },
  { v: 3, ro: "Mi" },
  { v: 4, ro: "Jo" },
  { v: 5, ro: "Vi" },
  { v: 6, ro: "Sâ" },
  { v: 0, ro: "Du" },
];
const SESSION_TYPES = ["micro", "quick", "deep", "repair", "recovery", "intensive"];
const hhmm = (h: number, m: number) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

export function ReminderManager({
  apiBase = "/api/student/reminders",
  domains,
  viewer = "self",
}: {
  /** CRUD base path. Default = own schedule; a parent passes the child-scoped base. */
  apiBase?: string;
  /** Targetable domains; when provided, each reminder gets a domain picker so you
   *  can schedule e.g. an evening "Aptitudini Aviație" session alongside others. */
  domains?: { slug: string; name: string }[];
  /** "guardian" on the parent's page: labels whose reminder it is and what an edit does. */
  viewer?: "self" | "guardian";
}) {
  const t = useTranslations("sessions");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBase);
      const d = await res.json();
      setReminders(Array.isArray(d?.reminders) ? d.reminders : []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const patch = (id: string, p: Partial<Reminder>) =>
    setReminders((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const toggleDay = (r: Reminder, day: number) => {
    const days = r.daysOfWeek.includes(day)
      ? r.daysOfWeek.filter((d) => d !== day)
      : [...r.daysOfWeek, day];
    patch(r.id, { daysOfWeek: days });
  };

  const save = async (r: Reminder) => {
    if (r.daysOfWeek.length === 0) return;
    setSavingId(r.id);
    setNotice(null);
    try {
      const res = await fetch(`${apiBase}/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: r.label,
          window: r.window,
          sessionType: r.sessionType,
          daysOfWeek: r.daysOfWeek,
          hour: r.hour,
          minute: r.minute,
          domainSlug: r.domainSlug ?? null,
          isActive: r.isActive,
        }),
      });
      if (!res.ok) {
        // e.g. a parent set this reminder meanwhile: say why and show it as it is now.
        const d = await res.json().catch(() => ({}));
        setNotice(d?.error ?? "Nu s-a putut salva.");
        await load();
      } else if (viewer === "guardian") {
        patch(r.id, { setBy: "you", setByName: null });
      }
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    setNotice(null);
    const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setNotice(d?.error ?? "Nu s-a putut șterge.");
      await load();
      return;
    }
    setReminders((rs) => rs.filter((r) => r.id !== id));
  };

  const add = async () => {
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: "Reminder nou",
        window: "morning",
        sessionType: "quick",
        daysOfWeek: [1, 2, 3, 4, 5],
        hour: 8,
        minute: 0,
      }),
    });
    const d = await res.json();
    if (d?.reminder) setReminders((rs) => [...rs, d.reminder]);
  };

  if (loading) return <p className="text-gray-400">Se încarcă…</p>;

  return (
    <div className="space-y-4">
      {reminders.length === 0 && (
        <p className="text-sm text-gray-500">Niciun reminder programat încă.</p>
      )}
      {viewer === "guardian" && reminders.length > 0 && (
        <p className="text-xs text-gray-400">
          Ce stabilești sau schimbi tu rămâne așa: copilul nu îl mai poate modifica. Remindere puse de copil le poate
          schimba el, până le modifici tu.
        </p>
      )}
      {notice && <p className="text-sm text-amber-400">{notice}</p>}

      {reminders.map((r) => {
        // The child's view of a reminder a parent set: shown, not editable.
        const locked = viewer === "self" && Boolean(r.lockedBy);
        return (
        <div
          key={r.id}
          className={`rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3 ${
            // Dim the controls, so a locked reminder doesn't look editable.
            locked ? "[&_button]:opacity-60 [&_input]:cursor-not-allowed [&_input]:opacity-60 [&_select]:opacity-60" : ""
          }`}
        >
          {locked && (
            <p className="text-xs text-amber-300">
              🔒 Stabilit de {r.lockedBy?.name?.trim() || "părintele tău"}. Ca să-l schimbați, vorbiți împreună.
            </p>
          )}
          {viewer === "guardian" && r.setBy && (
            <p className="text-xs text-gray-400">
              {r.setBy === "you"
                ? "Stabilit de tine"
                : r.setBy === "guardian"
                  ? `Stabilit de ${r.setByName?.trim() || "celălalt adult din familie"}`
                  : r.setBy === "tutor"
                    ? `Pus de ${r.setByName?.trim() || "meditator"}`
                    : "Pus de copil"}
            </p>
          )}
          <fieldset disabled={locked} className="contents">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="time"
              value={hhmm(r.hour, r.minute)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                patch(r.id, { hour: h || 0, minute: m || 0 });
              }}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
            <input
              value={r.label ?? ""}
              onChange={(e) => patch(r.id, { label: e.target.value })}
              placeholder="Etichetă"
              className="flex-1 min-w-[140px] rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            />
            <label className="flex items-center gap-1.5 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={r.isActive}
                onChange={(e) => patch(r.id, { isActive: e.target.checked })}
              />
              Activ
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {DAYS.map((d) => (
                <button
                  key={d.v}
                  onClick={() => toggleDay(r, d.v)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium ${
                    r.daysOfWeek.includes(d.v)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {d.ro}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1">
              <select
                value={r.sessionType}
                onChange={(e) => patch(r.id, { sessionType: e.target.value })}
                className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-xs text-white"
              >
                {SESSION_TYPES.map((ty) => (
                  <option key={ty} value={ty}>
                    {t(`types.${ty}`)}
                  </option>
                ))}
              </select>
              <InfoTooltip text={t(`tip.${r.sessionType}`)} label={t("infoLabel")} />
            </span>
            <span className="inline-flex items-center gap-1">
              <select
                value={r.window}
                onChange={(e) => patch(r.id, { window: e.target.value })}
                className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-xs text-white"
              >
                <option value="morning">{t("cascade.morning")}</option>
                <option value="evening">{t("cascade.evening")}</option>
              </select>
              <InfoTooltip text={t(`cascadeTip.${r.window}`)} label={t("infoLabel")} />
            </span>
            {domains && domains.length > 0 && (
              <select
                value={r.domainSlug ?? ""}
                onChange={(e) => patch(r.id, { domainSlug: e.target.value || null })}
                className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-xs text-white"
                title="Domeniul pe care îl deschide reminderul"
              >
                <option value="">Domeniu implicit</option>
                {domains.map((dm) => (
                  <option key={dm.slug} value={dm.slug}>
                    {dm.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          </fieldset>

          {!locked && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => remove(r.id)}
              className="text-xs text-gray-500 hover:text-red-400"
            >
              Șterge
            </button>
            <button
              onClick={() => save(r)}
              disabled={savingId === r.id || r.daysOfWeek.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {savingId === r.id ? "Se salvează…" : "Salvează"}
            </button>
          </div>
          )}
        </div>
        );
      })}

      <button
        onClick={add}
        className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
      >
        + Adaugă reminder
      </button>
    </div>
  );
}
