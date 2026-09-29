import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { parseBirthDate, needsParentConsent } from "@/lib/age";
import { issueConsentRequest, loadConsentState, sendConsentEmail } from "@/lib/parent-consent-server";

const schema = z.object({
  birthDate: z.string(),
  parentEmail: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v || undefined)
    .pipe(z.string().email().optional())
    .optional(),
  locale: z.enum(["ro", "en"]).optional(),
});

/**
 * POST: the date of birth of a learner who made their own account (asked once; Alex, 28.09.2026).
 * Under 16 it comes with a parent's email, who is asked for consent.
 */
async function _POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Scrie un email valid pentru părinte." }, { status: 400 });
  const { parentEmail } = parsed.data;
  const locale = parsed.data.locale ?? "ro";
  const birthDate = parseBirthDate(parsed.data.birthDate);
  if (!birthDate) return NextResponse.json({ error: "Alege data nașterii: ziua, luna și anul." }, { status: 400 });

  // Only an account the question is for (a learner on their own account, not yet answered): once —
  // a date changed after the question would undo it — and no one else can send consent emails.
  if ((await loadConsentState(session.user.id)).kind !== "ask-age") {
    return NextResponse.json({ error: "Data nașterii nu mai e de cerut pentru acest cont." }, { status: 409 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const minor = needsParentConsent(birthDate);
  if (minor && !parentEmail) return NextResponse.json({ error: "Scrie emailul unui părinte." }, { status: 400 });
  if (minor && user.email && user.email.toLowerCase() === parentEmail) {
    return NextResponse.json({ error: "Scrie adresa unui părinte, nu pe a ta." }, { status: 400 });
  }

  const saved = await prisma.user.updateMany({ where: { id: session.user.id, birthDate: null }, data: { birthDate } });
  if (saved.count !== 1) return NextResponse.json({ error: "Data nașterii e deja salvată." }, { status: 409 });
  if (minor && parentEmail) {
    const issued = await issueConsentRequest(session.user.id, parentEmail);
    if (issued.ok) after(() => sendConsentEmail(session.user.id, issued.token, locale));
    // The date is saved; say truthfully that no email went out (the page then asks for the address again).
    else if (issued.reason === "too-many" || issued.reason === "address-busy") {
      return NextResponse.json(
        { ok: true, minor, sent: false, error: "Acestei adrese i-am scris de prea multe ori azi. Scrie adresa celuilalt părinte sau încearcă mâine." },
        { status: 200 },
      );
    }
  }
  return NextResponse.json({ ok: true, minor, sent: minor });
}

export const POST = withErrorHandler(_POST);
