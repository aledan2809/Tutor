import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InstructorNav } from "@/components/instructor/instructor-nav";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;
  const isInstructor =
    user.isSuperAdmin ||
    user.enrollments?.some(
      (e) => e.roles.includes("INSTRUCTOR") || e.roles.includes("ADMIN")
    );

  if (!isInstructor) {
    redirect("/dashboard");
  }

  return (
    <div>
      <InstructorNav />
      {children}
    </div>
  );
}
