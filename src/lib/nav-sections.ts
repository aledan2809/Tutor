/**
 * The sidebar, as data.
 *
 * The menu was designed per role in June (knowledge/menu-restructure-mockups.md)
 * and shipped flat. Five items were added afterwards without regrouping, so a
 * student now scans 14 undifferentiated links and a parent's most useful page
 * (Rapoarte) is not in their menu at all. Grouping is the fix; extracting it here
 * is what makes the role matrix testable — `tests/unit` runs in a node
 * environment with no DOM, so logic living inside the component cannot be
 * covered, and the role rules are exactly the part that must not regress.
 *
 * Labels are i18n KEYS, resolved by the component. Keeping them unresolved is
 * what lets this file stay pure.
 */

import { resolveClientRole, type ClientRoleUser } from "./client-role";

export type NavItem = {
  href: string;
  /** Key inside the `nav` namespace. */
  labelKey: string;
  /** Renders as an upsell (padlock, amber) rather than a destination. */
  locked?: boolean;
};

export type NavSection = {
  id: string;
  /** Key inside the `nav` namespace. Absent = ungrouped, no heading. */
  labelKey?: string;
  items: NavItem[];
};

export interface NavUser extends ClientRoleUser {
  email?: string | null;
}

/**
 * HIDDEN 2026-06-04 (§213) — empty/niche destinations kept out of the menu while
 * their routes stay live, so the decision (populate / merge / drop) stays open
 * and reversible. To bring one back, put it in a section AND remove it here.
 */
const HIDDEN_NAV = new Set([
  "/dashboard/lessons", // Lesson = 0
  "/dashboard/assessment", // Assessment = 0
  "/dashboard/exams", // ExamSimulation = 1 (~empty; exam-bank/Simulări stays)
  "/dashboard/bibliography", // Bibliography = 11 (niche juridic/aviation)
  "/dashboard/gamification", // MERGED into „Progresul meu" (tab Realizări) — §213
]);

const CONTENT_LEARN: NavItem[] = [
  { href: "/dashboard/practice", labelKey: "practice" },
  { href: "/dashboard/exam-bank", labelKey: "examBank" },
  { href: "/dashboard/genereaza", labelKey: "generate" },
  { href: "/dashboard/domains", labelKey: "domains" },
  { href: "/dashboard/calendar", labelKey: "calendar" },
];

/** Every role ends with the same account block; only the extras differ. */
function accountSection(extra: NavItem[] = []): NavSection {
  return {
    id: "account",
    labelKey: "sectionAccount",
    items: [
      ...extra,
      { href: "/dashboard/referrals", labelKey: "referrals" },
      { href: "/dashboard/notifications", labelKey: "notifications" },
      { href: "/dashboard/settings", labelKey: "settings" },
      { href: "/dashboard/ajutor", labelKey: "help" },
    ],
  };
}

