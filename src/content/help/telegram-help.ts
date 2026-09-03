/**
 * What the bot answers to /help (and to a bare /start).
 *
 * The bot only ever said three things, all of them about linking or unlinking, so
 * someone who typed anything else got silence — including the person wondering why
 * a study reminder had arrived at all.
 */
export function telegramHelpReply(): string {
  return [
    "Botul eTutor îți trimite:",
    "• mementourile de studiu, la orele din programul tău",
    "• alertele despre copil (dacă ești părinte sau meditator)",
    "• raportul de progres",
    "",
    "Apasă butonul din mesaj ca să confirmi că l-ai văzut — așa se oprește restul lanțului " +
      "(email, WhatsApp).",
    "",
    "Comenzi:",
    "/help — mesajul acesta",
    "/stop — te dezabonezi (reactivezi oricând din Setări → Notificări, pe etutor.ro)",
  ].join("\n");
}
