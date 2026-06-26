/**
 * Server-side enforcement for plan-tiered functions. The pure policy lives in
 * plan-features.ts; this does the DB lookup + builds the 403 response so the
 * security boundary is the API (not the hideable UI). The `{ locked, feature }`
 * shape lets the client render the upgrade soft-lock on a 403.
 */

import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { hasFeature, type PlanFeature } from "./plan-features";

/**
 * Returns a 403 response when the user's package doesn't include `feature`, or
 * `null` when access is allowed. Pass `bypass: true` for staff (superadmin) who
 * must never be paywalled.
 */
export async function requireFeature(
  userId: string,
  feature: PlanFeature,
  opts?: { bypass?: boolean },
): Promise<NextResponse | null> {
  if (opts?.bypass) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true },
  });

  if (hasFeature(feature, user?.subscriptionStatus)) return null;

  return NextResponse.json(
    { error: "Această funcție face parte dintr-un pachet.", locked: true, feature },
    { status: 403 },
  );
}
