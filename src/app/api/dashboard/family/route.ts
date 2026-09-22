import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { canBecomeParent, familyBuyer, familyViewerFacts, getFamilyOverview } from "@/lib/family-invite";
import { loadAccess, loadSeatHolder } from "@/lib/access-server";
import { parentUpgradeQuote } from "@/lib/parent-upgrade";

/**
 * GET the current user's family household (members + seats + pending invites), the account's
 * access, whether it may be offered a family package (familyBuyer — never a learner or someone's
 * child) and whether it may declare itself a parent (canBecomeParent).
 */
async function _GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [overview, access, facts] = await Promise.all([
    getFamilyOverview(session.user.id),
    loadAccess(session.user.id),
    familyViewerFacts(session.user.id, prisma),
  ]);
  // A parent left out of the co-parent's plan is told who has it and which plan takes them too —
  // never sent to buy a second Family for the same child (review r6, sweep S3). Read only for an
  // account on the trial or paused, as the dashboard does.
  const seatHolder = access && (access.kind === "trial" || access.kind === "paused") ? await loadSeatHolder(session.user.id) : null;
  // The other way round: the payer is told that an adult of the family is left out, and what the move
  // to the package that includes them costs (Alex, decisions 6-7 of 22.09).
  const parentUpgrade = await parentUpgradeQuote(session.user.id, overview);
  return NextResponse.json({
    ...overview,
    access,
    seatHolder,
    parentUpgrade,
    offersFamily: facts !== null && familyBuyer(facts),
    canBecomeParent: facts !== null && canBecomeParent(facts),
  });
}

export const GET = withErrorHandler(_GET);
