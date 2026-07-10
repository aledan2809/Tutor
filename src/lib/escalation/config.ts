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
