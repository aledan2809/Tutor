import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/admin/course-invite { domainId, phone, lastName, firstName, ... }
 *
 * Trimite pe WhatsApp invitația la un curs, pe LINKUL PERSONAL al omului.
 *
 * Linkul personal e miezul, nu un amănunt: codul comun al materiei e același
 * pentru toți, deci n-ar putea spune niciodată cine a citit ce. Cu link propriu,
 * raportul managerului e complet din prima apăsare — fără să-i cerem omului să se
 * prezinte, ceea ce la mii de angajați ar pierde exact oamenii de instruit.
 *
 * De ce există: până acum invitațiile se trimiteau cu mâna, din linia de comandă.
 * Într-o întâlnire cu clientul vrei să ceri numărul omului și să-i sune telefonul
 * cât stați de vorbă — nu să-i promiți că îi trimite cineva mai târziu.
 *
 * Un mesaj inițiat de firmă cere un șablon APROBAT de Meta. Cel de aici
 * (`tutor_invite_curs_v1`, aprobat 2026-09-09) NU conține codul în text, ci doar
 * în adresa butonului: cu codul scris în corp, clasificatorul Meta îl citea drept
 * șablon de autentificare și respingea depunerea, indiferent ce categorie declaram.
 *
 * Fiecare eșec spune ce s-a întâmplat. Ruta asta se folosește în fața clientului,
 * iar acolo „nu s-a întâmplat nimic" e cel mai prost răspuns cu putință.
 */

const TEMPLATE = process.env.WHATSAPP_COURSE_INVITE_TEMPLATE || "tutor_invite_curs_v1";

/** Cine are voie să invite la materia asta. */
async function mayInvite(
  user: { id: string; isSuperAdmin?: boolean; isOrgAdmin?: boolean; organizationId?: string | null },
  domain: { id: string; organizationId: string | null }
): Promise<boolean> {
  if (user.isSuperAdmin) return true;
  if (user.isOrgAdmin && user.organizationId && user.organizationId === domain.organizationId) {
    return true;
  }
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_domainId: { userId: user.id, domainId: domain.id } },
    select: { isActive: true, roles: true },
  });
  return Boolean(enrollment?.isActive && enrollment.roles.includes("ADMIN"));
}

