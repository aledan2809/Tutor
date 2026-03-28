import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WatcherNav } from "@/components/watcher/watcher-nav";

export const metadata: Metadata = {
  title: "Watcher - Tutor",
  description: "Monitor student activity and learning progress in real-time.",
};

export default async function WatcherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;
  const isWatcher =
    user.isSuperAdmin ||
    user.enrollments?.some(
      (e) =>
        e.roles.includes("WATCHER") ||
        e.roles.includes("INSTRUCTOR") ||
        e.roles.includes("ADMIN")
    );

  if (!isWatcher) {
    redirect("/dashboard");
  }

  return (
    <div>
      <WatcherNav />
      {children}
    </div>
  );
}
