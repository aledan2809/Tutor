/**
 * Sections more than one role needs, written once.
 *
 * Every number is interpolated from the constant the engine actually reads, so a
 * change to the cascade or the points table rewrites the help text on the next
 * build instead of leaving it quietly wrong. The unit tests assert exactly that.
 */

import {
  CASCADE_GRACE_MINUTES,
  ESCALATION_LEVELS,
  ESCALATION_PRESETS,
  NUDGE_MAX_AGE_HOURS,
  ON_TIME_WINDOW_MIN,
  PARENT_RENOTIFY_MIN,
  QUIET_HOURS_DEFAULT,
} from "@/lib/escalation/config";
import type { HelpSection, Locale } from "./types";

/** Minutes between rungs, read off the ladder rather than retyped. */
const step = (channel: string) =>
  ESCALATION_LEVELS.find((l) => l.channel === channel)?.delayMinutes ?? 0;

const TELEGRAM_AFTER = step("TELEGRAM");
const EMAIL_AFTER = step("EMAIL");
const WHATSAPP_AFTER = step("WHATSAPP");
const BLAND_EMAIL_AFTER = ESCALATION_PRESETS.BLAND[1]?.delayMinutes ?? 0;
const INSISTENT_STEP = ESCALATION_PRESETS.INSISTENT[1]?.delayMinutes ?? 0;

/** The chain, and — more useful — what stops it. */
export function cascadeSection(locale: Locale, audience: "self" | "child"): HelpSection {
  const who = audience === "self" ? "tu" : "copilul";
  return locale === "ro"
    ? {
        id: "mementouri",
        title: audience === "self" ? "Cum ajung mementourile la tine" : "Cum ajung mementourile la copil",
        paragraphs: [
          `La ora din program pleacă primul memento, apoi urcăm pe rând, doar dacă ${who} nu reacționează: ` +
            `notificarea din aplicație (imediat) → Telegram (după ${TELEGRAM_AFTER} minute) → ` +
            `email (după încă ${EMAIL_AFTER}) → WhatsApp (după încă ${WHATSAPP_AFTER}, doar în pachetele plătite).`,
          `Lanțul se oprește în clipa în care apeși pe mesaj sau începi o sesiune. Nu trebuie să termini ` +
            `sesiunea ca să se oprească — apăsarea e de ajuns.`,
          `Între ${QUIET_HOURS_DEFAULT.start} și ${QUIET_HOURS_DEFAULT.end} sunt orele de liniște: pleacă ` +
            `doar notificarea din aplicație, restul lanțului așteaptă dimineața.`,
        ],
        bullets: [
          `Blând — aplicație, apoi email după ${BLAND_EMAIL_AFTER} de minute. Fără Telegram, fără WhatsApp.`,
          `Standard — lanțul complet de mai sus.`,
          `Insistent — aplicație, apoi câte ${INSISTENT_STEP} minute între canale.`,
          `La mementourile programate ritmul ține de fereastră: ~${CASCADE_GRACE_MINUTES.morning} minute ` +
            `între canale dimineața (când timpul e scurt), ~${CASCADE_GRACE_MINUTES.evening} seara.`,
        ],
      }
    : {
        id: "mementouri",
        title: audience === "self" ? "How reminders reach you" : "How reminders reach your child",
        paragraphs: [
          `At the scheduled time the first reminder goes out, then we move up one channel at a time, only ` +
            `if there is no reaction: in-app notification (immediately) → Telegram (after ${TELEGRAM_AFTER} ` +
            `minutes) → email (after another ${EMAIL_AFTER}) → WhatsApp (after another ${WHATSAPP_AFTER}, ` +
            `paid plans only).`,
          `The chain stops the moment the message is tapped or a session is started. Finishing the session ` +
            `is not required — the tap is enough.`,
          `Between ${QUIET_HOURS_DEFAULT.start} and ${QUIET_HOURS_DEFAULT.end} only the in-app notification ` +
            `goes out; the rest of the chain waits until morning.`,
        ],
        bullets: [
          `Gentle — app, then email after ${BLAND_EMAIL_AFTER} minutes. No Telegram, no WhatsApp.`,
          `Standard — the full chain above.`,
          `Insistent — app, then ${INSISTENT_STEP} minutes between channels.`,
          `For scheduled reminders the pace follows the window: ~${CASCADE_GRACE_MINUTES.morning} minutes ` +
            `between channels in the morning, ~${CASCADE_GRACE_MINUTES.evening} in the evening.`,
        ],
      };
}

