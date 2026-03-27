import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GroupForm } from "@/components/instructor/group-form";

export default async function NewGroupPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const instructorDomainIds = session.user.enrollments
    .filter((e) => e.roles.includes("INSTRUCTOR") || e.roles.includes("ADMIN"))
    .map((e) => e.domainId);

  const [domains, students] = await Promise.all([
    prisma.domain.findMany({
      where: { id: { in: instructorDomainIds }, isActive: true },
      select: { id: true, name: true, slug: true },
    }),
    prisma.enrollment.findMany({
      where: {
        domainId: { in: instructorDomainIds },
        roles: { hasSome: ["STUDENT"] },
        isActive: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      distinct: ["userId"],
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Create Group</h1>
      <GroupForm
        domains={domains}
        students={students.map((s) => s.user)}
      />
    </div>
  );
}
