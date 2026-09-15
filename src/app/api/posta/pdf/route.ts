import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { LOCALES_PDF, obtinePdfPosta, type LocalePdf } from "@/lib/posta-pdf";

/**
 * GET /api/posta/pdf?locale=ro|en — prezentarea `/posta` ca fișier de trimis mai departe.
 *
 * Toată logica (Chromium, cache pe disc, servire imediată a unei versiuni mai vechi cu
 * regenerare în fundal) stă în `@/lib/posta-pdf`; aici doar se traduce în HTTP. Antetul
 * `X-Posta-PDF` spune de unde a venit fișierul — util când cineva întreabă „de ce e vechi?".
 */
async function _GET(req: Request) {
  const asked = new URL(req.url).searchParams.get("locale");
  const locale: LocalePdf = (LOCALES_PDF as readonly string[]).includes(asked ?? "")
    ? (asked as LocalePdf)
    : "ro";

  let pdf: Buffer;
  let sursa: string;
  try {
    ({ pdf, sursa } = await obtinePdfPosta(locale));
  } catch (err) {
    console.error("[posta/pdf] generare eșuată:", err);
    return NextResponse.json(
      { error: "PDF_GENERATION_FAILED", message: "Prezentarea nu a putut fi generată acum." },
      { status: 503 }
    );
  }

  const nume = locale === "en" ? "eTutor-Posta-Romana-EN.pdf" : "eTutor-Posta-Romana.pdf";
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nume}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "public, max-age=600",
      "X-Posta-PDF": sursa,
    },
  });
}

export const GET = withErrorHandler(_GET);
