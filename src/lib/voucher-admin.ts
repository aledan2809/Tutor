import type { FamilyPlanKey } from "@/lib/family";

/** Plans a voucher can be limited to (Voucher.planKey). Kept in step with FamilyPlanKey. */
export const VOUCHER_PLAN_KEYS = ["ELEV", "FAMILY", "FAMILY_DUO", "TRIO", "FAMILY_TRIO"] as const satisfies readonly FamilyPlanKey[];

/** A 100% code that repeats on every payment would be a free subscription forever. */
export const RECURRING_FULL_DISCOUNT_ERROR =
  "A 100% voucher cannot apply to every payment (it would make the subscription free forever)";
