import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import { becomeParent } from "@/lib/family-invite";

/**
 * POST: „Sunt părinte" — a role-less account that picked a subject at sign-up (so it was taken for a
 * learner) becomes a parent's account, and can link the child in the free week (canBecomeParent).
 */
async function _POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await becomeParent(session.user.id))) {
    return NextResponse.json(
      { error: "Contul nu se poate schimba în cont de părinte: are deja un rol sau e legat ca și copil al unui părinte." },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(_POST);
