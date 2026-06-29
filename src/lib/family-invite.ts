/**
 * Family-packages server logic — the wiring the app was missing: real flows that
 * create the parent↔child↔tutor links (until now they only existed as hand-made
 * DB rows for the pilot). Pure rules live in `@/lib/family`; this module does the
 * DB work and channel delivery.
 *
 * Anchor model: the account OWNER (the paying parent) is the family anchor.
 *  - Children   = Guardian{ parentId: owner, relation: PARENT }
 *  - Co-parents = other adults with a relation=PARENT link to the owner's children
 *  - Tutors     = adults with a relation=TUTOR link to the owner's children
 *
 * When anyone is added we keep the family consistent: a new co-parent/tutor is
 * linked to ALL of the owner's current children, and a new child is linked to
 * all of the owner's current co-parents/tutors. A guardian (parent or tutor)
 * also gets a WATCHER enrollment in each child's domain so the child shows up in
 * their monitoring list — a tutor gets WATCHER, never INSTRUCTOR (the leak fix).
 */

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  type FamilyPlan,
  type FamilyPlanKey,
  type InviteTargetRole,
  type InviteChannel,
  type SeatCheck,
  GUARDIAN_RELATION,
  INVITE_TARGET_ROLE,
  INVITE_CHANNEL,
  resolveFamilyPlanFromRecord,
  canAddParent,
  canAddChild,
  canAddTutor,
} from "@/lib/family";
import { sendAppEmail, isEmailConfigured } from "@/lib/email";
import {
  getTelegramClient,
  telegramConfigured,
} from "@/lib/telegram/connect";

const DEFAULT_TTL_SEC = 7 * 24 * 3600; // 7 days

/** Prisma client type (injectable for tests). */
type Db = typeof prisma;

// ─────────────────────────── helpers ───────────────────────────

export function appBaseUrl(): string {
  const raw =
    process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://etutor.ro";
  return raw.replace(/\/+$/, "");
}

export function inviteAcceptUrl(token: string): string {
  return `${appBaseUrl()}/family/accept/${token}`;
}

export function familyJoinUrl(): string {
  return `${appBaseUrl()}/family/join`;
}

function genToken(): string {
  return randomBytes(24).toString("hex");
}

/** Short, human-typeable, unambiguous code (no 0/O/1/I). */
function genCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** Guardian.relation a given invite target maps to. */
function relationForTarget(target: InviteTargetRole): "PARENT" | "TUTOR" {
  return target === INVITE_TARGET_ROLE.TUTOR
    ? GUARDIAN_RELATION.TUTOR
    : GUARDIAN_RELATION.PARENT;
}

// ─────────────────────── membership / seats ───────────────────────

export interface OwnerPlan {
  key: FamilyPlanKey | null;
  plan: FamilyPlan | null;
  isSuperAdmin: boolean;
}

/** Resolve the owner's family plan from their billing plan name (+ admin flag). */
export async function resolveOwnerPlan(
  ownerId: string,
  db: Db = prisma
): Promise<OwnerPlan> {
  const u = await db.user.findUnique({
    where: { id: ownerId },
    select: {
      isSuperAdmin: true,
      subscriptionPlan: {
        select: {
          name: true,
          familyPlanKey: true,
          maxParents: true,
          maxChildren: true,
          maxTutors: true,
        },
      },
    },
  });
  // Prefer the seat composition stored on the plan record (familyPlanKey + seat
  // columns); fall back to deriving from the plan name for legacy rows.
  const plan = resolveFamilyPlanFromRecord(u?.subscriptionPlan);
  return {
    key: plan?.key ?? null,
    plan,
    isSuperAdmin: u?.isSuperAdmin ?? false,
  };
}

/** Active child user ids of the owner (relation=PARENT links the owner holds). */
export async function getOwnerChildIds(
  ownerId: string,
  db: Db = prisma
): Promise<string[]> {
  const rows = await db.guardian.findMany({
    where: { parentId: ownerId, relation: GUARDIAN_RELATION.PARENT, status: "active" },
    select: { childId: true },
  });
  return rows.map((r) => r.childId);
}

export interface FamilyMember {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  status: string;
}

export interface FamilySeats {
  parents: { used: number; max: number };
  children: { used: number; max: number };
  tutors: { used: number; max: number };
}

