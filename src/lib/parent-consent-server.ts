import { prisma } from "@/lib/prisma";
import { sendAppEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { needsParentConsent } from "@/lib/age";
import { payingForAccess } from "@/lib/access";
import { answerRequestId, recordGuardianEvent } from "@/lib/legal/guardian";
import {
  CONSENT_GRACE_DAYS,
  CONSENT_LINK_DAYS,
  CONSENT_SENDS_PER_DAY,
  consentEmail,
  consentEraseOnFrom,
  consentLatestEraseAt,
  consentReminderId,
  consentReminderToken,
  consentSentId,
  consentState,
  consentStops,
  consentToId,
  consentTokenId,
  newConsentToken,
  parseConsentReminderToken,
  type ConsentFacts,
  type ConsentState,
} from "@/lib/parent-consent";
import { endOfBucharestDay } from "@/lib/bucharest-day";

const DAY_MS = 24 * 60 * 60 * 1000;

export type IssueResult =
  | { ok: true; token: string }
  | { ok: false; reason: "too-many" | "address-busy" | "same-as-child" | "no-account" | "refused" | "not-needed" };

/** Everything consentState needs about one account, read in one go (+ the company check when it matters). */
export async function loadConsentFacts(userId: string): Promise<ConsentFacts | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountRole: true,
      isSuperAdmin: true,
      isGuest: true,
      organizationId: true,
      birthDate: true,
      parentConsentEmail: true,
      parentConsentRequestedAt: true,
      parentConsentAt: true,
      parentConsentRefusedAt: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      stripeSubscriptionId: true,
      enrollments: { where: { isActive: true }, select: { roles: true, domain: { select: { organizationId: true } } } },
      guardianLinks: { where: { status: "active", relation: "PARENT" }, select: { id: true }, take: 1 },
      childrenLinks: { where: { status: "active", relation: "PARENT" }, select: { id: true }, take: 1 },
    },
  });
  if (!u) return null;
  const roles = u.enrollments.flatMap((e) => e.roles as string[]);
  return {
    accountRole: u.accountRole,
    learning: roles.includes("STUDENT"),
    isChild: u.guardianLinks.length > 0,
    staff: u.isSuperAdmin || roles.includes("INSTRUCTOR") || roles.includes("ADMIN"),
    isParent: u.childrenLinks.length > 0,
    isGuest: u.isGuest,
    organizationId: u.organizationId,
    companyCovered: u.enrollments.some((e) => e.domain.organizationId != null),
    // Money actually paid (a card subscription), not a year from a 100% code: a code typed by the
    // child mustn't stand in for the parent's answer.
    paying: u.stripeSubscriptionId != null && payingForAccess(u),
    birthDate: u.birthDate,
    parentConsentEmail: u.parentConsentEmail,
    parentConsentRequestedAt: u.parentConsentRequestedAt,
    parentConsentAt: u.parentConsentAt,
    parentConsentRefusedAt: u.parentConsentRefusedAt,
  };
}

export async function loadConsentState(userId: string, now: Date = new Date()): Promise<ConsentState> {
  const facts = await loadConsentFacts(userId);
  return facts ? consentState(facts, now) : { kind: "none" };
}

/**
 * The accounts in `userIds` stopped for a missing or refused parent's consent — for the cron sweeps
 * (no reminders, no alerts to them) and the learning API. Only minors without consent are read in
 * full; everyone else costs one indexed query for the whole list.
 */
/**
 * One account, for the learning API (runs on every answered question): an account found not stopped
 * is remembered for a few seconds; a stopped one never is, so a parent's „yes” opens it at once.
 */
export async function consentStopped(userId: string): Promise<boolean> {
  const seen = notStoppedAt.get(userId);
  if (seen !== undefined && Date.now() - seen < NOT_STOPPED_TTL_MS) return false;
  const stopped = (await consentStoppedUserIds([userId])).has(userId);
  if (!stopped) {
    if (notStoppedAt.size >= 10_000) notStoppedAt.clear();
    notStoppedAt.set(userId, Date.now());
  }
  return stopped;
}
const NOT_STOPPED_TTL_MS = 15_000;
const notStoppedAt = new Map<string, number>();

export async function consentStoppedUserIds(userIds: Iterable<string>, now: Date = new Date()): Promise<Set<string>> {
  const ids = [...new Set(userIds)];
  const stopped = new Set<string>();
  if (!ids.length) return stopped;
  const rows = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, birthDate: true, parentConsentAt: true, parentConsentRefusedAt: true },
  });
  // An id with no account is an erased one whose session hasn't ended yet (≤5 min, auth.ts): nothing
  // it sends may be kept, so it counts as stopped.
  const present = new Set(rows.map((r) => r.id));
  for (const id of ids) if (!present.has(id)) stopped.add(id);
  for (const c of rows) {
    // Only a minor still without a parent's „yes” can be stopped — and anyone a parent refused, whatever
    // their age now; the exact state is read for those.
    const refused = c.parentConsentRefusedAt != null && c.parentConsentAt == null;
    if (!refused && (c.birthDate == null || c.parentConsentAt != null || !needsParentConsent(c.birthDate, now))) continue;
    if (consentStops(await loadConsentState(c.id, now))) stopped.add(c.id);
  }
  return stopped;
}

