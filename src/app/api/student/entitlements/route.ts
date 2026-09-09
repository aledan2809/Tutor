import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { featureMap } from "@/lib/plan-features";
import { hasAnyOrgProvidedAccess } from "@/lib/org-entitlement";
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

  // Cine e înscris într-o materie a unei firme are accesul plătit de firmă, nu de
  // el. Fără linia asta, poarta paginii de lecții rulează înainte de a ști despre ce
  // materie e vorba și arată ecranul de vânzare — inclusiv contului demonstrativ al
  // Poștei, în chiar demonstrația de vânzare (măsurat pe producție 2026-09-09).
  if (!user?.subscriptionStatus && (await hasAnyOrgProvidedAccess(session.user.id))) {
    return NextResponse.json({
      subscriptionStatus: "org",
      features: featureMap("active"),
    });
  }

  return NextResponse.json({
    subscriptionStatus: user?.subscriptionStatus ?? null,
    features: featureMap(user?.subscriptionStatus),
  });
}

export const GET = withErrorHandler(_GET);
