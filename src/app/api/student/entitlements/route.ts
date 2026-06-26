import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { featureMap } from "@/lib/plan-features";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET /api/student/entitlements
 * Server-truth for the per-plan function soft-lock: which functions the logged-in
 * user's package unlocks. Superadmins get everything. The UI renders what this says.
 */
async function _GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.isSuperAdmin) {
    return NextResponse.json({
      subscriptionStatus: "active",
      features: featureMap("active"),
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true },
  });

  return NextResponse.json({
    subscriptionStatus: user?.subscriptionStatus ?? null,
    features: featureMap(user?.subscriptionStatus),
  });
}

export const GET = withErrorHandler(_GET);