/** Forget a remembered „not stopped” (after a refusal or an erasure: it must take effect at once). */
export function forgetConsentStop(userId: string): void {
  notStoppedAt.delete(userId);
}

/**
 * Asks a parent's consent for this account: a new link (the old one stops working), the parent's
 * address kept on the account until the answer. The 7 days count from the FIRST request: sending again —
 * to the same address or another — never starts them over while the account waits or is stopped for
 * want of an answer (otherwise a learner could keep a stopped account by sending again). At most a few
 * emails a day: a learner can type any address here. A reminder isn't counted against those limits, so
 * nobody can use them up to keep the last reminder (and the erasure) from happening.
 */
export async function issueConsentRequest(
  userId: string,
  parentEmail: string,
  /** A reminder (consent-reminders.ts). */
  opts: { reminder?: boolean } = {},
): Promise<IssueResult> {
  const now = new Date();
  // A new waiting period only when the account wasn't in one (the date of birth only now given, the
  // first request): then its days mustn't be counted as used.
  const before = await loadConsentState(userId, now);
  const keepsClock = before.kind === "waiting" || (before.kind === "blocked" && before.reason === "no-answer");
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${consentTokenId(userId)}))`;
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true, parentConsentEmail: true, parentConsentRequestedAt: true, parentConsentRefusedAt: true, parentConsentAt: true },
    });
    if (!user) return { ok: false, reason: "no-account" } as const;
    // A parent's „no” is final: the account is being erased, and no other address can reopen it.
    if (user.parentConsentRefusedAt) return { ok: false, reason: "refused" } as const;
    // A parent already said yes: nobody is asked again.
    if (user.parentConsentAt) return { ok: false, reason: "not-needed" } as const;
    // Not the learner's own address: that would be agreeing with themselves.
    if (user.email && user.email.toLowerCase() === parentEmail.toLowerCase()) return { ok: false, reason: "same-as-child" } as const;

    if (!opts.reminder) {
      await tx.verificationToken.deleteMany({
        where: { identifier: { in: [consentSentId(userId), consentToId(parentEmail)] }, expires: { lt: now } },
      });
      if ((await tx.verificationToken.count({ where: { identifier: consentSentId(userId) } })) >= CONSENT_SENDS_PER_DAY) {
        return { ok: false, reason: "too-many" } as const;
      }
      // Emails one address may receive in a day, from all accounts together (anyone can type an address).
      if ((await tx.verificationToken.count({ where: { identifier: consentToId(parentEmail) } })) >= CONSENT_SENDS_PER_DAY) {
        return { ok: false, reason: "address-busy" } as const;
      }
    }

    const kept = keepsClock && user.parentConsentRequestedAt ? user.parentConsentRequestedAt : now;
    if (kept === now) {
      // A new period: the reminders of an earlier one don't count for it (their dates would erase early).
      await tx.verificationToken.deleteMany({
        where: {
          OR: [
            { identifier: { startsWith: `parent-consent-reminder:${userId}:` } },
            { identifier: { startsWith: `parent-consent-reminder-fail:${userId}:` } },
          ],
        },
      });
    } else if (!opts.reminder && user.parentConsentEmail && user.parentConsentEmail.toLowerCase() !== parentEmail.toLowerCase()) {
      // Another parent asked after the last reminder: two days for them too — but never more than a week
      // past day 37, whatever number of addresses a learner types.
      const final = await tx.verificationToken.findFirst({
        where: { identifier: consentReminderId(userId, "two_days_before") },
        select: { token: true },
      });
      const named = final ? parseConsentReminderToken(final.token) : null;
      if (named && named.requestedAt === kept.getTime()) {
        const want = Math.min(
          Math.max(named.eraseOn, endOfBucharestDay(new Date(now.getTime() + 2 * DAY_MS)).getTime()),
          consentLatestEraseAt(kept).getTime(),
        );
        if (want > named.eraseOn) {
          await tx.verificationToken.deleteMany({ where: { identifier: consentReminderId(userId, "two_days_before") } });
          await tx.verificationToken.create({
            data: {
              identifier: consentReminderId(userId, "two_days_before"),
              token: consentReminderToken(userId, "two_days_before", kept, new Date(want)),
              expires: new Date(want + 30 * DAY_MS),
            },
          });
        }
      }
    }

    // The link lives at least until the erasure date the account is told: a parent who opens an older
    // e-mail on day 25 must still be able to answer.
    const eraseOn = await consentEraseOnFor(userId, kept, now, tx);
    const token = newConsentToken();
    await tx.verificationToken.deleteMany({ where: { identifier: consentTokenId(userId) } });
    await tx.verificationToken.create({
      data: {
        identifier: consentTokenId(userId),
        token,
        expires: new Date(Math.max(now.getTime() + CONSENT_LINK_DAYS * DAY_MS, eraseOn.getTime() + DAY_MS)),
      },
    });
    if (!opts.reminder) {
      await tx.verificationToken.create({
        data: { identifier: consentSentId(userId), token: `sent:${newConsentToken()}`, expires: new Date(now.getTime() + DAY_MS) },
      });
      await tx.verificationToken.create({
        data: { identifier: consentToId(parentEmail), token: `to:${newConsentToken()}`, expires: new Date(now.getTime() + DAY_MS) },
      });
    }
    await tx.user.update({ where: { id: userId }, data: { parentConsentEmail: parentEmail, parentConsentRequestedAt: kept } });
    return { ok: true, token } as const;
  }, { timeout: 15_000, maxWait: 10_000 });
}

/**
 * The link a reminder carries: the one the parent already has, kept alive until the date the reminder
 * names — so every e-mail they got still works, and a reminder that fails to send kills nothing. A new
 * one only when there is none (answered on, expired), through issueConsentRequest.
 */
export async function consentLinkForReminder(userId: string, parentEmail: string, eraseOn: Date): Promise<IssueResult> {
  const until = new Date(eraseOn.getTime() + DAY_MS);
  const kept = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${consentTokenId(userId)}))`;
    const live = await tx.verificationToken.findFirst({
      where: { identifier: consentTokenId(userId), expires: { gt: new Date() } },
      select: { token: true, expires: true },
    });
    if (!live) return null;
    if (live.expires < until) await tx.verificationToken.updateMany({ where: { token: live.token }, data: { expires: until } });
    return live.token;
  });
  return kept ? { ok: true, token: kept } : issueConsentRequest(userId, parentEmail, { reminder: true });
}

