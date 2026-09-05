import { NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { getLeaderboard } from "@/lib/gamification";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const gate = await resolveDomainOrForbid(domainSlug, session.user);
  if (!gate.ok) return gate.response;
  const domain = gate.domain;

  const leaderboard = await getLeaderboard(session.user.id, domain.id);
  return NextResponse.json(leaderboard);
}

export const GET = withErrorHandler(_GET);
