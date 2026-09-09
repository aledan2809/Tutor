import { prisma } from "@/lib/prisma";
import { GuestEnter } from "./guest-enter";
import { ActivateForm } from "./activate-form";

/**
 * /acces/<ceva> — capătul oricărui link de invitație.
 *
 * „Ceva" e una din două, iar diferența contează:
 *
 * - un **link personal** (token de destinatar): știm cine e omul, de pe lista
 *   clientului. Îi arătăm datele lui deja completate și îi cerem un singur lucru:
 *   cum vrea să intre — nume de utilizator și parolă. Nu-l punem să se prezinte:
 *   HR-ul clientului l-a prezentat deja, iar fiecare câmp pus în calea lui pierde
 *   oameni pe care tocmai vrem să-i instruim.
 *
 * - un **cod de materie** (comun, tipărit pe o hârtie sau dat pe loc): nu știm
 *   cine e, deci intră ca invitat, ca până acum.
 *
 * Se caută întâi tokenul personal: e nesecvențial și lung, deci nu se poate
 * confunda cu un cod de opt caractere.
 */
export const dynamic = "force-dynamic";

export default async function AccesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const recipient = await prisma.recipient.findUnique({
    where: { token: code },
    select: {
      id: true,
      token: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      badgeNo: true,
      phone: true,
      county: true,
      city: true,
      postOffice: true,
      userId: true,
      openedAt: true,
      domain: { select: { name: true, isActive: true } },
    },
  });

  if (recipient && recipient.domain.isActive) {
    // „A apăsat linkul" e prima treaptă din raportul managerului, iar momentul ei
    // e ACUM — nu când își termină contul. Se scrie o singură dată.
    if (!recipient.openedAt) {
      await prisma.recipient
        .update({ where: { id: recipient.id }, data: { openedAt: new Date() } })
        .catch(() => {});
    }

    return (
      <ActivateForm
        token={recipient.token}
        alreadyActivated={recipient.userId !== null}
        person={{
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          jobTitle: recipient.jobTitle,
          badgeNo: recipient.badgeNo,
          phone: recipient.phone,
          county: recipient.county,
          city: recipient.city,
          postOffice: recipient.postOffice,
          course: recipient.domain.name,
        }}
      />
    );
  }

  return <GuestEnter />;
}
