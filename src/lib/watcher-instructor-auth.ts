import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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

export async function requireInstructor() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  const user = session.user;
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
    );

  if (!hasAccess) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}
