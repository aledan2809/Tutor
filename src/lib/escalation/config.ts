import type { EscalationChannel } from "@prisma/client";

export interface EscalationLevel {
  level: number;
  channel: EscalationChannel;
  delayMinutes: number;
  templateId: string;
  maxPerDay?: number;
}

export const ESCALATION_LEVELS: EscalationLevel[] = [
  { level: 1, channel: "PUSH", delayMinutes: 0, templateId: "push_missed_session" },
  { level: 2, channel: "WHATSAPP", delayMinutes: 30, templateId: "whatsapp_friendly_reminder" },
  { level: 3, channel: "WHATSAPP", delayMinutes: 120, templateId: "whatsapp_pressure_stats" },
  { level: 4, channel: "SMS", delayMinutes: 240, templateId: "sms_direct_alert", maxPerDay: 3 },
  { level: 5, channel: "EMAIL", delayMinutes: 1440, templateId: "email_instructor_alert" },
  { level: 6, channel: "CALL", delayMinutes: 2880, templateId: "call_instructor_request" },
];

export const QUIET_HOURS_DEFAULT = { start: "22:00", end: "07:00" };
export const DEFAULT_TIMEZONE = "Europe/Bucharest";
