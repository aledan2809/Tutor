import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  startRecoverySession,
  completeRecoverySession,
} from "@/lib/gamification";

// GET: Start a recovery session (returns questions)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const result = await startRecoverySession(session.user.id, domain.id);
  return NextResponse.json(result);
}

// POST: Submit recovery session answers
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain: domainSlug } = await params;

  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
  });
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

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
