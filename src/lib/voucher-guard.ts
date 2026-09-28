import { clientIp } from "@/lib/client-ip";

/**
 * Guessing voucher codes, counted where it can't be multiplied: per network address, and only the
 * misses (a code that doesn't exist at all). Every route that looks a typed code up tells whether it
 * exists, and a 100% code opens paid access; accounts cost nothing, so a per-account budget didn't
 * bound anything. A family with a real code — even an expired or switched-off one — never counts, so
 * a whole school or post office behind one address isn't slowed down by families that type a
 * printed code. Server-only, in memory (one process), like the other in-route limits.
 *
 * A lookup is counted BEFORE it runs and given back once the code turns out to exist: counted after,
 * a burst of requests sent together would all pass the check while none had been counted yet.
 */
const MAX_MISSES = 20;
const WINDOW_MS = 10 * 60_000;
const MAX_KEYS = 10_000;
const counts = new Map<string, { count: number; resetAt: number }>();

export type VoucherLookup = {
  /** The code exists (whatever its state): this lookup wasn't a guess. */
  found(): void;
};

/** null → this address has missed too often lately: don't look the code up. */
export function reserveVoucherLookup(headers: Headers): VoucherLookup | null {
  const ip = clientIp(headers);
  const now = Date.now();
  let entry = counts.get(ip);
  if (!entry || now > entry.resetAt) {
    if (counts.size >= MAX_KEYS) {
      for (const [key, e] of counts) if (now > e.resetAt) counts.delete(key);
    }
    entry = { count: 0, resetAt: now + WINDOW_MS };
    counts.set(ip, entry);
  }
  if (entry.count >= MAX_MISSES) return null;
  entry.count++;
  const reserved = entry;
  let settled = false;
  return {
    found() {
      if (settled) return;
      settled = true;
      // Only in the window it was taken from: a new window starts from zero anyway.
      if (counts.get(ip) === reserved && reserved.count > 0) reserved.count--;
    },
  };
}
