/**
 * Reminders to a parent who hasn't answered for a learner under 16 (Alex, 29.09.2026: three, no
 * offer): when the account stops (day 7), 7 days before it is erased (day 30) and 2 days before
 * (day 35). The erasure itself waits for the date the last reminder named — the end of that day in
 * Bucharest, at least two days after the reminder (account-erasure.ts reads it from the record).
 *
 * Only the answer is asked for — never a price, an offer or a sales link: the address came from the
 * child, for the consent alone, and a consent tied to a benefit isn't freely given. An account a card
 * pays for isn't stopped, but its parent gets the same reminders (worded for it) and, at the end, a
 * person stops the subscription and erases it.
 *
 * Each reminder's record belongs to one waiting period (parent-consent.ts consentReminderToken): one
 * from an earlier period never counts. A reminder that no transport accepted is tried again the next
 * hour, up to REMINDER_SEND_ATTEMPTS times — the account is never erased on a date nobody was told,
 * unless the address keeps refusing mail.
 *
 * dueConsentReminder and reminderEmail are pure; runConsentReminders reads, sends and records.
 */
import { prisma } from "@/lib/prisma";
import { sendAppEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { escapeHtml } from "@/lib/sanitize";
import { withCronLease } from "@/lib/cron-lease";
import { resolveIsTest } from "@/lib/notifications/test-account";
import {
  consentAwaitingPastGrace,
  consentEraseOnFrom,
  consentReminderId,
  consentReminderToken,
  consentState,
  parseConsentReminderToken,
  type ReminderStage,
} from "@/lib/parent-consent";
import { consentLinkForReminder, loadConsentFacts } from "@/lib/parent-consent-server";
import { inMessageWindow } from "@/lib/message-window";

export type { ReminderStage };

/** Days from the first request to each reminder. */
export const REMINDER_AT_DAYS: Record<ReminderStage, number> = { stopped: 7, week_before: 30, two_days_before: 35 };
/** Latest first: a late run sends only the most relevant one, never an earlier one after a later. */
const LATEST_FIRST: ReminderStage[] = ["two_days_before", "week_before", "stopped"];
/** Sends of one reminder refused by every transport before it counts as sent anyway (a dead address). */
export const REMINDER_SEND_ATTEMPTS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Inside the 10-minute lease, with room to finish the account in hand. */
const RUN_BUDGET_MS = 8 * 60_000;

export const reminderId = consentReminderId;
const failId = (userId: string, stage: ReminderStage) => `parent-consent-reminder-fail:${userId}:${stage}`;

/** The date a reminder names (parent-consent.ts consentEraseOnFrom). */
export const reminderEraseOn = consentEraseOnFrom;

/** The reminder this account should get now, or null. */
export function dueConsentReminder(requestedAt: Date, now: Date, sent: ReadonlySet<ReminderStage>): ReminderStage | null {
  const days = (now.getTime() - requestedAt.getTime()) / DAY_MS;
  for (let i = 0; i < LATEST_FIRST.length; i++) {
    const stage = LATEST_FIRST[i];
    if (days < REMINDER_AT_DAYS[stage]) continue;
    // This one, or a later one, went out already: nothing now.
    return LATEST_FIRST.slice(0, i + 1).some((s) => sent.has(s)) ? null : stage;
  }
  return null;
}

const DATE = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "long", year: "numeric" });

export function reminderEmail(
  stage: ReminderStage,
  childName: string | null,
  childLogin: string,
  url: string,
  eraseOn: Date,
  /** A card subscription runs on the account: it isn't stopped, and a person ends it. */
  paying = false,
) {
  // A name is typed by the learner: never in the subject, escaped and one line in the body.
  const plainName = childName?.replace(/[\r\n]+/g, " ").trim().slice(0, 80) || null;
  const who = escapeHtml(plainName || childLogin);
  const login = escapeHtml(childLogin);
  const on = DATE.format(eraseOn);
  const lead = paying
    ? "N-am primit încă răspunsul tău. Contul are un abonament plătit, așa că merge în continuare, dar fără acordul unui părinte nu-l putem păstra."
    : stage === "stopped"
      ? "N-am primit încă răspunsul tău, așa că, de azi, contul copilului e oprit."
      : "N-am primit încă răspunsul tău, iar contul copilului e oprit.";
  const then = paying
    ? `Dacă nu răspunde niciun părinte până pe <strong>${on}</strong>, oprim abonamentul și ștergem contul și tot ce a lucrat pe platformă.`
    : `Dacă nu răspunde niciun părinte până pe <strong>${on}</strong>, ștergem contul și tot ce a lucrat pe platformă.`;
  return {
    subject:
      stage === "two_days_before"
        ? `Contul de elev de pe eTutor.ro se șterge pe ${on}`
        : "Așteptăm acordul tău pentru un cont de elev pe eTutor.ro",
    html: `<p>Bună ziua,</p>
<p><strong>${who}</strong> (${login}) și-a făcut cont pe eTutor.ro și a dat adresa ta ca părinte. Sub 16 ani, legea cere acordul unui părinte. ${lead}</p>
<p>${then}</p>
<p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">Văd și răspund</a></p>
<p>Poți răspunde din oricare e-mail de la noi: linkul e același. Dacă nu știi despre ce e vorba, ignoră e-mailul.</p>
<p style="color:#888;font-size:12px;">eTutor.ro</p>`,
  };
}

