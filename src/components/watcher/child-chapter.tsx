"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ReminderManager } from "@/components/reminder-manager";
import { BreaksManager } from "@/components/watcher/breaks-manager";
import { PhoneCapture } from "@/components/phone-capture";
import { ParentAlertActions } from "@/components/watcher/parent-alert-actions";
import { ParentNudgeManager } from "@/components/watcher/parent-nudge-manager";

const KNOWN_SESSION_TYPES = ["micro", "quick", "deep", "repair", "recovery", "intensive"];

interface ChildLite {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  domains: { id: string; name: string; slug: string; icon: string | null }[];
  gamification?: { currentStreak: number; totalXp: number; level: string };
  progress?: { accuracy: number };
}

interface ScheduledSession {
  key: string;
  at: string;
  window: string;
  sessionType: string;
  channels: string[];
  reactedChannel: string | null;
  done: boolean;
  score: number | null;
  completed: boolean;
}
interface ReminderTouch {
  id: string;
  channel: string;
  level: number;
  sent: boolean;
  acknowledged: boolean;
  reason: string | null;
  at: string;
}
interface SessionItem {
  id: string;
  type: string;
  subject: string | null;
  startedAt: string;
  completed: boolean;
  score: number | null;
}
interface WeakArea {
  subject: string;
  topic: string;
  errorRate: number;
}
interface Detail {
  canManageSchedule: boolean;
  scheduledSessions: ScheduledSession[];
  reminderLog: ReminderTouch[];
  sessionLog: SessionItem[];
  domainSummaries?: { domain: { name: string }; weakAreas: WeakArea[] }[];
}

const CHANNEL_RO: Record<string, string> = {
  PUSH: "Aplicație",
  TELEGRAM: "Telegram",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  CALL: "Apel",
};
const WINDOW_RO: Record<string, string> = { morning: "dimineață", evening: "seară" };

