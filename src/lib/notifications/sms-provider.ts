/**
 * Ce furnizor de SMS folosim, dacă vreunul.
 *
 * Până acum `sendSMSNotification` cerea SMSLink și numai SMSLink, cu variabilele citite
 * direct la locul apelului. Efectul, măsurat: pe producție `SMSLINK_CONNECTION_ID` și
 * `SMSLINK_PASSWORD` nu sunt setate, deci treapta SMS era moartă — iar pagina de
 * prezentare promitea clientului remindere pe SMS.
 *
 * Între timp ecosistemul avea deja un expeditor care funcționează: contul Twilio „4PRO",
 * activ, cu număr propriu, din care s-au livrat SMS-uri către numere românești
 * (verificat în istoricul contului: `delivered`, fără cod de eroare). `@aledan/sms` îl
 * suportă complet — furnizorul Twilio e scris, exportat și construit în `dist/`.
 *
 * Deci nu lipsea nici biblioteca, nici credențialele: lipsea legătura dintre ele. Funcția
 * asta e legătura, și e PURĂ ca să poată fi probată fără să trimită nimic nimănui.
 *
 * Ordinea e deliberată: Twilio primul, fiindcă e cel care are chei. SMSLink rămâne ca
 * alternativă — dacă apar credențialele lui, e furnizor local (+40) și probabil mai
 * ieftin decât un long code american.
 */
import type { ProviderConfig } from "@aledan/sms";

type Mediu = Record<string, string | undefined>;

/**
 * `null` înseamnă „niciun furnizor configurat" — apelantul trebuie să sară treapta,
 * nu să încerce și să eșueze. Un eveniment care eșuează se reîncearcă la nesfârșit.
 */
export function resolveSmsConfig(env: Mediu): ProviderConfig | null {
  const sid = env.TWILIO_ACCOUNT_SID?.trim();
  const token = env.TWILIO_AUTH_TOKEN?.trim();
  const from = env.TWILIO_PHONE_NUMBER?.trim();
  if (sid && token && from) {
    return { provider: "twilio", accountSid: sid, authToken: token, phoneNumber: from };
  }

  const connectionId = env.SMSLINK_CONNECTION_ID?.trim();
  const password = env.SMSLINK_PASSWORD?.trim();
  if (connectionId && password) {
    return { provider: "smslink", connectionId, password };
  }

  return null;
}

/** Adevărat dacă treapta SMS poate livra ceva. Pentru gărzile din motor. */
export function smsConfigurat(env: Mediu): boolean {
  return resolveSmsConfig(env) !== null;
}

/**
 * Textul reminderului.
 *
 * Cel de dinainte era în engleză și vorbea despre „streak": «Tutor: Hi X, you haven't
 * studied recently. Open the app and keep your streak alive!». Scris pentru un elev,
 * trimis pe telefonul unui factor poștal — iar SMS-ul e treapta la care ajung tocmai
 * oamenii care n-au deschis nimic altceva, deci e ultimul lucru care ar trebui să sune
 * a altă aplicație.
 *
 * ── De ce FĂRĂ diacritice ────────────────────────────────────────────────────
 * Nu din neglijență. Un SMS cu diacritice iese din alfabetul GSM-7 și se codează UCS-2,
 * unde un segment are **70** de caractere, nu 160. Măsurat pe textul cu diacritice:
 * 114 caractere = **2 segmente**, adică factură dublă. La un client cu mii de oameni,
 * asta se vede.
 *
 * Prins uitându-mă la ieșirea unei probe uscate, care raporta `Parts: 2` pe un text pe
 * care îl credeam scurt. Testul verifica lungimea în caractere — pragul greșit.
 *
 * SMS-ul tranzacțional în România se scrie oricum fără diacritice; celelalte canale
 * (push, Telegram, e-mail, WhatsApp) le păstrează, fiindcă acolo nu costă nimic.
 *
 * ── Ce spune, și de ce exact asta ────────────────────────────────────────────
 * Prima variantă scria „mai ai o lectie de terminat". Ar fi fost FALS pentru o parte
 * din destinatari: cascada se declanșează pe INACTIVITATE (`lastActivityDate` sub prag),
 * nu pe o lecție neterminată — cine a parcurs tot și a tăcut o zi ar fi primit un mesaj
 * despre o lecție care nu există. „N-ai mai intrat de o vreme" e adevărat pentru toți
 * cei pe care mecanismul îi găsește, și nu pretinde să știe cât anume.
 *
 * Numele vine din baza de date, nu din `metadata.userName`: acolo motorul pune „Student"
 * când numele lipsește, ceea ce pe telefonul unui factor poștal ar suna a altă aplicație.
 */
const DIACRITICE: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "A", Â: "A", Î: "I", Ș: "S", Ş: "S", Ț: "T", Ţ: "T",
};

/** Scoate diacriticele românești, ca textul să încapă în alfabetul GSM-7. */
export function faraDiacritice(text: string): string {
  return text.replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (c) => DIACRITICE[c] ?? c);
}

export function textReminderSms(nume: string | undefined): string {
  const cineESte = nume?.trim() ? `${nume.trim()}, ` : "";
  return faraDiacritice(
    `eTutor: ${cineESte}n-ai mai intrat de o vreme. Reia de unde ai ramas, in zece minute: etutor.ro`
  );
}
