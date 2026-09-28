/**
 * Which rate-limit bucket an API request counts against, and how. Kept apart from the middleware so
 * the rules can be tested one by one; the middleware only counts.
 */

// Read-only auth endpoints. NextAuth's client hits /api/auth/session on every
// page load, tab refocus and periodic refetch — that is a READ, not an access
// attempt. Sharing one budget with credential submission meant a normal browsing
// session exhausted it; the client then reports the user as signed out even
// though the server session is still valid (measured: 60 session reads across 18
// pages, first 429 at the 18th). For a school platform a whole classroom sits
// behind one NAT, so the budget was effectively per-classroom.
export const AUTH_READ_PATHS = new Set([
  // Not a read, but no guessing happens here either — and counted with the sign-ins of a whole
  // classroom behind one address, a student's sign-out could get 429 and silently leave them in.
  "/api/auth/signout",
  "/api/auth/session",
  "/api/auth/providers",
  "/api/auth/csrf",
  "/api/auth/error",
  "/api/auth/_log",
]);

/**
 * The top-level folders of src/app/api. Any other first segment is the `[domain]` parameter (a subject
 * slug), and every slug shares one bucket — otherwise each slug, and each spelling of it
 * (`%62ac` is `bac`), opened a fresh budget. A unit test keeps this list equal to the folders.
 */
export const API_FOLDERS = new Set([
  "acces", "activate", "admin", "auth", "calendar", "courses", "creatori-waitlist", "cron",
  "dashboard", "domains", "escalation", "exam-bank", "family", "health", "lead-magnet", "licenta",
  "magic-quiz", "me", "notifications", "og", "org", "parent", "plans", "posta", "presence",
  "public", "questions", "referrals", "reports", "settings", "stripe", "student", "telegram", "v1",
  "vouchers", "webhooks",
]);

// Steps where nothing can be guessed (the provider or a 32-byte link token proves the person): a class
// signing in with Google together must not run out of the password-attempt budget.
const AUTH_LINK_PATHS = new Set([
  "/api/auth/signin/google",
  "/api/auth/callback/google",
  "/api/auth/callback/resend",
  "/api/auth/callback/google-one-tap",
]);

// Routes that tell whether a typed code exists (vouchers, family codes, class join codes). Counted per
// address whatever the session: accounts cost nothing to make, so a per-account budget let one person
// multiply guesses by the number of accounts they opened.
const CODE_PATHS = new Set([
  "/api/activate",
  "/api/vouchers/pending",
  "/api/family/invite/lookup",
  "/api/family/accept",
  "/api/domains/join",
  "/api/acces/activare",
]);

export type Bucket = { bucket: string; maxRequests: number; perAddress: boolean; strict: boolean };

/** `path` is already decoded (see `decodedApiPath`). */
export function rateLimitBucket(path: string): Bucket {
  if (path.startsWith("/api/admin/stripe") || path.startsWith("/api/stripe")) {
    return { bucket: "/api/stripe", maxRequests: 3, perAddress: false, strict: false };
  }
  if (path === "/api/auth" || path.startsWith("/api/auth/")) {
    if (AUTH_READ_PATHS.has(path)) return { bucket: "/api/auth:read", maxRequests: 300, perAddress: false, strict: false };
    if (AUTH_LINK_PATHS.has(path)) return { bucket: "/api/auth:link", maxRequests: 120, perAddress: true, strict: false };
    return { bucket: "/api/auth:write", maxRequests: 20, perAddress: true, strict: true };
  }
  const seg = path.split("/");
  if (CODE_PATHS.has(path)) {
    return { bucket: "/api/codes", maxRequests: 60, perAddress: true, strict: true };
  }
  const first = seg[2] ?? "";
  return { bucket: API_FOLDERS.has(first) ? `/api/${first}` : "/api/:domain", maxRequests: 60, perAddress: false, strict: false };
}

/** The path as the router will see it: percent-decoded once. null → malformed, refused. */
export function decodedApiPath(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}
