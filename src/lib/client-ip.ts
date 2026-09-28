/**
 * The address a request really came from.
 *
 * nginx in front of the app sets `X-Real-IP` to `$remote_addr` — the address of whoever opened the
 * connection — and APPENDS that same address to `X-Forwarded-For`. So the FIRST entry of
 * `X-Forwarded-For` is whatever the client chose to send. Keyed on it, every limit (sign-in attempts,
 * the 6-digit recovery code, the public quiz) could be reset at will by sending a fresh made-up
 * header with each request (True E2E 2026-09-26).
 *
 * `X-Real-IP` first; without it (a local dev server, no proxy), the LAST `X-Forwarded-For` entry — the
 * one the nearest proxy added — never the first. Edge-safe: no Node APIs.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const hops = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return hops[hops.length - 1] || "unknown";
}
