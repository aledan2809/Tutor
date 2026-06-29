/**
 * Family-packages config — the SINGLE source of truth for what each plan allows
 * (seats + features) and the pure rules that gate adding a child / parent / tutor.
 *
 * Seats are BASE entitlements. Over-limit adds are blocked strictly; the caller
 * surfaces an upgrade CTA (extra parent → bigger plan) or an add-on CTA (extra
 * child → same plan, discounted). Nothing is free above what was paid for.
 *
 * Pure module: no prisma, no IO — usable on the server and in the browser, and
 * unit-testable without a DB. Enforcement wiring lives in the API layer.
 */

export type FamilyPlanKey =
  | "ELEV"
  | "FAMILY"
  | "FAMILY_DUO"
  | "TRIO"
  | "FAMILY_TRIO";

/**
 * Guardian.relation values. A TUTOR is a per-child watcher (scoped to the
 * children they are paid for), NOT a domain-wide instructor.
 */
export const GUARDIAN_RELATION = { PARENT: "PARENT", TUTOR: "TUTOR" } as const;
export type GuardianRelation =
  (typeof GUARDIAN_RELATION)[keyof typeof GUARDIAN_RELATION];

/** What a FamilyInvite turns the invitee into. */
export const INVITE_TARGET_ROLE = {
  CHILD: "CHILD",
  PARENT: "PARENT",
  TUTOR: "TUTOR",
} as const;
export type InviteTargetRole =
  (typeof INVITE_TARGET_ROLE)[keyof typeof INVITE_TARGET_ROLE];

/** How a FamilyInvite is delivered / accepted. */
export const INVITE_CHANNEL = {
  EMAIL: "EMAIL",
  WHATSAPP: "WHATSAPP",
  TELEGRAM: "TELEGRAM",
  CODE: "CODE",
  DIRECT: "DIRECT",
} as const;
export type InviteChannel =
  (typeof INVITE_CHANNEL)[keyof typeof INVITE_CHANNEL];

export interface FamilyPlanFeatures {
  /** Scheduled KPI report to the parent (sessions / discipline / weaknesses). */
  watcherReports: boolean;
  /** On-demand discipline nudges from the parent. */
  parentNudges: boolean;
  /** Scheduled study-reminder cascades. */
  studyReminders: boolean;
  /** A tutor account can be linked to a child. */
  tutorAccess: boolean;
}

export interface FamilyPlan {
  key: FamilyPlanKey;
  /** RO, user-facing label (matches the /parinte marketing names). */
  label: string;
  /** Base parent seats — the 1st parent is the account owner. */
  maxParents: number;
  /** Base child seats. Extra children are a discounted add-on, never free. */
  maxChildren: number;
  /** Base tutor seats. */
  maxTutors: number;
  features: FamilyPlanFeatures;
}

export const FAMILY_PLANS: Record<FamilyPlanKey, FamilyPlan> = {
  ELEV: {
    key: "ELEV",
    label: "Elev",
    maxParents: 0,
    maxChildren: 0,
    maxTutors: 0,
    features: {
      watcherReports: false,
      parentNudges: false,
      studyReminders: true,
      tutorAccess: false,
    },
  },
  FAMILY: {
    key: "FAMILY",
    label: "Family",
    maxParents: 1,
    maxChildren: 1,
    maxTutors: 0,
    features: {
      watcherReports: true,
      parentNudges: true,
      studyReminders: true,
      tutorAccess: false,
    },
  },
  FAMILY_DUO: {
    key: "FAMILY_DUO",
    label: "Family Duo",
    maxParents: 2,
    maxChildren: 1,
    maxTutors: 0,
    features: {
      watcherReports: true,
      parentNudges: true,
      studyReminders: true,
      tutorAccess: false,
    },
  },
  TRIO: {
    key: "TRIO",
    label: "Trio",
    maxParents: 1,
    maxChildren: 1,
    maxTutors: 1,
    features: {
      watcherReports: true,
      parentNudges: true,
      studyReminders: true,
      tutorAccess: true,
    },
  },
  FAMILY_TRIO: {
    key: "FAMILY_TRIO",
    label: "Family Trio",
    maxParents: 2,
    maxChildren: 1,
    maxTutors: 1,
    features: {
      watcherReports: true,
      parentNudges: true,
      studyReminders: true,
      tutorAccess: true,
    },
  },
};

/** When you need one more parent than the plan allows, this is where you go. */
const PARENT_UPGRADE: Partial<Record<FamilyPlanKey, FamilyPlanKey>> = {
  FAMILY: "FAMILY_DUO",
  TRIO: "FAMILY_TRIO",
};

/** When the plan has no tutor seat, this is the plan that adds one. */
const TUTOR_UPGRADE: Partial<Record<FamilyPlanKey, FamilyPlanKey>> = {
  FAMILY: "TRIO",
  FAMILY_DUO: "FAMILY_TRIO",
};

export function getFamilyPlan(key: FamilyPlanKey): FamilyPlan {
  return FAMILY_PLANS[key];
}

/**
 * Map a billing plan name (SubscriptionPlan.name) to a family-plan key.
 * Returns null when the name is not a family plan (a plain learner). Order
 * matters: the most specific name wins ("Family Trio" before "Family").
 */
export function resolveFamilyPlanKey(
  planName: string | null | undefined
): FamilyPlanKey | null {
  if (!planName) return null;
  const n = planName.trim().toLowerCase();
  if (!n) return null;
  if (n.includes("family") && n.includes("trio")) return "FAMILY_TRIO";
  if (n.includes("family") && n.includes("duo")) return "FAMILY_DUO";
  if (n.includes("trio")) return "TRIO";
  if (n.includes("family")) return "FAMILY";
  if (n.includes("elev") || n.includes("individual") || n.includes("student"))
    return "ELEV";
  return null;
}

