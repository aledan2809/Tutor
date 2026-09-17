/**
 * Server-side enforcement for plan-tiered functions. The pure policy lives in
 * plan-features.ts and access.ts; this does the DB lookup + builds the 403 response so the
 * security boundary is the API (not the hideable UI). The `{ locked, feature }`
 * shape lets the client render the upgrade soft-lock on a 403.
 */

import { NextResponse } from "next/server";
import { PAID_FEATURES, type PlanFeature } from "./plan-features";
import { accessOpensPaidFeatures } from "./access";
import { loadAccess } from "./access-server";
import { pausedResponse } from "./access-gate";

/**
 * Returns a 403 response when the user's access doesn't include `feature`, or
 * `null` when access is allowed. Pass `bypass: true` for staff (superadmin) who
 * must never be paywalled.
 *
 * Open: a paid plan, a child of a paying family, a company-paid learner, staff, „Gratuit
 * permanent", and the 7-day trial. Closed: a free account, and a paused one (then the response
 * says `paused`, so the page shows the pause screen rather than the package ad).
 */
export async function requireFeature(
  userId: string,
  feature: PlanFeature,
  opts?: { bypass?: boolean },
): Promise<NextResponse | null> {
  if (opts?.bypass) return null;

  const access = await loadAccess(userId);
  if (access?.kind === "paused") return pausedResponse(access, { locked: true, feature });
  // A function no package gates (plan-features.ts) is open to every account that isn't paused.
  if (!PAID_FEATURES.includes(feature)) return null;
  if (access && accessOpensPaidFeatures(access)) return null;

  return NextResponse.json(
    { error: "Această funcție face parte dintr-un pachet.", locked: true, feature },
    { status: 403 },
  );
}
