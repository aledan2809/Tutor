/**
 * The short in-page blocks. Same facts as the help page, cut to what someone
 * needs while standing on that particular screen.
 */

import {
  CASCADE_GRACE_MINUTES,
  ESCALATION_LEVELS,
  ESCALATION_PRESETS,
  NUDGE_MAX_AGE_HOURS,
  NUDGE_MAX_FIRES,
  ON_TIME_WINDOW_MIN,
  PARENT_RENOTIFY_MIN,
  QUIET_HOURS_DEFAULT,
} from "@/lib/escalation/config";
import {
  DEFAULT_LEVELS,
  LEADERBOARD_TOP,
  ON_TIME_BONUS,
  STREAK_RECOVERY,
  XP_REWARDS,
} from "@/lib/gamification-constants";
import type { HowItWorksBlock, HowItWorksKey, Locale } from "./types";

const step = (c: string) => ESCALATION_LEVELS.find((l) => l.channel === c)?.delayMinutes ?? 0;
const TG = step("TELEGRAM");
const EM = step("EMAIL");
const WA = step("WHATSAPP");
const BLAND = ESCALATION_PRESETS.BLAND[1]?.delayMinutes ?? 0;
const INSISTENT = ESCALATION_PRESETS.INSISTENT[1]?.delayMinutes ?? 0;
const RECOVERY_MIN = STREAK_RECOVERY.timeLimitMs / 60_000;
const LADDER = DEFAULT_LEVELS.map((l) => `${l.name} ${l.minXp.toLocaleString("ro-RO")}`).join(" → ");
const LADDER_EN = DEFAULT_LEVELS.map((l) => `${l.name} ${l.minXp}`).join(" → ");