export function buildNavSections(
  user: NavUser,
  hasFamilyPlan = false,
  opts: { isFamilyTutor?: boolean } = {}
): NavSection[] {
  const role = resolveClientRole(user, { hasFamilyPlan, isFamilyTutor: opts.isFamilyTutor });
  const roles = (r: string) => !!user.enrollments?.some((e) => e.roles.includes(r));

  const isWatcher = user.isSuperAdmin || roles("WATCHER");
  const showFamily = isWatcher || hasFamilyPlan;
  const isInstructor = user.isSuperAdmin || roles("INSTRUCTOR") || roles("ADMIN");
  const isAdmin = user.isSuperAdmin || roles("ADMIN");

  // Licență — private study material, visible only to admins + the allowlisted
  // student (mirrors src/lib/licenta canUseLicenta / domain-access allowlist).
  const canLicenta =
    user.isSuperAdmin || roles("ADMIN") || user.email === "raresdanciulescu9@gmail.com";

  const home: NavSection = {
    id: "home",
    items: [{ href: "/dashboard", labelKey: "dashboard" }],
  };

  let sections: NavSection[];

  if (role === "parent") {
    // The parent's whole job is one child, so everything about that child sits in
    // one block. Rapoarte is here because it was missing entirely: the parent
    // override replaced the list and dropped it, leaving the email link as the
    // only way in. Abonament is here because the parent is the payer and had no
    // route to the billing portal other than typing the URL.
    sections = [
      home,
      {
        id: "child",
        labelKey: "sectionMyChild",
        items: [
          { href: "/dashboard/watcher", labelKey: "watcher" },
          { href: "/dashboard/rapoarte", labelKey: "reports" },
          { href: "/dashboard/watcher/notifications", labelKey: "watcherNotifications" },
          { href: "/dashboard/watcher/setari", labelKey: "watcherSettings" },
          { href: "/dashboard/family", labelKey: "family" },
        ],
      },
      accountSection([{ href: "/dashboard/packages", labelKey: "subscription" }]),
    ];
  } else if (role === "meditator") {
    sections = [
      home,
      {
        id: "students",
        labelKey: "sectionMyStudents",
        items: [{ href: "/dashboard/instructor", labelKey: "instructor" }],
      },
      {
        id: "content",
        labelKey: "sectionContent",
        items: [
          { href: "/dashboard/practice", labelKey: "practice" },
          { href: "/dashboard/exam-bank", labelKey: "examBank" },
        ],
      },
      accountSection(),
    ];
  } else {
    // Student, and every mixed account (student+watcher, admin, superadmin):
    // nothing they had is taken away, it is only grouped.
    const learn = [...CONTENT_LEARN];
    if (canLicenta) learn.push({ href: "/dashboard/licenta", labelKey: "licenta" });

    sections = [
      home,
      { id: "learn", labelKey: "sectionLearn", items: learn },
      {
        id: "progress",
        labelKey: "sectionProgress",
        // Rapoarte is not here: it became the third tab of „Progresul meu",
        // next to Statistici and Realizări, where it belongs.
        items: [{ href: "/dashboard/progress", labelKey: "progress" }],
      },
    ];

    if (isInstructor) {
      sections.push({
        id: "students",
        labelKey: "sectionMyStudents",
        items: [{ href: "/dashboard/instructor", labelKey: "instructor" }],
      });
    }
    if (showFamily) {
      sections.push({
        id: "child",
        labelKey: "sectionMyChild",
        items: [
          { href: "/dashboard/watcher", labelKey: "watcher" },
          { href: "/dashboard/watcher/notifications", labelKey: "watcherNotifications" },
          { href: "/dashboard/watcher/setari", labelKey: "watcherSettings" },
        ],
      });
    }

    // „Activare acces" and „Pachete" were two menu entries for one intention —
    // paying. They merge into Abonament on /dashboard/packages (which owns
    // checkout, the billing portal and a voucher field); /dashboard/activare
    // stays reachable from there.
    const account: NavItem[] = [{ href: "/dashboard/packages", labelKey: "subscription" }];
    // A fresh account has no family plan, so the family block is hidden and a
    // parent who signed up cannot find it. Show it locked — pointing at the page
    // that explains it, NOT at /dashboard/packages, which is already Abonament
    // one line above: two entries, one URL, two labels.
    account.push(
      showFamily
        ? { href: "/dashboard/family", labelKey: "family" }
        : { href: "/dashboard/family", labelKey: "family", locked: !isInstructor && !user.isSuperAdmin }
    );
    sections.push(accountSection(account));

    if (isAdmin) {
      sections.push({ id: "admin", items: [{ href: "/dashboard/admin", labelKey: "admin" }] });
    }
  }

  return sections
    .map((s) => ({ ...s, items: s.items.filter((i) => !HIDDEN_NAV.has(i.href)) }))
    .filter((s) => s.items.length > 0);
}
