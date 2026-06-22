import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";
import { authorizeExtraMemento } from "@/lib/escalation/parent-monitor";
import { z } from "zod";

const schema = z.object({ childId: z.string().min(1) });

/**
 * POST /api/parent/authorize-memento — a parent authorizes an extra (full, incl.
 * WhatsApp) cascade for their child after a no-reaction alert. Guarded: caller
 * must be an active guardian of the child.
 */
async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!(await isGuardianOf(session.user.id, parsed.data.childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await authorizeExtraMemento(session.user.id, parsed.data.childId);
  if (!result.ok) {
    return NextResponse.json(
      { error: "No pending escalation to authorize" },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}

export const POST = withErrorHandler(_POST);
