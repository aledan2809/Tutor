import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  const user = session.user;
  const isAdmin =
    user.isSuperAdmin ||
    user.enrollments?.some((e) =>
      e.roles.includes("ADMIN" as never) || e.roles.includes("INSTRUCTOR" as never)
    );

  if (!isAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}
