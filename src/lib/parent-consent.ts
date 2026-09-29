/**
 * A parent's consent for a learner under 16 who makes their own account (Alex, 28.09.2026; GDPR
 * art. 8). The learner gives a date of birth; under 16 also a parent's email, which gets a link to
 * agree or refuse. The account works for 7 days while the answer is awaited; without it, it stops. A
 * child whose parent is in the account (linked, or who made the account from „Familia mea”) is
 * covered by that parent and never asked.
 *
 * A refusal erases the account — and so does silence: 30 days after the account stops without an
 * answer (account-erasure.ts). The evidence (which text the parent was shown, what they answered,
 * when, from where; and that the account was then erased) is kept by the Legal Hub, not here
 * (lib/legal/guardian.ts): eTutor keeps only the dates it needs to run the account.
 */
import { randomBytes } from "node:crypto";
import { escapeHtml } from "@/lib/sanitize";
import { needsParentConsent } from "@/lib/age";
import { endOfBucharestDay } from "@/lib/bucharest-day";

export const CONSENT_GRACE_DAYS = 7;
/** Days an account stays stopped without any parent's answer before it is erased. */
export const CONSENT_ERASE_AFTER_DAYS = 30;
export const CONSENT_LINK_DAYS = 14;
/** Emails to a parent one account may trigger in a day (a mistyped address, a lost email). */
export const CONSENT_SENDS_PER_DAY = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export const consentTokenId = (userId: string) => `parent-consent:${userId}`;
export const consentSentId = (userId: string) => `parent-consent-sent:${userId}`;
/** Emails one address may receive in a day, from all accounts together (anyone can type an address). */
export const consentToId = (email: string) => `parent-consent-to:${email.toLowerCase()}`;
export const newConsentToken = () => randomBytes(32).toString("hex");

export type ConsentFacts = {
  accountRole: string | null;
  /** Enrolled as a student somewhere. */
  learning: boolean;
  /** Has an active parent link. */
  isChild: boolean;
  /** Tutor, instructor, administrator or the platform owner. */
  staff: boolean;
  /** A parent in the account (has an active child link): not asked, even with an old student enrollment. */
  isParent: boolean;
  isGuest: boolean;
  organizationId: string | null;
  /** Learns in a subject a company pays for (a course invitation, like Poșta's): adults at work. */
  companyCovered: boolean;
  /** Pays by card: without an answer it isn't locked out of what it pays for (the parent is still asked). A free code doesn't count. */
  paying: boolean;
  birthDate: Date | null;
  parentConsentEmail: string | null;
  parentConsentRequestedAt: Date | null;
  parentConsentAt: Date | null;
  parentConsentRefusedAt: Date | null;
};

export type ConsentState =
  | { kind: "none" }
  /** A learner on their own account whose date of birth isn't known: asked before anything else. */
  | { kind: "ask-age" }
  /** Under 16, no parent's email yet. */
  | { kind: "ask-parent" }
  | { kind: "waiting"; parentEmail: string; daysLeft: number }
  | { kind: "blocked"; reason: "no-answer" | "refused"; parentEmail: string | null };

/**
 * When an account no parent answered for is erased: 7 days of use, then 30 stopped — at the end of that
 * day in Bucharest, so „until 8 October” holds for the whole of 8 October.
 */
export const consentEraseAt = (requestedAt: Date) =>
  endOfBucharestDay(new Date(requestedAt.getTime() + (CONSENT_GRACE_DAYS + CONSENT_ERASE_AFTER_DAYS) * DAY_MS));

/**
 * The erasure date a learner and a parent are told: day 37, but never less than two days away — whoever
 * hears of it late (a request that started over, a cover that ended) still gets those two days. Once
 * the last reminder has named a date, that date holds (parent-consent-server.ts consentEraseOnFor).
 */
export const consentEraseOnFrom = (requestedAt: Date, now: Date = new Date()) =>
  new Date(Math.max(consentEraseAt(requestedAt).getTime(), endOfBucharestDay(new Date(now.getTime() + 2 * DAY_MS)).getTime()));

/**
 * A learner who sends the request to another parent after the last reminder: that parent gets two days
 * too, but the erasure never moves more than a week past day 37 (a learner could otherwise keep typing
 * new addresses to keep the account).
 */
