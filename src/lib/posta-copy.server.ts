/**
 * Citirea textelor editate din panou. Separat de `posta-copy.ts` fiindcă atinge
 * Prisma: fișierul acela e importat și de formularul din browser, iar un import de
 * bază de date acolo ar trage clientul Prisma în pachetul trimis utilizatorului.
 */
import { prisma } from "@/lib/prisma";
import { CHEIE_POSTA, EN, RO, imbinaCopy, type Copy } from "@/lib/posta-copy";

/**
 * Textele paginii pentru limba cerută.
 *
 * Engleza NU trece prin bază: userul a ales să editeze doar româna, iar clientul e
 * românesc. Pagina engleză rămâne cea din cod și nu se poate desincroniza tăcut de o
 * editare făcută pe română.
 *
 * Nu aruncă niciodată. Dacă baza de date e căzută sau rândul e stricat, pagina
 * publică se randează cu textul din cod — o pagină de prezentare nu are voie să
 * dispară fiindcă o interogare a eșuat.
 */
export async function resolvePostaCopy(locale: string): Promise<Copy> {
  if (locale === "en") return EN;
  try {
    const rand = await prisma.pageCopy.findUnique({
      where: { key: CHEIE_POSTA },
      select: { data: true },
    });
    return imbinaCopy(RO, rand?.data);
  } catch (e) {
    console.warn("[posta] nu am putut citi textele editate; folosesc originalul:", e);
    return RO;
  }
}
