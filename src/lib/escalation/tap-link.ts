/**
 * Link helpers for cascade rungs that can only send a URL (Telegram today).
 *
 * A push carries `escalationEventId` into the service worker, which POSTs
 * /api/escalation/ack; a Telegram inline button is just a URL, so a tap used to
 * leave `acknowledgedAt` null and the cascade escalated to the next rung anyway —
 * the student answered on the FREE channel and got the paid/next nudge regardless.
 * These two pure functions route the button through the ack endpoint instead.
 */

/**
 * Where a tap is allowed to land. Relative paths only, and a single leading
 * slash: `//evil.com` is protocol-relative and a browser treats it as absolute,
 * so an unvalidated `to` would make the ack route an open redirect reachable
 * from any Telegram message. CR/LF is rejected too (header splitting).
 */
export function safeRedirectPath(to: string | null | undefined): string {
  if (!to) return "/dashboard";
  if (!to.startsWith("/") || to.startsWith("//")) return "/dashboard";
  if (/[\r\n]/.test(to)) return "/dashboard";
  return to;
}

/**
 * The URL behind the Telegram button.
 *
 * Routes through /api/escalation/ack (which records the tap, then redirects) when
 * we have BOTH an event id and a relative in-app target. An absolute target is
 * passed through untouched — it is not ours to redirect to, and `to` only accepts
 * relative paths by design. No base URL means no absolute link is possible, and
 * Telegram rejects relative ones, so we return null and the caller sends plain text.
 */
export function buildTelegramButtonUrl(input: {
  base: string;
  rawUrl: string | undefined;
  escalationEventId: string | undefined;
}): string | null {
  const base = input.base.replace(/\/$/, "");
  const raw = input.rawUrl;

  if (raw && /^https?:\/\//i.test(raw)) return raw;
  if (!base) return null;

  const path = raw && raw.startsWith("/") ? raw : "/";
  if (!input.escalationEventId) return `${base}${path}`;

  const q = new URLSearchParams({ e: input.escalationEventId, to: safeRedirectPath(path) });
  return `${base}/api/escalation/ack?${q.toString()}`;
}
