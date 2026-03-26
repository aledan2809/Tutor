import { auth } from "@/lib/auth";
import { EnrollmentRole } from "@prisma/client";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export async function getSession() {
  return await auth();
}

export function hasRole(
  session: Session | null,
  domainSlug: string,
  role: EnrollmentRole
): boolean {
  if (!session?.user) return false;
  const user = session.user as Session["user"] & {
    isSuperAdmin?: boolean;
    enrollments?: { domainSlug: string; roles: EnrollmentRole[] }[];
  };
  if (user.isSuperAdmin) return true;
  const enrollment = user.enrollments?.find(
    (e) => e.domainSlug === domainSlug
  );
  return enrollment?.roles.includes(role) ?? false;
}

export function hasAnyRole(
  session: Session | null,
  domainSlug: string,
  roles: EnrollmentRole[]
): boolean {
  if (!session?.user) return false;
  const user = session.user as Session["user"] & {
    isSuperAdmin?: boolean;
    enrollments?: { domainSlug: string; roles: EnrollmentRole[] }[];
  };
  if (user.isSuperAdmin) return true;
  const enrollment = user.enrollments?.find(
    (e) => e.domainSlug === domainSlug
  );
  return enrollment?.roles.some((r) => roles.includes(r)) ?? false;
}

export function requireAuth(session: Session | null) {
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function requireRole(
  session: Session | null,
  domainSlug: string,
  role: EnrollmentRole
) {
  const authError = requireAuth(session);
  if (authError) return authError;
  if (!hasRole(session, domainSlug, role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
