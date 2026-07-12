import type { EscalationChannel } from "@prisma/client";

export interface EscalationLevel {
  level: number;
  channel: EscalationChannel;
  delayMinutes: number;
  templateId: string;
  maxPerDay?: number;
}

// Cascade: free push (App) → free Telegram → student email → paid WhatsApp.
// WhatsApp is Premium-only (gated in the engine). Per-step grace here is the
// DEFAULT (missed-session); scheduled reminders override it per time-window
// (fast morning / slow evening) via the ladder's graceMsFor resolver.
export const ESCALATION_LEVELS: EscalationLevel[] = [
  { level: 1, channel: "PUSH", delayMinutes: 0, templateId: "reminder_push" },
  { level: 2, channel: "TELEGRAM", delayMinutes: 10, templateId: "reminder_telegram" },
  { level: 3, channel: "EMAIL", delayMinutes: 10, templateId: "reminder_email" },
  { level: 4, channel: "WHATSAPP", delayMinutes: 10, templateId: "reminder_whatsapp" },
];

// Per-time-window grace (minutes) between cascade steps. Morning = short window
// (on the bus) so we escalate fast; evening = relaxed.
export const CASCADE_GRACE_MINUTES = {
  morning: 6,
  evening: 18,
  default: 10,
} as const;

export const QUIET_HOURS_DEFAULT = { start: "22:00", end: "07:00" };
export const DEFAULT_TIMEZONE = "Europe/Bucharest";

/** Cascade channels a user is allowed to reorder (the rungs that actually exist). */
export const ORDERABLE_CHANNELS: EscalationChannel[] = ESCALATION_LEVELS.map((l) => l.channel);

/**
 * Keep only known cascade channels, upper-cased and de-duplicated, in the order the
 * caller sent them. Anything else (unknown channel, non-array, dupes, non-string) is
 * dropped, so a bad payload can never corrupt the ladder — it just falls back to the
 * default order. Shared by the self (student) + family (parent-manages-child) writes.
 */
export function sanitizeChannelOrder(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const allowed = new Set<string>(ORDERABLE_CHANNELS);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const ch = raw.toUpperCase();
    if (allowed.has(ch) && !seen.has(ch)) {
      out.push(ch);
      seen.add(ch);
    }
  }
  return out;
}

/**
 * Resolve THIS user's escalation ladder from their saved `channelOrder` preference.
 *
 * The rungs are the same four cascade channels — we only change the ORDER they fire
 * in (e.g. WhatsApp before Email). Each channel keeps its own template; the level
 * numbers are re-indexed 1..n by the new position. Per-step grace is position-based
 * (see ESCALATION_LADDER in the engine), so it stays independent of which channel
 * sits at a given rung. A channel the user didn't mention keeps its default place at
 * the end; an unknown/duplicate entry is ignored. Empty/absent preference → the code
 * default order, byte-for-byte the pre-feature behaviour.
 */
export function resolveLadder(channelOrder?: string[] | null): EscalationLevel[] {
  if (!Array.isArray(channelOrder) || channelOrder.length === 0) {
    return ESCALATION_LEVELS;
  }
  const byChannel = new Map<EscalationChannel, EscalationLevel>(
    ESCALATION_LEVELS.map((l) => [l.channel, l] as const),
  );
  const seen = new Set<EscalationChannel>();
  const ordered: EscalationLevel[] = [];
  for (const raw of channelOrder) {
    const ch = String(raw).toUpperCase() as EscalationChannel;
    const lvl = byChannel.get(ch);
    if (lvl && !seen.has(ch)) {
      ordered.push(lvl);
      seen.add(ch);
    }
  }
  // Append any cascade channel the user didn't list, in the default order — we never
  // DROP a rung here (on/off gating stays with the booleans in the engine).
  for (const lvl of ESCALATION_LEVELS) {
    if (!seen.has(lvl.channel)) {
      ordered.push(lvl);
      seen.add(lvl.channel);
    }
  }
  return ordered.map((l, i) => ({ ...l, level: i + 1 }));
}

// ─── Feature 2: parent-set custom cascade (presets + per-step minutes) ───

// One rung of a parent-set custom cascade: which channel, and how long to wait
// after the PREVIOUS rung before firing this one (rung 0 = immediate).
export interface EscalationStep {
  channel: EscalationChannel;
  delayMinutes: number;
}

// Longest a single step may wait (24h) — guards against a typo freezing a chain.
export const MAX_STEP_DELAY_MIN = 1440;

