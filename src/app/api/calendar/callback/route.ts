import { NextRequest, NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET /api/calendar/callback
 * OAuth callback from Google. Exchanges code for tokens, stores in DB.
 */
async function _GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateStr = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/dashboard/calendar?error=access_denied", req.url)
    );
  }

  if (!code || !stateStr) {
    return NextResponse.redirect(
      new URL("/dashboard/calendar?error=missing_params", req.url)
    );
  }

  let state: { userId: string; domainId: string; domainSlug: string };
  try {
    state = JSON.parse(stateStr);
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/calendar?error=invalid_state", req.url)
    );
  }

  const client = getCalendarClient();
  const tokenSet = await client.exchangeCode(code);

  // Decode the Google user ID from the access token info
  // We'll use the userId+domainId as the unique key; store a placeholder googleId
  const googleId = `gcal_${state.userId}_${state.domainId}`;

  await prisma.userCalendar.upsert({
    where: {
      userId_domainId: {
        userId: state.userId,
        domainId: state.domainId,
      },
    },
    update: {
      accessToken: tokenSet.accessToken,
      refreshToken: tokenSet.refreshToken || "",
      expiresAt: tokenSet.expiresAt,
      googleId,
    },
    create: {
      userId: state.userId,
      domainId: state.domainId,
      googleId,
      accessToken: tokenSet.accessToken,
      refreshToken: tokenSet.refreshToken || "",
      expiresAt: tokenSet.expiresAt,
    },
  });

  return NextResponse.redirect(
    new URL(`/dashboard/calendar?connected=${state.domainSlug}`, req.url)
  );
}

export const GET = withErrorHandler(_GET);