export const CONSENT_ERASE_EXTENSION_DAYS = 7;
export const consentLatestEraseAt = (requestedAt: Date) =>
  endOfBucharestDay(new Date(requestedAt.getTime() + (CONSENT_GRACE_DAYS + CONSENT_ERASE_AFTER_DAYS + CONSENT_ERASE_EXTENSION_DAYS) * DAY_MS));

export type ReminderStage = "stopped" | "week_before" | "two_days_before";

/** The record that a reminder went out (one per stage per waiting period). */
export const consentReminderId = (userId: string, stage: ReminderStage) => `parent-consent-reminder:${userId}:${stage}`;

/**
 * A reminder's record carries the waiting period it belongs to (the first request's time) and the date
 * it named. A record from an earlier period — the request started over, a parent's cover came and went —
 * never counts for the current one.
 */
export const consentReminderToken = (userId: string, stage: ReminderStage, requestedAt: Date, eraseOn: Date) =>
  `reminder:${userId}:${stage}:${requestedAt.getTime()}:${eraseOn.getTime()}`;

/** The period and the named date of a reminder's record, or null for a record of another shape. */
export function parseConsentReminderToken(token: string): { requestedAt: number; eraseOn: number } | null {
  const parts = token.split(":");
  if (parts.length !== 5 || parts[0] !== "reminder") return null;
  const requestedAt = Number(parts[3]);
  const eraseOn = Number(parts[4]);
  return Number.isFinite(requestedAt) && Number.isFinite(eraseOn) ? { requestedAt, eraseOn } : null;
}

/**
 * Still waiting for a parent after the 7 days: stopped for want of an answer, or — an account paid by
 * card — still open but just as unanswered (it gets the reminders, and a person at the end).
 */
export const consentAwaitingPastGrace = (s: ConsentState) =>
  (s.kind === "blocked" && s.reason === "no-answer") || (s.kind === "waiting" && s.daysLeft === 0);

/** The states that stop the account (pages, the learning API and the messages it would get). */
export const consentStops = (s: ConsentState) => s.kind === "blocked" || s.kind === "ask-parent";

/** Pure. What the account must do about age and consent now. */
export function consentState(u: ConsentFacts, now: Date = new Date()): ConsentState {
  const learner = u.accountRole === "STUDENT" || (u.accountRole == null && u.learning && !u.isParent);
  // Adults at a company, invited guests, staff, parents and a child a parent covers aren't asked.
  if (!learner) return { kind: "none" };
  // A parent's „no” holds over every exemption below (a course code, a family link) and over the 16th
  // birthday that may come before the erasure finishes: only a „yes” lifts it.
  if (u.parentConsentRefusedAt && !u.parentConsentAt) {
    return { kind: "blocked", reason: "refused", parentEmail: u.parentConsentEmail };
  }
  const minor = u.birthDate != null && needsParentConsent(u.birthDate, now);
  // A company's course covers an adult at work — not a declared minor still without a parent's „yes”
  // (a course code typed during the week of waiting mustn't replace the answer).
  const companyExempt = u.companyCovered && !(minor && !u.parentConsentAt);
  if (u.staff || u.isGuest || u.organizationId || companyExempt) return { kind: "none" };
  // A parent in the account covers the child — but not over a parent's recorded „no”.
  if (u.isChild && !u.parentConsentRefusedAt) return { kind: "none" };
  if (u.birthDate == null) return { kind: "ask-age" };
  // From the 16th birthday the learner consents alone: the question ends that very day.
  if (!needsParentConsent(u.birthDate, now)) return { kind: "none" };
  if (u.parentConsentAt) return { kind: "none" };
  // A refusal is final: the account is erased (account-erasure.ts). Until that has happened it stays shut.
  if (u.parentConsentRefusedAt) return { kind: "blocked", reason: "refused", parentEmail: u.parentConsentEmail };
  if (!u.parentConsentEmail || !u.parentConsentRequestedAt) return { kind: "ask-parent" };
  const ends = u.parentConsentRequestedAt.getTime() + CONSENT_GRACE_DAYS * DAY_MS;
  const daysLeft = Math.max(0, Math.ceil((ends - now.getTime()) / DAY_MS));
  if (daysLeft === 0 && !u.paying) return { kind: "blocked", reason: "no-answer", parentEmail: u.parentConsentEmail };
  return { kind: "waiting", parentEmail: u.parentConsentEmail, daysLeft };
}

