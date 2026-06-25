import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET public-safe invite info for the accept/join screens (no auth — the
 * recipient may not be logged in yet). Exposes only the inviter's display name,
 * the role, and whether the invite is still usable. Looks up by ?token= or ?code=.
 */
async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const code = searchParams.get("code");
  const where = token ? { token } : code ? { code: code.toUpperCase() } : null;
  if (!where) {
    return NextResponse.json({ error: "token sau code obligatoriu" }, { status: 400 });
  }

  const invite = await prisma.familyInvite.findUnique({
    where,
    select: {
      targetRole: true,
      status: true,
      expiresAt: true,
      inviter: { select: { name: true } },
    },
  });
  if (!invite) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  const usable =
    invite.status === "pending" && invite.expiresAt.getTime() > Date.now();

  return NextResponse.json({
    found: true,
    usable,
    status: invite.status,
    targetRole: invite.targetRole,
    inviterName: invite.inviter?.name ?? null,
  });
}

export const GET = withErrorHandler(_GET);
