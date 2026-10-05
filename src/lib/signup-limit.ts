/**
 * New accounts per address: at most SIGNUPS_PER_IP_PER_HOUR in a sliding hour (20: a class signing up
 * together from the school Wi-Fi shares one address — Alex, 05.10).
 *
 * Signup sends an email to any address typed as "the parent's" (consent for under-16s), so an
 * unlimited signup was an unlimited mail-sender to strangers from the site's own domain (True E2E
 * 2026-10-05, S2). The per-account and per-recipient ceilings already held; a script could still make
 * account after account. Kept in memory, like the middleware's limits: the site runs as one process,
 * and a restart forgetting the last hour costs at most one more hour's worth.
 */
export const SIGNUPS_PER_IP_PER_HOUR = 20;
const WINDOW_MS = 3600 * 1000;
const MAX_TRACKED = 50_000;

const recent = new Map<string, number[]>();

function live(ip: string, now: number): number[] {
  const kept = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (kept.length) recent.set(ip, kept);
  else recent.delete(ip);
  return kept;
}

/**
 * Take one of this address's slots now, or false when none is left. Check and count in one synchronous
 * step: a check here and a count after the awaits of signup let 50 parallel requests all pass.
 * "unknown" (no proxy header — a local server) is never limited: it would put everyone in one bucket.
 */
export function takeSignupSlot(ip: string, now: number = Date.now()): boolean {
  if (ip === "unknown") return true;
  const kept = live(ip, now);
  if (kept.length >= SIGNUPS_PER_IP_PER_HOUR) return false;
  if (recent.size >= MAX_TRACKED && !recent.has(ip)) {
    // Bounded memory: drop the oldest address first (a Map iterates in insertion order).
    const oldest = recent.keys().next().value;
    if (oldest !== undefined) recent.delete(oldest);
  }
  recent.set(ip, [...kept, now]);
  return true;
}

/** Give back a slot taken for a signup that made no account (the email was taken). */
export function releaseSignupSlot(ip: string, takenAt: number): void {
  const list = recent.get(ip);
  if (!list) return;
  const i = list.lastIndexOf(takenAt);
  if (i >= 0) list.splice(i, 1);
  if (!list.length) recent.delete(ip);
}

/** Tests only. */
export function resetSignupLimit(): void {
  recent.clear();
}
