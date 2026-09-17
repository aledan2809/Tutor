import { describe, it, expect, vi, beforeEach } from "vitest";

// The platform switch for the 7-day trial + pause lives in the real database; the tests set it.
const pauseSwitch = vi.hoisted(() => ({ startsAt: null as Date | null }));
vi.mock("@/lib/access-server", () => ({ loadPauseStartsAt: async () => pauseSwitch.startsAt }));

import {
  appBaseUrl,
  inviteAcceptUrl,
  getFamilyOverview,
  checkSeat,
  canBecomeParent,
  familyBuyer,
} from "@/lib/family-invite";
import { INVITE_TARGET_ROLE } from "@/lib/family";

/**
 * Membership/seat math for the family subsystem (Faza 1/2). DB is faked — we
 * pin the counting (parents = owner + co-parents), SuperAdmin bypass, and the
 * seat-gate delegation, without a real database.
 */

type AnyRec = Record<string, unknown>;

const DAY = 24 * 60 * 60 * 1000;
/** An account old enough that its free week is long over. */
const LONG_AGO = new Date("2025-01-01T00:00:00Z");

beforeEach(() => {
  pauseSwitch.startsAt = null;
});

/** Minimal fake of the bits of the prisma client these functions touch. */
function makeDb(opts: {
  planName?: string | null;
  isSuperAdmin?: boolean;
  freeForever?: boolean;
  /** Default "active" when a plan is set; a plan with "canceled" gives no seats. */
  subscriptionStatus?: string | null;
  createdAt?: Date;
  accountRole?: "PARENT" | "STUDENT" | "TUTOR" | null;
  /** The account learns itself (an active STUDENT enrollment). */
  learning?: boolean;
  /** The account is someone's child (an active PARENT link where it is the child). */
  isChild?: boolean;
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
        freeForever: opts.freeForever ?? false,
        accountRole: opts.accountRole ?? null,
        createdAt: opts.createdAt ?? LONG_AGO,
        subscriptionStatus:
          opts.subscriptionStatus !== undefined ? opts.subscriptionStatus : opts.planName ? "active" : null,
        subscriptionEndsAt: null,
        paidExtraChildSeats: 0,
        subscriptionPlan: opts.planName ? { name: opts.planName } : null,
        enrollments: opts.learning ? [{ id: "e1" }] : [],
        guardianLinks: opts.isChild ? [{ id: "g1" }] : [],
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

  it("„Gratuit permanent” has no seat limit either", async () => {
    const db = makeDb({ freeForever: true, children: [{ id: "c1" }] });
    const o = await getFamilyOverview("friend", db);
    expect(o.freeForever).toBe(true);
    expect(o.unlimited).toBe(true);
    expect(o.trial).toBe(false);
    expect(o.seats.children.max).toBeGreaterThan(100);
  });

  it("a parent inside the 7 free days gets Family's seats without a card", async () => {
    const db = makeDb({ createdAt: new Date(Date.now() - 2 * DAY) });
    const o = await getFamilyOverview("new-parent", db);
    expect(o.trial).toBe(true);
    expect(o.planKey).toBe("FAMILY");
    expect(o.seats.parents.max).toBe(1);
    expect(o.seats.children.max).toBe(1);
  });

  it("a learner account in its free week gets no family seats (no classmate as „child”)", async () => {
    const db = makeDb({ createdAt: new Date(Date.now() - DAY), accountRole: "STUDENT" });
    const o = await getFamilyOverview("student", db);
    expect(o.trial).toBe(false);
    expect(o.planKey).toBeNull();
    expect(o.seats.children.max).toBe(0);
  });

  it("an account without a role that learns itself (a pupil signed in with Google) gets no family seats", async () => {
    const pupil = await getFamilyOverview("google-pupil", makeDb({ createdAt: new Date(Date.now() - DAY), accountRole: null, learning: true }));
    expect(pupil.trial).toBe(false);
    expect(pupil.seats.children.max).toBe(0);
    // Without a role and not learning (a parent signed in with Google): the free week's seats.
    const parent = await getFamilyOverview("google-parent", makeDb({ createdAt: new Date(Date.now() - DAY), accountRole: null }));
    expect(parent.trial).toBe(true);
    expect(parent.seats.children.max).toBe(1);
  });

  it("someone's child gets no free-week family seats, even without a role or a subject (a child created by the parent)", async () => {
    const child = await getFamilyOverview("direct-child", makeDb({ createdAt: new Date(Date.now() - DAY), accountRole: null, isChild: true }));
    expect(child.trial).toBe(false);
    expect(child.seats.children.max).toBe(0);
  });

  it("an older account gets its week from the day the pause was switched on", async () => {
    pauseSwitch.startsAt = new Date(Date.now() - 1 * DAY);
    const o = await getFamilyOverview("old-parent", makeDb({}));
    expect(o.trial).toBe(true);
    expect(o.planKey).toBe("FAMILY");
  });

  it("a cancelled subscription keeps its plan on the account but gives no seats", async () => {
    const db = makeDb({ planName: "Family Trio", subscriptionStatus: "canceled", children: [] });
    const o = await getFamilyOverview("left", db);
    expect(o.planKey).toBeNull();
    expect(o.trial).toBe(false);
    expect(o.seats.children.max).toBe(0);
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

  it("„Gratuit permanent” always allowed", async () => {
    const db = makeDb({ freeForever: true, children: [{ id: "c1" }] });
    expect((await checkSeat("friend", INVITE_TARGET_ROLE.PARENT, db)).allowed).toBe(true);
  });

  it("free week: the first child links, a second one points to Family (no add-on checkout)", async () => {
    const recent = new Date(Date.now() - DAY);
    expect((await checkSeat("u", INVITE_TARGET_ROLE.CHILD, makeDb({ createdAt: recent }))).allowed).toBe(true);

    const r = await checkSeat("u", INVITE_TARGET_ROLE.CHILD, makeDb({ createdAt: recent, children: [{ id: "c1" }] }));
    expect(r.allowed).toBe(false);
    expect(r.addon).toBeUndefined();
    expect(r.upgradeTo).toBe("FAMILY");
  });

  it("cancelled plan → child seat denied with no_family_plan", async () => {
    const db = makeDb({ planName: "Family", subscriptionStatus: "canceled" });
    expect((await checkSeat("u", INVITE_TARGET_ROLE.CHILD, db)).reason).toBe("no_family_plan");
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

describe("cui i se oferă un pachet de familie", () => {
  it("niciodată unui elev sau copilului cuiva (UCPD); da unui adult fără rol care nu învață", () => {
    expect(familyBuyer({ accountRole: "PARENT", learning: false, isChild: false })).toBe(true);
    expect(familyBuyer({ accountRole: null, learning: false, isChild: false })).toBe(true);
    expect(familyBuyer({ accountRole: "STUDENT", learning: false, isChild: false })).toBe(false);
    expect(familyBuyer({ accountRole: null, learning: true, isChild: false })).toBe(false);
    // Copilul legat de un părinte, chiar fără rol și fără materie (creat direct de părinte).
    expect(familyBuyer({ accountRole: null, learning: false, isChild: true })).toBe(false);
    expect(familyBuyer({ accountRole: "PARENT", learning: false, isChild: true })).toBe(false);
  });
});

describe("„Sunt părinte” — contul fără rol luat drept elev", () => {
  it("se oferă doar contului fără rol care a ales o materie, n-a exersat și nu e copilul cuiva", () => {
    const base = { accountRole: null, isChild: false, learning: true, practised: false };
    expect(canBecomeParent(base)).toBe(true);
    // Fără materie aleasă nu e luat drept elev: are deja locurile din proba gratuită.
    expect(canBecomeParent({ ...base, learning: false })).toBe(false);
    // Un elev legat de un părinte nu-și poate face un coleg „copil".
    expect(canBecomeParent({ ...base, isChild: true })).toBe(false);
    // Cine a răspuns deja la întrebări învață el însuși: schimbarea nu se poate desface, și-ar pierde exersarea.
    expect(canBecomeParent({ ...base, practised: true })).toBe(false);
    // Un cont înregistrat cu rol nu se schimbă de aici.
    expect(canBecomeParent({ ...base, accountRole: "STUDENT" })).toBe(false);
    expect(canBecomeParent({ ...base, accountRole: "PARENT" })).toBe(false);
  });
});
