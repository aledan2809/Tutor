import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { getStreakInfo } from "@/lib/gamification";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";
import { refuseIfPaused } from "@/lib/access-gate";

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Proba gratuită s-a încheiat fără plată: contul e în pauză (access.ts).
  const paused = await refuseIfPaused(session.user.id);
  if (paused) return paused;

  const { domain: domainSlug } = await params;

  const gate = await resolveDomainOrForbid(domainSlug, session.user);
  if (!gate.ok) return gate.response;
  const domain = gate.domain;

  const streakInfo = await getStreakInfo(session.user.id, domain.id);
  return NextResponse.json(streakInfo);
}

export const GET = withErrorHandler(_GET);
