import { describe, it, expect } from "vitest";
import { serverChannelAvailability } from "@/lib/escalation/channel-availability";

describe("canalele pe care serverul chiar le poate trimite", () => {
  it("fără nicio setare: doar notificarea din aplicație (care nu apare aici) — restul oprite", () => {
    expect(serverChannelAvailability({})).toEqual({ telegram: false, whatsapp: false, sms: false, email: false });
  });
  it("Telegram cere și botul, și comutatorul pornit", () => {
    expect(serverChannelAvailability({ TELEGRAM_BOT_TOKEN: "t" }).telegram).toBe(false);
    expect(serverChannelAvailability({ TELEGRAM_BOT_TOKEN: "t", FEATURE_TELEGRAM_NUDGES: "true" }).telegram).toBe(true);
  });
  it("WhatsApp cere și numărul, și cheia", () => {
    expect(serverChannelAvailability({ WHATSAPP_ACCESS_TOKEN: "k" }).whatsapp).toBe(false);
    expect(serverChannelAvailability({ WHATSAPP_ACCESS_TOKEN: "k", WHATSAPP_PHONE_NUMBER_ID: "1" }).whatsapp).toBe(true);
  });
  it("SMS merge prin Twilio (ca pe producție) sau SMSLink", () => {
    expect(serverChannelAvailability({ TWILIO_ACCOUNT_SID: "a", TWILIO_AUTH_TOKEN: "b", TWILIO_PHONE_NUMBER: "+1" }).sms).toBe(true);
    expect(serverChannelAvailability({ SMSLINK_CONNECTION_ID: "a", SMSLINK_PASSWORD: "b" }).sms).toBe(true);
    expect(serverChannelAvailability({ TWILIO_ACCOUNT_SID: "a" }).sms).toBe(false);
  });
  it("email prin Resend sau SMTP", () => {
    expect(serverChannelAvailability({ AUTH_RESEND_KEY: "r" }).email).toBe(true);
    expect(serverChannelAvailability({ SMTP_HOST: "h" }).email).toBe(true);
  });
});