export const HOW_IT_WORKS: Record<HowItWorksKey, Record<Locale, HowItWorksBlock>> = {
  watcher: {
    ro: {
      more: "monitorizare",
      steps: [
        "Fiecare copil are un capitol: Sesiuni (ce a lucrat și cu ce scor), Remindere (ce a primit și dacă a reacționat), Program (zilele și orele) și Vacanță (zile fără remindere).",
        "Datele sunt la zi la fiecare deschidere a paginii — nu aștepți raportul ca să vezi cum a fost azi.",
        "Ești anunțat doar când copilul ignoră tot lanțul într-o zi cu program. Raportul vine separat, în ziua și la ora alese mai jos.",
        `Poți trimite un reminder chiar acum, pe canalele gratuite; se repetă până reacționează, de cel mult ${NUDGE_MAX_FIRES} ori și cel mult ${NUDGE_MAX_AGE_HOURS} de ore.`,
      ],
    },
    en: {
      more: "monitorizare",
      steps: [
        "Each child has a chapter: Sessions, Reminders (what arrived and whether they reacted), Schedule and Holidays.",
        "The data is current every time you open the page — no need to wait for the report.",
        "You are alerted only when the whole chain is ignored on a scheduled day. The report is separate, on the day and hour set below.",
        `You can send a reminder right now on the free channels; it repeats until they react, at most ${NUDGE_MAX_FIRES} times and for at most ${NUDGE_MAX_AGE_HOURS} hours.`,
      ],
    },
  },

  rapoarte: {
    ro: {
      more: "raport",
      steps: [
        `„La timp” = sesiunea a început în cel mult ${ON_TIME_WINDOW_MIN} de minute de la reminder. „Întârziate” = mai târziu, în aceeași zi. „Ignorate” = nici apăsare pe reminder, nici sesiune în ziua aceea.`,
        "Perioada în curs apare aici înainte să fie trimisă — verifici oricând, nu doar când ajunge mesajul.",
        "„Zilnic” = ultimele 24 de ore, „Săptămânal” = ultimele 7 zile; fiecare e comparată cu ultimele cinci de același fel.",
        "Elevul vede aceeași pagină, despre el.",
      ],
    },
    en: {
      more: "raport",
      steps: [
        `"On time" = the session started within ${ON_TIME_WINDOW_MIN} minutes of the reminder. "Late" = later the same day. "Ignored" = no tap and no session that day.`,
        "The period in progress shows here before it is sent — check any time, not only when the message arrives.",
        '"Daily" = last 24 hours, "Weekly" = last 7 days; each is compared with the previous five of the same kind.',
        "The student sees the same page, about themselves.",
      ],
    },
  },

  cascade: {
    ro: {
      more: "alerte",
      steps: [
        `Copilul primește în ordinea: aplicație (imediat) → Telegram (după ${TG} min) → email (după încă ${EM}) → WhatsApp (după încă ${WA}, doar în pachetele plătite).`,
        `Lanțul se oprește când apasă pe notificarea din aplicație sau pe butonul din Telegram, ori termină o sesiune. Între ${QUIET_HOURS_DEFAULT.start} și ${QUIET_HOURS_DEFAULT.end} pleacă doar notificarea din aplicație.`,
        `Ritmuri: Blând = aplicație → email după ${BLAND} min · Standard = cel de mai sus · Insistent = câte ${INSISTENT} min între canale. La reminderele programate: ~${CASCADE_GRACE_MINUTES.morning} min dimineața, ~${CASCADE_GRACE_MINUTES.evening} seara.`,
        `Tu ești anunțat doar dacă a ignorat tot lanțul, într-o zi cu program — apoi re-anunțat la ${PARENT_RENOTIFY_MIN} de minute, sau cum alegi mai jos.`,
      ],
    },
    en: {
      more: "alerte",
      steps: [
        `Your child gets: app (immediately) → Telegram (after ${TG} min) → email (after another ${EM}) → WhatsApp (after another ${WA}, paid plans only).`,
        `The chain stops when they tap the in-app notification or the Telegram button, or finish a session. Between ${QUIET_HOURS_DEFAULT.start} and ${QUIET_HOURS_DEFAULT.end} only the in-app notification goes out.`,
        `Pace: Gentle = app → email after ${BLAND} min · Standard = the above · Insistent = ${INSISTENT} min between channels. For scheduled reminders: ~${CASCADE_GRACE_MINUTES.morning} min in the morning, ~${CASCADE_GRACE_MINUTES.evening} in the evening.`,
        `You are alerted only if the whole chain was ignored on a scheduled day — then re-alerted every ${PARENT_RENOTIFY_MIN} minutes, or as you choose below.`,
      ],
    },
  },

  progress: {
    ro: {
      more: "puncte",
      steps: [
        `${XP_REWARDS.CORRECT_ANSWER} puncte pentru fiecare răspuns corect (+${XP_REWARDS.FAST_ANSWER_BONUS} sub 5 secunde), ${XP_REWARDS.SESSION_COMPLETE} la fiecare sesiune terminată (+${XP_REWARDS.PERFECT_SCORE} fără greșeală), +${ON_TIME_BONUS} dacă termini în ${ON_TIME_WINDOW_MIN} de minute de la reminder.`,
        `Niveluri implicite: ${LADDER} puncte. Materia ta poate avea alte praguri — le vezi în Realizări.`,
        `Serie = zilele CU PROGRAM în care ai terminat o sesiune. Weekendul fără program n-o rupe. Dacă s-a rupt, o recuperezi în ${STREAK_RECOVERY.maxMissedDays} zile: ${STREAK_RECOVERY.questions} întrebări în ${RECOVERY_MIN} minute, minimum ${STREAK_RECOVERY.requiredCorrect} corecte.`,
        `Clasament = punctele săptămânii, în grupa ta; se resetează lunea, primii ${LEADERBOARD_TOP} apar în Realizări.`,
      ],
    },
    en: {
      more: "puncte",
      steps: [
        `${XP_REWARDS.CORRECT_ANSWER} points per correct answer (+${XP_REWARDS.FAST_ANSWER_BONUS} under 5 seconds), ${XP_REWARDS.SESSION_COMPLETE} per finished session (+${XP_REWARDS.PERFECT_SCORE} for a perfect one), +${ON_TIME_BONUS} for finishing within ${ON_TIME_WINDOW_MIN} minutes of the reminder.`,
        `Default levels: ${LADDER_EN} points. Your subject may set its own — see Achievements.`,
        `Streak = SCHEDULED days on which you finished a session. A schedule-free weekend does not break it. If it breaks, recover within ${STREAK_RECOVERY.maxMissedDays} days: ${STREAK_RECOVERY.questions} questions in ${RECOVERY_MIN} minutes, at least ${STREAK_RECOVERY.requiredCorrect} correct.`,
        `Leaderboard = this week's points in your group; resets on Monday, top ${LEADERBOARD_TOP} shown in Achievements.`,
      ],
    },
  },

  notifSettings: {
    ro: {
      more: "mementouri",
      steps: [
        `Ordinea implicită: aplicație → Telegram → email → WhatsApp. Dacă nu reacționezi pe primul canal, trecem la următorul; ordinea o schimbi mai jos.`,
        "Telegram e gratuit și instant, iar butonul din mesaj oprește restul lanțului dintr-o apăsare.",
        `Programul de studiu decide când pleacă primul reminder; între ${QUIET_HOURS_DEFAULT.start} și ${QUIET_HOURS_DEFAULT.end} restul lanțului așteaptă dimineața.`,
        "Apeși pe notificarea din aplicație sau pe butonul din Telegram, ori termini o sesiune — lanțul se oprește acolo.",
      ],
    },
    en: {
      more: "mementouri",
      steps: [
        "Default order: app → Telegram → email → WhatsApp. If you do not react on the first channel we move to the next; you can reorder below.",
        "Telegram is free and instant, and the button in the message stops the rest of the chain with one tap.",
        `Your study schedule decides when the first reminder goes out; between ${QUIET_HOURS_DEFAULT.start} and ${QUIET_HOURS_DEFAULT.end} the rest of the chain waits until morning.`,
        "Tap the in-app notification or the Telegram button, or finish a session — the chain stops there.",
      ],
    },
  },
};
