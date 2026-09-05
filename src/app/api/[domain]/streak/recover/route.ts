import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import {
  startRecoverySession,
  completeRecoverySession,
} from "@/lib/gamification";
import { withErrorHandler } from "@/lib/api-handler";
import { resolveDomainOrForbid } from "@/lib/domain-gate";

// GET: Start a recovery session (returns questions)
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

  const result = await startRecoverySession(session.user.id, domain.id);
  return NextResponse.json(result);
}

// POST: Submit recovery session answers
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

  const body = await req.json();
  const { answers, startedAtMs } = body;

  if (!Array.isArray(answers) || typeof startedAtMs !== "number") {
    return NextResponse.json(
      { error: "Missing required fields: answers (array), startedAtMs (number)" },
      { status: 400 }
    );
  }

  const result = await completeRecoverySession(
    session.user.id,
    domain.id,
    answers,
    startedAtMs
  );
  return NextResponse.json(result);
}

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
