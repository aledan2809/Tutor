import { randomInt, randomUUID, createHmac, timingSafeEqual } from "node:crypto";
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
/** Câte coduri noi se pot cere pentru același cont într-o oră. */
export const CODURI_PE_ORA = 5;

/**
 * Cheile din tabela de tokenuri. Codul viu, încercările greșite pe el și codurile
 * trimise în ultima oră stau separat, ca să poată fi numărate.
 */
export const cheieCod = (userId: string) => `otp:${userId}`;
const cheieGresit = (userId: string) => `otp-fail:${userId}`;
const cheieTrimis = (userId: string) => `otp-sent:${userId}`;

/**
 * Încercările pe același cont se fac pe rând. Dacă altă încercare ține deja contul, cererea asta
 * se refuză pe loc în loc să aștepte: o rafală pe un cont ar ocupa altfel toate conexiunile la
 * bază cât stă la coadă.
 */
async function ocupaContul(
  tx: { $queryRaw: typeof prisma.$queryRaw },
  userId: string
): Promise<boolean> {
  const rows = await tx.$queryRaw<{ ok: boolean }[]>`SELECT pg_try_advisory_xact_lock(hashtext(${cheieCod(userId)})::bigint) AS ok`;
  return rows[0]?.ok === true;
}

/**
 * Poate pleca un cod nou pentru contul ăsta? Fără limită, cineva care știe marca
 * altuia ar putea cere coduri la nesfârșit și, cu câte cinci încercări pe fiecare,
 * ar ghici până la urmă. Dacă da, notează trimiterea și șterge contorul de
 * greșeli: fiecare cod nou pornește cu cinci încercări.
 */
export async function potTrimiteCod(userId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    if (!(await ocupaContul(tx, userId))) return false;
    const acum = new Date();
    await tx.verificationToken.deleteMany({ where: { identifier: cheieTrimis(userId), expires: { lt: acum } } });
    const trimise = await tx.verificationToken.count({ where: { identifier: cheieTrimis(userId) } });
    if (trimise >= CODURI_PE_ORA) {
      console.warn(`[recuperare] limita de ${CODURI_PE_ORA} coduri pe oră atinsă pentru contul ${userId}`);
      return false;
    }
    await tx.verificationToken.create({
      data: { identifier: cheieTrimis(userId), token: `sent:${randomUUID()}`, expires: new Date(acum.getTime() + 60 * 60 * 1000) },
    });
    await tx.verificationToken.deleteMany({ where: { identifier: cheieGresit(userId) } });
    return true;
  });
}

/**
 * Verifică codul și, dacă e bun, rulează `laSucces` în aceeași tranzacție (schimbarea
 * parolei). Încercările pe același cont se fac pe rând (lacăt pe cont), altfel o
 * rafală de cereri simultane ar citi toate „0 greșeli" și ar trece de limită. Cea care
 * găsește contul ocupat e refuzată ca un cod greșit, fără să conteze ca greșeală.
 * La a cincea greșeală codul se șterge: de acolo, orice încercare e „cere altul".
 */
export async function consumaCodul(
  userId: string,
  cod: string,
  laSucces: (tx: Pick<typeof prisma, "user">) => Promise<void>
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    if (!(await ocupaContul(tx, userId))) return false;
    const salvat = await tx.verificationToken.findFirst({
      where: { identifier: cheieCod(userId) },
      orderBy: { expires: "desc" },
    });
    if (!salvat || salvat.expires < new Date()) return false;
    const toate = { identifier: { in: [cheieCod(userId), cheieGresit(userId)] } };
    if (codePotrivit(userId, cod, salvat.token)) {
      await laSucces(tx);
      await tx.verificationToken.deleteMany({ where: toate });
      return true;
    }
    const gresite = (await tx.verificationToken.count({ where: { identifier: cheieGresit(userId) } })) + 1;
    if (gresite >= INCERCARI_MAXIME) {
      await tx.verificationToken.deleteMany({ where: toate });
    } else {
      await tx.verificationToken.create({
        data: { identifier: cheieGresit(userId), token: `fail:${randomUUID()}`, expires: salvat.expires },
      });
    }
    return false;
  });
}

export function codNou(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Codul se ține sub o cheie secretă a serverului, legat de cont: o citire a bazei nu trebuie să dea
 * acces la conturi. Un simplu sha256 nu ajungea — un milion de coduri posibile se încearcă pe loc.
 * Cu contul în cheie, doi oameni cu același cod nu se mai ciocnesc pe coloana unică.
 */
export function hashCod(userId: string, cod: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET lipsește — codul de recuperare nu poate fi păstrat în siguranță.");
  return createHmac("sha256", secret).update(`${userId}:${cod}`).digest("hex");
}

export function codePotrivit(userId: string, cod: string, hash: string): boolean {
  const a = Buffer.from(hashCod(userId, cod), "hex");
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