async function _POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corp de cerere invalid." }, { status: 400 });
  }

  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const opt = (k: string) => str(k) || null;

  const domainId = str("domainId");
  const rawPhone = str("phone");
  const lastName = str("lastName");
  const firstName = str("firstName");
  if (!domainId || !rawPhone) {
    return NextResponse.json({ error: "Alege materia și scrie numărul." }, { status: 400 });
  }
  if (!lastName || !firstName) {
    return NextResponse.json(
      { error: "Numele și prenumele sunt obligatorii — fără ele, raportul nu spune cine a făcut ce." },
      { status: 400 }
    );
  }

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    select: {
      id: true,
      name: true,
      organizationId: true,
      isActive: true,
      organization: { select: { name: true } },
      courses: {
        where: { isPublished: true },
        select: { title: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
  if (!domain || !domain.isActive) {
    return NextResponse.json({ error: "Materia nu există sau e oprită." }, { status: 404 });
  }

  if (!(await mayInvite(session.user, domain))) {
    return NextResponse.json({ error: "Nu ai drept de invitare pe materia asta." }, { status: 403 });
  }

  // Codul comun al materiei NU mai e cerut aici: invitația pleacă pe linkul
  // personal al destinatarului, care nu depinde de el. A-l cere ar fi însemnat să
  // blochez o invitație perfect validă pentru că a expirat un cod pe care n-o
  // folosește — exact genul de refuz inexplicabil în fața clientului.

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    return NextResponse.json(
      { error: "WhatsApp nu e configurat pe serverul ăsta." },
      { status: 503 }
    );
  }

  // Numele care apare în mesaj: organizația materiei, ca omul să recunoască de la
  // cine vine. Se poate suprascrie de la apelant.
  const inviter =
    (typeof body.inviterName === "string" && body.inviterName.trim()) ||
    domain.organization?.name ||
    "eTutor";
  const courseTitle = domain.courses[0]?.title || domain.name;

  try {
    const { WhatsAppClient, normalizePhone } = await import("@aledan/whatsapp");
    const client = new WhatsAppClient({ phoneNumberId, accessToken });

    // Prefixul de țară e al DOILEA parametru al normalizării, și e opțional: fără
    // el, „0712383492" pleacă exact așa spre Meta, care nu are de unde ști ce țară
    // e. Meta nu se plânge — mesajul pur și simplu nu ajunge nicăieri. Prins la
    // prima probă reală a rutei, 2026-09-09.
    const to = normalizePhone(rawPhone, process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "40");
    if (!/^\d{10,15}$/.test(to)) {
      return NextResponse.json(
        { error: `Numărul nu arată a număr de telefon: „${rawPhone}".` },
        { status: 400 }
      );
    }

    // Destinatarul, cu link PROPRIU. Aici se naște atribuirea: din clipa în care
    // omul apasă, raportul poate spune cine e — fără niciun formular de identitate
    // pus în calea lui. Codul comun al materiei nu poate face asta, fiindcă e
    // același pentru toți.
    const recipient = await prisma.recipient.upsert({
      where: { domainId_phone: { domainId: domain.id, phone: to } },
      create: {
        domainId: domain.id,
        phone: to,
        lastName,
        firstName,
        jobTitle: opt("jobTitle"),
        badgeNo: opt("badgeNo"),
        county: opt("county"),
        city: opt("city"),
        postOffice: opt("postOffice"),
        token: randomBytes(16).toString("base64url"),
      },
      // Re-invitarea aceluiași om îi actualizează datele, dar NU-i schimbă
      // tokenul: un link deja trimis trebuie să rămână valabil.
      update: {
        lastName,
        firstName,
        jobTitle: opt("jobTitle"),
        badgeNo: opt("badgeNo"),
        county: opt("county"),
        city: opt("city"),
        postOffice: opt("postOffice"),
      },
      select: { id: true, token: true },
    });

    const result = await client.sendTemplate(to, TEMPLATE, "ro", [
      {
        type: "body" as const,
        parameters: [
          { type: "text" as const, text: inviter },
          { type: "text" as const, text: courseTitle },
        ],
      },
      {
        // Butonul poartă codul. Sufixul se lipește de adresa din șablonul aprobat
        // (`https://etutor.ro/`), deci aici merge DOAR partea de după domeniu.
        type: "button" as const,
        sub_type: "url" as const,
        index: 0,
        parameters: [{ type: "text" as const, text: `ro/acces/${recipient.token}` }],
      },
    ]);

    // `sendTemplate` NU aruncă la refuz — întoarce `{success:false, error}`. Fără
    // verificarea asta, orice refuz de la Meta ar fi fost raportat drept succes,
    // adică exact minciuna care se descoperă abia când omul spune că n-a primit.
    if (!result.success) {
      console.error("[course-invite] Meta a refuzat:", result.error);
      return NextResponse.json(
        { error: "Mesajul nu a plecat.", detail: (result.error || "").slice(0, 300) },
        { status: 502 }
      );
    }

    await prisma.recipient.update({
      where: { id: recipient.id },
      data: { invitedAt: new Date() },
    });

    await logAudit({
      action: "COURSE_INVITE_WHATSAPP",
      performedById: session.user.id,
      targetType: "Domain",
      metadata: { domainId: domain.id, courseTitle, to, recipientId: recipient.id, messageId: result.messageId },
    });

    return NextResponse.json({
      sent: true,
      to,
      course: courseTitle,
      person: `${firstName} ${lastName}`,
      messageId: result.messageId,
    });
  } catch (e) {
    // Meta răspunde cu motive utile (număr fără WhatsApp, șablon nepotrivit, cotă
    // depășită). Le arătăm, în loc să spunem „a eșuat" — ruta se folosește live.
    const reason = e instanceof Error ? e.message : String(e);
    console.error("[course-invite] trimitere eșuată:", reason);
    return NextResponse.json(
      { error: "Mesajul nu a plecat.", detail: reason.slice(0, 300) },
      { status: 502 }
    );
  }
}

export const POST = withErrorHandler(_POST);