/** The email to the parent. Sent after the response; a failure is logged, never the link. */
export async function sendConsentEmail(userId: string, token: string, locale: "ro" | "en"): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, username: true, parentConsentEmail: true, parentConsentRequestedAt: true },
  });
  if (!user?.parentConsentEmail) return;
  const baseUrl = process.env.AUTH_URL || "https://etutor.ro";
  const url = `${baseUrl}/${locale}/acord-parinte/${token}`;
  const requestedAt = user.parentConsentRequestedAt ?? new Date();
  const ends = requestedAt.getTime() + CONSENT_GRACE_DAYS * DAY_MS;
  const daysLeft = Math.max(0, Math.ceil((ends - Date.now()) / DAY_MS));
  // The date the learner's page and the eraser use: the last reminder's, if it went out.
  const eraseOn = await consentEraseOnFor(userId, requestedAt);
  const paying = (await loadConsentFacts(userId))?.paying ?? false;
  const { subject, html } = consentEmail(locale, user.name, user.email ?? user.username ?? "", url, daysLeft, eraseOn, paying);
  const sent = await sendAppEmail({ to: user.parentConsentEmail, subject, html });
  if (!sent) logger.error("Parent consent email was not accepted by any transport");
}

/**
 * The erasure date an account waiting for an answer is shown: the one the last reminder of this waiting
 * period named, if it went out; otherwise day 37, at least two days away.
 */
export async function consentEraseOnFor(
  userId: string,
  requestedAt: Date,
  now: Date = new Date(),
  db: Pick<typeof prisma, "verificationToken"> = prisma,
): Promise<Date> {
  const marker = await db.verificationToken.findFirst({
    where: { identifier: consentReminderId(userId, "two_days_before") },
    select: { token: true },
  });
  const named = marker ? parseConsentReminderToken(marker.token) : null;
  return named && named.requestedAt === requestedAt.getTime() ? new Date(named.eraseOn) : consentEraseOnFrom(requestedAt, now);
}

/** The account a live consent link belongs to, or null. */
export async function consentLinkOwner(token: string): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row || !row.identifier.startsWith("parent-consent:") || row.expires < new Date()) return null;
  return row.identifier.slice("parent-consent:".length);
}

export type AnswerResult =
  | { ok: true; userId: string; decision: "GIVEN" | "REFUSED"; asked: "GIVEN" | "REFUSED" }
  | { ok: false; why: "invalid-link" | "not-needed" | "busy" | "uncertain" | "stale-text" }
  | { ok: false; why: "erased"; userId: string };

