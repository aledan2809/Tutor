import { describe, expect, it } from "vitest";
import { estimateParts } from "@aledan/sms";
import {
  faraDiacritice,
  resolveSmsConfig,
  smsConfigurat,
  textReminderSms,
} from "@/lib/notifications/sms-provider";

const TW = {
  TWILIO_ACCOUNT_SID: "AC" + "x".repeat(32),
  TWILIO_AUTH_TOKEN: "y".repeat(32),
  TWILIO_PHONE_NUMBER: "+15015644340",
};
const SL = { SMSLINK_CONNECTION_ID: "conn-1", SMSLINK_PASSWORD: "parola" };

describe("resolveSmsConfig", () => {
  it("întoarce null când nu e nimic configurat — starea reală a producției până acum", () => {
    expect(resolveSmsConfig({})).toBeNull();
    expect(smsConfigurat({})).toBe(false);
  });

  it("alege Twilio când are toate cele trei bucăți", () => {
    expect(resolveSmsConfig(TW)).toEqual({
      provider: "twilio",
      accountSid: TW.TWILIO_ACCOUNT_SID,
      authToken: TW.TWILIO_AUTH_TOKEN,
      phoneNumber: TW.TWILIO_PHONE_NUMBER,
    });
  });

  it("NU alege Twilio fără numărul de expediere", () => {
    // Capcana reală: SID + token există în mai multe fișiere de credențiale pentru
    // Verify (OTP), unde nu e nevoie de număr. Fără număr, un `send` ar eșua la Twilio.
    const { TWILIO_PHONE_NUMBER, ...faraNumar } = TW;
    expect(resolveSmsConfig(faraNumar)).toBeNull();
  });

  it("cade pe SMSLink dacă Twilio lipsește", () => {
    expect(resolveSmsConfig(SL)).toEqual({
      provider: "smslink",
      connectionId: "conn-1",
      password: "parola",
    });
  });

  it("preferă Twilio când sunt amândouă", () => {
    expect(resolveSmsConfig({ ...TW, ...SL })?.provider).toBe("twilio");
  });

  it("tratează șirul gol ca lipsă — exact forma din seiful de credențiale", () => {
    // În `credentials/rpa-hub.env` cheile SMSLink EXISTĂ, dar cu valoare goală.
    // Fără `trim()`, `Boolean("")` ar fi fost false oricum — dar `" "` nu.
    expect(resolveSmsConfig({ SMSLINK_CONNECTION_ID: "", SMSLINK_PASSWORD: "" })).toBeNull();
    expect(resolveSmsConfig({ SMSLINK_CONNECTION_ID: "  ", SMSLINK_PASSWORD: " " })).toBeNull();
    expect(resolveSmsConfig({ ...TW, TWILIO_PHONE_NUMBER: "   " })).toBeNull();
  });
});

describe("textReminderSms", () => {
  it("e în românește și nu vorbește despre serii de studiu", () => {
    const t = textReminderSms("Marian");
    expect(t).toContain("Marian");
    expect(t).not.toMatch(/streak|you haven|Open the app/i);
    expect(t).not.toMatch(/lectie de terminat/);
  });

  it("merge și fără nume", () => {
    const t = textReminderSms(undefined);
    expect(t.startsWith("eTutor:")).toBe(true);
    expect(t).not.toContain("undefined");
    expect(t).not.toContain(", mai ai"); // fără virgulă orfană când lipsește numele
  });

  it("intră într-un SINGUR segment, măsurat cu numărătoarea bibliotecii", () => {
    // Pragul nu e 160: cu diacritice, SMS-ul se codează UCS-2 și un segment are 70 de
    // caractere. Prima variantă a acestui test verifica lungimea în caractere și trecea
    // pe un text care costa DOUĂ segmente. Se măsoară cu unealta care taxează.
    const t = textReminderSms("Vasilache Petru Constantinescu");
    expect(estimateParts(t)).toBe(1);
  });

  it("scoate diacriticele — de-aia încape într-un segment", () => {
    const t = textReminderSms("Ionescu Marian");
    expect(t).not.toMatch(/[ăâîșşțţĂÂÎȘŞȚŢ]/);
    expect(faraDiacritice("Coada de la prânz și reclamația")).toBe("Coada de la pranz si reclamatia");
  });

  it("nu lasă spații duble când numele e doar spații", () => {
    expect(textReminderSms("   ")).not.toContain("  ");
  });
});
