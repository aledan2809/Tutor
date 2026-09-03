import { describe, it, expect } from "vitest";
import { buildNavSections, type NavUser } from "@/lib/nav-sections";
import { resolveClientRole } from "@/lib/client-role";

const enr = (...roles: string[]) => [{ roles }];
const hrefs = (u: NavUser, plan = false, opts = {}) =>
  buildNavSections(u, plan, opts).flatMap((s) => s.items.map((i) => i.href));
const sectionIds = (u: NavUser, plan = false, opts = {}) =>
  buildNavSections(u, plan, opts).map((s) => s.id);

const STUDENT: NavUser = { isSuperAdmin: false, enrollments: enr("STUDENT") };
const PARENT: NavUser = { isSuperAdmin: false, enrollments: enr("WATCHER") };
const TUTOR: NavUser = { isSuperAdmin: false, enrollments: enr("INSTRUCTOR") };

describe("buildNavSections — grouping", () => {
  it("groups the student menu instead of one flat list", () => {
    expect(sectionIds(STUDENT)).toEqual(["home", "learn", "progress", "account"]);
  });

  it("gives the parent a child block and an account block, no learning block", () => {
    expect(sectionIds(PARENT)).toEqual(["home", "child", "account"]);
  });

  it("builds the meditator sections the June design sketched but never shipped", () => {
    expect(sectionIds(TUTOR)).toEqual(["home", "students", "content", "account"]);
  });

  it("gives every section except the home/admin rows a heading", () => {
    for (const s of buildNavSections(STUDENT)) {
      if (s.id === "home" || s.id === "admin") expect(s.labelKey).toBeUndefined();
      else expect(s.labelKey, `${s.id} needs a heading`).toBeTruthy();
    }
  });
});

describe("buildNavSections — the duplicates that prompted this", () => {
  // "Familia mea" (locked) and "Pachete" both pointed at /dashboard/packages:
  // one URL, two entries, two labels, in the same sidebar.
  it("never lists the same href twice for one user", () => {
    for (const [name, u, plan] of [
      ["student", STUDENT, false],
      ["parent", PARENT, false],
      ["meditator", TUTOR, false],
      ["student+family", STUDENT, true],
      ["superadmin", { isSuperAdmin: true } as NavUser, false],
    ] as const) {
      const list = hrefs(u, plan);
      expect(new Set(list).size, `${name} has a duplicate href`).toBe(list.length);
    }
  });

  it("points the locked family entry at the family page, not at Abonament", () => {
    const items = buildNavSections(STUDENT).flatMap((s) => s.items);
    const locked = items.find((i) => i.locked);
    expect(locked?.href).toBe("/dashboard/family");
    expect(locked?.labelKey).toBe("family");
  });

  it("unlocks the family entry once a plan is paid", () => {
    const items = buildNavSections(STUDENT, true).flatMap((s) => s.items);
    expect(items.find((i) => i.href === "/dashboard/family")?.locked).toBeFalsy();
  });

  it("merges Activare acces + Pachete into one Abonament entry", () => {
    const items = buildNavSections(STUDENT).flatMap((s) => s.items);
    expect(items.filter((i) => i.labelKey === "subscription")).toHaveLength(1);
    expect(items.some((i) => i.href === "/dashboard/activare")).toBe(false);
  });
});

describe("buildNavSections — what each role can reach", () => {
  // THE parent regression: the parent override rewrote the list and dropped
  // Rapoarte, so the only way in was the link inside the report email.
  it("gives the parent Rapoarte", () => {
    expect(hrefs(PARENT)).toContain("/dashboard/rapoarte");
  });

  // The payer had no route to the billing portal except typing the URL.
  it("gives the parent Abonament", () => {
    expect(hrefs(PARENT)).toContain("/dashboard/packages");
  });

  it("keeps Rapoarte out of the student sidebar — it is a Progres tab now", () => {
    expect(hrefs(STUDENT)).not.toContain("/dashboard/rapoarte");
    expect(hrefs(STUDENT)).toContain("/dashboard/progress");
  });

  it("offers help to every role", () => {
    for (const u of [STUDENT, PARENT, TUTOR]) {
      expect(hrefs(u)).toContain("/dashboard/ajutor");
    }
  });

  it("hides the learning flow from a parent and the child flow from a meditator", () => {
    expect(hrefs(PARENT)).not.toContain("/dashboard/practice");
    expect(hrefs(TUTOR)).not.toContain("/dashboard/watcher");
  });

  it("keeps Domenii and Calendar visible (June decision), under Învață", () => {
    const learn = buildNavSections(STUDENT).find((s) => s.id === "learn")!;
    const inLearn = learn.items.map((i) => i.href);
    expect(inLearn).toContain("/dashboard/domains");
    expect(inLearn).toContain("/dashboard/calendar");
  });
});

