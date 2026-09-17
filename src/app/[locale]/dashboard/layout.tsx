import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { loadAccess, loadPauseStartsAt, loadSeatHolder } from "@/lib/access-server";
import { teaserOffer, teaserStats } from "@/lib/access-teaser";
import { PausedLearnerScreen, PausedParentScreen, TrialBanner } from "@/components/access/access-screens";
import { PauseGate, RefreshAt } from "@/components/access/pause-gate";
import { prisma } from "@/lib/prisma";
import { isPaidStatus } from "@/lib/plan-channels";
import { resolveFamilyPlanFromRecord } from "@/lib/family";
import { Sidebar } from "@/components/sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GamificationToastContainer } from "@/components/gamification/gamification-toast";
import { AppBanner } from "@/components/app-banner";
import { SetupChecklist } from "@/components/setup-checklist";

export const metadata: Metadata = {
  title: "Dashboard - Tutor",
  description:
    "Your personalized learning dashboard. Track progress, practice sessions, and manage your adaptive learning journey.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Bottom tab bar is for the learners (kids) — parents/instructors keep the menu.
  // An explicit PARENT/TUTOR account is not a learner even if a legacy STUDENT
  // enrollment is still attached (registering with a subject always granted one).
  const hasStudentEnrollment = session.user.enrollments?.some((e) =>
    e.roles.includes("STUDENT" as never)
  );
  const isStudent =
    session.user.accountRole === "STUDENT" ||
    (session.user.accountRole == null && hasStudentEnrollment);

  // A paying parent unlocks the family section from their subscription plan, even
  // before any WATCHER enrollment exists (buying a Family/Trio plan grants seats,
  // not a role) — so the "Familia mea" nav follows the plan, not just the role.
  const sub = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: {
        select: { name: true, familyPlanKey: true, maxParents: true, maxChildren: true, maxTutors: true },
      },
    },
  });
  const fam = resolveFamilyPlanFromRecord(sub?.subscriptionPlan);
  // A renewal Stripe is still retrying keeps the menu: the parent must reach the family, not lose it.
  const hasFamilyPlan =
    (isPaidStatus(sub?.subscriptionStatus) || sub?.subscriptionStatus === "past_due") &&
    !!fam &&
    (fam.maxChildren > 0 || fam.maxParents > 0);

  const isWatcher = session.user.enrollments?.some((e) =>
    e.roles.includes("WATCHER" as never)
  );
  const isInstructor = session.user.enrollments?.some(
    (e) => e.roles.includes("INSTRUCTOR" as never) || e.roles.includes("ADMIN" as never)
  );
  // A parent account that isn't itself a learner: the push banner must fire for them
  // (they never answer questions) and the setup checklist should prompt linking a child.
  const isParentAccount = session.user.accountRole === "PARENT";
  const isWatcherOnly =
    (!!isWatcher || hasFamilyPlan || isParentAccount) &&
    !isStudent &&
    !isInstructor &&
    !session.user.isSuperAdmin;
  // A parent who registered as one has no child linked yet — that is exactly who
  // the "add your child" step is for.
  const showLinkChild =
    (!!isWatcher || hasFamilyPlan || isParentAccount) && !session.user.isSuperAdmin;

  // The 7-day trial and the pause (access.ts, decisions of 16.09.2026).
  const locale = (await getLocale()) === "en" ? "en" : "ro";
  const access = await loadAccess(session.user.id);
  const parentLinks = await prisma.guardian.findMany({
    where: { childId: session.user.id, status: "active", relation: "PARENT" },
    select: { parent: { select: { name: true } } },
    take: 2,
  });
  // A parent in the free week gets the family menu like a paying one.
  const familyNav = hasFamilyPlan || (isParentAccount && access?.kind === "trial");
  const bannerAudience: "parent" | "self" | null =
    access?.kind !== "trial" ? null : isWatcherOnly || isParentAccount ? "parent" : parentLinks.length === 0 ? "self" : null;
  // A parent whose children another parent's plan already covers, without a seat for them (Family is
  // for one parent): told who has the plan and which plan takes them too — never sold a second Family.
  const trialHolder = bannerAudience === "parent" ? await loadSeatHolder(session.user.id) : null;

  // Which pause screen this account gets is decided by who it is, not by the page: a child only
  // ever sees the learner screen, without an offer (UCPD Annex I point 28); a parent sees the family
  // screen; a learner who pays for themselves sees theirs. PauseGate picks the pages it covers.
  let pausedScreen: React.ReactNode = null;
  if (access?.kind === "paused") {
    const links =
      access.payer === "self"
        ? await prisma.guardian.findMany({
            where: { parentId: session.user.id, status: "active", relation: "PARENT" },
            select: { child: { select: { id: true, name: true } } },
          })
        : [];
    // An account registered as a pupil is never shown the family offer, even with a child linked.
    const asParent =
      access.payer === "self" &&
      session.user.accountRole !== "STUDENT" &&
      (isWatcherOnly || isParentAccount || links.length > 0);
    if (asParent) {
      const week = { since: new Date(access.since.getTime() - 7 * 24 * 60 * 60 * 1000), until: access.since };
      const [kids, holder] = await Promise.all([
        Promise.all(links.map(async (l) => ({ id: l.child.id, name: l.child.name, stats: await teaserStats(l.child.id, week) }))),
        loadSeatHolder(session.user.id),
      ]);
      pausedScreen = (
        <PausedParentScreen
          locale={locale}
          kids={kids}
          holder={holder}
          offer={holder ? null : await teaserOffer(session.user.id, "FAMILY")}
        />
      );
    } else {
      const [stats, offer] = await Promise.all([
        teaserStats(session.user.id),
        access.payer === "self" ? teaserOffer(session.user.id, "ELEV") : Promise.resolve(null),
      ]);
      pausedScreen = (
        <PausedLearnerScreen
          locale={locale}
          name={session.user.name ?? null}
          stats={stats}
          payer={access.payer}
          parentName={parentLinks[0]?.parent.name ?? null}
          offer={offer}
        />
      );
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} hasFamilyPlan={familyNav} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end border-b border-gray-800 px-4 sm:px-6">
          <SetupChecklist showLinkChild={showLinkChild} />
          <NotificationBell />
        </header>
        <main className={`flex-1 p-4 pt-14 sm:p-6 lg:pt-6 ${isStudent ? "pb-20 lg:pb-6" : ""}`}>
          <AppBanner isWatcherOnly={isWatcherOnly} />
          {access?.kind === "trial" && bannerAudience && (
            <TrialBanner
              locale={locale}
              daysLeft={access.daysLeft}
              audience={bannerAudience}
              pauseOn={(await loadPauseStartsAt()) !== null}
              holder={trialHolder}
            />
          )}
          <RefreshAt at={access?.kind === "trial" ? access.endsAt.toISOString() : null} />
          <PauseGate screen={pausedScreen}>{children}</PauseGate>
        </main>
      </div>
      {isStudent && <MobileBottomNav />}
      <GamificationToastContainer />
    </div>
  );
}
