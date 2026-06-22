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
