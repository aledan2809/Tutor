/**
 * The two kinds of administrator — the part that touches the session and the
 * database. The rule itself is pure and lives in merchant-scope.ts, which is what
 * the unit tests exercise; this file only resolves WHO is asking.
 *
 * Until 2026-09-05 there was effectively one kind: the superadmin. 41 admin routes
 * check `isSuperAdmin` — including the helper named `requireAdmin`, which does
 * NOT mean "an admin" — so the per-domain ADMIN enrollment role let someone into
 * the panel and was then refused by almost everything inside it.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownsDomain, type AdminScope } from "@/lib/merchant-scope";

// Re-exported so the ~10 routes that already import them from here keep working,
// and so a call site needs one import rather than two.
export { isPlatform, domainScopeWhere, ownsDomain, ownsUser } from "@/lib/merchant-scope";
export type { AdminScope } from "@/lib/merchant-scope";

type Ok = { error: null; scope: AdminScope; userId: string };
type Err = { error: NextResponse; scope: null; userId: null };

function unauthorized(): Err {
  return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), scope: null, userId: null };
}
function forbidden(): Err {
  return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), scope: null, userId: null };
}

/**
 * Admin of the platform, or admin of one organization.
 *
 * The organization is re-read from the database rather than taken from the
 * session: session claims are cached for up to five minutes (auth.ts REFRESH_MS),
 * and revoking a merchant admin should take effect at once, not eventually.
 *
 * `isOrgAdmin` and `organizationId` are read as a pair. One without the other is
 * an admin of nothing in particular, and treating it as either kind would be wrong.
 */
export async function requireContentAdmin(): Promise<Ok | Err> {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  if (session.user.isSuperAdmin) {
    return { error: null, scope: { kind: "PLATFORM", organizationId: null }, userId: session.user.id };
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isOrgAdmin: true, organizationId: true, isBanned: true },
  });
  if (!me || me.isBanned) return forbidden();
  if (!me.isOrgAdmin || !me.organizationId) return forbidden();

  return { error: null, scope: { kind: "ORG", organizationId: me.organizationId }, userId: session.user.id };
}

/**
 * Look up a subject and confirm this admin owns it.
 * 404 rather than 403 for a subject outside the scope: a merchant must not learn
 * which subjects other merchants have, the same reasoning as the private-domain gate.
 */
export async function resolveOwnedDomain(
  scope: AdminScope,
  domainId: string
): Promise<{ ok: true; domain: { id: string; slug: string; name: string; organizationId: string | null } } | { ok: false; response: NextResponse }> {
  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    select: { id: true, slug: true, name: true, organizationId: true },
  });
  if (!ownsDomain(scope, domain)) {
    return { ok: false, response: NextResponse.json({ error: "Domain not found" }, { status: 404 }) };
  }
  return { ok: true, domain: domain! };
}
