import { NextRequest, NextResponse } from "next/server";

// POST /api/v1/consent/record  { type?, choice, locale? }
// Records the visitor's cookie consent in the Legal Hub (anonymous path: x-app-slug
// header, no x-user-id — Legal derives an anon id from the IP hash). Legal's
// /api/v1/consents/record schema: { appSlug, documentVersionId, consentText, method }.
// We resolve the current document version server-side. Best-effort: never blocks the
// UI (the client also persists the choice locally).

const APP_SLUG = "tutor";
export const dynamic = "force-dynamic";

// Per-IP rate limit (defense-in-depth: this proxy forwards to the Legal Hub).
const RATE_MAX = 10;
const RATE_WINDOW_MS = 60_000;
const counters = new Map<string, { count: number; resetAt: number }>();
function allow(ip: string): boolean {
  const now = Date.now();
  if (counters.size > 5000) {
    counters.forEach((v, k) => {
      if (v.resetAt < now) counters.delete(k);
    });
  }
  const e = counters.get(ip);
  if (!e || e.resetAt < now) {
    counters.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (e.count >= RATE_MAX) return false;
  e.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "local";
  if (!allow(ip)) {
    return NextResponse.json({ recorded: false, reason: "rate-limited" }, { status: 429 });
  }
  let payload: { type?: string; choice?: string; locale?: string } = {};
  try {
    payload = await request.json();
  } catch {
    /* tolerate */
  }

  const apiUrl = process.env.LEGAL_API_URL;
  if (!apiUrl) return NextResponse.json({ recorded: false, reason: "legal-not-configured" });

  const base = apiUrl.replace(/\/$/, "");
  const docType = (payload.type ?? "COOKIES").toLowerCase();
  const locale = payload.locale === "en" ? "en" : "ro";
  // Only record an affirmative consent; "rejected" is kept client-side only.
  if (payload.choice !== "accepted") {
    return NextResponse.json({ recorded: false, reason: "not-granted" });
  }

  try {
    // 1) resolve current document version id (master doc, rendered for eTutor)
    const docRes = await fetch(`${base}/api/v1/public/legal/${APP_SLUG}/${docType}?locale=${locale}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!docRes.ok) return NextResponse.json({ recorded: false, reason: "doc-unavailable", upstream: docRes.status });
    const doc = await docRes.json();
    const versionId = doc?.version?.id;
    if (!versionId) return NextResponse.json({ recorded: false, reason: "no-version" });

    const consentText = `Consimțământ cookie acordat prin banner-ul din aplicație pe etutor.ro (${docType} ${doc.version?.version ?? ""}).`;

    // 2) record (anonymous path: x-app-slug header, no x-user-id)
    const recRes = await fetch(`${base}/api/v1/consents/record`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-slug": APP_SLUG,
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({ appSlug: APP_SLUG, documentVersionId: versionId, consentText, method: "IN_APP" }),
      signal: AbortSignal.timeout(8000),
    });
    return NextResponse.json({ recorded: recRes.ok, upstream: recRes.status });
  } catch {
    return NextResponse.json({ recorded: false, reason: "legal-unreachable" });
  }
}
