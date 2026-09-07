import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { normalizeJoinCode } from "@/lib/join-code";
import { logAudit } from "@/lib/audit";
import { isJoinCodeUsable } from "@/lib/join-code-policy";

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
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      joinCodeExpiresAt: true,
      joinCodeMaxUses: true,
      joinCodeUses: true,
    },
  });
  if (!domain || !domain.isActive) {
    return NextResponse.json({ error: "Cod invalid" }, { status: 404 });
  }
  // Expirat sau epuizat arată la fel ca inexistent, deliberat: altfel cineva ar
  // afla, încercând, care coduri au fost cândva reale.
  const usable = isJoinCodeUsable(
    {
      expiresAt: domain.joinCodeExpiresAt,
      maxUses: domain.joinCodeMaxUses,
      uses: domain.joinCodeUses,
    },
    new Date(),
  );
  if (!usable) {
    return NextResponse.json({ error: "Cod invalid" }, { status: 404 });
  }

  // Upsert: a person whose enrollment was deactivated and who is handed a new
  // code gets back in; an already-active enrollment is left exactly as it is
  // (roles included — a WATCHER stays a WATCHER).
  const existing = await prisma.enrollment.findUnique({
    where: { userId_domainId: { userId: session.user.id, domainId: domain.id } },
    select: { isActive: true },
  });
  // O folosire se consumă doar la o intrare REALĂ. Cine e deja înscris și apasă
  // din nou (sau dă dublu-click) nu arde codul altcuiva.
  if (!existing || !existing.isActive) {
    // Revendicarea e o singură scriere condiționată, ca doi oameni care apasă în
    // aceeași clipă să nu treacă amândoi de ultima folosire: baza de date aplică
    // condiția la scriere, nu noi între două citiri.
    const claimed = await prisma.domain.updateMany({
      where: {
        id: domain.id,
        ...(domain.joinCodeMaxUses !== null ? { joinCodeUses: { lt: domain.joinCodeMaxUses } } : {}),
      },
      data: { joinCodeUses: { increment: 1 } },
    });
    if (claimed.count === 0) {
      return NextResponse.json({ error: "Cod invalid" }, { status: 404 });
    }
  }

  if (!existing) {
    try {
      await prisma.enrollment.create({
        data: { userId: session.user.id, domainId: domain.id, roles: ["STUDENT"], isActive: true },
      });
    } catch (e) {
      // Double-submit: the row appeared between the read and the write. The
      // unique constraint is the real guard; a 500 here would read to the user
      // as "that code is invalid", which is the opposite of what happened.
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  } else if (!existing.isActive) {
    // Rolurile se resetează la STUDENT, nu se păstrează.
    //
    // Reactivarea păstra rolurile înscrierii vechi: cineva căruia i se retrăsese
    // ADMIN sau INSTRUCTOR pe o materie privată și-l recăpăta folosind un cod
    // destinat elevilor. Un cod de elev dă acces de elev; dacă cineva trebuie să
    // fie iar administrator, îl repune un administrator.
    await prisma.enrollment.update({
      where: { userId_domainId: { userId: session.user.id, domainId: domain.id } },
      data: { isActive: true, roles: ["STUDENT"] },
    });
  }

  // Emiterea codului era auditată, folosirea lui nu — deci nu se putea vedea
  // niciodată cine a intrat pe cod și când.
  if (!existing || !existing.isActive) {
    await logAudit({
      action: "DOMAIN_JOIN_CODE_REDEEM",
      performedById: session.user.id,
      targetType: "Domain",
      metadata: {
        domainId: domain.id,
        slug: domain.slug,
        reactivated: existing !== null,
      },
    });
  }

  return NextResponse.json({
    domain: { id: domain.id, name: domain.name, slug: domain.slug },
    alreadyEnrolled: existing?.isActive === true,
  });
}

export const POST = withErrorHandler(_POST);
