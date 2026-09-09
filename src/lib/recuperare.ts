import { randomInt, createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Recuperarea accesului pentru cineva care n-are email.
 *
 * Un factor poștal nu are email de serviciu, deci calea clasică — „îți trimitem
 * un link pe email" — nu-l ajută cu nimic. El are un singur lucru sigur: telefonul
 * de pe lista angajatorului.
 *
 * De aceea omul se poate identifica prin ORICE dintre: numărul de telefon, numele
 * de utilizator, sau marca. Toate trei sunt unice și toate trei le știe pe de rost.
 *
 * Ce NU se poate ocoli: ceva trebuie să dovedească că e el. Într-o companie cu mii
 * de angajați, marca o știe și colegul de birou — dacă resetarea s-ar face doar
 * tastând-o, oricine ar putea intra pe contul altuia și, mai rău, ar putea parcurge
 * cursul în locul lui. Dovada e codul primit pe telefonul lui.
 */

/** Codul trăiește zece minute. Cât să apuci să-l tastezi, nu cât să fie furat. */
export const DURATA_COD_MS = 10 * 60 * 1000;
/** Câte încercări greșite până când codul moare. */
export const INCERCARI_MAXIME = 5;

export function codNou(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Codul se ține hașurat: o citire a bazei nu trebuie să dea acces la conturi. */
export function hashCod(cod: string): string {
  return createHash("sha256").update(cod).digest("hex");
}

export function codePotrivit(cod: string, hash: string): boolean {
  const a = Buffer.from(hashCod(cod), "hex");
  const b = Buffer.from(hash, "hex");
  // Comparare în timp constant: altfel durata răspunsului spune cât din cod e bun.
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Aceeași normalizare ca la trimiterea invitației, ca numerele să se potrivească. */
export function normalizeazaTelefon(intrare: string): string {
  const cifre = intrare.replace(/\D/g, "");
  if (!cifre) return "";
  return cifre.startsWith("0") ? `40${cifre.slice(1)}` : cifre;
}

export type GasitPentruRecuperare = {
  userId: string;
  telefon: string;
  prenume: string | null;
};

/**
 * Cine e omul, după orice ar fi tastat. Întoarce `null` fără să spună de ce:
 * un răspuns diferit pentru „nu există" ar transforma ecranul într-un instrument
 * de aflat ce mărci sunt reale.
 */
export async function gasestePentruRecuperare(
  intrare: string
): Promise<GasitPentruRecuperare | null> {
  const text = intrare.trim();
  if (!text) return null;

  // 1. Nume de utilizator — singurul care poate să nu aibă destinatar în spate.
  const dupaUsername = await prisma.user.findUnique({
    where: { username: text.toLowerCase() },
    select: { id: true, recipient: { select: { phone: true, firstName: true } } },
  });
  if (dupaUsername?.recipient?.phone) {
    return {
      userId: dupaUsername.id,
      telefon: dupaUsername.recipient.phone,
      prenume: dupaUsername.recipient.firstName,
    };
  }

  // 2. Telefon sau marcă — amândouă trec prin lista angajatorului.
  const telefon = normalizeazaTelefon(text);
  const destinatar = await prisma.recipient.findFirst({
    where: {
      userId: { not: null },
      OR: [
        ...(telefon.length >= 10 ? [{ phone: telefon }] : []),
        { badgeNo: text },
      ],
    },
    select: { userId: true, phone: true, firstName: true },
  });
  if (destinatar?.userId) {
    return { userId: destinatar.userId, telefon: destinatar.phone, prenume: destinatar.firstName };
  }

  return null;
}
