import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { applyGoogleSignupIntent } from "@/lib/google-signup";
import { nextPathAfterSignup, safeReturnTo } from "@/lib/signup-next-path";
import { normalizeVoucherCode, plausibleVoucherCode } from "@/lib/voucher-checkout";
import { GoogleDoneFinish } from "./finish";

/**
 * Where the „Continuă cu Google” button for parents lands after Google (google-signup-button.tsx). A brand-new
 * account gets the parent's role and keeps the code, as the signup form would have done; an existing
 * account is just taken where it was going. Then the same next step as the form (signup-next-path.ts).
 */
export const dynamic = "force-dynamic";

const PLAN_SHAPE = /^[A-Z_]{1,24}$/;

export default async function GoogleDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const lp = locale === "en" ? "en" : "ro";
  const q = await searchParams;
  const one = (key: string) => (typeof q[key] === "string" ? (q[key] as string) : null);

  const session = await auth();
  if (!session?.user?.id) redirect(`/${lp}/auth/signin`);

  const rawVoucher = normalizeVoucherCode(one("voucher"));
  const voucher = plausibleVoucherCode(rawVoucher) ? rawVoucher : null;
  const rawPlan = one("plan")?.toUpperCase() ?? null;
  const plan = rawPlan && PLAN_SHAPE.test(rawPlan) ? rawPlan : null;
  const start = one("start") === "free" ? "free" : null;
  const returnTo = safeReturnTo(one("returnTo"));

  const [h, c] = await Promise.all([headers(), cookies()]);
  const result = await applyGoogleSignupIntent({
    userId: session.user.id,
    voucher,
    headers: h,
    cookie: (name) => c.get(name)?.value,
  });

  const path = result.applied
    ? nextPathAfterSignup({
        plan,
        voucherCode: result.voucherDeferred ?? voucher ?? "",
        voucherApplied: false,
        start,
        returnTo,
        voucherDeferred: Boolean(result.voucherDeferred),
      })
    : returnTo ?? "/dashboard";
  const dest = /^\/(en|ro)(\/|$)/.test(path) ? path : `/${lp}${path}`;

  return <GoogleDoneFinish dest={dest} newAccount={result.applied} locale={lp} />;
}
