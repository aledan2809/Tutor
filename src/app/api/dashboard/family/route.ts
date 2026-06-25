import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import { getFamilyOverview } from "@/lib/family-invite";

/** GET the current user's family household (members + seats + pending invites). */
async function _GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const overview = await getFamilyOverview(session.user.id);
  return NextResponse.json(overview);
}

export const GET = withErrorHandler(_GET);
