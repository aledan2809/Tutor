import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
  const isStudent = session.user.enrollments?.some((e) =>
    e.roles.includes("STUDENT" as never)
  );

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
  const hasFamilyPlan =
    isPaidStatus(sub?.subscriptionStatus) && !!fam && (fam.maxChildren > 0 || fam.maxParents > 0);

  const isWatcher = session.user.enrollments?.some((e) =>
    e.roles.includes("WATCHER" as never)
  );
  const isInstructor = session.user.enrollments?.some(
    (e) => e.roles.includes("INSTRUCTOR" as never) || e.roles.includes("ADMIN" as never)
  );
  // A parent account that isn't itself a learner: the push banner must fire for them
  // (they never answer questions) and the setup checklist should prompt linking a child.
  const isWatcherOnly =
    (!!isWatcher || hasFamilyPlan) &&
    !isStudent &&
    !isInstructor &&
    !session.user.isSuperAdmin;
  const showLinkChild = (!!isWatcher || hasFamilyPlan) && !session.user.isSuperAdmin;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} hasFamilyPlan={hasFamilyPlan} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end border-b border-gray-800 px-4 sm:px-6">
          <SetupChecklist showLinkChild={showLinkChild} />
          <NotificationBell />
        </header>
        <main className={`flex-1 p-4 pt-14 sm:p-6 lg:pt-6 ${isStudent ? "pb-20 lg:pb-6" : ""}`}>
          <AppBanner isWatcherOnly={isWatcherOnly} />
          {children}
        </main>
      </div>
      {isStudent && <MobileBottomNav />}
      <GamificationToastContainer />
    </div>
  );
}
