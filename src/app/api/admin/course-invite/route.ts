import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { isJoinCodeUsable } from "@/lib/join-code-policy";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/admin/course-invite { domainId, phone, inviterName? }
 *
 * Trimite pe WhatsApp invitația la un curs: un mesaj cu buton care duce direct în
 * lecții, fără cont și fără cod de tastat.
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

  let body: { domainId?: unknown; phone?: unknown; inviterName?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corp de cerere invalid." }, { status: 400 });
  }

  const domainId = typeof body.domainId === "string" ? body.domainId : "";
  const rawPhone = typeof body.phone === "string" ? body.phone : "";
  if (!domainId || !rawPhone.trim()) {
    return NextResponse.json({ error: "Alege materia și scrie numărul." }, { status: 400 });
  }

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    select: {
      id: true,
      name: true,
      organizationId: true,
      isActive: true,
      joinCode: true,
      joinCodeExpiresAt: true,
      joinCodeMaxUses: true,
      joinCodeUses: true,
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

  if (!domain.joinCode) {
    return NextResponse.json(
      { error: "Materia n-are cod de acces emis. Emite unul întâi, din pagina materiei." },
      { status: 409 }
    );
  }
  const usable = isJoinCodeUsable(
    {
      expiresAt: domain.joinCodeExpiresAt,
      maxUses: domain.joinCodeMaxUses,
      uses: domain.joinCodeUses,
    },
    new Date()
  );
  if (!usable) {
    return NextResponse.json(
      { error: "Codul materiei a expirat sau s-a epuizat. Emite unul nou." },
      { status: 409 }
    );
  }

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
    const to = normalizePhone(rawPhone);

    await client.sendTemplate(to, TEMPLATE, "ro", [
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
        parameters: [{ type: "text" as const, text: `ro/acces/${domain.joinCode}` }],
      },
    ]);

    await logAudit({
      action: "COURSE_INVITE_WHATSAPP",
      performedById: session.user.id,
      targetType: "Domain",
      metadata: { domainId: domain.id, courseTitle, to },
    });

    return NextResponse.json({ sent: true, to, course: courseTitle });
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
