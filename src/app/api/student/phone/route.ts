import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { withErrorHandler } from "@/lib/api-handler";
import { getUserPhone, setUserPhone, clearUserPhone, normalizePhoneInput } from "@/lib/phone-setting";

/** GET /api/student/phone — the signed-in user's WhatsApp phone. */
async function _GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ phone: await getUserPhone(session.user.id) });
}

/** PUT /api/student/phone — set ("phone") or clear (empty) the user's WhatsApp phone. */
async function _PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { phone?: string };
  const raw = (body.phone ?? "").trim();
  if (!raw) {
    await clearUserPhone(session.user.id);
    return NextResponse.json({ phone: null });
  }
  const phone = normalizePhoneInput(raw);
  if (!phone) return NextResponse.json({ error: "Număr de telefon invalid" }, { status: 400 });
  await setUserPhone(session.user.id, phone);
  return NextResponse.json({ phone });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
