import { NextRequest, NextResponse, after } from "next/server";
import { validBirthYear, needsParentConsent } from "@/lib/age";
import { issueConsentRequest, sendConsentEmail } from "@/lib/parent-consent-server";
import { prisma } from "@/lib/prisma";
import { reserveVoucherLookup } from "@/lib/voucher-guard";
import { normalizeVoucherCode, plausibleVoucherCode } from "@/lib/voucher-checkout";
import { emailTaken } from "@/lib/email-lookup";
import { withErrorHandler } from "@/lib/api-handler";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { attributeReferral, grantWelcomeVoucher, REFERRAL_COOKIE } from "@/lib/referral";
import {
  CAMPAIGN_COOKIE,
  parseAttribution,
  recordCampaignSignup,
} from "@/lib/campaign-attribution";
import { logger } from "@/lib/logger";
import { SIGNUP_ROLES, accountRoleForSignup, enrollmentsForSignup } from "@/lib/signup-role";
import { loadVoucherPreview, planForCodeYear } from "@/lib/voucher-preview-server";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name must be at most 80 characters"),
  // Lowercase: phones capitalise the first letter, and sign-in looks the email up in lowercase.
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be at most 72 characters"),
  domainSlug: z.string().optional(), // legacy single-select
  domainSlugs: z.array(z.string()).optional(), // multi-select
  voucherCode: z.string().min(1).max(50).optional(), // campaign links (?voucher=)
  // No TUTOR here on purpose — see SIGNUP_ROLES.
  role: z.enum(SIGNUP_ROLES).default("STUDENT"),
  // A learner's year of birth, and under 16 a parent's email for consent (Alex, 28.09.2026). Optional
  // here: an account made without them is asked on its first page (dashboard layout).
  birthYear: z.number().optional(),
  parentEmail: z.string().trim().toLowerCase().email().optional(),
});

