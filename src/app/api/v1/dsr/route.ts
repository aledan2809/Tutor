import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// POST /api/v1/dsr  { email, type: "export"|"delete"|"rectify", description? }
// Proxies a Data Subject Request to the Legal Hub (legal.knowbest.ro) on the
// CONSUMER_APP channel (appSlug = "tutor"). Legal runs the DPO queue + the Art. 12
// email-confirmation. Controller for eTutor data = Class RDA Impex SRL.
// CONSUMER_APP REQUIRES the x-legal-api-key header (Legal F-11) — without it Legal
// rejects an appSlug-attributed submission (anti-forgery into the DPO queue).

const APP_SLUG = "tutor";
const VALID_TYPES = ["export", "delete", "rectify"] as const;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let payload: { email?: string; type?: string; description?: string } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  // A logged-in user's request is bound to their account (better evidence); a
  // logged-out visitor may still file by email (DPO verifies via Art. 12 email).
  const session = await auth().catch(() => null);
  const sessionEmail = session?.user?.email ?? null;
  const globalUserId = session?.user?.id ?? null;

  const email = (sessionEmail ?? payload.email ?? "").trim();
  const type = (payload.type ?? "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "valid email required" }, { status: 400 });
  }
  if (!(VALID_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ ok: false, error: `type must be one of ${VALID_TYPES.join(", ")}` }, { status: 400 });
  }

  const apiUrl = process.env.LEGAL_API_URL;
  const apiKey = process.env.LEGAL_API_KEY;
  if (!apiUrl) return NextResponse.json({ ok: false, error: "legal-not-configured" }, { status: 503 });
  if (!apiKey) return NextResponse.json({ ok: false, error: "legal-key-not-configured" }, { status: 503 });

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/dsr/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-legal-api-key": apiKey,
      },
      body: JSON.stringify({
        email,
        type,
        appSlug: APP_SLUG,
        ...(globalUserId ? { globalUserId } : {}),
        ...(payload.description ? { description: String(payload.description).slice(0, 5000) } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    return NextResponse.json({ ok: res.ok, upstream: res.status });
  } catch {
    return NextResponse.json({ ok: false, error: "legal-unreachable" }, { status: 502 });
  }
}
