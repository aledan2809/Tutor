import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { codePotrivit, gasestePentruRecuperare } from "@/lib/recuperare";

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

  const gasit = await gasestePentruRecuperare(identificator);
  if (!gasit) return gresit;

  const salvat = await prisma.verificationToken.findFirst({
    where: { identifier: `otp:${gasit.userId}` },
    orderBy: { expires: "desc" },
  });
  if (!salvat || salvat.expires < new Date() || !codePotrivit(cod, salvat.token)) {
    return gresit;
  }

  const hash = await bcrypt.hash(parolaNoua, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: gasit.userId }, data: { password: hash } }),
    prisma.verificationToken.deleteMany({ where: { identifier: `otp:${gasit.userId}` } }),
  ]);

  await logAudit({
    action: "PASSWORD_RESET_OTP",
    performedById: gasit.userId,
    targetType: "User",
    metadata: { userId: gasit.userId },
  });

  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(_POST);
