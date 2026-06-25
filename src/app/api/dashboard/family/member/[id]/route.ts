import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import { removeFamilyMember } from "@/lib/family-invite";

/** DELETE: remove a member (child / co-parent / tutor) from the family. */
async function _DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await removeFamilyMember({ ownerId: session.user.id, memberId: id });
  if (!ok) {
    return NextResponse.json({ error: "Not a member of your family" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export const DELETE = withErrorHandler(_DELETE);
