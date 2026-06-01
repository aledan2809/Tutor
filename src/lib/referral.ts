import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

// ─── Referral / Growth engine (Tier 2 — instructorul-își-aduce-elevii) ───
//
// A promoter shares etutor.ro/r/<CODE>. A visitor who lands there gets a 90-day
// cookie; if they sign up, a Referral (PENDING) links promoter→referred. On every
// CONFIRMED payment of the referred user, the promoter accrues a commission
// (50% — see the public /creatori promise), PERPETUALLY, with a 30-day hold.

// ─── Constants ───

/** Commission fraction. 0.5 = 50% — matches the public /creatori headline. */
export const REFERRAL_COMMISSION_PCT = 0.5;

/** Anti-fraud hold before an accrued earning becomes PAYABLE. */
export const REFERRAL_HOLD_DAYS = 30;

/** Cookie that carries the referral code from /r/<code> to signup. */
export const REFERRAL_COOKIE = "tutor_ref";
export const REFERRAL_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days, in seconds

/** Two-sided reward: discount the referred user can apply on first checkout. */
export const REFERRAL_WELCOME_DISCOUNT_PCT = 25;

/** Code charset excludes ambiguous chars (0/O/1/I/L) to keep links shareable. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

// ─── Pure helpers (no DB — unit-tested directly) ───

/** Generate a random, share-friendly referral code (uppercase, unambiguous). */
export function generateReferralCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** Normalize a user-supplied code: trim + uppercase. Returns null if invalid. */
export function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (code.length < 4 || code.length > 16) return null;
  if (!/^[A-Z0-9]+$/.test(code)) return null;
  return code;
}

/** Commission in cents for a payment, rounded to the nearest cent. */
export function commissionCents(
  amountCents: number,
  pct: number = REFERRAL_COMMISSION_PCT
): number {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return 0;
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return Math.round(amountCents * pct);
}

/** When an earning accrued at `from` becomes payable (after the hold window). */
export function payableAt(from: Date, holdDays: number = REFERRAL_HOLD_DAYS): Date {
  return new Date(from.getTime() + holdDays * 24 * 60 * 60 * 1000);
}

/**
 * Decide whether a referral attribution is allowed, given the relevant facts.
 * Pure so the guard logic is unit-tested without a DB.
 */
export function canAttribute(input: {
  promoterId: string | null | undefined;
  referredUserId: string;
  referredAlreadyHasReferrer: boolean;
}): { ok: boolean; reason?: string } {
  const { promoterId, referredUserId, referredAlreadyHasReferrer } = input;
  if (!promoterId) return { ok: false, reason: "no_promoter" };
  if (promoterId === referredUserId) return { ok: false, reason: "self_referral" };
  if (referredAlreadyHasReferrer) return { ok: false, reason: "already_referred" };
  return { ok: true };
}

/** Build the public share URL for a code. */
export function referralUrl(code: string, baseUrl?: string): string {
  const base = (baseUrl || process.env.AUTH_URL || "https://etutor.ro").replace(/\/$/, "");
  return `${base}/r/${code}`;
}

// ─── DB functions ───

/**
 * Return the user's referral code, generating + persisting one on first use.
 * Retries on the (rare) unique collision.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch (err) {
      // P2002 = unique violation on referralCode → try a fresh code.
      if (isUniqueViolation(err)) continue;
      throw err;
    }
  }
  throw new Error("Could not allocate a unique referral code after 5 attempts");
}

/** Resolve the promoter user id for a referral code (active, non-banned). */
export async function resolvePromoterByCode(
  rawCode: string
): Promise<{ id: string } | null> {
  const code = normalizeCode(rawCode);
  if (!code) return null;
  return prisma.user.findFirst({
    where: { referralCode: code, isBanned: false },
    select: { id: true },
  });
}

/**
 * Attribute a freshly-created user to a promoter via a referral code.
 * Idempotent + guarded: no self-referral, one referrer per user.
 * Returns whether a Referral was created (and why not, if skipped).
 */
export async function attributeReferral(input: {
  referredUserId: string;
  code: string;
}): Promise<{ created: boolean; reason?: string; promoterId?: string }> {
  const promoter = await resolvePromoterByCode(input.code);
  const normalized = normalizeCode(input.code);

  const referred = await prisma.user.findUnique({
    where: { id: input.referredUserId },
    select: { referredById: true },
  });
  if (!referred) return { created: false, reason: "referred_not_found" };

  const guard = canAttribute({
    promoterId: promoter?.id,
    referredUserId: input.referredUserId,
    referredAlreadyHasReferrer: Boolean(referred.referredById),
  });
  if (!guard.ok) return { created: false, reason: guard.reason };

  const promoterId = promoter!.id;
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: input.referredUserId },
        data: { referredById: promoterId },
      }),
      prisma.referral.create({
        data: {
          promoterId,
          referredId: input.referredUserId,
          code: normalized!,
          status: "PENDING",
          commissionPct: REFERRAL_COMMISSION_PCT,
        },
      }),
    ]);
    return { created: true, promoterId };
  } catch (err) {
    // Concurrent attribution (referredId unique) → treat as already referred.
    if (isUniqueViolation(err)) return { created: false, reason: "already_referred" };
    throw err;
  }
}

