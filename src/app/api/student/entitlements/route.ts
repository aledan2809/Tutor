import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { featureMap } from "@/lib/plan-features";
import { accessOpensPaidFeatures } from "@/lib/access";
import { loadAccess } from "@/lib/access-server";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET /api/student/entitlements
 * Server-truth for the per-plan function soft-lock: which functions the logged-in
 * user's access unlocks (access.ts decides: paid, family, company, staff, „Gratuit permanent",
 * the 7-day trial; free and paused accounts stay locked). The UI renders what this says.
 *
 * `subscriptionStatus` keeps its old meaning for existing readers: "family" for the child of a
 * paying family, "org" for a company-paid learner, "active" for everything else that is open.
 */
async function _GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await loadAccess(session.user.id);
  const open = access ? accessOpensPaidFeatures(access) : false;
  const subscriptionStatus =
    access?.kind === "full"
      ? access.reason === "family_paid"
        ? "family"
        : access.reason === "org"
          ? "org"
          : "active"
      : access?.kind === "trial"
        ? "trial"
        : access?.kind === "paused"
          ? "paused"
          : null;

  return NextResponse.json({
    subscriptionStatus,
    features: featureMap(open ? "active" : null),
    access,
  });
}

export const GET = withErrorHandler(_GET);
