import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import {
  createAndDeliverInvite,
  FamilySeatError,
} from "@/lib/family-invite";
import { INVITE_TARGET_ROLE, INVITE_CHANNEL } from "@/lib/family";

const schema = z.object({
  target: z.enum([
    INVITE_TARGET_ROLE.CHILD,
    INVITE_TARGET_ROLE.PARENT,
    INVITE_TARGET_ROLE.TUTOR,
  ]),
  channel: z.enum([
    INVITE_CHANNEL.EMAIL,
    INVITE_CHANNEL.WHATSAPP,
    INVITE_CHANNEL.TELEGRAM,
    INVITE_CHANNEL.CODE,
  ]),
  email: z.string().email().optional(),
  phone: z.string().min(6).max(20).optional(),
});

/** POST: create + deliver a family invite (child / 2nd parent / tutor). */
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
  const { target, channel, email, phone } = parsed.data;

  // Channel ⇄ contact consistency.
  if (channel === INVITE_CHANNEL.EMAIL && !email) {
    return NextResponse.json({ error: "Email obligatoriu pentru canalul email." }, { status: 400 });
  }
  if (channel === INVITE_CHANNEL.WHATSAPP && !phone) {
    return NextResponse.json({ error: "Telefon obligatoriu pentru canalul WhatsApp." }, { status: 400 });
  }

  try {
    const result = await createAndDeliverInvite({
      inviterId: session.user.id,
      inviterName: session.user.name ?? null,
      target,
      channel,
      email,
      phone,
    });
    return NextResponse.json(
      {
        ok: true,
        inviteId: result.invite.id,
        acceptUrl: result.acceptUrl,
        code: result.code,
        delivery: result.delivery,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof FamilySeatError) {
      return NextResponse.json(
        { error: "seat_unavailable", seat: err.check },
        { status: 409 }
      );
    }
    throw err;
  }
}

export const POST = withErrorHandler(_POST);