async function _POST(req: NextRequest) {
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

  const { name, email, password, domainSlug, domainSlugs, voucherCode, role, parentEmail } = parsed.data;
  const birthYear = role === "STUDENT" && validBirthYear(parsed.data.birthYear) ? parsed.data.birthYear : null;
  if (role === "STUDENT" && parsed.data.birthYear !== undefined && birthYear === null) {
    return NextResponse.json({ error: "Invalid input", details: { fieldErrors: { birthYear: ["Invalid year"] } } }, { status: 400 });
  }

  // Check if user already exists (whatever the capitals of an older row)
  if (await emailTaken(email)) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // Create user
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      accountRole: accountRoleForSignup(role),
      birthYear,
      // Not proven: nobody has shown they own this address yet. It stays null until a reset link
      // or a sign-in link reaches the inbox — until then Google / the email link can't enter it.
      emailVerified: null,
    },
  });

  // Auto-enroll in the selected domain(s): STUDENT for a learner, WATCHER for a
  // parent (who picks their CHILD's subjects — WATCHER is per-domain, so without
  // one the child never shows up in their monitoring list). Supports multi-select
  // (domainSlugs[]) and the legacy single domainSlug.
  const slugs = Array.from(
    new Set([...(domainSlugs ?? []), ...(domainSlug ? [domainSlug] : [])])
  );
  let enrolledCount = 0;
  if (slugs.length) {
    // Only PUBLIC, active domains can be self-joined. A private slug sent here
    // is dropped silently, exactly as an unknown one is: the picker never offers
    // it, so a real form never sends it.
    const found = await prisma.domain.findMany({
      where: { slug: { in: slugs }, isActive: true, visibility: "PUBLIC" },
      select: { id: true },
    });
    if (found.length) {
      await prisma.enrollment.createMany({
        data: enrollmentsForSignup(
          role,
          found.map((d) => d.id)
        ).map((e) => ({ userId: user.id, ...e })),
        skipDuplicates: true,
      });
      enrolledCount = found.length;
    }
  }

  // ─── Campaign voucher (best-effort — never blocks signup) ───
  // 100% voucher → redeem atomically + activate subscription (same semantics as
  // POST /api/activate, including the ≥1 enrolled subject requirement). < 100%
  // voucher → NOT redeemed here (it applies at payment time); the client routes
  // the user to /dashboard/activare with the code prefilled.
  let voucherApplied = false;
  let voucherDiscount: number | null = null;

  // A partial discount (V126S from the flyer, ONV126S from the site) is paid with later, maybe
  // days later after trying without a card: keep it on the account so the packages page has it
  // filled in. No subject needed for this — a parent often picks the child's subjects afterwards.
  // A link that dropped the query string (the quiz on another page, a bookmark) still carries the
  // code in the campaign cookie /cafea set — keep that one too. Only kept, never redeemed: the 100%
  // path below still needs the code on the form.
  const keptCode = voucherCode ?? parseAttribution(req.cookies.get(CAMPAIGN_COOKIE)?.value)?.voucher;
  // Codes are looked up only while this address isn't guessing (voucher-guard.ts). While it is, the
  // account is still made; the code goes back to the page (`voucherDeferred`), which takes the parent
  // to the packages page with it in the box, where it is checked through the same guard. Nothing
  // unchecked is kept on the account: the pages that read the kept code would tell whether it exists.
  const lookup = keptCode ? reserveVoucherLookup(req.headers) : null;
  const guessing = !!keptCode && !lookup;
  const deferredCode = guessing ? normalizeVoucherCode(keptCode) : "";
  const voucherDeferred = plausibleVoucherCode(deferredCode) ? deferredCode : null;
  if (keptCode && lookup) {
    try {
      const preview = await loadVoucherPreview(keptCode, user.id, lookup);
      if (preview?.ok) {
        voucherDiscount = preview.preview.discountPercent;
        await prisma.user.update({
          where: { id: user.id },
          data: { pendingVoucherCode: preview.preview.code },
        });
      }
    } catch (err) {
      logger.error("Signup pending voucher save failed", err, { userId: user.id });
    }
  }

  if (voucherCode && !guessing && enrolledCount > 0) {
    try {
      const code = voucherCode.toUpperCase();
      await prisma.$transaction(async (tx) => {
        const voucher = await tx.voucher.findUnique({ where: { code } });
        if (!voucher || !voucher.isActive) return;
        if (voucher.expiresAt && voucher.expiresAt < new Date()) return;
        if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) return;
        if (voucher.discountPercent < 100) {
          // Reported to the client so the success screen can say "applies at payment".
          voucherDiscount = voucher.discountPercent;
          return;
        }

        // Same plan rule as /api/activate: without it an Elev code gave a family's worth of access
        // for a year (review r6, P3). A code whose package is gone isn't applied at signup.
        const plan = await planForCodeYear(tx, voucher.planKey);
        if (plan === "missing") return;

        await tx.voucher.update({
          where: {
            id: voucher.id,
            ...(voucher.maxUses !== null ? { usedCount: { lt: voucher.maxUses } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        const endsAt = new Date();
        endsAt.setFullYear(endsAt.getFullYear() + 1);
        await tx.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "active", subscriptionEndsAt: endsAt, ...(plan ? { subscriptionPlanId: plan.id } : {}) },
        });
        voucherApplied = true;
      });
    } catch (err) {
      logger.error("Signup voucher apply failed", err, { userId: user.id });
    }
  }

  // ─── Campaign attribution (best-effort — never blocks signup) ───
  // Read the one-shot campaign cookie (set by /evaluare, /bac, or any utm_* link).
  // Fall back to voucher-only attribution when a code was used without a cookie.
  const campaignCookieRaw = req.cookies.get(CAMPAIGN_COOKIE)?.value;
  const campaignAttr =
    parseAttribution(campaignCookieRaw) ??
    (voucherCode ? { voucher: voucherCode.toUpperCase() } : null);
  if (campaignAttr) {
    await recordCampaignSignup(user.id, email, campaignAttr, {
      activated: voucherApplied,
    });
  }

  // ─── Referral attribution (best-effort — never blocks signup) ───
  const refCode = req.cookies.get(REFERRAL_COOKIE)?.value;
  if (refCode) {
    try {
      const result = await attributeReferral({ referredUserId: user.id, code: refCode });
      if (result.created && result.promoterId) {
        await grantWelcomeVoucher({ referredUserId: user.id, promoterId: result.promoterId });
      }
    } catch (err) {
      logger.error("Referral attribution failed", err, { userId: user.id });
    }
  }

  // ─── Lazy-save: claim the demo Magic Quiz into the new account (best-effort) ───
  const demoQuizId = req.cookies.get("tutor_demo_quiz")?.value;
  if (demoQuizId) {
    try {
      // Only claim an unclaimed, still-valid quiz.
      await prisma.magicQuiz.updateMany({
        where: { id: demoQuizId, userId: null },
        data: { userId: user.id },
      });
    } catch (err) {
      logger.error("Demo quiz claim failed", err, { userId: user.id });
    }
  }

  // Under 16: the parent is asked now, by email, after the response. The learner's own address (or
  // none) isn't a parent's — then the first page asks again.
  if (birthYear !== null && needsParentConsent(birthYear) && parentEmail && parentEmail !== email) {
    try {
      const issued = await issueConsentRequest(user.id, parentEmail);
      if (issued.ok) {
        const locale = req.headers.get("referer")?.includes("/en/") ? "en" : "ro";
        after(() => sendConsentEmail(user.id, issued.token, locale));
      }
    } catch (err) {
      logger.error("Signup parent consent request failed", err, { userId: user.id });
    }
  }

  const res = NextResponse.json({
    success: true,
    message: "Account created. You can now sign in.",
    voucherApplied,
    voucherDiscount,
    voucherDeferred,
  }, { status: 201 });

  // Consume the one-shot cookies regardless of outcome.
  if (refCode) {
    res.cookies.set(REFERRAL_COOKIE, "", { path: "/", maxAge: 0 });
  }
  if (campaignCookieRaw && !voucherDeferred) {
    res.cookies.set(CAMPAIGN_COOKIE, "", { path: "/", maxAge: 0 });
  }
  if (demoQuizId) {
    res.cookies.set("tutor_demo_quiz", "", { path: "/", maxAge: 0 });
  }
  return res;
}

export const POST = withErrorHandler(_POST);