describe("buildNavSections — mixed accounts lose nothing", () => {
  it("gives a student with a family plan both the learning and the child block", () => {
    expect(sectionIds(STUDENT, true)).toEqual(["home", "learn", "progress", "child", "account"]);
  });

  it("gives a student who also teaches the instructor hub", () => {
    const u: NavUser = { isSuperAdmin: false, enrollments: enr("STUDENT", "INSTRUCTOR") };
    expect(hrefs(u)).toContain("/dashboard/instructor");
    expect(hrefs(u)).toContain("/dashboard/practice");
  });

  it("gives a superadmin every block plus admin", () => {
    const ids = sectionIds({ isSuperAdmin: true });
    expect(ids).toContain("learn");
    expect(ids).toContain("child");
    expect(ids).toContain("students");
    expect(ids).toContain("admin");
  });
});

describe("buildNavSections — gates carried over verbatim", () => {
  it("shows Licență to an admin and to the allowlisted student only", () => {
    expect(hrefs({ isSuperAdmin: true })).toContain("/dashboard/licenta");
    expect(
      hrefs({ isSuperAdmin: false, email: "raresdanciulescu9@gmail.com", enrollments: enr("STUDENT") })
    ).toContain("/dashboard/licenta");
    expect(hrefs(STUDENT)).not.toContain("/dashboard/licenta");
  });

  it("keeps the hidden routes out of every role's menu", () => {
    const hidden = [
      "/dashboard/lessons",
      "/dashboard/assessment",
      "/dashboard/exams",
      "/dashboard/bibliography",
      "/dashboard/gamification",
    ];
    for (const u of [STUDENT, PARENT, TUTOR, { isSuperAdmin: true } as NavUser]) {
      for (const h of hidden) expect(hrefs(u, true)).not.toContain(h);
    }
  });

  it("never emits an empty section", () => {
    for (const u of [STUDENT, PARENT, TUTOR, { isSuperAdmin: true } as NavUser]) {
      for (const s of buildNavSections(u, true)) expect(s.items.length).toBeGreaterThan(0);
    }
  });
});

describe("resolveClientRole", () => {
  it("reads an explicit parent account even with zero enrollments", () => {
    expect(resolveClientRole({ isSuperAdmin: false, accountRole: "PARENT" })).toBe("parent");
  });

  // A parent who signed up before the role question carries STUDENT, which is why
  // they were seeing the learner menu; the explicit marker is what fixes them.
  it("lets the explicit marker override a legacy STUDENT enrollment", () => {
    expect(
      resolveClientRole({ isSuperAdmin: false, accountRole: "PARENT", enrollments: enr("STUDENT") })
    ).toBe("parent");
  });

  it("treats a learner who also watches a sibling as a learner", () => {
    expect(resolveClientRole({ isSuperAdmin: false, enrollments: enr("STUDENT", "WATCHER") })).toBe(
      "student"
    );
  });

  it("separates a family tutor from a parent by the guardian relation", () => {
    const u = { isSuperAdmin: false, enrollments: enr("WATCHER") };
    expect(resolveClientRole(u, { isFamilyTutor: true })).toBe("meditator");
    expect(resolveClientRole(u, { isFamilyTutor: false })).toBe("parent");
  });

  it("treats a payer with no role yet as a parent", () => {
    expect(resolveClientRole({ isSuperAdmin: false, enrollments: [] }, { hasFamilyPlan: true })).toBe(
      "parent"
    );
  });

  it("puts admins first", () => {
    expect(resolveClientRole({ isSuperAdmin: true, enrollments: enr("STUDENT") })).toBe("admin");
    expect(resolveClientRole({ isSuperAdmin: false, enrollments: enr("ADMIN") })).toBe("admin");
  });

  it("falls back to student for an account with nothing on it", () => {
    expect(resolveClientRole({ isSuperAdmin: false })).toBe("student");
  });
});
