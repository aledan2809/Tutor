/**
 * Which reminder channels this server can actually deliver on — the same answer for the engine
 * (skip a rung that can't send) and for the public pages (don't promise a channel that is off).
 *
 * Before 16.09.2026 the checks lived inline in the engine only, and /parinte promised
 * „WhatsApp" alone while the server was sending on Telegram, email and SMS too. One function,
 * two readers, so the page can't drift from what the engine does.
 *
 * Per-user conditions (a linked Telegram chat, a paid plan) are not here: this is the server's
 * side of the question.
 */
import { smsConfigurat } from "@/lib/notifications/sms-provider";

type Mediu = Record<string, string | undefined>;

export interface ServerChannelAvailability {
  telegram: boolean;
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

export function serverChannelAvailability(env: Mediu): ServerChannelAvailability {
  return {
    telegram: env.FEATURE_TELEGRAM_NUDGES === "true" && Boolean(env.TELEGRAM_BOT_TOKEN),
    whatsapp: Boolean(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN),
    // Nu doar SMSLink: și Twilio (vezi sms-provider.ts).
    sms: smsConfigurat(env),
    email: Boolean(env.AUTH_RESEND_KEY || env.SMTP_HOST),
  };
}
