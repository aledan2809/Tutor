import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreatoriAdmin, type CreatorEntry } from "./creatori-client";

export const metadata = { title: "Creatori — waitlist | Admin" };

export default async function AdminCreatoriPage() {
  const session = await auth();
  // SuperAdmin-only — the waitlist holds personal data + CVs.
  if (!session?.user?.isSuperAdmin) redirect("/dashboard/admin");

  const rows = await prisma.creatorWaitlist.findMany({
    orderBy: { createdAt: "desc" },
  });

  const entries: CreatorEntry[] = rows.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    track: e.track,
    subject: e.subject,
    experience: e.experience,
    needsTaxHelp: e.needsTaxHelp,
    cvPath: e.cvPath,
    createdAt: e.createdAt.toISOString(),
  }));

  return <CreatoriAdmin entries={entries} />;
}