/** Cron: the reminders that are due, between 9:00 and 20:00, one per account per run. */
export async function runConsentReminders(now: Date = new Date()): Promise<{ ran: boolean; sent: number; skippedTest: number; failed: number }> {
  if (!inMessageWindow(now)) return { ran: false, sent: 0, skippedTest: 0, failed: 0 };
  const run = await withCronLease("consent-reminders", 10 * 60_000, async () => {
    const started = Date.now();
    let sent = 0;
    let skippedTest = 0;
    let failed = 0;
    // Only accounts that can still be due: under 16 (a day's margin; the exact age is read below), no
    // parent in the account. Read in pages by id, all of them — none is left out for being late in the list.
    const under16 = new Date(Date.UTC(now.getUTCFullYear() - 16, now.getUTCMonth(), now.getUTCDate() - 1));
    let cursor: string | undefined;
    while (Date.now() - started < RUN_BUDGET_MS) {
      const page = await prisma.user.findMany({
        where: {
          ...(cursor ? { id: { gt: cursor } } : {}),
          parentConsentEmail: { not: null },
          parentConsentAt: null,
          parentConsentRefusedAt: null,
          parentConsentRequestedAt: { lte: new Date(now.getTime() - REMINDER_AT_DAYS.stopped * DAY_MS) },
          birthDate: { gt: under16 },
          guardianLinks: { none: { status: "active", relation: "PARENT" } },
        },
        select: { id: true, name: true, email: true, username: true, parentConsentEmail: true, parentConsentRequestedAt: true },
        orderBy: { id: "asc" },
        take: 200,
      });
      if (page.length === 0) break;
      cursor = page[page.length - 1].id;
      for (const c of page) {
        if (Date.now() - started >= RUN_BUDGET_MS) break;
        if (!c.parentConsentEmail || !c.parentConsentRequestedAt) continue;
        try {
          // Still waiting for an answer past the 7 days (stopped — or open because a card pays for it).
          const facts = await loadConsentFacts(c.id);
          if (!facts) continue;
          const state = consentState(facts, now);
          if (!consentAwaitingPastGrace(state)) continue;
          const paying = state.kind === "waiting";
          const requestedAt = c.parentConsentRequestedAt;
          const records = await prisma.verificationToken.findMany({
            where: { identifier: { startsWith: `parent-consent-reminder:${c.id}:` } },
            select: { identifier: true, token: true },
          });
          const sentStages = new Set(
            (Object.keys(REMINDER_AT_DAYS) as ReminderStage[]).filter((s) =>
              records.some((m) => m.identifier === reminderId(c.id, s) && parseConsentReminderToken(m.token)?.requestedAt === requestedAt.getTime()),
            ),
          );
          const stage = dueConsentReminder(requestedAt, now, sentStages);
          if (!stage) continue;
          const eraseOn = reminderEraseOn(requestedAt, now);

          const link = await consentLinkForReminder(c.id, c.parentConsentEmail, eraseOn);
          if (!link.ok) continue;
          // Recorded before sending: a reminder goes out at most once, even if the run dies right after.
          // The record carries the waiting period and the date it names: the erasure waits for it.
          const token = consentReminderToken(c.id, stage, requestedAt, eraseOn);
          await prisma.verificationToken.create({
            data: { identifier: reminderId(c.id, stage), token, expires: new Date(eraseOn.getTime() + 30 * DAY_MS) },
          });
          // Test accounts (journey audits, demos): recorded, never mailed.
          if (resolveIsTest(c.parentConsentEmail)) {
            skippedTest++;
            continue;
          }
          const baseUrl = process.env.AUTH_URL || "https://etutor.ro";
          const { subject, html } = reminderEmail(stage, c.name, c.email ?? c.username ?? "", `${baseUrl}/ro/acord-parinte/${link.token}`, eraseOn, paying);
          if (await sendAppEmail({ to: c.parentConsentEmail, subject, html })) {
            sent++;
            await prisma.verificationToken.deleteMany({ where: { identifier: failId(c.id, stage) } });
            continue;
          }
          failed++;
          // Nobody accepted it: try again the next hour (the date moves with it), unless this address has
          // refused it too often — then it counts as sent and a person can see why in the log.
          const tries =
            (await prisma.verificationToken.count({ where: { identifier: failId(c.id, stage) } })) + 1;
          await prisma.verificationToken.create({
            data: { identifier: failId(c.id, stage), token: `fail:${c.id}:${stage}:${tries}:${Date.now()}`, expires: new Date(eraseOn.getTime() + 60 * DAY_MS) },
          });
          if (tries < REMINDER_SEND_ATTEMPTS) {
            await prisma.verificationToken.deleteMany({ where: { identifier: reminderId(c.id, stage), token } });
            logger.warn("Parent consent reminder not accepted; retried next hour", { userId: c.id, stage, tries });
          } else {
            logger.error("Parent consent reminder refused by every transport, counted as sent", undefined, { userId: c.id, stage, tries });
          }
        } catch (err) {
          failed++;
          logger.error("Parent consent reminder failed for one account", err, { userId: c.id });
        }
      }
      if (page.length < 200) break;
    }
    return { sent, skippedTest, failed };
  });
  return run.ran ? { ran: true, ...run.result } : { ran: false, sent: 0, skippedTest: 0, failed: 0 };
}
