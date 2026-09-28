/**
 * A parent's consent for a learner under 16 who makes their own account (Alex, 28.09.2026; GDPR
 * art. 8). The learner gives a year of birth; under 16 also a parent's email, which gets a link to
 * agree or refuse. The account works for 7 days while the answer is awaited; without it — or after a
 * refusal — it waits for the parent. A child whose parent is in the account (linked, or who made the
 * account from „Familia mea”) is covered by that parent and never asked.
 *
 * The answer is kept as evidence (ParentalConsent: who, which text, when, from where).
 * TODO(legal): the text below is to be confirmed by the legal counsel; Legal Hub doesn't record this
 * kind of consent yet (NO-TOUCH project), so the evidence stays here for now.
 */
import { randomBytes } from "node:crypto";
import { escapeHtml } from "@/lib/sanitize";
import { needsParentConsent } from "@/lib/age";

export const PARENT_CONSENT_VERSION = "PC-2026-09-28";
export const CONSENT_GRACE_DAYS = 7;
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
  birthYear: number | null;
  parentConsentEmail: string | null;
  parentConsentRequestedAt: Date | null;
  parentConsentAt: Date | null;
  parentConsentRefusedAt: Date | null;
};

export type ConsentState =
  | { kind: "none" }
  /** A learner on their own account whose year of birth isn't known: asked before anything else. */
  | { kind: "ask-age" }
  /** Under 16, no parent's email yet. */
  | { kind: "ask-parent" }
  | { kind: "waiting"; parentEmail: string; daysLeft: number }
  | { kind: "blocked"; reason: "no-answer" | "refused"; parentEmail: string | null };

/** The states that stop the account (pages, the learning API and the messages it would get). */
export const consentStops = (s: ConsentState) => s.kind === "blocked" || s.kind === "ask-parent";

/** Pure. What the account must do about age and consent now. */
export function consentState(u: ConsentFacts, now: Date = new Date()): ConsentState {
  const learner = u.accountRole === "STUDENT" || (u.accountRole == null && u.learning && !u.isParent);
  // Adults at a company, invited guests, staff, parents and a child a parent covers aren't asked.
  if (!learner) return { kind: "none" };
  // A parent's „no” holds over every exemption below (a course code, a family link): only a „yes” lifts it.
  const minor = u.birthYear != null && needsParentConsent(u.birthYear, now);
  if (minor && u.parentConsentRefusedAt && !u.parentConsentAt) {
    return { kind: "blocked", reason: "refused", parentEmail: u.parentConsentEmail };
  }
  // A company's course covers an adult at work — not a declared minor still without a parent's „yes”
  // (a course code typed during the week of waiting mustn't replace the answer).
  const companyExempt = u.companyCovered && !(minor && !u.parentConsentAt);
  if (u.staff || u.isGuest || u.organizationId || companyExempt) return { kind: "none" };
  // A parent in the account covers the child — but not over a parent's recorded „no”.
  if (u.isChild && !u.parentConsentRefusedAt) return { kind: "none" };
  if (u.birthYear == null) return { kind: "ask-age" };
  if (!needsParentConsent(u.birthYear, now)) return { kind: "none" };
  if (u.parentConsentAt) return { kind: "none" };
  // A refusal holds until a parent agrees: asking another parent doesn't reopen the account meanwhile.
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

export function consentEmail(locale: "ro" | "en", childName: string | null, childLogin: string, url: string, daysLeft: number) {
  // A name is typed by the learner: never in the subject (it would carry any text to any address),
  // escaped and one line in the body.
  const plainName = childName?.replace(/[\r\n]+/g, " ").trim().slice(0, 80) || null;
  const who = escapeHtml(plainName || childLogin);
  const login = escapeHtml(childLogin);
  const button = (label: string) =>
    `<p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a></p>`;
  const daysRo = daysLeft <= 0 ? "Contul așteaptă răspunsul tău." : daysLeft === 1 ? "Contul mai merge o zi cât așteptăm răspunsul tău." : `Contul mai merge ${daysLeft} zile cât așteptăm răspunsul tău.`;
  const daysEn = daysLeft <= 0 ? "The account is waiting for your answer." : daysLeft === 1 ? "The account works one more day while we wait for your answer." : `The account works ${daysLeft} more days while we wait for your answer.`;
  if (locale === "en") {
    return {
      subject: "A parent's consent for an eTutor.ro student account",
      html: `<p>Hello,</p>
<p><strong>${who}</strong> (${login}) made an account on eTutor.ro, a learning platform for school subjects and exams, and gave your address as a parent's. Under 16, the law asks for a parent's consent.</p>
${button("See and answer")}
<p>${daysEn} If you don't know what this is about, ignore this email: without your consent the account stops.</p>
<p style="color:#888;font-size:12px;">eTutor.ro</p>`,
    };
  }
  return {
    subject: "Acordul unui părinte pentru un cont de elev pe eTutor.ro",
    html: `<p>Bună ziua,</p>
<p><strong>${who}</strong> (${login}) și-a făcut cont pe eTutor.ro, o platformă de învățat pentru materiile de la școală și examene, și a dat adresa ta ca părinte. Sub 16 ani, legea cere acordul unui părinte.</p>
${button("Văd și răspund")}
<p>${daysRo} Dacă nu știi despre ce e vorba, ignoră emailul: fără acordul tău, contul se oprește.</p>
<p style="color:#888;font-size:12px;">eTutor.ro</p>`,
  };
}
