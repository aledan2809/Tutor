import { describe, it, expect } from "vitest";
import {
  appBaseUrl,
  inviteAcceptUrl,
  getFamilyOverview,
  checkSeat,
} from "@/lib/family-invite";
import { INVITE_TARGET_ROLE } from "@/lib/family";

/**
 * Membership/seat math for the family subsystem (Faza 1/2). DB is faked — we
 * pin the counting (parents = owner + co-parents), SuperAdmin bypass, and the
 * seat-gate delegation, without a real database.
 */

type AnyRec = Record<string, unknown>;

/** Minimal fake of the bits of the prisma client these functions touch. */
function makeDb(opts: {
  planName?: string | null;
  isSuperAdmin?: boolean;
  /** children directly owned (relation=PARENT links the owner holds) */
  children?: { id: string; name?: string; email?: string }[];
  /** other adults linked to the owner's children */
  others?: { id: string; relation: "PARENT" | "TUTOR" }[];
}) {
  const children = opts.children ?? [];
  const others = opts.others ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = {
    user: {
      findUnique: async () => ({
        isSuperAdmin: opts.isSuperAdmin ?? false,
        subscriptionPlan: opts.planName ? { name: opts.planName } : null,
      }),
    },
    guardian: {
      findMany: async ({ where }: { where: AnyRec }) => {
        // childLinks: where parentId set + relation PARENT
        if (where.parentId && where.relation === "PARENT") {
          return children.map((c) => ({
            status: "active",
            childId: c.id,
            child: { id: c.id, name: c.name ?? null, email: c.email ?? null, image: null },
          }));
        }
        // otherLinks: where childId in [...] + parentId not owner
        if (where.childId) {
          return others.map((o) => ({
            relation: o.relation,
            status: "active",
            parent: { id: o.id, name: null, email: null, image: null },
          }));
        }
        return [];
      },
    },
    familyInvite: {
      findMany: async () => [],
    },
  };
  return db;
}

describe("URL helpers", () => {
  it("builds an absolute accept link", () => {
    const base = appBaseUrl();
    expect(base.startsWith("http")).toBe(true);
    expect(base.endsWith("/")).toBe(false);
    expect(inviteAcceptUrl("abc123")).toBe(`${base}/family/accept/abc123`);
  });
});

describe("getFamilyOverview seat math", () => {
  it("counts the owner on the parent line (used = 1 + co-parents)", async () => {
    const db = makeDb({
      planName: "Family Duo",
      children: [{ id: "c1" }],
      others: [{ id: "p2", relation: "PARENT" }],
    });
    const o = await getFamilyOverview("owner1", db);
    expect(o.planKey).toBe("FAMILY_DUO");
    expect(o.children.length).toBe(1);
    expect(o.coParents.length).toBe(1);
    expect(o.seats.parents.used).toBe(2); // owner + 1 co-parent
    expect(o.seats.parents.max).toBe(2);
    expect(o.seats.children.used).toBe(1);
    expect(o.seats.tutors.used).toBe(0);
  });

  it("splits co-parents from tutors by relation", async () => {
    const db = makeDb({
      planName: "Family Trio",
      children: [{ id: "c1" }],
      others: [
        { id: "p2", relation: "PARENT" },
        { id: "t1", relation: "TUTOR" },
      ],
    });
    const o = await getFamilyOverview("owner1", db);
    expect(o.coParents.map((m) => m.userId)).toEqual(["p2"]);
    expect(o.tutors.map((m) => m.userId)).toEqual(["t1"]);
    expect(o.seats.tutors.used).toBe(1);
  });

  it("no family plan → all seat maxes are zero", async () => {
    const db = makeDb({ planName: null, children: [] });
    const o = await getFamilyOverview("owner1", db);
    expect(o.planKey).toBeNull();
    expect(o.seats.parents.max).toBe(0);
    expect(o.seats.children.max).toBe(0);
    expect(o.seats.parents.used).toBe(1); // owner always counts
  });

  it("SuperAdmin gets unlimited seat maxes", async () => {
    const db = makeDb({ isSuperAdmin: true, children: [{ id: "c1" }] });
    const o = await getFamilyOverview("admin", db);
    expect(o.isSuperAdmin).toBe(true);
    expect(o.seats.children.max).toBeGreaterThan(100);
  });
});

describe("checkSeat", () => {
  it("SuperAdmin always allowed", async () => {
    const db = makeDb({ isSuperAdmin: true });
    const r = await checkSeat("admin", INVITE_TARGET_ROLE.CHILD, db);
    expect(r.allowed).toBe(true);
  });

  it("no plan → child seat denied with no_family_plan", async () => {
    const db = makeDb({ planName: null });
    const r = await checkSeat("u", INVITE_TARGET_ROLE.CHILD, db);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("no_family_plan");
  });

  it("Family plan: 1st child ok, 2nd child is a discounted add-on", async () => {
    const empty = makeDb({ planName: "Family", children: [] });
    expect((await checkSeat("u", INVITE_TARGET_ROLE.CHILD, empty)).allowed).toBe(true);

    const oneChild = makeDb({ planName: "Family", children: [{ id: "c1" }] });
    const r = await checkSeat("u", INVITE_TARGET_ROLE.CHILD, oneChild);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("child_addon");
    expect(r.discountPercent).toBe(20);
  });

  it("Family plan: 2nd parent blocked → upgrade to Duo", async () => {
    const db = makeDb({ planName: "Family", children: [{ id: "c1" }] });
    const r = await checkSeat("u", INVITE_TARGET_ROLE.PARENT, db);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("parent_limit");
    expect(r.upgradeTo).toBe("FAMILY_DUO");
  });

  it("Family plan: tutor blocked → feature off (upgrade to Trio)", async () => {
    const db = makeDb({ planName: "Family", children: [{ id: "c1" }] });
    const r = await checkSeat("u", INVITE_TARGET_ROLE.TUTOR, db);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("tutor_feature_off");
    expect(r.upgradeTo).toBe("TRIO");
  });

  it("Trio plan: tutor allowed at 0, blocked at 1", async () => {
    const none = makeDb({ planName: "Trio", children: [{ id: "c1" }] });
    expect((await checkSeat("u", INVITE_TARGET_ROLE.TUTOR, none)).allowed).toBe(true);

    const one = makeDb({
      planName: "Trio",
      children: [{ id: "c1" }],
      others: [{ id: "t1", relation: "TUTOR" }],
    });
    const r = await checkSeat("u", INVITE_TARGET_ROLE.TUTOR, one);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("tutor_limit");
  });
});
