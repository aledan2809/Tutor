import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { withErrorHandler } from "@/lib/api-handler";
import { isGuardianOf } from "@/lib/guardian";
import { getUserPhone, setUserPhone, clearUserPhone, normalizePhoneInput } from "@/lib/phone-setting";

/** GET — the child's WhatsApp phone (guardian only). */
async function _GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ phone: await getUserPhone(childId) });
}

/** PUT — set or clear (empty) the child's WhatsApp phone (guardian only). */
async function _PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: childId } = await params;
  if (!(await isGuardianOf(session.user.id, childId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { phone?: string };
  const raw = (body.phone ?? "").trim();
  if (!raw) {
    await clearUserPhone(childId);
    return NextResponse.json({ phone: null });
  }
  const phone = normalizePhoneInput(raw);
  if (!phone) return NextResponse.json({ error: "Număr de telefon invalid" }, { status: 400 });
  await setUserPhone(childId, phone);
  return NextResponse.json({ phone });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
