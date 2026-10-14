import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getParentChildIds } from "@/lib/guardian";

export async function requireWatcher() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  const user = session.user;
  const isWatcher =
    user.isSuperAdmin ||
    user.enrollments?.some((e) => e.roles.includes("WATCHER" as never));

  if (!isWatcher) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}

export async function requireInstructor(domainSlug?: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  const user = session.user;

  // H09: If domainSlug provided, enforce domain boundary
  if (domainSlug && !user.isSuperAdmin) {
    const enrollment = user.enrollments?.find(
      (e) => e.domainSlug === domainSlug && (e.roles.includes("INSTRUCTOR" as never) || e.roles.includes("ADMIN" as never))
    );
    if (!enrollment) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
    }
    return { error: null, session };
  }

  const isInstructor =
    user.isSuperAdmin ||
    user.enrollments?.some((e) =>
      e.roles.includes("INSTRUCTOR" as never) || e.roles.includes("ADMIN" as never)
    );

  if (!isInstructor) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}

export async function requireWatcherOrInstructor() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  const user = session.user;
  const hasAccess =
    user.isSuperAdmin ||
    user.enrollments?.some((e) =>
      e.roles.includes("WATCHER" as never) ||
      e.roles.includes("INSTRUCTOR" as never) ||
      e.roles.includes("ADMIN" as never)
    ) ||
    // A parent whose child has no subject yet (guardian.ts getParentChildIds); each route still checks the child.
    (await getParentChildIds(user.id)).length > 0;

  if (!hasAccess) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}
