import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import { acceptInvite } from "@/lib/family-invite";

const schema = z
  .object({
    token: z.string().min(1).optional(),
    code: z.string().min(1).max(16).optional(),
  })
  .refine((d) => d.token || d.code, { message: "token sau code obligatoriu" });

/**
 * POST: accept a family invite (by link token or typed code). The accepter must
 * be logged in — the UI sends them through sign-in/sign-up first, then back here.
 */
async function _POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await acceptInvite({
    token: parsed.data.token ?? null,
    code: parsed.data.code ?? null,
    accepterUserId: session.user.id,
  });

  if (!result.ok) {
    const code =
      result.status === "not_found"
        ? 404
        : result.status === "seat_unavailable"
        ? 409
        : 410; // expired / already used / self
    return NextResponse.json({ ok: false, status: result.status, seat: result.seat }, { status: code });
  }
  return NextResponse.json({ ok: true, target: result.target });
}

export const POST = withErrorHandler(_POST);
