import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WatcherNav } from "@/components/watcher/watcher-nav";
import { getParentChildIds } from "@/lib/guardian";

export const metadata: Metadata = {
  title: "Watcher",
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

  // A parent whose child has no subject yet follows nothing, but comes here to give the child one.
  if (!isWatcher && (await getParentChildIds(user.id)).length === 0) {
    redirect("/dashboard");
  }

  return (
    <div>
      <WatcherNav />
      {children}
    </div>
  );
}
