import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end border-b border-gray-800 px-4 sm:px-6">
          <SetupChecklist />
          <NotificationBell />
        </header>
        <main className={`flex-1 p-4 pt-14 sm:p-6 lg:pt-6 ${isStudent ? "pb-20 lg:pb-6" : ""}`}>
          <AppBanner />
          {children}
        </main>
      </div>
      {isStudent && <MobileBottomNav />}
      <GamificationToastContainer />
    </div>
  );
}
