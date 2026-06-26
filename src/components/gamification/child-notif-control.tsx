"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Channels = { push: boolean; email: boolean; whatsapp: boolean; sms: boolean };
type State = { managedByParent: boolean; channels: Channels; allowedChannels?: string[] };

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

  const save = async (patch: Record<string, boolean>, optimistic: State) => {
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
    </div>
  );
}