function fmt(d: string): string {
  return new Date(d).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDay(d: string): string {
  return new Date(d).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type Tab = "sesiuni" | "remindere" | "program";

export function ChildChapter({ child }: { child: ChildLite }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("sesiuni");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await fetch(`/api/dashboard/watcher/${child.id}`);
      if (r.ok) setDetail(await r.json());
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !detail) await loadDetail();
  };

  const initials = (child.name ?? "?")[0]?.toUpperCase();
  const streak = child.gamification?.currentStreak ?? 0;
  const accuracy = child.progress?.accuracy ?? 0;

  // Group reminder touches into episodes (reason + calendar-day) for the cascade view.
  const episodes = (() => {
    if (!detail) return [];
    const map = new Map<string, { reason: string | null; day: string; touches: ReminderTouch[] }>();
    for (const t of detail.reminderLog) {
      const day = fmtDay(t.at);
      const key = `${t.reason ?? "—"}|${day}`;
      let g = map.get(key);
      if (!g) {
        g = { reason: t.reason, day, touches: [] };
        map.set(key, g);
      }
      g.touches.push(t);
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      touches: g.touches.sort((a, b) => a.level - b.level),
    }));
  })();

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900">
      {/* Chapter header (collapsed by default) */}
      <button
        onClick={toggle}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-800/40"
        aria-expanded={open}
      >
        <span className={`text-gray-500 transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        {child.image ? (
          <Image src={child.image} alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 font-bold">
            {initials}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="block truncate font-semibold text-white">{child.name ?? child.email}</span>
          <span className="block truncate text-xs text-gray-400">
            {child.domains.map((d) => d.name).join(" · ")}
          </span>
        </span>
        <span className="flex items-center gap-3 text-xs text-gray-400">
          <span title="Serie: zile consecutive cu cel puțin o sesiune de studiu">🔥 {streak} zile</span>
          <span title="Acuratețe: procentul răspunsurilor corecte">{accuracy}% corect</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-800 p-4">
          {/* WhatsApp phone band (sus) — guardian sets the child's number so
              reminders can also go out via WhatsApp (Meta). */}
          {detail?.canManageSchedule && (
            <div className="mb-4">
              <PhoneCapture
                apiBase={`/api/dashboard/watcher/${child.id}/phone`}
                label="Remindere pe WhatsApp"
                hint="Adaugă un număr de telefon dacă vrei ca acest copil să primească remindere și pe WhatsApp (Meta)."
              />
            </div>
          )}

          {/* Sub-tabs (subcapitole) */}
          <div className="mb-4 flex flex-wrap gap-2">
            <TabBtn active={tab === "sesiuni"} onClick={() => setTab("sesiuni")}>
              Sesiuni
            </TabBtn>
            <TabBtn active={tab === "remindere"} onClick={() => setTab("remindere")}>
              Remindere
            </TabBtn>
            {detail?.canManageSchedule && (
              <TabBtn active={tab === "program"} onClick={() => setTab("program")}>
                Program
              </TabBtn>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Se încarcă…</p>
          ) : error ? (
            <button onClick={loadDetail} className="text-sm text-blue-400 hover:text-blue-300">
              Nu s-au putut încărca datele. Reîncearcă.
            </button>
          ) : !detail ? (
            <p className="text-sm text-gray-500">Se încarcă…</p>
          ) : tab === "program" ? (
            detail.canManageSchedule ? (
              <div className="space-y-6">
                <ReminderManager apiBase={`/api/dashboard/watcher/${child.id}/reminders`} />
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-400">Vacanță / excepții</h3>
                  <BreaksManager apiBase={`/api/dashboard/watcher/${child.id}/breaks`} />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-400">Trimite memento acum</h3>
                  <ParentNudgeManager apiBase={`/api/dashboard/watcher/${child.id}/nudge`} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Programul poate fi gestionat doar de părinte.</p>
            )
          ) : tab === "sesiuni" ? (
            <div className="space-y-5">
              <WeakAreasBlock domainSummaries={detail.domainSummaries} />
              <SesiuniTab scheduled={detail.scheduledSessions} sessions={detail.sessionLog} />
            </div>
          ) : (
            <div className="space-y-4">
              {detail.canManageSchedule && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-400">Trimite un memento</h3>
                  <ParentAlertActions childId={child.id} />
                </div>
              )}
              <RemindereTab episodes={episodes} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function SesiuniTab({
  scheduled,
  sessions,
}: {
  scheduled: ScheduledSession[];
  sessions: SessionItem[];
}) {
  const t = useTranslations("sessions");
  const typeLabel = (x: string) => (KNOWN_SESSION_TYPES.includes(x) ? t(`types.${x}`) : x);
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-400">
          Sesiuni programate (memento → rezultat)
        </h3>
        {scheduled.length === 0 ? (
          <p className="text-sm text-gray-500">Niciun memento programat declanșat încă.</p>
        ) : (
          <div className="space-y-1">
            {scheduled.map((s) => (
              <div key={s.key} className="flex items-center justify-between rounded bg-gray-800 px-3 py-2">
                <span className="text-sm text-white">
                  {WINDOW_RO[s.window] ?? s.window} · {typeLabel(s.sessionType)}
                  <span className="ml-2 text-xs text-gray-500">{fmt(s.at)}</span>
                </span>
                <span className="flex items-center gap-2 text-xs">
                  {s.done ? (
                    <span className="rounded bg-green-600/20 px-2 py-0.5 text-green-400">
                      {s.score !== null ? `${Math.round(s.score)}%` : s.completed ? "făcută" : "a reacționat"}
                    </span>
                  ) : (
                    <span className="rounded bg-red-600/20 px-2 py-0.5 text-red-400">ignorată</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-400">Toate sesiunile efectuate</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-500">Nicio sesiune încă.</p>
        ) : (
          <div className="space-y-1">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded bg-gray-800 px-3 py-2">
                <span className="text-sm text-white">
                  {typeLabel(s.type)}
                  {s.subject ? ` · ${s.subject}` : ""}
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <span className={s.completed ? "text-green-400" : "text-yellow-400"}>
                    {s.completed ? (s.score !== null ? `${Math.round(s.score)}%` : "terminat") : "neterminat"}
                  </span>
                  <span className="text-gray-500">{fmt(s.startedAt)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WeakAreasBlock({
  domainSummaries,
}: {
  domainSummaries?: { domain: { name: string }; weakAreas: WeakArea[] }[];
}) {
  // Aggregate (overall) weak topics — what the repair sessions target. Highest
  // error rate first.
  const all = (domainSummaries ?? [])
    .flatMap((ds) => ds.weakAreas.map((w) => ({ ...w, domain: ds.domain.name })))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 8);
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-gray-400">Puncte slabe (per ansamblu)</h3>
      {all.length === 0 ? (
        <p className="text-sm text-gray-500">Niciun punct slab detectat încă.</p>
      ) : (
        <div className="space-y-1">
          {all.map((w) => (
            <div
              key={`${w.subject}-${w.topic}`}
              className="flex items-center justify-between rounded bg-gray-800 px-3 py-2"
            >
              <span className="text-sm text-white">
                {w.subject} · {w.topic}
              </span>
              <span className="text-xs text-red-400">{Math.round(w.errorRate)}% greșeli</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RemindereTab({
  episodes,
}: {
  episodes: { reason: string | null; day: string; touches: ReminderTouch[] }[];
}) {
  if (episodes.length === 0) {
    return <p className="text-sm text-gray-500">Niciun memento încă.</p>;
  }
  return (
    <div className="space-y-3">
      {episodes.map((ep, i) => {
        const r = ep.reason ?? "";
        const win = r.startsWith("morning")
          ? "dimineață"
          : r.startsWith("evening")
            ? "seară"
            : r === "missed_session"
              ? "sesiune ratată"
              : r === "parent_authorized"
                ? "memento autorizat"
                : r === "parent_nudge"
                  ? "memento de la părinte"
                  : "memento";
        const reacted = ep.touches.some((t) => t.acknowledged);
        return (
          <div key={`${ep.reason}-${ep.day}-${i}`} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                {win} · {ep.day}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  reacted ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                }`}
              >
                {reacted ? "a reacționat" : "ignorat"}
              </span>
            </div>
            <div className="space-y-1">
              {ep.touches.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">
                    #{t.level} · {CHANNEL_RO[t.channel] ?? t.channel}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={t.acknowledged ? "text-green-400" : t.sent ? "text-gray-400" : "text-gray-600"}>
                      {t.acknowledged ? "a reacționat" : t.sent ? "trimis" : "sărit"}
                    </span>
                    <span className="text-gray-500">{fmt(t.at)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
