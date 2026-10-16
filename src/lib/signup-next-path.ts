/**
 * Where a new account goes right after it is made — the same for the signup form and the Google button
 * (google-done), so the two ways in can't drift apart. Pure.
 */
export function nextPathAfterSignup(opts: {
  plan: string | null;
  voucherCode: string;
  voucherApplied: boolean;
  start: string | null;
  returnTo?: string | null;
  /** The code couldn't be checked yet (too many wrong codes from this network): the packages page checks it. */
  voucherDeferred?: boolean;
}): string {
  // Came from a page that needs the account (a family invitation, a family code): back there.
  if (opts.returnTo) return opts.returnTo;
  if (opts.voucherApplied) return "/dashboard";
  if (opts.start === "free" && !(opts.voucherDeferred && opts.voucherCode)) return "/dashboard/family";
  const q = new URLSearchParams();
  if (opts.plan) q.set("plan", opts.plan);
  if (opts.voucherCode) q.set("voucher", opts.voucherCode);
  return q.toString() ? `/dashboard/packages?${q.toString()}` : "/dashboard";
}

/** A same-site path only (`/x`, never `//host` or `/\host`): what a returnTo may be. */
export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  return raw;
}
