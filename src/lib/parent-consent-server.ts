import { prisma } from "@/lib/prisma";
import { sendAppEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { needsParentConsent } from "@/lib/age";
import { payingForAccess } from "@/lib/access";
import {
  CONSENT_GRACE_DAYS,
  CONSENT_LINK_DAYS,
  CONSENT_SENDS_PER_DAY,
  PARENT_CONSENT_VERSION,
  consentEmail,
  consentSentId,
  consentState,
  consentStops,
  consentToId,
  consentTokenId,
  newConsentToken,
  type ConsentFacts,
  type ConsentState,
} from "@/lib/parent-consent";

const DAY_MS = 24 * 60 * 60 * 1000;

export type IssueResult =
  | { ok: true; token: string }
  | { ok: false; reason: "too-many" | "same-as-child" | "no-account" | "refused-address" };

/** Everything consentState needs about one account, read in one go (+ the company check when it matters). */
export async function loadConsentFacts(userId: string): Promise<ConsentFacts | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountRole: true,
      isSuperAdmin: true,
      isGuest: true,
      organizationId: true,
      birthYear: true,
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
    birthYear: u.birthYear,
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
  const candidates = await prisma.user.findMany({
    where: { id: { in: ids }, birthYear: { gte: now.getFullYear() - 16 }, parentConsentAt: null },
    select: { id: true, birthYear: true },
  });
  for (const c of candidates) {
    if (c.birthYear == null || !needsParentConsent(c.birthYear, now)) continue;
    if (consentStops(await loadConsentState(c.id, now))) stopped.add(c.id);
  }
  return stopped;
}

/**
 * Asks a parent's consent for this account: a new link (the old one stops working), the parent's
 * address kept on the account. The 7 days count from the FIRST request — changing the address
 * doesn't restart them. At most a few emails a day: a learner can type any address here.
 */
export async function issueConsentRequest(userId: string, parentEmail: string): Promise<IssueResult> {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${consentTokenId(userId)}))`;
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true, parentConsentRequestedAt: true },
    });
    if (!user) return { ok: false, reason: "no-account" } as const;
    // Not the learner's own address: that would be agreeing with themselves.
    if (user.email && user.email.toLowerCase() === parentEmail.toLowerCase()) return { ok: false, reason: "same-as-child" } as const;
    // A parent who said no can change their mind (a misclick, a talk at home), but isn't pressed: one
    // email a day at most to that address. The account stays stopped until a „yes” either way.
    const refused = await tx.parentalConsent.findFirst({
      // Both stored lowercase (the routes lowercase what is typed).
      where: { userId, decision: "REFUSED", parentEmail: parentEmail.toLowerCase() },
      select: { id: true },
    });
    if (refused && (await tx.verificationToken.count({ where: { identifier: consentToId(parentEmail), expires: { gt: now } } })) >= 1) {
      return { ok: false, reason: "refused-address" } as const;
    }

    await tx.verificationToken.deleteMany({
      where: { identifier: { in: [consentSentId(userId), consentToId(parentEmail)] }, expires: { lt: now } },
    });
    if (
      (await tx.verificationToken.count({ where: { identifier: consentSentId(userId) } })) >= CONSENT_SENDS_PER_DAY ||
      (await tx.verificationToken.count({ where: { identifier: consentToId(parentEmail) } })) >= CONSENT_SENDS_PER_DAY
    ) {
      return { ok: false, reason: "too-many" } as const;
    }
    const token = newConsentToken();
    await tx.verificationToken.deleteMany({ where: { identifier: consentTokenId(userId) } });
    await tx.verificationToken.create({
      data: { identifier: consentTokenId(userId), token, expires: new Date(now.getTime() + CONSENT_LINK_DAYS * DAY_MS) },
    });
    await tx.verificationToken.create({
      data: { identifier: consentSentId(userId), token: `sent:${newConsentToken()}`, expires: new Date(now.getTime() + DAY_MS) },
    });
    await tx.verificationToken.create({
      data: { identifier: consentToId(parentEmail), token: `to:${newConsentToken()}`, expires: new Date(now.getTime() + DAY_MS) },
    });
    // The days already used don't come back, and a refusal stays until a parent agrees (answerConsent).
    await tx.user.update({
      where: { id: userId },
      data: { parentConsentEmail: parentEmail, parentConsentRequestedAt: user.parentConsentRequestedAt ?? now },
    });
    return { ok: true, token } as const;
  });
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
  const ends = (user.parentConsentRequestedAt ?? new Date()).getTime() + CONSENT_GRACE_DAYS * DAY_MS;
  const daysLeft = Math.max(0, Math.ceil((ends - Date.now()) / DAY_MS));
  const { subject, html } = consentEmail(locale, user.name, user.email ?? user.username ?? "", url, daysLeft);
  const sent = await sendAppEmail({ to: user.parentConsentEmail, subject, html });
  if (!sent) logger.error("Parent consent email was not accepted by any transport");
}

/** The account a live consent link belongs to, or null. */
export async function consentLinkOwner(token: string): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row || !row.identifier.startsWith("parent-consent:") || row.expires < new Date()) return null;
  return row.identifier.slice("parent-consent:".length);
}

/** The parent's answer, kept as evidence; the link is used up. */
export async function answerConsent(
  token: string,
  decision: "GIVEN" | "REFUSED",
  from: { ip: string | null; userAgent: string | null },
): Promise<{ ok: true; userId: string } | { ok: false }> {
  const userId = await consentLinkOwner(token);
  if (!userId) return { ok: false };
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    // Used up inside the transaction: two answers sent together can't both count.
    const used = await tx.verificationToken.deleteMany({ where: { token, identifier: consentTokenId(userId) } });
    if (used.count !== 1) return { ok: false } as const;
    const user = await tx.user.findUnique({ where: { id: userId }, select: { parentConsentEmail: true } });
    if (!user?.parentConsentEmail) return { ok: false } as const;
    await tx.parentalConsent.create({
      data: {
        userId,
        parentEmail: user.parentConsentEmail,
        decision,
        textVersion: PARENT_CONSENT_VERSION,
        ip: from.ip,
        userAgent: from.userAgent?.slice(0, 300) ?? null,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: decision === "GIVEN" ? { parentConsentAt: now, parentConsentRefusedAt: null } : { parentConsentRefusedAt: now },
    });
    return { ok: true, userId } as const;
  });
}
