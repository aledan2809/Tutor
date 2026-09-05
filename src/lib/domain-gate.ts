/**
 * The single gate every domain-scoped route must pass through.
 *
 * Before this existed, `/api/[domain]/*` routes each did their own
 * `prisma.domain.findUnique({ where: { slug } })` and then mostly trusted the slug.
 * Eleven of twenty-nine routes checked something; the rest served whatever domain
 * was named in the URL — so the daily challenge, the bibliography and the
 * leaderboard of a private subject were readable by any logged-in account.
 *
 * Two deliberate choices:
 *
 * 1. A private domain the caller may not reach answers 404, not 403. 403 would
 *    confirm the domain exists, and "invisible" was chosen to mean invisible: a
 *    private subject must be indistinguishable from one that was never created.
 *
 * 2. Enrollment is re-read from the database rather than taken from the session.
 *    Session enrollments are cached for up to five minutes (auth.ts REFRESH_MS),
 *    so a revoked enrollment would otherwise keep working for that long. One extra
 *    query, only on private domains, buys revocation that takes effect at once.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canSeePrivateDomains, type DomainAccessUser } from "@/lib/domain-access";

export interface GatedDomain {
  id: string;
  slug: string;
  name: string;
  visibility: "PUBLIC" | "PRIVATE";
  isActive: boolean;
}

export type DomainGateUser = DomainAccessUser & { id?: string };

export type DomainGateResult =
  | { ok: true; domain: GatedDomain }
  | { ok: false; response: NextResponse };

/** The answer given for "does not exist" and for "exists but is not yours". */
function notFound(): NextResponse {
  return NextResponse.json({ error: "Domain not found" }, { status: 404 });
}

/**
 * Resolve a domain slug for this user, or produce the response to return.
 *
 * Callers replace their own `findUnique` with this and keep the rest untouched:
 *
 *   const gate = await resolveDomainOrForbid(domainSlug, session.user);
 *   if (!gate.ok) return gate.response;
 *   const domain = gate.domain;
 */
export async function resolveDomainOrForbid(
  slug: string,
  user: DomainGateUser | null | undefined
): Promise<DomainGateResult> {
  const domain = await prisma.domain.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, visibility: true, isActive: true },
  });
  if (!domain) return { ok: false, response: notFound() };

  // Admins reach everything, including domains switched off, so a subject can be
  // repaired while it is dark.
  if (canSeePrivateDomains(user)) return { ok: true, domain };

  // A domain that was switched off is not content any more, for anyone else.
  if (!domain.isActive) return { ok: false, response: notFound() };

  if (domain.visibility === "PUBLIC") return { ok: true, domain };

  if (!user?.id) return { ok: false, response: notFound() };

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_domainId: { userId: user.id, domainId: domain.id } },
    select: { isActive: true },
  });
  if (!enrollment?.isActive) return { ok: false, response: notFound() };

  return { ok: true, domain };
}