/** „a***@gmail.com”: enough for the learner to recognise the address, not to read it off a screen. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

const ERASE_DATE_RO = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "long", year: "numeric" });
const ERASE_DATE_EN = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", day: "numeric", month: "long", year: "numeric" });

export function consentEmail(
  locale: "ro" | "en",
  childName: string | null,
  childLogin: string,
  url: string,
  daysLeft: number,
  /** When the account is erased if no parent answers (consentEraseOnFor). */
  eraseOn?: Date,
  /** A card subscription runs on the account: it isn't stopped, and a „no” is finished by a person. */
  paying = false,
) {
  // A name is typed by the learner: never in the subject (it would carry any text to any address),
  // escaped and one line in the body.
  const plainName = childName?.replace(/[\r\n]+/g, " ").trim().slice(0, 80) || null;
  const who = escapeHtml(plainName || childLogin);
  const login = escapeHtml(childLogin);
  const button = (label: string) =>
    `<p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a></p>`;
  const onRo = eraseOn ? ERASE_DATE_RO.format(eraseOn) : null;
  const onEn = eraseOn ? ERASE_DATE_EN.format(eraseOn) : null;
  // What happens next depends on where the account is: still in its 7 days, stopped, or paid for.
  const daysRo =
    daysLeft <= 0
      ? paying
        ? `Contul are un abonament plătit, așa că merge în continuare, dar fără acordul unui părinte nu-l putem păstra${onRo ? `: dacă nu răspunde niciun părinte până pe ${onRo}, oprim abonamentul și ștergem contul, cu tot ce a lucrat` : ""}.`
        : `Contul e oprit până răspunde un părinte.${onRo ? ` Dacă nu răspunde niciunul, se șterge pe ${onRo}, cu tot ce a lucrat.` : ""}`
      : `Contul mai merge ${daysLeft === 1 ? "o zi" : `${daysLeft} zile`} cât așteptăm răspunsul tău, apoi se oprește.${onRo ? ` Dacă nu răspunde niciun părinte, se șterge pe ${onRo}, cu tot ce a lucrat.` : ""}`;
  const daysEn =
    daysLeft <= 0
      ? paying
        ? `The account has a paid subscription, so it keeps working, but without a parent's consent we can't keep it${onEn ? `: if no parent answers by ${onEn}, we stop the subscription and erase the account, with everything your child did` : ""}.`
        : `The account is stopped until a parent answers.${onEn ? ` If none does, it is erased on ${onEn}, with everything your child did.` : ""}`
      : `The account works ${daysLeft === 1 ? "one more day" : `${daysLeft} more days`} while we wait for your answer, then it stops.${onEn ? ` If no parent answers, it is erased on ${onEn}, with everything your child did.` : ""}`;
  const refuseRo = paying
    ? "Dacă nu ești de acord, oprim abonamentul și ștergem contul în cel mult 30 de zile, păstrând doar documentele de plată."
    : "Dacă nu ești de acord, îl ștergem imediat.";
  const refuseEn = paying
    ? "If you don't agree, we stop the subscription and erase the account within 30 days, keeping only the payment records."
    : "If you don't agree, we erase it at once.";
  if (locale === "en") {
    return {
      subject: "A parent's consent for an eTutor.ro student account",
      html: `<p>Hello,</p>
<p><strong>${who}</strong> (${login}) made an account on eTutor.ro, a learning platform for school subjects and exams, and gave your address as a parent's. Under 16, the law asks for a parent's consent.</p>
${button("See and answer")}
<p>${daysEn} ${refuseEn} If you don't know what this is about, you can ignore this email.</p>
<p style="color:#888;font-size:12px;">eTutor.ro</p>`,
    };
  }
  return {
    subject: "Acordul unui părinte pentru un cont de elev pe eTutor.ro",
    html: `<p>Bună ziua,</p>
<p><strong>${who}</strong> (${login}) și-a făcut cont pe eTutor.ro, o platformă de învățat pentru materiile de la școală și examene, și a dat adresa ta ca părinte. Sub 16 ani, legea cere acordul unui părinte.</p>
${button("Văd și răspund")}
<p>${daysRo} ${refuseRo} Dacă nu știi despre ce e vorba, poți ignora emailul.</p>
<p style="color:#888;font-size:12px;">eTutor.ro</p>`,
  };
}
