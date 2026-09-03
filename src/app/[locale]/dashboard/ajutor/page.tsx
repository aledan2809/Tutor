import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPaidStatus } from "@/lib/plan-channels";
import { resolveFamilyPlanFromRecord } from "@/lib/family";
import { resolveClientRole } from "@/lib/client-role";
import { helpContentFor, type HelpRole, type Locale } from "@/content/help";
import { HelpPage } from "@/components/help/help-page";

/**
 * „Cum funcționează", per role.
 *
 * There was no such page: no help route, no tour, no welcome email — the only
 * explanations lived scattered in tooltips, and the one plain-language manual that
 * existed was written into a report folder and never shipped. A parent invited into
 * a plan, or a tutor handed an account, had nowhere to read what the thing does.
 */
export default async function AjutorPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const locale = (await getLocale()) as Locale;

  const [sub, familyTutor] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: {
          select: {
            name: true,
            familyPlanKey: true,
            maxParents: true,
            maxChildren: true,
            maxTutors: true,
          },
        },
      },
    }),
    prisma.guardian.findFirst({
      where: { parentId: session.user.id, relation: "TUTOR", status: "active" },
      select: { id: true },
    }),
  ]);

  const fam = resolveFamilyPlanFromRecord(sub?.subscriptionPlan);
  const hasFamilyPlan =
    isPaidStatus(sub?.subscriptionStatus) && !!fam && (fam.maxChildren > 0 || fam.maxParents > 0);

  const role = resolveClientRole(session.user, {
    hasFamilyPlan,
    isFamilyTutor: !!familyTutor,
  });
  // An admin reads it as a student would; there is no separate admin story here.
  const defaultRole: HelpRole = role === "admin" ? "student" : role;

  const content = {
    student: helpContentFor("student", locale),
    parent: helpContentFor("parent", locale),
    meditator: helpContentFor("meditator", locale),
  };

  // A parent's Telegram card lives in their own settings page, not the student one.
  const telegramHref =
    defaultRole === "parent"
      ? "/dashboard/watcher/setari#telegram"
      : "/dashboard/settings/notifications#telegram";

  return <HelpPage content={content} defaultRole={defaultRole} telegramHref={telegramHref} />;
}
