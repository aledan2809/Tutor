import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminNav } from "@/components/admin/superadmin-nav";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  if (!session.user.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-white">SuperAdmin Panel</h1>
        <SuperAdminNav />
      </div>
      {children}
    </div>
  );
}
