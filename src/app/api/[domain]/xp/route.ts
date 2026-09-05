import { NextRequest, NextResponse } from "next/server";
import { getSession, hasAnyRole } from "@/lib/authorization";
import { getXpInfo, awardXpDirect } from "@/lib/gamification";
import { z } from "zod";
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

  const xpInfo = await getXpInfo(session.user.id, domain.id);
  return NextResponse.json(xpInfo);
}

const addXpSchema = z.object({
  userId: z.string().min(1),
  xp: z.number().int().min(1).max(10000),
  reason: z.string().min(1).max(200),
});

async function _POST(
  req: NextRequest,
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

  if (!hasAnyRole(session, domainSlug, ["ADMIN", "INSTRUCTOR"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = addXpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await awardXpDirect(parsed.data.userId, domain.id, parsed.data.xp, parsed.data.reason);
  return NextResponse.json(result);
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
