/**
 * The two kinds of administrator — the RULE, with no IO.
 *
 * Pure so it can be unit-tested and read on its own; the part that touches the
 * session and the database lives in merchant-auth.ts. Same split as
 * domain-access.ts (rule) vs domain-gate.ts (gate), and for the same reason: a
 * rule that imports next-auth cannot be tested without booting half the app.
 *
 *   PLATFORM  the superadmin. Everything, unscoped.
 *   ORG       a merchant admin. Their own organization only: its subjects, its
 *             content, its people. Platform-wide surfaces (plans, ads, revenue,
 *             campaigns, impersonation) stay closed to them.
 */

export type AdminScope =
  | { kind: "PLATFORM"; organizationId: null }
  | { kind: "ORG"; organizationId: string };

/** Separates the two kinds where a call site must treat them differently. */
export function isPlatform(scope: AdminScope): scope is { kind: "PLATFORM"; organizationId: null } {
  return scope.kind === "PLATFORM";
}

/**
 * The `where` fragment that scopes a query to what this admin may touch.
 * PLATFORM → `{}` (everything, so the superadmin's queries stay byte-identical to
 * what they were). ORG → only that organization's rows.
 * Spread it into a Prisma `where`; never rebuild the filter by hand at a call site.
 */
export function domainScopeWhere(scope: AdminScope): { organizationId?: string } {
  return scope.kind === "PLATFORM" ? {} : { organizationId: scope.organizationId };
}

/**
 * May this admin act on this subject?
 *
 * A subject with no organization belongs to the PLATFORM, not to whichever
 * merchant asks first — that is why `null` is not treated as "unowned, help
 * yourself". A missing subject is nobody's either, so a bad id cannot pass.
 */
export function ownsDomain(
  scope: AdminScope,
  domain: { organizationId: string | null } | null | undefined
): boolean {
  if (!domain) return false;
  if (scope.kind === "PLATFORM") return true;
  return domain.organizationId === scope.organizationId;
}

/** Same rule, for accounts. */
export function ownsUser(
  scope: AdminScope,
  user: { organizationId: string | null } | null | undefined
): boolean {
  if (!user) return false;
  if (scope.kind === "PLATFORM") return true;
  return user.organizationId === scope.organizationId;
}
