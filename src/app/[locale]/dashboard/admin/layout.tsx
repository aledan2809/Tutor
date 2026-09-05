import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Admin - Tutor",
  description:
    "Manage domains, questions, users, and platform settings. Admin control panel for Tutor adaptive learning platform.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tAdmin = await getTranslations("admin");
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  // Two kinds of administrator reach this panel: the superadmin, and a merchant
  // admin who administers their own organization. The per-domain ADMIN enrollment
  // is deliberately NOT one of them any more: it used to open the door and then be
  // refused by almost everything inside, because 41 routes check isSuperAdmin.
  // Content scoping for instructors still runs on that role, inside the routes.
  const isAdmin =
    session.user.isSuperAdmin ||
    (session.user.isOrgAdmin === true && Boolean(session.user.organizationId));

  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-white">{tAdmin("panelTitle")}</h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
