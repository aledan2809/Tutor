"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Channels = { push: boolean; email: boolean; whatsapp: boolean; sms: boolean };
type State = { managedByParent: boolean; channels: Channels; channelOrder?: string[]; allowedChannels?: string[] };

/** Escalation cascade channels the parent can reorder for the child (must match ORDERABLE_CHANNELS server-side). */
const CASCADE = ["PUSH", "TELEGRAM", "EMAIL", "WHATSAPP"] as const;

/** Always show all cascade channels exactly once; missing ones appended in default order. */
function normalizeOrder(saved?: string[]): string[] {
  const up = (saved ?? []).map((s) => s.toUpperCase()).filter((s) => (CASCADE as readonly string[]).includes(s));
  const seen = new Set(up);
  return [...up, ...CASCADE.filter((c) => !seen.has(c))];
}

/**
 * Parent control: choose whether the parent manages a child's notification channels,
 * and (when they do) set those channels. Guardian-gated endpoint.
 */
export function ChildNotifControl({ childId }: { childId: string }) {
  const t = useTranslations("familyNotif");
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    fetch(`/api/family/${childId}/notifications`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setState(d))
      .catch(() => {});
  }, [childId]);

  const save = async (patch: Record<string, unknown>, optimistic: State) => {
    setState(optimistic);
    setBusy(true);
    try {
      const r = await fetch(`/api/family/${childId}/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (r.ok) {
        setState(await r.json());
        setSavedAt(Date.now());
      }
    } catch {
      /* best-effort */
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;

  const toggleManaged = () =>
    save({ managedByParent: !state.managedByParent }, { ...state, managedByParent: !state.managedByParent });

  const toggleChannel = (ch: keyof Channels) =>
    save({ [ch]: !state.channels[ch] }, { ...state, channels: { ...state.channels, [ch]: !state.channels[ch] } });

  const CHANNELS: Array<keyof Channels> = ["push", "email", "whatsapp", "sms"];

  const order = normalizeOrder(state.channelOrder);
  const ORDER_LABEL: Record<string, string> = { PUSH: t("push"), TELEGRAM: t("telegram"), EMAIL: t("email"), WHATSAPP: t("whatsapp") };
  const moveOrder = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    save({ channelOrder: next }, { ...state, channelOrder: next });
  };

  return (
    <div className="mt-2 border-t border-gray-700/60 pt-2">
      <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
        <input
          type="checkbox"
          checked={state.managedByParent}
          onChange={toggleManaged}
          disabled={busy}
          className="accent-blue-600"
        />
        <span>
          <span className="text-gray-300">{t("delegate")}</span> — {t("delegateHint")}
        </span>
      </label>

      {state.managedByParent && (
        <div className="mt-2 flex flex-wrap items-center gap-3 pl-6">
          <span className="text-xs text-gray-500">{t("channels")}:</span>
          {CHANNELS.map((ch) => {
            const locked = state.allowedChannels ? !state.allowedChannels.includes(ch) : false;
            return (
              <label
                key={ch}
                className={`flex items-center gap-1 text-xs ${locked ? "cursor-not-allowed text-gray-600" : "cursor-pointer text-gray-300"}`}
                title={locked ? t("paidOnly") : undefined}
              >
                <input
                  type="checkbox"
                  checked={locked ? false : state.channels[ch]}
                  onChange={() => !locked && toggleChannel(ch)}
                  disabled={busy || locked}
                  className="accent-blue-600"
                />
                {t(ch)}
                {locked && <span aria-hidden="true">🔒</span>}
              </label>
            );
          })}
          {savedAt > 0 && <span className="text-xs text-gray-600">{t("saved")}</span>}
        </div>
      )}

      {state.managedByParent && (
        <div className="mt-3 pl-6">
          <span className="text-xs text-gray-500">{t("orderTitle")}:</span>
          <ol className="mt-1.5 space-y-1">
            {order.map((ch, i) => (
              <li key={ch} className="flex items-center gap-2 rounded-md border border-gray-800 bg-gray-900/60 px-2 py-1">
                <span className="flex h-4 w-4 items-center justify-center rounded bg-blue-600/15 text-[10px] font-bold text-blue-400">{i + 1}</span>
                <span className="flex-1 text-xs text-gray-300">{ORDER_LABEL[ch] ?? ch}</span>
                <button
                  type="button"
                  aria-label={t("moveUp")}
                  disabled={busy || i === 0}
                  onClick={() => moveOrder(i, i - 1)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-gray-700 text-[11px] text-gray-300 hover:bg-gray-800 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={t("moveDown")}
                  disabled={busy || i === order.length - 1}
                  onClick={() => moveOrder(i, i + 1)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-gray-700 text-[11px] text-gray-300 hover:bg-gray-800 disabled:opacity-30"
                >
                  ↓
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
