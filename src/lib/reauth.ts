import { NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";

const REAUTH_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if the user has recently re-authenticated.
 * Requires lastAuthAt in the JWT token (set by /api/auth/reauth).
 */
export async function requireReauth(
  req: NextRequest
): Promise<NextResponse | null> {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const tokenCookie =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  if (!tokenCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await decode({ token: tokenCookie, secret, salt: "" });
  if (!token?.lastAuthAt) {
    return NextResponse.json(
      { error: "Re-authentication required", code: "REAUTH_REQUIRED" },
      { status: 403 }
    );
  }

  const elapsed = Date.now() - (token.lastAuthAt as number);
  if (elapsed >= REAUTH_TTL_MS) {
    return NextResponse.json(
      { error: "Re-authentication expired", code: "REAUTH_REQUIRED" },
      { status: 403 }
    );
  }

  return null; // Reauth is valid
}