export interface FamilyOverview {
  ownerId: string;
  planKey: FamilyPlanKey | null;
  planLabel: string | null;
  isSuperAdmin: boolean;
  children: FamilyMember[];
  coParents: FamilyMember[];
  tutors: FamilyMember[];
  seats: FamilySeats;
  pendingInvites: {
    id: string;
    targetRole: string;
    channel: string;
    email: string | null;
    phone: string | null;
    code: string | null;
    expiresAt: Date;
    createdAt: Date;
  }[];
}

const UNLIMITED = 999;

/** The owner's whole household + seat usage + pending invites. */
export async function getFamilyOverview(
  ownerId: string,
  db: Db = prisma
): Promise<FamilyOverview> {
  const { key, plan, isSuperAdmin } = await resolveOwnerPlan(ownerId, db);

  // Children directly held by the owner.
  const childLinks = await db.guardian.findMany({
    where: { parentId: ownerId, relation: GUARDIAN_RELATION.PARENT, status: "active" },
    select: {
      status: true,
      child: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  const childIds = childLinks.map((l) => l.child.id);

  // Co-parents + tutors = other adults linked to the owner's children.
  const otherLinks = childIds.length
    ? await db.guardian.findMany({
        where: {
          childId: { in: childIds },
          parentId: { not: ownerId },
          status: "active",
        },
        select: {
          relation: true,
          status: true,
          parent: { select: { id: true, name: true, email: true, image: true } },
        },
      })
    : [];

  const coParentMap = new Map<string, FamilyMember>();
  const tutorMap = new Map<string, FamilyMember>();
  for (const l of otherLinks) {
    const m: FamilyMember = {
      userId: l.parent.id,
      name: l.parent.name,
      email: l.parent.email,
      image: l.parent.image,
      status: l.status,
    };
    if (l.relation === GUARDIAN_RELATION.TUTOR) tutorMap.set(m.userId, m);
    else coParentMap.set(m.userId, m);
  }

  const children: FamilyMember[] = childLinks.map((l) => ({
    userId: l.child.id,
    name: l.child.name,
    email: l.child.email,
    image: l.child.image,
    status: l.status,
  }));
  const coParents = Array.from(coParentMap.values());
  const tutors = Array.from(tutorMap.values());

  const pending = await db.familyInvite.findMany({
    where: { inviterId: ownerId, status: "pending" },
    select: {
      id: true,
      targetRole: true,
      channel: true,
      email: true,
      phone: true,
      code: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const maxParents = isSuperAdmin ? UNLIMITED : plan?.maxParents ?? 0;
  const maxChildren = isSuperAdmin ? UNLIMITED : plan?.maxChildren ?? 0;
  const maxTutors = isSuperAdmin ? UNLIMITED : plan?.maxTutors ?? 0;

  return {
    ownerId,
    planKey: key,
    planLabel: plan?.label ?? null,
    isSuperAdmin,
    children,
    coParents,
    tutors,
    seats: {
      // +1 for the owner themselves on the parent line.
      parents: { used: 1 + coParents.length, max: maxParents },
      children: { used: children.length, max: maxChildren },
      tutors: { used: tutors.length, max: maxTutors },
    },
    pendingInvites: pending,
  };
}

/**
 * Seat check for adding one more member of `target` to the owner's family.
 * SuperAdmin bypasses limits (covers the manual pilot account).
 */
export async function checkSeat(
  ownerId: string,
  target: InviteTargetRole,
  db: Db = prisma
): Promise<SeatCheck> {
  const { plan, isSuperAdmin } = await resolveOwnerPlan(ownerId, db);
  if (isSuperAdmin) return { allowed: true };
  const overview = await getFamilyOverview(ownerId, db);
  if (target === INVITE_TARGET_ROLE.CHILD)
    return canAddChild(plan, overview.children.length);
  if (target === INVITE_TARGET_ROLE.TUTOR)
    return canAddTutor(plan, overview.tutors.length);
  return canAddParent(plan, overview.seats.parents.used);
}

// ─────────────────────── link plumbing ───────────────────────

/** Domains a user is an active STUDENT in. */
async function studentDomainIds(userId: string, db: Db): Promise<string[]> {
  const rows = await db.enrollment.findMany({
    where: { userId, isActive: true, roles: { hasSome: ["STUDENT"] } },
    select: { domainId: true },
  });
  return rows.map((r) => r.domainId);
}

/**
 * Ensure `watcherId` has a WATCHER enrollment in each of the given domains so the
 * children show up in their monitoring list. Adds WATCHER to an existing
 * enrollment without dropping any role; creates one when missing. Never grants
 * INSTRUCTOR — a family tutor is scoped per-child, not domain-wide.
 */
async function ensureWatcherEnrollments(
  watcherId: string,
  domainIds: string[],
  db: Db
): Promise<void> {
  for (const domainId of domainIds) {
    const existing = await db.enrollment.findUnique({
      where: { userId_domainId: { userId: watcherId, domainId } },
      select: { id: true, roles: true },
    });
    if (existing) {
      if (!existing.roles.includes("WATCHER")) {
        await db.enrollment.update({
          where: { id: existing.id },
          data: { roles: { set: [...existing.roles, "WATCHER"] }, isActive: true },
        });
      }
    } else {
      await db.enrollment.create({
        data: { userId: watcherId, domainId, roles: ["WATCHER"] },
      });
    }
  }
}

/** Idempotently link a guardian (parent/tutor) to a child + grant WATCHER scope. */
async function linkGuardianToChild(
  guardianId: string,
  childId: string,
  relation: "PARENT" | "TUTOR",
  db: Db
): Promise<void> {
  if (guardianId === childId) return; // never self-link
  await db.guardian.upsert({
    where: { parentId_childId: { parentId: guardianId, childId } },
    create: { parentId: guardianId, childId, relation, status: "active" },
    update: { status: "active", relation },
  });
  const domains = await studentDomainIds(childId, db);
  await ensureWatcherEnrollments(guardianId, domains, db);
}

/**
 * Add a fully-resolved member (existing user) to the owner's family and keep the
 * household consistent. Runs in a transaction.
 */
async function addMemberToFamily(params: {
  ownerId: string;
  memberId: string;
  target: InviteTargetRole;
  db?: Db;
}): Promise<void> {
  const db = params.db ?? prisma;
  const { ownerId, memberId, target } = params;

  if (target === INVITE_TARGET_ROLE.CHILD) {
    // Link the owner (+ existing co-parents/tutors) to the new child.
    await linkGuardianToChild(ownerId, memberId, GUARDIAN_RELATION.PARENT, db);
    const overview = await getFamilyOverview(ownerId, db);
    for (const cp of overview.coParents)
      await linkGuardianToChild(cp.userId, memberId, GUARDIAN_RELATION.PARENT, db);
    for (const t of overview.tutors)
      await linkGuardianToChild(t.userId, memberId, GUARDIAN_RELATION.TUTOR, db);
    return;
  }

  // 2nd parent or tutor: link them to ALL of the owner's current children.
  const relation = relationForTarget(target);
  const childIds = await getOwnerChildIds(ownerId, db);
  for (const childId of childIds)
    await linkGuardianToChild(memberId, childId, relation, db);
}

// ─────────────────────── invites ───────────────────────

export interface CreateInviteResult {
  invite: { id: string; token: string; code: string | null };
  acceptUrl: string;
  code: string | null;
  delivery: { channel: InviteChannel; delivered: boolean; reason?: string };
}

/**
 * Create + deliver a family invite. Seat-checked here (UX: don't mint an invite
 * that can't be accepted) AND re-checked authoritatively at accept time.
 * Throws `FamilySeatError` when the seat is unavailable so the route can surface
 * the upgrade/add-on CTA.
 */
export class FamilySeatError extends Error {
  check: SeatCheck;
  constructor(check: SeatCheck) {
    super(check.message ?? "Seat unavailable");
    this.name = "FamilySeatError";
    this.check = check;
  }
}

/** Thrown inside the accept transaction when the accepter already holds a
 * conflicting role in this family (rolls back the single-use claim). */
export class RoleConflictError extends Error {
  constructor() {
    super("Role conflict");
    this.name = "RoleConflictError";
  }
}

export async function createAndDeliverInvite(params: {
  inviterId: string;
  inviterName?: string | null;
  target: InviteTargetRole;
  channel: InviteChannel;
  email?: string | null;
  phone?: string | null;
  ttlSec?: number;
  db?: Db;
}): Promise<CreateInviteResult> {
  const db = params.db ?? prisma;
  const seat = await checkSeat(params.inviterId, params.target, db);
  if (!seat.allowed) throw new FamilySeatError(seat);

  const token = genToken();
  const code = params.channel === INVITE_CHANNEL.CODE ? genCode() : null;
  const relation = relationForTarget(params.target);
  const expiresAt = new Date(Date.now() + (params.ttlSec ?? DEFAULT_TTL_SEC) * 1000);

  const invite = await db.familyInvite.create({
    data: {
      inviterId: params.inviterId,
      token,
      code,
      targetRole: params.target,
      relation,
      email: params.email ?? null,
      phone: params.phone ?? null,
      channel: params.channel,
      expiresAt,
    },
    select: { id: true, token: true, code: true },
  });

  const acceptUrl = inviteAcceptUrl(token);
  const delivery = await deliverInvite({
    channel: params.channel,
    target: params.target,
    inviterName: params.inviterName ?? null,
    email: params.email ?? null,
    phone: params.phone ?? null,
    acceptUrl,
    code,
  });

  return { invite, acceptUrl, code, delivery };
}

function inviteRoleLabel(target: InviteTargetRole): string {
  if (target === INVITE_TARGET_ROLE.CHILD) return "elev";
  if (target === INVITE_TARGET_ROLE.TUTOR) return "meditator";
  return "părinte";
}

/** Deliver an invite link over the chosen channel. Never throws. */
async function deliverInvite(params: {
  channel: InviteChannel;
  target: InviteTargetRole;
  inviterName: string | null;
  email: string | null;
  phone: string | null;
  acceptUrl: string;
  code: string | null;
}): Promise<{ channel: InviteChannel; delivered: boolean; reason?: string }> {
  const who = params.inviterName ? `${params.inviterName} ` : "";
  const roleRo = inviteRoleLabel(params.target);

  try {
    if (params.channel === INVITE_CHANNEL.EMAIL) {
      if (!params.email) return { channel: params.channel, delivered: false, reason: "no_email" };
      if (!isEmailConfigured())
        return { channel: params.channel, delivered: false, reason: "email_not_configured" };
      const html = `
        <p>Bună!</p>
        <p>${who}te invită pe etutor.ro ca <strong>${roleRo}</strong>.</p>
        <p><a href="${params.acceptUrl}">Acceptă invitația</a></p>
        <p>Sau deschide linkul: ${params.acceptUrl}</p>
        <p style="color:#888;font-size:12px">Linkul expiră în 7 zile.</p>`;
      const ok = await sendAppEmail({
        to: params.email,
        subject: "Invitație etutor.ro",
        html,
      });
      return { channel: params.channel, delivered: ok, reason: ok ? undefined : "send_failed" };
    }

    if (params.channel === INVITE_CHANNEL.WHATSAPP) {
      // Cold WhatsApp to a non-contact needs a Meta-APPROVED template. The only
      // approved template (study_reminder) is the wrong intent for an invite, so
      // we only send when a dedicated invite template is configured. Until then
      // the link is shown in the UI for the parent to forward manually.
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const template = process.env.WHATSAPP_INVITE_TEMPLATE;
      if (!params.phone)
        return { channel: params.channel, delivered: false, reason: "no_phone" };
      if (!phoneNumberId || !accessToken || !template)
        return { channel: params.channel, delivered: false, reason: "invite_template_not_configured" };
      const { WhatsAppClient, normalizePhone } = await import("@aledan/whatsapp");
      const client = new WhatsAppClient({ phoneNumberId, accessToken });
      await client.sendTemplate(normalizePhone(params.phone), template, "ro", [
        {
          type: "body" as const,
          parameters: [{ type: "text" as const, text: params.acceptUrl }],
        },
      ]);
      return { channel: params.channel, delivered: true };
    }

    if (params.channel === INVITE_CHANNEL.TELEGRAM) {
      // Telegram needs the recipient's chatId; a cold invite has none. We can't
      // deliver to a stranger — the parent forwards the link from the UI.
      if (!telegramConfigured() || !getTelegramClient())
        return { channel: params.channel, delivered: false, reason: "telegram_not_configured" };
      return { channel: params.channel, delivered: false, reason: "no_recipient_chat" };
    }

    // CODE / DIRECT — nothing to send; the UI shows the code / handles directly.
    return { channel: params.channel, delivered: false, reason: "manual_channel" };
  } catch (err) {
    logger.error("Family invite delivery failed", err, { channel: params.channel });
    return { channel: params.channel, delivered: false, reason: "exception" };
  }
}

export interface AcceptResult {
  ok: boolean;
  status:
    | "accepted"
    | "expired"
    | "not_found"
    | "already_used"
    | "seat_unavailable"
    | "self_invite"
    | "role_conflict";
  target?: InviteTargetRole;
  seat?: SeatCheck;
}

/**
 * Accept an invite by `token` (link) or `code` (typed). The accepter must be a
 * logged-in user (`accepterUserId`). Atomic: the invite is flipped pending→
 * accepted with a conditional update so a double-submit can't double-link.
 */
export async function acceptInvite(params: {
  token?: string | null;
  code?: string | null;
  accepterUserId: string;
}): Promise<AcceptResult> {
  const where = params.token
    ? { token: params.token }
    : params.code
    ? { code: params.code.toUpperCase() }
    : null;
  if (!where) return { ok: false, status: "not_found" };

  const invite = await prisma.familyInvite.findUnique({ where });
  if (!invite) return { ok: false, status: "not_found" };
  if (invite.status !== "pending")
    return { ok: false, status: "already_used" };
  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.familyInvite
      .updateMany({ where: { id: invite.id, status: "pending" }, data: { status: "expired" } })
      .catch(() => {});
    return { ok: false, status: "expired" };
  }
  if (invite.inviterId === params.accepterUserId)
    return { ok: false, status: "self_invite" };

  const target = invite.targetRole as InviteTargetRole;

  return prisma.$transaction(async (tx) => {
    // Serialize concurrent accepts within the same family so the seat re-check
    // below can't be raced (two accepts both seeing 0 used → strict limit blown).
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${invite.inviterId}))`;

    // Single-use guard: only the call that flips pending→accepted proceeds.
    const claimed = await tx.familyInvite.updateMany({
      where: { id: invite.id, status: "pending" },
      data: {
        status: "accepted",
        acceptedById: params.accepterUserId,
        acceptedAt: new Date(),
      },
    });
    if (claimed.count !== 1) return { ok: false, status: "already_used" as const };

    const txDb = tx as unknown as Db;

    // Authoritative seat re-check at accept time.
    const seat = await checkSeat(invite.inviterId, target, txDb);
    if (!seat.allowed) {
      throw new FamilySeatError(seat); // rolls back the claim
    }

    // Role-conflict guard: the accepter must not already be in this family in a
    // different role. Prevents e.g. a TUTOR invite flipping an existing
    // co-parent's PARENT link, or one of the owner's children becoming a tutor
    // of their siblings. Throws → rolls back the claim (invite stays usable).
    const ownerChildIds = await getOwnerChildIds(invite.inviterId, txDb);
    const targetRelation = relationForTarget(target);
    if (target === INVITE_TARGET_ROLE.CHILD) {
      // The accepter must not already be a guardian of this family.
      const asGuardian = await tx.guardian.count({
        where: { parentId: params.accepterUserId, childId: { in: ownerChildIds }, status: "active" },
      });
      if (asGuardian > 0) throw new RoleConflictError();
    } else {
      // A parent/tutor accepter must not be one of the owner's children…
      if (ownerChildIds.includes(params.accepterUserId)) throw new RoleConflictError();
      // …and must not already hold a different-relation active link to them.
      const conflicting = await tx.guardian.count({
        where: {
          parentId: params.accepterUserId,
          childId: { in: ownerChildIds },
          status: "active",
          relation: { not: targetRelation },
        },
      });
      if (conflicting > 0) throw new RoleConflictError();
    }

    await addMemberToFamily({
      ownerId: invite.inviterId,
      memberId: params.accepterUserId,
      target,
      db: txDb,
    });

    return { ok: true, status: "accepted" as const, target };
  }, { timeout: 15000 }).catch((err) => {
    if (err instanceof FamilySeatError)
      return { ok: false, status: "seat_unavailable" as const, seat: err.check };
    if (err instanceof RoleConflictError)
      return { ok: false, status: "role_conflict" as const };
    throw err;
  });
}

/**
 * Owner creates a child account directly (the 3rd linking path). Creates the
 * student user, enrolls them in the chosen domains, links the family, and
 * records an accepted DIRECT invite for the audit trail. Throws on seat denial
 * or duplicate email.
 */
export async function createChildDirectly(params: {
  ownerId: string;
  name: string;
  email: string;
  passwordHash: string;
  domainSlugs?: string[];
}): Promise<{ childId: string }> {
  return prisma.$transaction(async (tx) => {
    // Serialize per-family so the seat check holds under concurrent adds.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${params.ownerId}))`;

    const seat = await checkSeat(params.ownerId, INVITE_TARGET_ROLE.CHILD, tx as unknown as Db);
    if (!seat.allowed) throw new FamilySeatError(seat);

    const existing = await tx.user.findUnique({
      where: { email: params.email },
      select: { id: true },
    });
    if (existing) {
      const e = new Error("EMAIL_TAKEN");
      e.name = "EmailTakenError";
      throw e;
    }

    const child = await tx.user.create({
      data: {
        name: params.name,
        email: params.email,
        password: params.passwordHash,
        emailVerified: new Date(),
      },
      select: { id: true },
    });

    const slugs = Array.from(new Set(params.domainSlugs ?? []));
    if (slugs.length) {
      const domains = await tx.domain.findMany({
        where: { slug: { in: slugs } },
        select: { id: true },
      });
      if (domains.length) {
        await tx.enrollment.createMany({
          data: domains.map((d) => ({ userId: child.id, domainId: d.id, roles: ["STUDENT"] as const })),
          skipDuplicates: true,
        });
      }
    }

    await addMemberToFamily({
      ownerId: params.ownerId,
      memberId: child.id,
      target: INVITE_TARGET_ROLE.CHILD,
      db: tx as unknown as Db,
    });

    await tx.familyInvite.create({
      data: {
        inviterId: params.ownerId,
        token: genToken(),
        targetRole: INVITE_TARGET_ROLE.CHILD,
        relation: GUARDIAN_RELATION.PARENT,
        email: params.email,
        channel: INVITE_CHANNEL.DIRECT,
        status: "accepted",
        acceptedById: child.id,
        acceptedAt: new Date(),
        expiresAt: new Date(),
      },
    });

    return { childId: child.id };
  }, { timeout: 15000 });
}

/** Revoke a still-pending invite the owner created. */
export async function revokeInvite(
  ownerId: string,
  inviteId: string
): Promise<boolean> {
  const res = await prisma.familyInvite.updateMany({
    where: { id: inviteId, inviterId: ownerId, status: "pending" },
    data: { status: "revoked" },
  });
  return res.count === 1;
}

/**
 * Remove a family member: deactivates the relevant Guardian links (owner→child
 * for a child; member→owner's-children for a co-parent/tutor). Does NOT delete
 * the user account.
 */
export async function removeFamilyMember(params: {
  ownerId: string;
  memberId: string;
}): Promise<boolean> {
  const { ownerId, memberId } = params;
  // Is the member an ACTIVE child of the caller (caller holds a PARENT link)?
  const asChild = await prisma.guardian.findUnique({
    where: { parentId_childId: { parentId: ownerId, childId: memberId } },
    select: { id: true, relation: true, status: true },
  });
  if (
    asChild &&
    asChild.status === "active" &&
    asChild.relation === GUARDIAN_RELATION.PARENT
  ) {
    // Only the child's ANCHOR (the account that added the child) may remove the
    // child from the WHOLE family. A co-parent removing "a child" must not be
    // able to evict everyone — they only drop their own link. The anchor is the
    // inviter on the child's accepted CHILD/DIRECT invite; if there's no invite
    // row (legacy/manual link), the caller counts as anchor only when they are
    // the sole active PARENT of the child.
    const anchorInvite = await prisma.familyInvite.findFirst({
      where: { acceptedById: memberId, targetRole: "CHILD", status: "accepted" },
      select: { inviterId: true },
      orderBy: { acceptedAt: "asc" },
    });
    let isAnchor: boolean;
    if (anchorInvite) {
      isAnchor = anchorInvite.inviterId === ownerId;
    } else {
      const activeParents = await prisma.guardian.count({
        where: { childId: memberId, relation: GUARDIAN_RELATION.PARENT, status: "active" },
      });
      isAnchor = activeParents <= 1;
    }

    if (isAnchor) {
      // Remove the child from the whole family (owner + co-parents/tutors).
      await prisma.guardian.updateMany({
        where: { childId: memberId, status: "active" },
        data: { status: "removed" },
      });
    } else {
      // Co-parent: drop only their own link to this child.
      await prisma.guardian.update({
        where: { id: asChild.id },
        data: { status: "removed" },
      });
    }
    return true;
  }

  // Otherwise the member is a co-parent/tutor: drop their links to the owner's children.
  const childIds = await getOwnerChildIds(ownerId);
  if (!childIds.length) return false;
  const res = await prisma.guardian.updateMany({
    where: { parentId: memberId, childId: { in: childIds }, status: "active" },
    data: { status: "removed" },
  });
  return res.count > 0;
}
