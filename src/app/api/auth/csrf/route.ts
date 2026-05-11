import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const CSRF_COOKIE = "csrf-token";
const TOKEN_LENGTH = 32;
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * GET /api/auth/csrf
 * Generates a CSRF token, sets it as an httpOnly cookie, and returns it.
 * The client stores this token and sends it back via X-CSRF-Token header
 * on all state-changing requests (POST, PUT, PATCH, DELETE).
 *
 * AUDIT-002: Server-side CSRF token generation endpoint.
 */
export async function GET(req: NextRequest) {
  const existingToken = req.cookies.get(CSRF_COOKIE)?.value;

  // Reuse existing valid token if present
  if (existingToken && existingToken.length === TOKEN_LENGTH * 2) {
    return NextResponse.json({ csrfToken: existingToken });
  }

  const token = randomBytes(TOKEN_LENGTH).toString("hex");

  const response = NextResponse.json({ csrfToken: token });
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}
