import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { citesteLista } from "@/lib/import-destinatari";

/**
 * POST /api/admin/import-destinatari { domainId, text, aplica }
 *
 * Două moduri, dinadins: fără `aplica` doar CITEȘTE și spune ce a înțeles; cu
 * `aplica` scrie. La mii de rânduri, o coloană încurcată înseamnă mii de oameni
 * greșiți — iar telefonul e cheia: dacă e greșit, omul nu primește nimic și nimeni
 * nu observă. De-aia se vede întâi, se apasă după.
 *
 * Importul NU trimite niciun mesaj. Trimiterea rămâne un pas separat: un buton
 * care importă și trimite deodată ar putea porni mii de mesaje reale dintr-o
 * greșeală de fișier.
 */
const MAX_RANDURI = 5000;

async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { domainId?: unknown; text?: unknown; aplica?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }
  const domainId = typeof body.domainId === "string" ? body.domainId : "";
  const text = typeof body.text === "string" ? body.text : "";
  const aplica = body.aplica === true;

  if (!domainId || !text.trim()) {
    return NextResponse.json({ error: "Alege materia și lipește lista." }, { status: 400 });
  }

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    select: { id: true, name: true, organizationId: true, isActive: true },
  });
  if (!domain || !domain.isActive) {
    return NextResponse.json({ error: "Materia nu există sau e oprită." }, { status: 404 });
  }

  const poate =
    session.user.isSuperAdmin ||
    (session.user.isOrgAdmin &&
      session.user.organizationId &&
      session.user.organizationId === domain.organizationId) ||
    (await prisma.enrollment.findUnique({
      where: { userId_domainId: { userId: session.user.id, domainId: domain.id } },
      select: { isActive: true, roles: true },
    }).then((e) => Boolean(e?.isActive && e.roles.includes("ADMIN"))));
  if (!poate) {
    return NextResponse.json({ error: "Nu ai drept pe materia asta." }, { status: 403 });
  }

  const citit = citesteLista(text);
  if (citit.randuri.length > MAX_RANDURI) {
    return NextResponse.json(
      { error: `Prea multe rânduri (${citit.randuri.length}). Împarte fișierul în bucăți de cel mult ${MAX_RANDURI}.` },
      { status: 413 }
    );
  }

  const bune = citit.randuri.filter((r) => r.probleme.length === 0);
  const rele = citit.randuri.filter((r) => r.probleme.length > 0);

  // Cine e DEJA pe listă: la re-import se actualizează, nu se dublează.
  const existenti = bune.length
    ? await prisma.recipient.findMany({
        where: { domainId: domain.id, phone: { in: bune.map((r) => r.phone) } },
        select: { phone: true },
      })
    : [];
  const deja = new Set(existenti.map((e) => e.phone));

  if (!aplica) {
    return NextResponse.json({
      previzualizare: true,
      coloane: citit.coloane,
      necunoscute: citit.necunoscute,
      total: citit.randuri.length,
      noi: bune.filter((r) => !deja.has(r.phone)).length,
      actualizati: bune.filter((r) => deja.has(r.phone)).length,
      sarite: rele.length,
      randuri: citit.randuri.slice(0, 200),
    });
  }

  let noi = 0;
  let actualizati = 0;
  for (const r of bune) {
    await prisma.recipient.upsert({
      where: { domainId_phone: { domainId: domain.id, phone: r.phone } },
      create: {
        domainId: domain.id,
        phone: r.phone,
        lastName: r.lastName,
        firstName: r.firstName,
        jobTitle: r.jobTitle,
        badgeNo: r.badgeNo,
        county: r.county,
        city: r.city,
        postOffice: r.postOffice,
        token: randomBytes(16).toString("base64url"),
      },
      // Tokenul NU se schimbă la re-import: un link deja trimis rămâne valabil.
      update: {
        lastName: r.lastName,
        firstName: r.firstName,
        jobTitle: r.jobTitle,
        badgeNo: r.badgeNo,
        county: r.county,
        city: r.city,
        postOffice: r.postOffice,
      },
    });
    if (deja.has(r.phone)) actualizati++;
    else noi++;
  }

  await logAudit({
    action: "RECIPIENTS_IMPORTED",
    performedById: session.user.id,
    targetType: "Domain",
    metadata: { domainId: domain.id, noi, actualizati, sarite: rele.length },
  });

  return NextResponse.json({ aplicat: true, noi, actualizati, sarite: rele.length });
}

export const POST = withErrorHandler(_POST);
