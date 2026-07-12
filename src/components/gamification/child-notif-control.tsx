"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ESCALATION_PRESETS } from "@/lib/escalation/config";

type Channels = { push: boolean; email: boolean; whatsapp: boolean; sms: boolean };
type Step = { channel: string; delayMinutes: number };
type State = {
  managedByParent: boolean;
  channels: Channels;
  channelOrder?: string[];
  escalationSteps?: Step[] | null;
  allowedChannels?: string[];
};

/** Escalation cascade channels the parent can use (must match ORDERABLE_CHANNELS server-side). */
const CASCADE = ["PUSH", "TELEGRAM", "EMAIL", "WHATSAPP"] as const;
const PRESET_KEYS = ["BLAND", "STANDARD", "INSISTENT"] as const;
type PresetKey = (typeof PRESET_KEYS)[number];

const stepsEqual = (a: Step[], b: Step[]) =>
  a.length === b.length && a.every((s, i) => s.channel === b[i].channel && s.delayMinutes === b[i].delayMinutes);

/**
 * Parent control: choose whether the parent manages a child's notification channels,
 * and (when they do) set the cascade — a one-click preset or a fine-tuned step list
 * (channel + minutes per rung). Guardian-gated endpoint.
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

  const ORDER_LABEL: Record<string, string> = { PUSH: t("push"), TELEGRAM: t("telegram"), EMAIL: t("email"), WHATSAPP: t("whatsapp") };
  const PRESET_LABEL: Record<PresetKey, string> = { BLAND: t("presetBland"), STANDARD: t("presetStandard"), INSISTENT: t("presetInsistent") };

  // The cascade the parent is editing: their custom steps, or the Standard baseline
  // when they haven't overridden it yet (escalationSteps === null → "implicit").
  const isCustom = state.escalationSteps != null;
  const steps: Step[] = (state.escalationSteps as Step[] | null) ?? ESCALATION_PRESETS.STANDARD;
  const activePreset: PresetKey | "CUSTOM" | null = !isCustom
    ? null
    : PRESET_KEYS.find((k) => stepsEqual(steps, ESCALATION_PRESETS[k])) ?? "CUSTOM";

  const writeSteps = (next: Step[]) => save({ escalationSteps: next }, { ...state, escalationSteps: next });
  const applyPreset = (k: PresetKey) =>
    save({ preset: k }, { ...state, escalationSteps: ESCALATION_PRESETS[k].map((s) => ({ ...s })) });
  const clearSteps = () => save({ escalationSteps: null }, { ...state, escalationSteps: null });

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    const next = steps.map((s) => ({ ...s }));
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    if (next[0]) next[0].delayMinutes = 0; // the lead rung always fires immediately
    writeSteps(next);
  };
  const setMinutes = (i: number, v: number) => {
    const floor = i === 0 ? 0 : 1;
    const next = steps.map((s, j) =>
      j === i ? { ...s, delayMinutes: Math.max(floor, Math.min(1440, Math.round(v) || 0)) } : { ...s },
    );
    writeSteps(next);
  };
  const removeStep = (i: number) => {
    if (steps.length <= 1) return;
    const next = steps.filter((_, j) => j !== i).map((s) => ({ ...s }));
    if (next[0]) next[0].delayMinutes = 0;
    writeSteps(next);
  };
  const present = new Set(steps.map((s) => s.channel));
  const addable = CASCADE.filter((c) => !present.has(c));
  const addChannel = (ch: string) => writeSteps([...steps.map((s) => ({ ...s })), { channel: ch, delayMinutes: 10 }]);

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
          <span className="text-xs text-gray-500">{t("cascadeTitle")}:</span>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {PRESET_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                disabled={busy}
                onClick={() => applyPreset(k)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  activePreset === k
                    ? "border-blue-500 bg-blue-600/20 text-blue-300"
                    : "border-gray-700 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {PRESET_LABEL[k]}
              </button>
            ))}
            {activePreset === "CUSTOM" && (
              <span className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-400">{t("presetCustom")}</span>
            )}
            {!isCustom && <span className="self-center text-xs text-gray-600">{t("cascadeImplicit")}</span>}
          </div>

          <ol className="mt-2 space-y-1">
            {steps.map((s, i) => (
              <li key={s.channel} className="flex items-center gap-2 rounded-md border border-gray-800 bg-gray-900/60 px-2 py-1">
                <span className="flex h-4 w-4 items-center justify-center rounded bg-blue-600/15 text-[10px] font-bold text-blue-400">{i + 1}</span>
                <span className="flex-1 text-xs text-gray-300">{ORDER_LABEL[s.channel] ?? s.channel}</span>
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <input
                    type="number"
                    key={`${s.channel}-${s.delayMinutes}`}
                    min={i === 0 ? 0 : 1}
                    max={1440}
                    defaultValue={s.delayMinutes}
                    disabled={busy || i === 0}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v !== s.delayMinutes) setMinutes(i, v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    aria-label={t("stepMinutes")}
                    className="w-12 rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-center text-[11px] text-gray-200 disabled:opacity-40"
                  />
                  {t("minShort")}
                </span>
                <button
                  type="button"
                  aria-label={t("moveUp")}
                  disabled={busy || i === 0}
                  onClick={() => moveStep(i, i - 1)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-gray-700 text-[11px] text-gray-300 hover:bg-gray-800 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={t("moveDown")}
                  disabled={busy || i === steps.length - 1}
                  onClick={() => moveStep(i, i + 1)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-gray-700 text-[11px] text-gray-300 hover:bg-gray-800 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={t("removeStep")}
                  disabled={busy || steps.length <= 1}
                  onClick={() => removeStep(i)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-gray-700 text-[11px] text-gray-400 hover:bg-gray-800 disabled:opacity-30"
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {addable.map((ch) => (
              <button
                key={ch}
                type="button"
                disabled={busy}
                onClick={() => addChannel(ch)}
                className="rounded border border-gray-700 px-2 py-0.5 text-[11px] text-gray-400 hover:bg-gray-800"
              >
                + {ORDER_LABEL[ch] ?? ch}
              </button>
            ))}
            {isCustom && (
              <button
                type="button"
                disabled={busy}
                onClick={clearSteps}
                className="ml-auto text-[11px] text-gray-500 underline hover:text-gray-300"
              >
                {t("cascadeReset")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