/** The answer being recorded right now (the Hub is asked outside any transaction). */
export const consentInflightId = (userId: string) => `parent-consent-inflight:${userId}`;
const INFLIGHT_MS = 30_000;

/**
 * The parent's answer, in three steps, never holding the database while the Legal Hub is asked:
 *  1. claim the link (short): still live, nobody else answering, and a parent's answer still needed —
 *     a learner who turned 16 or whom a parent now covers is past it, and the link is dropped;
 *  2. the Hub records it (which text, what, when, from where), keyed on the link: a second answer on
 *     the same link gets back the first one;
 *  3. apply (short) what the Hub holds, and use the link up.
 * If step 2's reply is lost, the Hub may hold the answer while eTutor doesn't: the parent presses again,
 * gets the same answer back, and it is applied. A „no” is followed by the erasure (the route).
 */
export async function answerConsent(
  token: string,
  decision: "GIVEN" | "REFUSED",
  documentVersionId: string,
  from: { ip: string | null; userAgent: string | null },
): Promise<AnswerResult> {
  const userId = await consentLinkOwner(token);
  if (!userId) return { ok: false, why: "invalid-link" };
  const state = await loadConsentState(userId);
  const needed = state.kind === "ask-parent" || state.kind === "waiting" || (state.kind === "blocked" && state.reason === "no-answer");

  const claim = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${consentTokenId(userId)}))`;
    const now = new Date();
    const live = await tx.verificationToken.findFirst({
      where: { token, identifier: consentTokenId(userId), expires: { gt: now } },
      select: { token: true },
    });
    if (!live) return { kind: "invalid" } as const;
    if (!needed) {
      await tx.verificationToken.deleteMany({ where: { token } });
      return { kind: "not-needed" } as const;
    }
    const busy = await tx.verificationToken.findFirst({
      where: { identifier: consentInflightId(userId), expires: { gt: now } },
      select: { token: true },
    });
    if (busy) return { kind: "busy" } as const;
    const user = await tx.user.findUnique({ where: { id: userId }, select: { parentConsentEmail: true } });
    if (!user?.parentConsentEmail) return { kind: "invalid" } as const;
    await tx.verificationToken.deleteMany({ where: { identifier: consentInflightId(userId) } });
    await tx.verificationToken.create({
      data: { identifier: consentInflightId(userId), token: `inflight:${newConsentToken()}`, expires: new Date(now.getTime() + INFLIGHT_MS) },
    });
    return { kind: "claimed", parentEmail: user.parentConsentEmail } as const;
  });
  if (claim.kind === "invalid") return { ok: false, why: "invalid-link" };
  if (claim.kind === "not-needed") return { ok: false, why: "not-needed" };
  if (claim.kind === "busy") return { ok: false, why: "busy" };

  const release = () => prisma.verificationToken.deleteMany({ where: { identifier: consentInflightId(userId) } });
  const recorded = await recordGuardianEvent({
    event: decision,
    subjectRef: userId,
    requestId: answerRequestId(token),
    guardianEmail: claim.parentEmail,
    documentVersionId,
    ipAddress: from.ip,
    userAgent: from.userAgent,
  });
  if (!recorded.ok) {
    await release();
    if (recorded.why === "subject-erased") return { ok: false, why: "erased", userId };
    // 422: the text the page showed isn't one the Hub knows (an old page, a changed text).
    if (recorded.why === "rejected" && recorded.status === 422) return { ok: false, why: "stale-text" };
    // Unreachable or refused: it may or may not be recorded. A retry on this link gets back the one kept.
    return { ok: false, why: "uncertain" };
  }
  const applied: "GIVEN" | "REFUSED" = recorded.event === "REFUSED" ? "REFUSED" : "GIVEN";

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${consentTokenId(userId)}))`;
      const now = new Date();
      await tx.verificationToken.deleteMany({ where: { OR: [{ token }, { identifier: consentInflightId(userId) }] } });
      // A „no” also withdraws an earlier „yes” (a parent can take it back on a later link). After a „yes”
      // the parent's address has done its job: it goes (the Hub keeps only its fingerprint). After a „no”
      // the account is erased, address and all.
      await tx.user.update({
        where: { id: userId },
        data:
          applied === "GIVEN"
            ? { parentConsentAt: now, parentConsentRefusedAt: null, parentConsentEmail: null }
            : { parentConsentRefusedAt: now, parentConsentAt: null },
      });
    });
  } catch (err) {
    // The account was erased while the Hub was asked (the day-37 sweep got there first).
    if ((err as { code?: string })?.code === "P2025") return { ok: false, why: "erased", userId };
    throw err;
  }
  forgetConsentStop(userId);
  return { ok: true, userId, decision: applied, asked: decision };
}