export function telegramSection(locale: Locale, settingsHref: string): HelpSection {
  return locale === "ro"
    ? {
        id: "telegram",
        title: "De ce merită Telegram",
        paragraphs: [
          "Telegram e gratuit și ajunge instant. WhatsApp costă la fiecare mesaj — de aceea abonamentul e " +
            "cu 10% mai ieftin cât timp comunicarea merge pe Telegram.",
          "Conectarea durează un minut și se face o singură dată: de pe telefon apeși linkul, de pe " +
            "calculator scanezi codul QR cu telefonul pe care ai Telegram.",
          "Nu-ți cerem parola și nu vedem conversațiile tale — botul îți poate doar trimite mesaje. " +
            "Poți renunța oricând scriind /stop botului.",
        ],
        links: [{ label: "Conectează Telegram", href: settingsHref }],
      }
    : {
        id: "telegram",
        title: "Why Telegram is worth it",
        paragraphs: [
          "Telegram is free and instant. WhatsApp costs per message — which is why the subscription is 10% " +
            "cheaper while communication goes over Telegram.",
          "Connecting takes a minute, once: on a phone you tap the link, on a computer you scan the QR code " +
            "with the phone that has Telegram.",
          "We never ask for your password and cannot see your conversations — the bot can only send you " +
            "messages. Send /stop to the bot to unsubscribe at any time.",
        ],
        links: [{ label: "Connect Telegram", href: settingsHref }],
      };
}

/** The report, and what its three discipline words actually mean. */
export function reportSection(locale: Locale, audience: "self" | "child"): HelpSection {
  return locale === "ro"
    ? {
        id: "raport",
        title: "Raportul de progres",
        paragraphs: [
          audience === "self"
            ? "Vezi aceeași pagină pe care o vede părintele, dar despre tine — ca să știi cum stai înainte " +
              "să fii întrebat, nu după."
            : "Raportul vine zilnic sau săptămânal, în ziua și la ora pe care le alegi. Perioada în curs se " +
              "vede în aplicație chiar înainte să fie trimisă, deci nu trebuie să aștepți mesajul.",
          "„Zilnic” înseamnă ultimele 24 de ore, „Săptămânal” ultimele 7 zile. Fiecare perioadă e comparată " +
            "cu ultimele cinci de același fel, ca să se vadă direcția, nu doar cifra.",
        ],
        bullets: [
          `La timp — sesiunea a început în cel mult ${ON_TIME_WINDOW_MIN} de minute de la memento.`,
          "Întârziate — a început mai târziu, dar în aceeași zi.",
          "Ignorate — nici nu s-a apăsat pe memento, nici nu s-a făcut vreo sesiune în ziua aceea.",
        ],
        links: [{ label: "Vezi raportul", href: "/dashboard/rapoarte" }],
      }
    : {
        id: "raport",
        title: "The progress report",
        paragraphs: [
          audience === "self"
            ? "You see the same page a parent sees, but about you — so you know where you stand before you " +
              "are asked, not after."
            : "The report arrives daily or weekly, on the day and at the hour you choose. The period in " +
              "progress is visible in the app before it is sent, so you never have to wait for the message.",
          '"Daily" means the last 24 hours, "Weekly" the last 7 days. Each period is compared with the ' +
            "previous five of the same kind, so you see the direction and not just the number.",
        ],
        bullets: [
          `On time — the session started within ${ON_TIME_WINDOW_MIN} minutes of the reminder.`,
          "Late — started later, but the same day.",
          "Ignored — the reminder was never tapped and no session happened that day.",
        ],
        links: [{ label: "Open the report", href: "/dashboard/rapoarte" }],
      };
}

/** Device setup — the one onboarding surface that already exists and works. */
export function setupSection(locale: Locale, forParent: boolean): HelpSection {
  return locale === "ro"
    ? {
        id: "configurare",
        title: "Configurarea, o singură dată",
        paragraphs: [
          (forParent ? "Adaugi copilul, apoi instalezi" : "Instalezi") +
            " aplicația pe telefon, pornești notificările și conectezi Telegram. " +
            "Butonul 🚀 din bara de sus ține minte unde ai rămas.",
          "Instalarea NU e obligatorie — poți primi tot ce trebuie pe Telegram, fără să instalezi nimic.",
        ],
      }
    : {
        id: "configurare",
        title: "Setup, once",
        paragraphs: [
          (forParent ? "Add your child, then install" : "Install") +
            " the app on your phone, turn on notifications and connect Telegram. " +
            "The 🚀 button in the top bar remembers where you left off.",
          "Installing is NOT required — everything can reach you over Telegram instead.",
        ],
      };
}

/** Used by the parent alert copy; kept here so the number has one source. */
export const PARENT_ALERT_FACTS = {
  renotifyMin: PARENT_RENOTIFY_MIN,
  nudgeMaxAgeHours: NUDGE_MAX_AGE_HOURS,
};
