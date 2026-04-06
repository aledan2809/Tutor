import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withErrorHandler } from "@/lib/api-handler";
import { encode, decode } from "next-auth/jwt";
import { cookies } from "next/headers";

const REAUTH_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { password } = body;

  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 400 }
    );
  }

  // Fetch user with password hash
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  });

  if (!user?.password) {
    return NextResponse.json(
      { error: "Password authentication not available for this account" },
      { status: 400 }
    );
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 403 }
    );
  }

  // Update the JWT token with lastAuthAt timestamp
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const tokenCookie =
    cookieStore.get("authjs.session-token")?.value ||
    cookieStore.get("__Secure-authjs.session-token")?.value;

  if (!tokenCookie) {
    return NextResponse.json({ error: "No session token" }, { status: 401 });
  }

  const token = await decode({ token: tokenCookie, secret, salt: "" });
  if (!token) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Set lastAuthAt in token
  token.lastAuthAt = Date.now();

  const newToken = await encode({ token, secret, salt: "" });

  const isSecure = req.url.startsWith("https");
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const response = NextResponse.json({
    success: true,
    expiresAt: Date.now() + REAUTH_TTL_MS,
  });

  response.cookies.set(cookieName, newToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
  });

  return response;
}

export const POST = withErrorHandler(_POST);
