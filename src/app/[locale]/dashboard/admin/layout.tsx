import type { Metadata } from "next";
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
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const isAdmin =
    session.user.isSuperAdmin ||
    session.user.enrollments?.some((e) => e.roles.includes("ADMIN" as never));

  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