/** Narrow an arbitrary string to a known FamilyPlanKey. */
export function isFamilyPlanKey(
  value: string | null | undefined
): value is FamilyPlanKey {
  return value != null && value in FAMILY_PLANS;
}

/** The SubscriptionPlan fields that drive seat composition. */
export interface SubscriptionPlanSeatFields {
  name?: string | null;
  familyPlanKey?: string | null;
  maxParents?: number | null;
  maxChildren?: number | null;
  maxTutors?: number | null;
}

/**
 * Resolve a FamilyPlan from a SubscriptionPlan record. Prefers the stored
 * `familyPlanKey` (+ optional per-seat overrides on the row); falls back to
 * deriving the key from the plan name for legacy rows written before the schema
 * columns existed. A null seat column inherits the key's canonical seat count.
 * Returns null when the record is not a family plan (a plain learner).
 */
export function resolveFamilyPlanFromRecord(
  rec: SubscriptionPlanSeatFields | null | undefined
): FamilyPlan | null {
  if (!rec) return null;
  const key = isFamilyPlanKey(rec.familyPlanKey)
    ? rec.familyPlanKey
    : resolveFamilyPlanKey(rec.name);
  if (!key) return null;
  const base = FAMILY_PLANS[key];
  return {
    ...base,
    maxParents: rec.maxParents ?? base.maxParents,
    maxChildren: rec.maxChildren ?? base.maxChildren,
    maxTutors: rec.maxTutors ?? base.maxTutors,
  };
}

/**
 * Discount for the N-th child on a family plan (1-based child index). The first
 * child is the base seat (no discount); the 2nd is −20%, the 3rd and beyond −30%.
 * Mirrors the /parinte pricing copy.
 */
export function childDiscountPercent(childIndex: number): number {
  if (childIndex <= 1) return 0;
  if (childIndex === 2) return 20;
  return 30;
}

/**
 * Discount for the N-th subject (1-based). A plan's advertised price covers the
 * FIRST subject; the 2nd subject is −15%, the 3rd and beyond −25%. Mirrors the
 * /parinte pricing copy. The base price is per-subject/month, not a flat total.
 */
export function subjectDiscountPercent(subjectIndex: number): number {
  if (subjectIndex <= 1) return 0;
  if (subjectIndex === 2) return 15;
  return 25;
}

export type SeatDenyReason =
  | "no_family_plan"
  | "parent_limit"
  | "child_addon"
  | "tutor_feature_off"
  | "tutor_limit";

export interface SeatCheck {
  allowed: boolean;
  reason?: SeatDenyReason;
  /** Plan to upgrade to (extra parent / unlock tutor). */
  upgradeTo?: FamilyPlanKey;
  /** True when the path forward is a discounted add-on (extra child), not a block. */
  addon?: boolean;
  /** Discount percent to advertise on an add-on path. */
  discountPercent?: number;
  /** RO, user-facing CTA message (no "AI"). */
  message?: string;
}

const NO_PLAN: SeatCheck = {
  allowed: false,
  reason: "no_family_plan",
  message:
    "Acest cont nu are un pachet de familie activ. Alege un pachet ca să adaugi membri.",
};

/**
 * Can the account owner add another parent? `currentParents` counts the owner
 * plus already-linked parents.
 */
export function canAddParent(
  plan: FamilyPlan | null,
  currentParents: number
): SeatCheck {
  if (!plan) return NO_PLAN;
  if (currentParents < plan.maxParents) return { allowed: true };
  const upgradeTo = PARENT_UPGRADE[plan.key];
  return {
    allowed: false,
    reason: "parent_limit",
    upgradeTo,
    message: upgradeTo
      ? `Pachetul „${plan.label}" include un singur părinte. Treci la „${FAMILY_PLANS[upgradeTo].label}" ca să adaugi al doilea părinte.`
      : `Pachetul „${plan.label}" a atins numărul maxim de părinți.`,
  };
}

/**
 * Can the account owner add another child? Over the base seat this is NOT a hard
 * stop — it's a discounted add-on the owner can purchase. `currentChildren` is
 * the number of children already linked.
 */
export function canAddChild(
  plan: FamilyPlan | null,
  currentChildren: number
): SeatCheck {
  if (!plan) return NO_PLAN;
  if (currentChildren < plan.maxChildren) return { allowed: true };
  // Beyond the base seat → paid add-on with a loyalty discount.
  const nextIndex = currentChildren + 1;
  const discountPercent = childDiscountPercent(nextIndex);
  return {
    allowed: false,
    reason: "child_addon",
    addon: true,
    discountPercent,
    message: `Adaugă al ${nextIndex}-lea copil cu o reducere de ${discountPercent}% pe pachet.`,
  };
}

/** Can the account owner add a tutor? */
export function canAddTutor(
  plan: FamilyPlan | null,
  currentTutors: number
): SeatCheck {
  if (!plan) return NO_PLAN;
  if (!plan.features.tutorAccess) {
    const upgradeTo = TUTOR_UPGRADE[plan.key];
    return {
      allowed: false,
      reason: "tutor_feature_off",
      upgradeTo,
      message: upgradeTo
        ? `Accesul pentru meditator e disponibil în pachetul „${FAMILY_PLANS[upgradeTo].label}". Treci la el ca să adaugi un meditator.`
        : `Pachetul „${plan.label}" nu include acces pentru meditator.`,
    };
  }
  if (currentTutors < plan.maxTutors) return { allowed: true };
  return {
    allowed: false,
    reason: "tutor_limit",
    message: `Pachetul „${plan.label}" a atins numărul maxim de meditatori.`,
  };
}
