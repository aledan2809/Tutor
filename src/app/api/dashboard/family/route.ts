import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import { getFamilyOverview, loadCanBecomeParent } from "@/lib/family-invite";
import { loadAccess } from "@/lib/access-server";

/**
 * GET the current user's family household (members + seats + pending invites), the account's
 * access, and whether it may declare itself a parent (canBecomeParent).
 */
async function _GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [overview, access, canBecomeParent] = await Promise.all([
    getFamilyOverview(session.user.id),
    loadAccess(session.user.id),
    loadCanBecomeParent(session.user.id),
  ]);
  return NextResponse.json({ ...overview, access, canBecomeParent });
}

export const GET = withErrorHandler(_GET);
