import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const publicPaths = ["/", "/auth/signin", "/auth/verify"];

function isPublicPath(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ro)/, "") || "/";
  return publicPaths.some(
    (p) =>
      pathWithoutLocale === p ||
      pathWithoutLocale.startsWith("/api/auth")
  );
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API auth routes entirely
  if (pathname.startsWith("/api/auth")) {
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
  matcher: ["/", "/(en|ro)/:path*"],
};
