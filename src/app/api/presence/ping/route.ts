import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordPing } from "@/lib/presence";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * The quiet signal a page sends while it is in front, so the admin table can say how often an account
 * comes and for how long. Carries nothing: who it is comes from the session, when it is from the
 * server's clock — a body would only be a way to write someone else's presence.
 *
 * Never fails the page: a presence that cannot be recorded is answered 204 like one that was.
 */
export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new NextResponse(null, { status: 401 });

  // The page signals once a minute; 10 leaves room for several tabs and reloads, and stops a loop
  // from spending a transaction per request. Refused signals are silent — nothing is lost but a tick.
  const { allowed } = checkRateLimit(`presence:${userId}`, { maxRequests: 10, windowMs: 60_000 });
  if (!allowed) return new NextResponse(null, { status: 204 });

  try {
    await recordPing(userId);
  } catch (error) {
    console.error("[presence] ping failed:", error);
  }
  return new NextResponse(null, { status: 204 });
}
