import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { consumaCodul, gasestePentruRecuperare } from "@/lib/recuperare";

/**
 * POST /api/auth/recuperare/schimba { identificator, cod, parolaNoua }
 *
 * Verifică codul primit pe WhatsApp și pune parola nouă. Codul se consumă la
 * prima folosire reușită — un cod care rămâne valabil după ce a fost folosit e
 * o a doua cheie lăsată în ușă.
 */
async function _POST(req: NextRequest) {
  let body: { identificator?: unknown; cod?: unknown; parolaNoua?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const identificator = typeof body.identificator === "string" ? body.identificator : "";
  const cod = typeof body.cod === "string" ? body.cod.replace(/\D/g, "") : "";
  const parolaNoua = typeof body.parolaNoua === "string" ? body.parolaNoua : "";

  if (parolaNoua.length < 8) {
    return NextResponse.json(
      { error: "Parola trebuie să aibă cel puțin 8 caractere." },
      { status: 400 }
    );
  }
  // Un cod greșit și un om inexistent primesc același răspuns: altfel s-ar afla,
  // prin încercări, care identificatori sunt reali.
  const gresit = NextResponse.json(
    { error: "Codul nu e bun sau a expirat. Cere altul." },
    { status: 400 }
  );
  if (!identificator.trim() || cod.length !== 6) return gresit;

  // Hașul se face mereu, înainte de căutare: dacă s-ar face doar pentru un cont găsit, răspunsul
  // ar dura vizibil mai mult când contul există. Și așa lacătul pe cont nu stă cât calculează bcrypt.
  const hash = await bcrypt.hash(parolaNoua, 10);
  const gasit = await gasestePentruRecuperare(identificator);
  if (!gasit) return gresit;

  const ok = await consumaCodul(gasit.userId, cod, async (tx) => {
    // Versiunea nouă închide sesiunile deschise cu parola veche.
    await tx.user.update({
      where: { id: gasit.userId },
      data: { password: hash, sessionVersion: { increment: 1 } },
    });
  });
  if (!ok) return gresit;

  await logAudit({
    action: "PASSWORD_RESET_OTP",
    performedById: gasit.userId,
    targetType: "User",
    metadata: { userId: gasit.userId },
  });

  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(_POST);
