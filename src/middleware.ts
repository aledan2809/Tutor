import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

// ─── Content-Security-Policy (per-request nonce) ───
// Moved here from next.config.ts headers() because a nonce must be unique per
// request (a static header cannot carry one). The root layout is force-dynamic,
// so every HTML response is rendered fresh — no stale-nonce caching risk.
//
// script-src: 'self' (Next chunk files) + per-request nonce (Next's own inline
// bootstrap — Next 15 reads the nonce from the CSP *request* header and stamps
// every <script> it emits) + accounts.google.com (the GSI client script that
// GoogleOneTap injects at runtime via document.createElement). No 'unsafe-inline',
// no 'strict-dynamic'. We have ZERO author-written inline <script> tags.
//
// style-src: keeps 'unsafe-inline' deliberately — Next inlines critical CSS as
// <style> without a nonce, and style-injection XSS is low severity. Documented
// compromise, widely used with the App Router.
function buildCsp(nonce: string): string {
  return (
    "default-src 'self'; " +
    `script-src 'self' 'nonce-${nonce}' https://accounts.google.com https://analytics.knowbest.ro; ` +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.googleusercontent.com; " +
    "font-src 'self'; " +
    "connect-src 'self' https://accounts.google.com https://*.googleapis.com https://analytics.knowbest.ro; " +
    "frame-src 'self' https://accounts.google.com; " +
    "frame-ancestors 'self'; " +
    "base-uri 'self'; " +
    "form-action 'self' https://accounts.google.com; " +
    "object-src 'none';"
  );
}

const publicPaths = ["/", "/try", "/scor", "/grile", "/auth/signin", "/auth/verify", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/terms", "/privacy", "/cookies", "/creatori", "/parinte", "/elev", "/preturi", "/ghid-bac", "/family/join"];
// Public sections that carry a dynamic segment (e.g. /duel/<id>, /certificat/<id>, /grile/<slug>).
// /family/accept/<token> must render for a logged-out invitee (the page itself
// offers sign-in / sign-up); the accept POST stays auth-gated server-side.
const publicPrefixes = ["/duel/", "/certificat/", "/grile/", "/family/accept/"];

function isPublicPath(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ro)/, "") || "/";
  return (
    publicPaths.some((p) => pathWithoutLocale === p || pathWithoutLocale.startsWith("/api/auth")) ||
    publicPrefixes.some((p) => pathWithoutLocale.startsWith(p))
  );
}

// ─── Rate limiting state (in-memory, edge-compatible) ───
const MAX_STORE_SIZE = 10_000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function purgeExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number } {
  let maxRequests = 60;
  const windowMs = 60_000;

  if (path.startsWith("/api/auth")) {
    maxRequests = 20;
  } else if (path.startsWith("/api/admin/stripe") || path.startsWith("/api/stripe")) {
    maxRequests = 3;
  }

  const key = `${ip}:${path.split("/").slice(0, 3).join("/")}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // Prevent unbounded growth: purge expired entries when store is too large
    if (rateLimitStore.size >= MAX_STORE_SIZE) {
      purgeExpiredEntries();
    }
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Cleanup stale entries periodically (limit map growth)
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    purgeExpiredEntries();
  }, 60_000);
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Per-request CSP nonce. crypto.randomUUID is edge-runtime safe.
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  // Redirect routes without locale prefix to default locale
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/en") &&
    !pathname.startsWith("/ro") &&
    !pathname.startsWith("/_next/") &&
    pathname !== "/" &&
    !pathname.match(/\.\w+$/)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}${pathname}`;
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, remaining } = checkRateLimit(ip, pathname);

    if (!allowed) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
          "Content-Security-Policy": csp,
        },
      });
    }

    // Skip auth routes for intl middleware
    if (pathname.startsWith("/api/auth")) {
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      response.headers.set("Content-Security-Policy", csp);
      return response;
    }

    const apiResponse = NextResponse.next();
    apiResponse.headers.set("Content-Security-Policy", csp);
    return apiResponse;
  }

  // Propagate the nonce to the rendered document: Next 15 extracts the nonce from
  // the Content-Security-Policy *request* header and stamps it on every <script>
  // it emits. We forward the original request headers (cookies etc.) plus x-nonce
  // and the CSP so next-intl's rewrite carries them through to the RSC render.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  // Expose the path to Server Components (so the layout can skip the minimal
  // policy-footer on the landing page, which has its own rich footer).
  requestHeaders.set("x-pathname", pathname);
  const intlRequest = new NextRequest(request, { headers: requestHeaders });

  // Run intl middleware for locale handling
  const response = intlMiddleware(intlRequest);

  // Add Secure flag to NEXT_LOCALE cookie on HTTPS
  if (request.nextUrl.protocol === "https:") {
    const localeCookie = response.cookies.get("NEXT_LOCALE");
    if (localeCookie) {
      response.cookies.set("NEXT_LOCALE", localeCookie.value, {
        path: "/",
        sameSite: "lax",
        secure: true,
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  // Check auth for protected routes
  if (!isPublicPath(pathname)) {
    const token =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!token) {
      const locale =
        pathname.match(/^\/(en|ro)/)?.[1] || routing.defaultLocale;
      const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
      // Strip locale prefix from callbackUrl to prevent double-locale (/en/en/...)
      const callbackPath = pathname.replace(/^\/(en|ro)/, "") || "/dashboard";
      signInUrl.searchParams.set("callbackUrl", callbackPath);
      const redirect = NextResponse.redirect(signInUrl);
      redirect.headers.set("Content-Security-Policy", csp);
      return redirect;
    }
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/", "/try", "/scor", "/ghid-bac", "/(en|ro)/:path*", "/api/:path*", "/dashboard/:path*", "/auth/:path*", "/family/:path*"],
};
