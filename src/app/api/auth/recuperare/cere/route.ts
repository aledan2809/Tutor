import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import {
  DURATA_COD_MS,
  codNou,
  gasestePentruRecuperare,
  hashCod,
} from "@/lib/recuperare";

/**
 * POST /api/auth/recuperare/cere { identificator }
 *
 * Trimite pe WhatsApp un cod de șase cifre către telefonul de pe lista
 * angajatorului. Identificatorul poate fi telefonul, numele de utilizator sau
 * marca — omul de teren le știe pe toate trei pe de rost, spre deosebire de un
 * email pe care nu-l are.
 *
 * Răspunsul e ACELAȘI indiferent dacă omul există sau nu. Altfel ecranul ar
 * deveni un instrument prin care se află ce mărci sunt reale într-o companie.
 */
const TEMPLATE = process.env.WHATSAPP_OTP_TEMPLATE || "tutor_cod_acces";

async function _POST(req: NextRequest) {
  let body: { identificator?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }
  const identificator = typeof body.identificator === "string" ? body.identificator : "";

  // Un singur răspuns, mereu.
  const raspuns = NextResponse.json({
    ok: true,
    mesaj: "Dacă datele sunt bune, ai primit un cod pe WhatsApp.",
  });
  if (!identificator.trim()) return raspuns;

  const gasit = await gasestePentruRecuperare(identificator);
  if (!gasit) return raspuns;

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    console.error("[recuperare] WhatsApp neconfigurat — codul nu poate pleca.");
    return raspuns;
  }

  const cod = codNou();
  // Un cod nou îl anulează pe cel dinainte: două coduri vii în același timp ar
  // însemna două ferestre de ghicit, nu una.
  await prisma.verificationToken.deleteMany({
    where: { identifier: `otp:${gasit.userId}` },
  });
  await prisma.verificationToken.create({
    data: {
      identifier: `otp:${gasit.userId}`,
      token: hashCod(cod),
      expires: new Date(Date.now() + DURATA_COD_MS),
    },
  });

  try {
    const { WhatsAppClient } = await import("@aledan/whatsapp");
    const client = new WhatsAppClient({ phoneNumberId, accessToken });
    // Șablon de autentificare: Meta îi scrie singur textul, iar codul merge și în
    // corp, și în butonul de copiere — de-aia apare de două ori în componente.
    const result = await client.sendTemplate(gasit.telefon, TEMPLATE, "ro", [
      { type: "body" as const, parameters: [{ type: "text" as const, text: cod }] },
      {
        type: "button" as const,
        sub_type: "url" as const,
        index: 0,
        parameters: [{ type: "text" as const, text: cod }],
      },
    ]);
    if (!result.success) {
      console.error("[recuperare] Meta a refuzat codul:", result.error);
    }
  } catch (e) {
    console.error("[recuperare] trimitere eșuată:", e);
  }

  return raspuns;
}

export const POST = withErrorHandler(_POST);
