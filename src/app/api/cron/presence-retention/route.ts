import { NextRequest, NextResponse } from "next/server";
import { purgeOldVisits } from "@/lib/presence";

/**
 * Drops presence older than a year and a bit. Presence says when a named person — sometimes a child —
 * had the page in front of them, so it is kept for a season and then forgotten. The admin table never
 * looks further back than 30 days; the extra months are there so a year-on-year question stays
 * answerable for a while.
 *
 * Called by cron with the shared secret, like the other cron routes; unreachable from the internet
 * (the vhost answers 404 on /api/cron/).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const days = Number(process.env.PRESENCE_RETENTION_DAYS || 400);
  const deleted = await purgeOldVisits(Number.isFinite(days) && days >= 30 ? days : 400);
  return NextResponse.json({ ok: true, deleted });
}
