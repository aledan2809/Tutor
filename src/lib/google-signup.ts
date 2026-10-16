/**
 * A parent's account made with the Google button (signup review 16.10.2026). Google gives back only an
 * email and a name; the signup form would also have set the parent's role, kept the discount code and
 * recorded where the person came from. This does the same for an account Google just made, through
 * the same checks as the form (api/auth/register): the code goes through the guessing guard, the
 * campaign and the referral are recorded the same way.
 *
 * Only for an account that is brand new: no role yet, no password, not a guest, made minutes ago. The
 * role is the gate, written in one conditional update, so two loads of the page (or an old account
 * that signs in with Google) can't give anyone a role or a second welcome code.
 */
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { reserveVoucherLookup } from "@/lib/voucher-guard";
import { normalizeVoucherCode, plausibleVoucherCode } from "@/lib/voucher-checkout";
import { loadVoucherPreview } from "@/lib/voucher-preview-server";
import { CAMPAIGN_COOKIE, parseAttribution, recordCampaignSignup } from "@/lib/campaign-attribution";
import { attributeReferral, grantWelcomeVoucher, REFERRAL_COOKIE } from "@/lib/referral";
import { accountRoleForSignup } from "@/lib/signup-role";

/** An account the Google button made within this window, still without a role, is a new signup. */
export const GOOGLE_SIGNUP_WINDOW_MS = 30 * 60_000;

export type GoogleSignupResult = {
  /** The account was new and is now a parent's. */
  applied: boolean;
  /** The code couldn't be checked yet (too many wrong codes from this network): the packages page checks it. */
  voucherDeferred: string | null;
};

export async function applyGoogleSignupIntent(input: {
  userId: string;
  voucher: string | null;
  headers: Headers;
  cookie: (name: string) => string | undefined;
  now?: Date;
}): Promise<GoogleSignupResult> {
  const now = input.now ?? new Date();
  const claimed = await prisma.user.updateMany({
    where: {
      id: input.userId,
      accountRole: null,
      password: null,
      isGuest: false,
      createdAt: { gte: new Date(now.getTime() - GOOGLE_SIGNUP_WINDOW_MS) },
    },
    data: { accountRole: accountRoleForSignup("PARENT") },
  });
  if (claimed.count !== 1) return { applied: false, voucherDeferred: null };

  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { email: true } });

  // The discount code: from the link, or from the campaign cookie /cafea set (as the form does).
  const fromCookie = parseAttribution(input.cookie(CAMPAIGN_COOKIE));
  const keptCode = input.voucher ?? fromCookie?.voucher ?? null;
  let voucherDeferred: string | null = null;
  if (keptCode) {
    const lookup = reserveVoucherLookup(input.headers);
    if (!lookup) {
      const code = normalizeVoucherCode(keptCode);
      voucherDeferred = plausibleVoucherCode(code) ? code : null;
    } else {
      try {
        const preview = await loadVoucherPreview(keptCode, input.userId, lookup);
        if (preview?.ok) {
          await prisma.user.update({ where: { id: input.userId }, data: { pendingVoucherCode: preview.preview.code } });
        }
      } catch (err) {
        logger.error("Google signup pending voucher save failed", err, { userId: input.userId });
      }
    }
  }

  // Where the person came from, and who sent them — best-effort, never blocks the account.
  const attr = fromCookie ?? (input.voucher ? { voucher: input.voucher.toUpperCase() } : null);
  if (attr) await recordCampaignSignup(input.userId, user?.email, attr, { activated: false });

  const refCode = input.cookie(REFERRAL_COOKIE);
  if (refCode) {
    try {
      const result = await attributeReferral({ referredUserId: input.userId, code: refCode });
      if (result.created && result.promoterId) {
        await grantWelcomeVoucher({ referredUserId: input.userId, promoterId: result.promoterId });
      }
    } catch (err) {
      logger.error("Google signup referral attribution failed", err, { userId: input.userId });
    }
  }

  const demoQuizId = input.cookie("tutor_demo_quiz");
  if (demoQuizId) {
    try {
      await prisma.magicQuiz.updateMany({ where: { id: demoQuizId, userId: null }, data: { userId: input.userId } });
    } catch (err) {
      logger.error("Google signup demo quiz claim failed", err, { userId: input.userId });
    }
  }

  return { applied: true, voucherDeferred };
}
