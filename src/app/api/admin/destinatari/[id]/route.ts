import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { normalizeazaTelefon } from "@/lib/import-destinatari";

/**
 * PATCH /api/admin/destinatari/:id — corectează datele unui om de pe lista de invitații.
 *
 * Cerut pentru clienții mari: la mii de oameni importați dintr-un fișier, un nume scris
 * greșit sau o funcție încurcată se descoperă abia în tablou. Până acum singura cale era
 * reimportul, care nu schimbă un rând existent decât prin telefon.
 *
 * Dreptul e EXACT cel al importului: superadmin, administratorul firmei care deține
 * materia, sau administratorul materiei. Cine poate pune oameni pe listă îi poate corecta.
 */
const OBLIGATORII = ["lastName", "firstName"] as const;
const OPTIONALE = ["jobTitle", "badgeNo", "county", "city", "postOffice"] as const;
const MAX = 120;

async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const r = await prisma.recipient.findUnique({
    where: { id },
    select: { id: true, domainId: true, domain: { select: { organizationId: true, isActive: true } } },
  });
  // 404 și pentru ce nu e al tău: nu se află pe ce materii are altă firmă oameni.
  if (!r) return NextResponse.json({ error: "Nu există." }, { status: 404 });

  const poate =
    session.user.isSuperAdmin ||
    (session.user.isOrgAdmin &&
      session.user.organizationId &&
      session.user.organizationId === r.domain.organizationId) ||
    (await prisma.enrollment
      .findUnique({
        where: { userId_domainId: { userId: session.user.id, domainId: r.domainId } },
        select: { isActive: true, roles: true },
      })
      .then((e) => Boolean(e?.isActive && e.roles.includes("ADMIN"))));
  if (!poate) return NextResponse.json({ error: "Nu există." }, { status: 404 });

  const data: Record<string, string | null> = {};
  for (const k of OBLIGATORII) {
    if (body[k] === undefined) continue;
    const v = typeof body[k] === "string" ? (body[k] as string).trim() : "";
    if (!v) return NextResponse.json({ error: "Numele și prenumele nu pot rămâne goale." }, { status: 400 });
    if (v.length > MAX) return NextResponse.json({ error: "Text prea lung." }, { status: 400 });
    data[k] = v;
  }
  for (const k of OPTIONALE) {
    if (body[k] === undefined) continue;
    const v = typeof body[k] === "string" ? (body[k] as string).trim() : "";
    if (v.length > MAX) return NextResponse.json({ error: "Text prea lung." }, { status: 400 });
    data[k] = v || null;
  }
  if (body.phone !== undefined) {
    // Aceeași normalizare ca la import: unicitatea (materie, telefon) se verifică pe
    // forma normalizată, deci „0749…" și „+40 749…" trebuie să ajungă la același șir.
    const tel = normalizeazaTelefon(typeof body.phone === "string" ? body.phone : "");
    if (tel.length < 11) return NextResponse.json({ error: "Telefonul nu pare complet." }, { status: 400 });
    data.phone = tel;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nimic de schimbat." }, { status: 400 });
  }

  try {
    const salvat = await prisma.recipient.update({
      where: { id },
      data,
      select: {
        id: true, lastName: true, firstName: true, jobTitle: true, badgeNo: true,
        phone: true, county: true, city: true, postOffice: true,
      },
    });
    await logAudit({
      action: "RECIPIENT_UPDATE",
      performedById: session.user.id,
      targetType: "Recipient",
      // Doar NUMELE câmpurilor: valorile sunt date personale și n-au ce căuta în jurnal.
      metadata: { recipientId: id, domainId: r.domainId, campuri: Object.keys(data) },
    });
    return NextResponse.json({ ok: true, recipient: salvat });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Numărul acesta e deja pe lista materiei, la alt om." },
        { status: 409 }
      );
    }
    throw e;
  }
}

export const PATCH = withErrorHandler(_PATCH);
