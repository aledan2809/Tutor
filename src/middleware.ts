import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const publicPaths = ["/", "/auth/signin", "/auth/verify", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/terms", "/privacy"];

function isPublicPath(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ro)/, "") || "/";
  return publicPaths.some(
    (p) =>
      pathWithoutLocale === p ||
      pathWithoutLocale.startsWith("/api/auth")
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

  // Redirect routes without locale prefix to default locale
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/en/") &&
    !pathname.startsWith("/ro/") &&
    !pathname.startsWith("/_next/") &&
    pathname !== "/" &&
    !pathname.match(/\.\w+$/)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
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
        },
      });
    }

    // Skip auth routes for intl middleware
    if (pathname.startsWith("/api/auth")) {
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      return response;
    }

    return NextResponse.next();
  }

  // Run intl middleware for locale handling
  const response = intlMiddleware(request);

  // Check auth for protected routes
  if (!isPublicPath(pathname)) {
    const token =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!token) {
      const locale =
        pathname.match(/^\/(en|ro)/)?.[1] || routing.defaultLocale;
      const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/(en|ro)/:path*", "/api/:path*", "/dashboard/:path*", "/auth/:path*"],
};