// Named presets a parent can apply from the child card in one click. Each is a
// subset/reorder of the same cascade channels with its own pace. "Standard" is the
// current default cascade; "Blând" is gentle (fewer rungs, long waits, no WhatsApp);
// "Insistent" hits every channel fast. Applying a preset just writes its steps to the
// child's escalationSteps; the parent can then fine-tune → it becomes "personalizat".
export const ESCALATION_PRESETS: Record<"BLAND" | "STANDARD" | "INSISTENT", EscalationStep[]> = {
  BLAND: [
    { channel: "PUSH", delayMinutes: 0 },
    { channel: "EMAIL", delayMinutes: 30 },
  ],
  STANDARD: [
    { channel: "PUSH", delayMinutes: 0 },
    { channel: "TELEGRAM", delayMinutes: 10 },
    { channel: "EMAIL", delayMinutes: 10 },
    { channel: "WHATSAPP", delayMinutes: 10 },
  ],
  INSISTENT: [
    { channel: "PUSH", delayMinutes: 0 },
    { channel: "TELEGRAM", delayMinutes: 5 },
    { channel: "WHATSAPP", delayMinutes: 5 },
    { channel: "EMAIL", delayMinutes: 5 },
  ],
};

/**
 * Validate a parent-supplied custom cascade. Keeps only known cascade channels
 * (upper-cased, de-duplicated, in the sent order); coerces delayMinutes to an int
 * clamped to [0, MAX_STEP_DELAY_MIN] with a floor of 1 on every rung past the first
 * (so a non-lead rung can never fire instantly and loop). Anything malformed (not an
 * array, empty, junk entries) → undefined, so a bad payload falls back to the default
 * ladder instead of corrupting delivery.
 */
export function sanitizeEscalationSteps(input: unknown): EscalationStep[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const allowed = new Set<string>(ORDERABLE_CHANNELS);
  const seen = new Set<string>();
  const out: EscalationStep[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const ch = String((raw as { channel?: unknown }).channel ?? "").toUpperCase();
    if (!allowed.has(ch) || seen.has(ch)) continue;
    const nRaw = Number((raw as { delayMinutes?: unknown }).delayMinutes);
    if (!Number.isFinite(nRaw)) continue;
    let n = Math.max(0, Math.min(MAX_STEP_DELAY_MIN, Math.round(nRaw)));
    if (out.length > 0 && n < 1) n = 1; // non-lead rung: never instant
    out.push({ channel: ch as EscalationChannel, delayMinutes: n });
    seen.add(ch);
  }
  return out.length > 0 ? out : undefined;
}

/** Build an escalation ladder from an explicit step list (custom cascade). */
export function resolveLadderFromSteps(steps: EscalationStep[]): EscalationLevel[] {
  const byChannel = new Map<EscalationChannel, EscalationLevel>(
    ESCALATION_LEVELS.map((l) => [l.channel, l] as const),
  );
  return steps.map((s, i) => {
    const base = byChannel.get(s.channel);
    return {
      level: i + 1,
      channel: s.channel,
      delayMinutes: s.delayMinutes,
      templateId: base?.templateId ?? `reminder_${s.channel.toLowerCase()}`,
      ...(base?.maxPerDay != null ? { maxPerDay: base.maxPerDay } : {}),
    };
  });
}

/**
 * The single source of truth for a user's escalation ladder. A valid parent-set
 * `escalationSteps` (channel + minutes) overrides everything; otherwise fall back to
 * the channelOrder-based `resolveLadder`. Callers pass the raw prefs values; parsing +
 * validation happen here so the engine never has to know the storage shape.
 */
export function resolveUserLadder(prefs: {
  channelOrder?: string[] | null;
  escalationSteps?: unknown;
}): EscalationLevel[] {
  const steps = sanitizeEscalationSteps(prefs.escalationSteps);
  if (steps) return resolveLadderFromSteps(steps);
  return resolveLadder(prefs.channelOrder);
}

/**
 * Grace (ms) to wait after the rung at `currentIndex` before firing the next one,
 * for a child on a custom cascade — the next step's own delayMinutes. Returns null at
 * the terminal rung (no next step). When there are no custom steps this returns
 * undefined so the caller keeps its window-based fallback (resolveGraceMs).
 */
export function resolveUserGraceMs(
  escalationSteps: unknown,
  currentIndex: number,
): number | null | undefined {
  const steps = sanitizeEscalationSteps(escalationSteps);
  if (!steps) return undefined;
  const next = steps[currentIndex + 1];
  return next ? next.delayMinutes * 60_000 : null;
}
