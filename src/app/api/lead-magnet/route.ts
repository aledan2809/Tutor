// Lead-magnet capture relay (Money Machine S2). The /ghid-bac landing posts here; we validate and
// forward SERVER-SIDE to MarketingAutomation's /api/external/tutor/leads (the shared secret never
// reaches a browser). MA owns the Lead + the email sequence; Tutor only relays.
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const url = process.env.MA_LEADS_URL;
  const secret = process.env.MA_LEADS_SECRET;
  if (!url || !secret) {
    return NextResponse.json({ error: "lead capture not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";
  const consent = body?.consent === true;
  const utm = body?.utm && typeof body.utm === "object" ? body.utm : {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Adresa de email nu pare validă." }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "Bifează acordul pentru a primi ghidul." }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": secret },
      body: JSON.stringify({ email, firstName, consent: true, utm, sourceUrl: "https://etutor.ro/ghid-bac" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[lead-magnet] MA relay failed:", res.status, detail.slice(0, 200));
      return NextResponse.json({ error: "Nu am putut procesa cererea — încearcă din nou." }, { status: 502 });
    }
  } catch (e) {
    console.error("[lead-magnet] MA relay error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Nu am putut procesa cererea — încearcă din nou." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
