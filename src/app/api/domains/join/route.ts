import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { normalizeJoinCode } from "@/lib/join-code";

/**
 * POST /api/domains/join { code }
 *
 * Redeem an access code → an active STUDENT enrollment in the domain that
 * issued it. This is the only self-service way into a private domain.
 *
 * Every failure is the same 404: a wrong code, a cleared code, a switched-off
 * domain. Anything more specific would let someone learn which codes are live.
 */
async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const code = typeof body.code === "string" ? normalizeJoinCode(body.code) : null;
  if (!code) {
    return NextResponse.json({ error: "Cod invalid" }, { status: 404 });
  }

  const domain = await prisma.domain.findUnique({
    where: { joinCode: code },
    select: { id: true, name: true, slug: true, isActive: true },
  });
  if (!domain || !domain.isActive) {
    return NextResponse.json({ error: "Cod invalid" }, { status: 404 });
  }

  // Upsert: a person whose enrollment was deactivated and who is handed a new
  // code gets back in; an already-active enrollment is left exactly as it is
  // (roles included — a WATCHER stays a WATCHER).
  const existing = await prisma.enrollment.findUnique({
    where: { userId_domainId: { userId: session.user.id, domainId: domain.id } },
    select: { isActive: true },
  });
  if (!existing) {
    await prisma.enrollment.create({
      data: { userId: session.user.id, domainId: domain.id, roles: ["STUDENT"], isActive: true },
    });
  } else if (!existing.isActive) {
    await prisma.enrollment.update({
      where: { userId_domainId: { userId: session.user.id, domainId: domain.id } },
      data: { isActive: true },
    });
  }

  return NextResponse.json({
    domain: { id: domain.id, name: domain.name, slug: domain.slug },
    alreadyEnrolled: existing?.isActive === true,
  });
}

export const POST = withErrorHandler(_POST);
