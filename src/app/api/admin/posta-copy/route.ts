/**
 * Textele paginii `/posta`, citite și salvate din panou.
 *
 * Doar superadmin: pagina e materialul de vânzare care ajunge la conducerea unui
 * client instituțional, nu conținut de curs pe care îl poate atinge orice formator.
 *
 * Se salvează DOAR diferențele față de textul din cod (vezi `imbinaCopy`). Un câmp
 * golit dispare din rândul salvat, deci se întoarce singur la original — nu există
 * stare din care pagina să rămână cu o gaură în ea.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin-auth";
import { withErrorHandler } from "@/lib/api-handler";
import { CHEIE_POSTA, RO, imbinaCopy, normalizeazaLista } from "@/lib/posta-copy";
import { invalideazaPdfPosta } from "@/lib/posta-pdf-cache";

async function _GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const rand = await prisma.pageCopy.findUnique({
    where: { key: CHEIE_POSTA },
    select: { data: true, updatedAt: true, updatedBy: true },
  });

  return NextResponse.json({
    salvat: rand?.data ?? {},
    actualizatLa: rand?.updatedAt ?? null,
    actualizatDe: rand?.updatedBy ?? null,
  });
}

/**
 * Curăță ce vine din formular înainte de scriere.
 *
 * Păstrăm doar cheile pe care codul le cunoaște, cu tipul pe care îl are originalul.
 * Motivul nu e teoretic: rândul ăsta ajunge direct în randarea unei pagini publice,
 * iar o cheie străină sau un tip nepotrivit ar trece prin `imbinaCopy` fără să fie
 * folosită, dar ar rămâne în bază la nesfârșit, îngreunând orice citire viitoare.
 *
 * Șirurile goale nu se salvează deloc: absența lor ESTE mecanismul de revenire la
 * original.
 */
function curata(brut: unknown): Record<string, unknown> {
  if (!brut || typeof brut !== "object" || Array.isArray(brut)) return {};
  const intrare = brut as Record<string, unknown>;
  const iesire: Record<string, unknown> = {};

  for (const [cheie, implicit] of Object.entries(RO as unknown as Record<string, unknown>)) {
    if (!(cheie in intrare)) continue;
    const v = intrare[cheie];

    if (typeof implicit === "string") {
      if (typeof v === "string" && v.trim() !== "" && v !== implicit) iesire[cheie] = v;
    } else if (Array.isArray(implicit)) {
      // Se normalizează ÎNAINTE de comparație: altfel un element trunchiat ar fi
      // arătat „diferit de original" și s-ar fi salvat exact în forma care rupe
      // pagina. Așa, ce ajunge în bază are întotdeauna toate câmpurile.
      if (Array.isArray(v)) {
        const curat = normalizeazaLista(implicit, v);
        if (JSON.stringify(curat) !== JSON.stringify(implicit)) iesire[cheie] = curat;
      }
    } else if (implicit && typeof implicit === "object") {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const sub: Record<string, unknown> = {};
        for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
          const orig = (implicit as Record<string, unknown>)[k];
          if (typeof orig === "string" && typeof val === "string" && val.trim() !== "" && val !== orig) {
            sub[k] = val;
          }
        }
        if (Object.keys(sub).length) iesire[cheie] = sub;
      }
    }
  }
  return iesire;
}

async function _PUT(req: Request) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  let brut: unknown;
  try {
    brut = await req.json();
  } catch {
    return NextResponse.json({ error: "Corp de cerere invalid" }, { status: 400 });
  }

  const data = curata((brut as { copy?: unknown })?.copy);

  // Probă de siguranță ÎNAINTE de scriere: dacă îmbinarea a ceea ce urmează să salvăm
  // n-ar produce un obiect cu toate cheile paginii, nu scriem nimic. E ieftină și
  // închide clasa întreagă de „am salvat ceva ce rupe pagina publică".
  const rezultat = imbinaCopy(RO, data);
  const lipsa = Object.keys(RO as unknown as Record<string, unknown>).filter(
    (k) => (rezultat as unknown as Record<string, unknown>)[k] === undefined
  );
  if (lipsa.length) {
    return NextResponse.json(
      { error: `Salvarea ar lăsa pagina fără: ${lipsa.join(", ")}` },
      { status: 422 }
    );
  }

  await prisma.pageCopy.upsert({
    where: { key: CHEIE_POSTA },
    create: { key: CHEIE_POSTA, data, updatedBy: session?.user?.email ?? null },
    update: { data, updatedBy: session?.user?.email ?? null },
  });

  // PDF-ul se randează DIN pagină și e ținut în cache 10 minute după vechime, nu după
  // conținut. Fără rândul ăsta, cine salvează și descarcă imediat primește documentul
  // de dinainte de modificare, în tăcere.
  const pdfAruncate = await invalideazaPdfPosta();

  return NextResponse.json({
    ok: true,
    campuriSchimbate: Object.keys(data).length,
    pdfRegenerat: pdfAruncate > 0,
  });
}

export const GET = withErrorHandler(_GET);
export const PUT = withErrorHandler(_PUT);
