import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";
import { markCampaignActivated } from "@/lib/campaign-attribution";
import { activeSetters } from "@/lib/guardian-lock";
import { paysByCard } from "@/lib/card-subscription";
import { planForCodeYear } from "@/lib/voucher-preview-server";

/**
 * POST /api/activate — voucher-based activation (no Stripe needed for 100% vouchers).
 *
 * Body: { voucherCode, domainSlugs[] }
 *  - 100% voucher  → enroll the user in the chosen subjects (STUDENT) + set
 *    subscriptionStatus="active" (1 year) + atomically redeem the voucher. Access granted.
 *  - < 100% voucher → returns { requiresPayment, discountPercent } so the UI can route to
 *    the card/Stripe checkout (dormant until Stripe keys are configured).
 *
 * This is the "checkout up to payment → voucher cancels the amount → access" flow for
 * the no-Stripe (100%) case. Real card payment stays on /api/admin/stripe/checkout.
 */
const schema = z.object({
  voucherCode: z.string().min(1).max(50),
  domainSlugs: z.array(z.string()).min(1),
});

async function _POST(req: NextRequest) {
  const session = await getSession();
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
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  const code = parsed.data.voucherCode.toUpperCase();
  const userId = session.user.id;

  // Resolve chosen subjects to real, active, PUBLIC domains. A voucher opens a
  // paid tier, not a private subject — that stays admin-granted.
  const domains = await prisma.domain.findMany({
    where: { slug: { in: parsed.data.domainSlugs }, isActive: true, visibility: "PUBLIC" },
    select: { id: true, slug: true, name: true },
  });
  if (domains.length === 0) {
    return NextResponse.json({ error: "Nicio materie validă selectată" }, { status: 400 });
  }
  // A subject the child's parent removed stays removed (guardian-lock.ts): activating a voucher
  // doesn't turn it back on.
  const removedByParent = await prisma.enrollment.findMany({
    where: { userId, domainId: { in: domains.map((d) => d.id) }, isActive: false, setById: { not: null } },
    select: { domainId: true, setById: true },
  });
  const setters = await activeSetters(userId, removedByParent.map((e) => e.setById));
  const lockedDomainIds = new Set(removedByParent.filter((e) => e.setById && setters.has(e.setById)).map((e) => e.domainId));

  const result = await prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUnique({ where: { code } });
    if (!voucher || !voucher.isActive) return { error: "Voucher inexistent sau inactiv", status: 404 };
    if (voucher.expiresAt && voucher.expiresAt < new Date()) return { error: "Voucher expirat", status: 400 };
    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses)
      return { error: "Voucher epuizat (limită de utilizări atinsă)", status: 400 };
    // One use per account, when the code says so — the same rule checkout applies (voucher-checkout.ts),
    // read from the same evidence: the row written below.
    if (voucher.oncePerUser) {
      const used = await tx.voucherRedemption.findUnique({ where: { voucherId_userId: { voucherId: voucher.id, userId } } });
      if (used) return { error: "Codul a fost deja folosit pe acest cont.", status: 400 };
    }

    // < 100% → needs the Stripe card flow (not handled here)
    if (voucher.discountPercent < 100) {
      return { requiresPayment: true, discountPercent: voucher.discountPercent };
    }

    // Not over a subscription paid by card: the code would replace the plan the family pays for (a
    // Family Trio turned into the code's plan) while the card keeps being charged for the old one.
    const me = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, accountRole: true, subscriptionStatus: true, subscriptionEndsAt: true, stripeSubscriptionId: true },
    });
    if (me && (await paysByCard(me, tx))) {
      return {
        error:
          "Contul are deja un abonament plătit cu cardul, iar codul l-ar înlocui în timp ce cardul e taxat în continuare. Îl poți folosi după ce abonamentul se încheie: îl oprești din Pachete → Gestionează abonamentul.",
        status: 409,
      };
    }

    // A code made for one plan activates that plan: an Elev code must not cover a whole family
    // (access.ts). A code without a plan keeps today's behaviour; one whose plan is gone isn't used.
    const plan = await planForCodeYear(tx, voucher.planKey);
    if (plan === "missing") {
      return { error: "Pachetul pentru care e făcut codul nu mai e disponibil. Scrie-ne și îl rezolvăm.", status: 409 };
    }

    // Subjects the parent removed stay removed: if every chosen subject is one of them, nothing
    // would be activated — the code isn't spent on that (review r6, P8).
    const activated = domains.filter((d) => !lockedDomainIds.has(d.id));
    if (activated.length === 0) {
      return {
        error: "Materiile alese au fost scoase de părinte. Vorbește cu el ca să le repună, apoi folosește codul.",
        status: 409,
      };
    }

    // 100% → redeem atomically (guard against races on maxUses)
    await tx.voucher.update({
      where: {
        id: voucher.id,
        ...(voucher.maxUses !== null ? { usedCount: { lt: voucher.maxUses } } : {}),
      },
      data: { usedCount: { increment: 1 } },
    });

    // Whose use it was, and when: until now only a counter grew, so a free year on an account could
    // never be traced back to the code that gave it (the admin list and the voucher page read this).
    // The pair is unique and the same account may activate the same code again on other subjects, so
    // the first use is the one kept.
    await tx.voucherRedemption.upsert({
      where: { voucherId_userId: { voucherId: voucher.id, userId } },
      create: { voucherId: voucher.id, userId },
      update: {},
    });

    // Enroll in chosen subjects (idempotent via composite unique).
    // A parent activating their child's subject must NOT be turned into a learner:
    // one STUDENT row is enough to flip them back to the student menu.
    const role = me?.accountRole === "PARENT" ? "WATCHER" : "STUDENT";
    for (const d of domains) {
      await tx.enrollment.upsert({
        where: { userId_domainId: { userId, domainId: d.id } },
        create: { userId, domainId: d.id, roles: [role], isActive: true },
        update: lockedDomainIds.has(d.id) ? {} : { isActive: true },
      });
    }

    // Mark subscription active (1 year — tester/grandfathered access), on the code's plan if it has one.
    const endsAt = new Date();
    endsAt.setFullYear(endsAt.getFullYear() + 1);
    await tx.user.update({
      where: { id: userId },
      data: { subscriptionStatus: "active", subscriptionEndsAt: endsAt, ...(plan ? { subscriptionPlanId: plan.id } : {}) },
    });

    return {
      success: true,
      status: "active",
      // Only what was turned on: a subject the parent removed is left off and isn't reported.
      activated: activated.map((d) => d.name),
      voucherCode: voucher.code,
    };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status as number });
  }
  if ("requiresPayment" in result) {
    return NextResponse.json(result);
  }

  // Conversion: a 100% voucher just activated this account — stamp the campaign
  // attribution (best-effort, no-op if the user wasn't campaign-attributed).
  await markCampaignActivated(userId);

  return NextResponse.json(result);
}

export const POST = withErrorHandler(_POST);
