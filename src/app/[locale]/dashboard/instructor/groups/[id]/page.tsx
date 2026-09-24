import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GroupForm } from "@/components/instructor/group-form";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      domain: { select: { id: true, name: true, slug: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!group) redirect("/dashboard/instructor/groups");

  const instructorDomainIds = session.user.enrollments
    .filter((e) => e.roles.includes("INSTRUCTOR") || e.roles.includes("ADMIN"))
    .map((e) => e.domainId);

  // Access guard — a group is open only to a teacher/admin of its subject, or a superadmin. Not to
  // its creator as such: a group shows its members, and someone who stopped teaching the subject
  // must not keep reading them. Without a guard, any instructor could open any group by its id.
  const canManage = session.user.isSuperAdmin || instructorDomainIds.includes(group.domainId);
  if (!canManage) redirect("/dashboard/instructor/groups");

  const [domains, students] = await Promise.all([
    prisma.domain.findMany({
      where: { id: { in: instructorDomainIds }, isActive: true },
      select: { id: true, name: true, slug: true },
    }),
    prisma.enrollment.findMany({
      where: {
        domainId: group.domainId,
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
      <h1 className="mb-6 text-2xl font-bold text-white">{group.name}</h1>
      <GroupForm
        domains={domains}
        students={students.map((s) => s.user)}
        initialData={{
          id: group.id,
          name: group.name,
          description: group.description,
          domainId: group.domainId,
          members: group.members,
        }}
      />
    </div>
  );
}
