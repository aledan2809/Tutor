import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/acces/activare { token, username, password }
 *
 * Prima intrare a unui om invitat: își alege doar CUM intră. Cine e vine de pe
 * lista clientului, deci nu i se cere să se prezinte.
 *
 * Contul se creează pe rândul de destinatar, nu invers: de-aia raportul
 * managerului poate spune „Ion Popescu, Oficiul Slatina 3, a citit lecția 2" din
 * clipa în care omul intră, fără niciun formular de identitate.
 *
 * Ruta e PUBLICĂ prin necesitate — omul n-are cont încă. Ce o ține în frâu e că
 * fără un token valid, nefolosit, nu se creează nimic.
 */

/** Reguli de nume de utilizator: scurt, tastabil pe telefon, fără ambiguități. */
const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._-]{2,29})$/;

async function _POST(req: NextRequest) {
  let body: { token?: unknown; username?: unknown; password?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Link invalid." }, { status: 400 });
  }
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      {
        error:
          "Numele de utilizator: 3–30 de caractere, litere mici, cifre, punct, minus sau underscore. Prima poziție literă sau cifră.",
      },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Parola trebuie să aibă cel puțin 8 caractere." },
      { status: 400 }
    );
  }

  const recipient = await prisma.recipient.findUnique({
    where: { token },
    select: {
      id: true,
      domainId: true,
      firstName: true,
      lastName: true,
      phone: true,
      userId: true,
      domain: { select: { id: true, name: true, isActive: true } },
    },
  });
  // Un link inexistent și unul al unei materii oprite arată la fel, deliberat.
  if (!recipient || !recipient.domain.isActive) {
    return NextResponse.json({ error: "Link invalid." }, { status: 404 });
  }
  if (recipient.userId) {
    return NextResponse.json(
      { error: "Contul e deja creat. Intră cu numele de utilizator și parola ta." },
      { status: 409 }
    );
  }

  const taken = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (taken) {
    return NextResponse.json(
      { error: "Numele ăsta e luat. Alege altul." },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 10);
  const fullName = `${recipient.firstName} ${recipient.lastName}`.trim();

  // Contul, înscrierea și legătura cu destinatarul se scriu împreună: un cont
  // creat fără înscriere l-ar lăsa pe om autentificat și în afara cursului, adică
  // exact în locul din care nu se poate ieși singur.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: fullName,
        username,
        password: hash,
        locale: "ro",
        accountRole: "STUDENT",
      },
      select: { id: true },
    });

    await tx.enrollment.create({
      data: { userId: created.id, domainId: recipient.domainId, roles: ["STUDENT"], isActive: true },
    });

    await tx.recipient.update({
      where: { id: recipient.id },
      data: { userId: created.id, openedAt: recipient.userId ? undefined : new Date() },
    });

    return created;
  });

  await logAudit({
    action: "RECIPIENT_ACTIVATED",
    performedById: user.id,
    targetType: "Recipient",
    metadata: { recipientId: recipient.id, domainId: recipient.domainId, username },
  });

  return NextResponse.json({ ok: true, username, name: fullName });
}

export const POST = withErrorHandler(_POST);
