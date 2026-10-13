/**
 * One paid period from a moment: the month or the year a payment buys. Pure. Used when a payment
 * arrives for a subscription that has already ended (a parent paying an old invoice by hand, a
 * notification delivered late): that money buys exactly one period with an end date — never access
 * with no end (Alex, 13.10.2026).
 */
export type BillingInterval = "MONTH" | "YEAR";

export function billingIntervalOf(raw: unknown): BillingInterval {
  return raw === "YEAR" || raw === "year" ? "YEAR" : "MONTH";
}

/** `from` plus one period, the day of the month kept (the 31st becomes the month's last day). */
export function paidPeriodEnd(from: Date, interval: BillingInterval): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  if (interval === "YEAR") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

// ── Where a card subscription stands (payment broker, callback contract v3) ──────────────────────────

/** The broker's summary of a Stripe subscription (stripe-module admin/src/lib/subscription-summary.ts). */
export type BrokerSubscription = {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  trialEnd: string | null;
  endedAt: string | null;
  recurringAmount: number | null;
  currency: string | null;
  interval: string | null;
};

const asDate = (v: unknown): Date | null => {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Pure: the broker's summary, checked field by field (it is signed, but an older broker sends none). */
export function parseBrokerSubscription(raw: unknown): BrokerSubscription | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.status !== "string") return null;
  return {
    status: r.status,
    currentPeriodEnd: asDate(r.currentPeriodEnd)?.toISOString() ?? null,
    cancelAtPeriodEnd: r.cancelAtPeriodEnd === true,
    cancelAt: asDate(r.cancelAt)?.toISOString() ?? null,
    trialEnd: asDate(r.trialEnd)?.toISOString() ?? null,
    endedAt: asDate(r.endedAt)?.toISOString() ?? null,
    recurringAmount: typeof r.recurringAmount === "number" && Number.isFinite(r.recurringAmount) && r.recurringAmount >= 0 ? Math.round(r.recurringAmount) : null,
    currency: typeof r.currency === "string" ? r.currency : null,
    interval: typeof r.interval === "string" ? r.interval : null,
  };
}

/** The account columns that keep it (schema: User.subscriptionPeriodEnd …). */
export type SubscriptionPeriodFields = {
  subscriptionPeriodEnd: Date | null;
  subscriptionCancelAt: Date | null;
  subscriptionPrice: number | null;
  subscriptionSyncedAt: Date;
};

/** Pure: what to store from a summary. A cancellation scheduled without a date stops at the period's end. */
export function periodFieldsFrom(sub: BrokerSubscription, now: Date = new Date()): SubscriptionPeriodFields {
  const periodEnd = asDate(sub.currentPeriodEnd);
  const cancelAt = sub.cancelAtPeriodEnd ? (asDate(sub.cancelAt) ?? periodEnd) : null;
  return {
    subscriptionPeriodEnd: periodEnd,
    subscriptionCancelAt: cancelAt,
    subscriptionPrice: sub.recurringAmount,
    subscriptionSyncedAt: now,
  };
}

/** Nothing renews any more: the period columns are cleared (a cancellation, an account left unpaid). */
export const CLEARED_PERIOD_FIELDS = {
  subscriptionPeriodEnd: null,
  subscriptionCancelAt: null,
  subscriptionPrice: null,
  subscriptionRetryAt: null,
} as const;

/** What the payer sees about their billing (Pachete, dashboard). */
export type BillingSummary =
  /** Renews by itself on `at`; paid until then. */
  | { kind: "renews"; at: string; daysLeft: number; amountMinor: number | null }
  /** The card's free trial: the first charge is on `at`. */
  | { kind: "trial"; at: string; daysLeft: number }
  /** Stopped by the payer: access until `at`, nothing charged after. */
  | { kind: "ends"; at: string; daysLeft: number }
  /** Paid without a subscription (a year from a code, a payment that came after a cancellation): until `at`. */
  | { kind: "fixed"; at: string; daysLeft: number }
  /** The bank declined the renewal; Stripe retries on `retryAt` (null: no more retries). */
  | { kind: "retrying"; retryAt: string | null };

export type BillingFacts = {
  subscriptionStatus: string | null;
  subscriptionEndsAt: Date | null;
  subscriptionPeriodEnd?: Date | null;
  subscriptionCancelAt?: Date | null;
  subscriptionPrice?: number | null;
  subscriptionRetryAt?: Date | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** Whole days left, rounded up: on the last day „1 zi", never „0" while access lasts. */
export function daysUntil(at: Date, now: Date): number {
  return Math.max(0, Math.ceil((at.getTime() - now.getTime()) / DAY_MS));
}

/** Pure. Null when there is nothing to say (no plan, or a card subscription whose period isn't known yet). */
export function billingSummary(u: BillingFacts, now: Date = new Date()): BillingSummary | null {
  const status = u.subscriptionStatus;
  if (status === "past_due") return { kind: "retrying", retryAt: u.subscriptionRetryAt?.toISOString() ?? null };
  if (status !== "active" && status !== "trialing") return null;
  const future = (d: Date | null | undefined): d is Date => Boolean(d && d.getTime() > now.getTime());
  // An end date on the account: paid for a fixed time, no subscription renewing it.
  if (u.subscriptionEndsAt) {
    return future(u.subscriptionEndsAt) ? { kind: "fixed", at: u.subscriptionEndsAt.toISOString(), daysLeft: daysUntil(u.subscriptionEndsAt, now) } : null;
  }
  if (future(u.subscriptionCancelAt)) return { kind: "ends", at: u.subscriptionCancelAt.toISOString(), daysLeft: daysUntil(u.subscriptionCancelAt, now) };
  if (!future(u.subscriptionPeriodEnd)) return null;
  const at = u.subscriptionPeriodEnd.toISOString();
  const daysLeft = daysUntil(u.subscriptionPeriodEnd, now);
  return status === "trialing" ? { kind: "trial", at, daysLeft } : { kind: "renews", at, daysLeft, amountMinor: u.subscriptionPrice ?? null };
}

/** The dashboard warns the payer this many days before access ends without renewing. */
export const ACCESS_ENDING_NOTICE_DAYS = 3;