/**
 * Accrue commission for a confirmed payment. Looks up whether the paying user
 * was referred; if so, records a ReferralEarning (idempotent on paymentId+level),
 * flips the Referral to ACTIVE on first payment, and bumps totalEarned.
 *
 * Best-effort: callers (Stripe webhook) wrap this so a failure here never breaks
 * the payment flow.
 */
export async function accrueCommissionForPayment(input: {
  paymentId: string;
  payerUserId: string;
  amountCents: number;
  currency?: string;
  at?: Date;
}): Promise<{ accrued: boolean; amount?: number; reason?: string }> {
  if (!input.amountCents || input.amountCents <= 0) {
    return { accrued: false, reason: "no_amount" };
  }

  const referral = await prisma.referral.findUnique({
    where: { referredId: input.payerUserId },
    select: { id: true, promoterId: true, commissionPct: true, status: true },
  });
  if (!referral) return { accrued: false, reason: "not_referred" };

  const amount = commissionCents(input.amountCents, referral.commissionPct);
  if (amount <= 0) return { accrued: false, reason: "zero_commission" };

  const at = input.at ?? new Date();
  try {
    await prisma.$transaction([
      prisma.referralEarning.create({
        data: {
          referralId: referral.id,
          promoterId: referral.promoterId,
          paymentId: input.paymentId,
          level: 1,
          amount,
          currency: (input.currency || "ron").toLowerCase(),
          status: "PENDING",
          payableAt: payableAt(at),
        },
      }),
      prisma.referral.update({
        where: { id: referral.id },
        data: {
          totalEarned: { increment: amount },
          ...(referral.status === "PENDING"
            ? { status: "ACTIVE", activatedAt: at }
            : {}),
        },
      }),
    ]);
    return { accrued: true, amount };
  } catch (err) {
    // Idempotency: a Stripe webhook retry hits the (paymentId, level) unique index.
    if (isUniqueViolation(err)) return { accrued: false, reason: "duplicate" };
    throw err;
  }
}

/** Aggregate referral stats for a promoter (dashboard). */
export async function getReferralStats(userId: string) {
  const code = await ensureReferralCode(userId);

  const [referrals, earnAgg, payableAgg, pendingAgg] = await Promise.all([
    prisma.referral.findMany({
      where: { promoterId: userId },
      select: {
        id: true,
        status: true,
        totalEarned: true,
        createdAt: true,
        activatedAt: true,
        referred: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.referralEarning.aggregate({
      where: { promoterId: userId },
      _sum: { amount: true },
    }),
    prisma.referralEarning.aggregate({
      where: { promoterId: userId, status: "PAYABLE" },
      _sum: { amount: true },
    }),
    prisma.referralEarning.aggregate({
      where: { promoterId: userId, status: "PENDING" },
      _sum: { amount: true },
    }),
  ]);

  const activeCount = referrals.filter((r) => r.status === "ACTIVE").length;

  return {
    code,
    url: referralUrl(code),
    commissionPct: REFERRAL_COMMISSION_PCT,
    counts: {
      total: referrals.length,
      active: activeCount,
      pending: referrals.filter((r) => r.status === "PENDING").length,
    },
    earnings: {
      totalCents: earnAgg._sum.amount ?? 0,
      payableCents: payableAgg._sum.amount ?? 0,
      pendingCents: pendingAgg._sum.amount ?? 0,
    },
    referrals: referrals.map((r) => ({
      id: r.id,
      name: r.referred?.name ?? null,
      status: r.status,
      earnedCents: r.totalEarned,
      joinedAt: r.createdAt,
      activatedAt: r.activatedAt,
    })),
  };
}

/**
 * Two-sided reward: give the referred user a single-use welcome discount voucher.
 * Reuses the existing Voucher infra (applied at Stripe checkout via percent_off).
 * The code is stashed in the referred user's Setting so the dashboard can surface it.
 * Best-effort — never blocks signup.
 */
export async function grantWelcomeVoucher(input: {
  referredUserId: string;
  promoterId: string;
}): Promise<{ code: string } | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `WLC${generateReferralCode()}`;
    try {
      await prisma.$transaction([
        prisma.voucher.create({
          data: {
            code,
            discountPercent: REFERRAL_WELCOME_DISCOUNT_PCT,
            maxUses: 1,
            createdById: input.promoterId,
            isActive: true,
          },
        }),
        prisma.setting.upsert({
          where: {
            userId_key: { userId: input.referredUserId, key: "referral_welcome_voucher" },
          },
          create: {
            userId: input.referredUserId,
            key: "referral_welcome_voucher",
            value: { code, discountPercent: REFERRAL_WELCOME_DISCOUNT_PCT },
          },
          update: {},
        }),
      ]);
      return { code };
    } catch (err) {
      if (isUniqueViolation(err)) continue; // voucher code collision → retry
      throw err;
    }
  }
  return null;
}

// ─── Internals ───

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}
