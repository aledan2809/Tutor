import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Require global admin access (superAdmin only).
 * Use this for routes that manage cross-domain resources (e.g. listing all domains).
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  if (!session.user.isSuperAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}

/**
 * Require ADMIN or INSTRUCTOR role in at least one domain.
 * Returns `allowedDomainIds = null` for superAdmin (all domains),
 * or the array of domain IDs where the user holds ADMIN/INSTRUCTOR.
 * Callers should scope queries with `where.domainId IN allowedDomainIds`.
 */
export async function requireAdminOrInstructor() {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
      allowedDomainIds: null as string[] | null,
    };
  }

  const user = session.user;
  if (user.isSuperAdmin) {
    return { error: null, session, allowedDomainIds: null as string[] | null };
  }

  const allowedDomainIds = (user.enrollments ?? [])
    .filter(
      (e) =>
        e.roles.includes("ADMIN" as never) || e.roles.includes("INSTRUCTOR" as never)
    )
    .map((e) => e.domainId);

  if (allowedDomainIds.length === 0) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
      allowedDomainIds: null as string[] | null,
    };
  }

  return { error: null, session, allowedDomainIds };
}

/**
 * Require admin/instructor access scoped to a specific domain.
 * Grants access if the user is a superAdmin OR has ADMIN/INSTRUCTOR role
 * in the specified domain.
 */
export async function requireDomainAdmin(domainId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  const user = session.user;
  const hasDomainAccess =
    user.isSuperAdmin ||
    user.enrollments?.some(
      (e) =>
        e.domainId === domainId &&
        (e.roles.includes("ADMIN" as never) || e.roles.includes("INSTRUCTOR" as never))
    );

  if (!hasDomainAccess) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}
