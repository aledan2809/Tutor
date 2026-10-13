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
