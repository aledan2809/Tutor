/**
 * POST /api/posta/proceduri — clientul își încarcă procedurile, din pagina lui.
 *
 * Butonul final de pe `/posta` deschidea un `mailto:`. Userul a cerut încărcare directă,
 * și are dreptate: omul de la client are documentele pe calculator, iar un `mailto:` îl
 * scoate din pagină, îi deschide alt program și îl lasă să se descurce cu atașamentele —
 * exact în momentul în care tocmai s-a hotărât.
 *
 * Public, deliberat: destinatarul e un decident care a primit linkul, nu are cont la noi
 * și nu vrem să-i cerem unul ca să ne trimită documente. Apărările sunt pe altceva:
 * extensii permise, plafon de mărime, număr maxim de fișiere, plafon pe adresă IP.
 *
 * Numele fișierului se GENEREAZĂ (`randomUUID`), nu se preia — deci o cale strecurată în
 * numele original n-are unde să ajungă. Numele trimis de om se păstrează doar ca text, în
 * baza de date, ca să știm ce ne-a dat.
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

const DIR = process.env.PROCEDURI_UPLOAD_DIR || "/var/www/tutor-uploads/proceduri";
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_FISIERE = 10;
const EXT_PERMISE = new Set([".pdf", ".doc", ".docx", ".odt", ".rtf", ".txt", ".zip", ".jpg", ".jpeg", ".png"]);

/**
 * Plafon simplu pe IP, în memoria procesului. Nu e apărare împotriva cuiva hotărât —
 * pentru asta ar trebui altceva — dar oprește o trimitere repetată din greșeală și
 * costă zero. Se pierde la repornire, ceea ce e acceptabil pentru ce apără.
 */
const trimiteriRecente = new Map<string, number[]>();
const FEREASTRA_MS = 60 * 60 * 1000;
const MAX_PE_ORA = 5;

function preaMulte(ip: string): boolean {
  const acum = Date.now();
  const anterioare = (trimiteriRecente.get(ip) ?? []).filter((t) => acum - t < FEREASTRA_MS);
  if (anterioare.length >= MAX_PE_ORA) {
    trimiteriRecente.set(ip, anterioare);
    return true;
  }
  anterioare.push(acum);
  trimiteriRecente.set(ip, anterioare);
  return false;
}

const schema = z.object({
  name: z.string().trim().min(2, "Spuneți-ne cum vă cheamă").max(120),
  email: z.string().trim().email("Adresa de e-mail nu pare corectă").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  note: z.string().trim().max(4000).optional().or(z.literal("")),
});

async function _POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "necunoscut";
  if (preaMulte(ip)) {
    return NextResponse.json(
      { error: "Ați trimis deja de câteva ori în ultima oră. Scrieți-ne pe e-mail dacă e urgent." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formular invalid" }, { status: 400 });
  }

  const parsed = schema.safeParse({
    name: form.get("name") ?? "",
    email: form.get("email") ?? "",
    phone: form.get("phone") ?? "",
    role: form.get("role") ?? "",
    note: form.get("note") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Date incomplete" },
      { status: 400 }
    );
  }

  const brute = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (brute.length === 0) {
    return NextResponse.json({ error: "Alegeți cel puțin un fișier" }, { status: 400 });
  }
  if (brute.length > MAX_FISIERE) {
    return NextResponse.json(
      { error: `Cel mult ${MAX_FISIERE} fișiere odată. Trimiteți restul într-o a doua tranșă.` },
      { status: 400 }
    );
  }

  // Se validează TOATE înainte de a scrie vreunul: altfel al treilea fișier respins ar
  // lăsa două pe disc, fără rând în baza de date care să spună de ce sunt acolo.
  for (const f of brute) {
    const ext = path.extname(f.name).toLowerCase();
    if (!EXT_PERMISE.has(ext)) {
      return NextResponse.json(
        { error: `„${f.name}" nu e un tip acceptat. Trimiteți PDF, Word, text, imagini sau o arhivă ZIP.` },
        { status: 400 }
      );
    }
    if (f.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `„${f.name}" depășește 15 MB. Trimiteți-l separat sau comprimat.` },
        { status: 400 }
      );
    }
  }

  await mkdir(DIR, { recursive: true });
  const scrise: { path: string; originalName: string; size: number }[] = [];
  for (const f of brute) {
    const ext = path.extname(f.name).toLowerCase();
    const nume = `${randomUUID()}${ext}`;
    await writeFile(path.join(DIR, nume), Buffer.from(await f.arrayBuffer()));
    scrise.push({ path: nume, originalName: f.name, size: f.size });
  }

  const rand = await prisma.procedureUpload.create({
    data: {
      appSlug: "posta",
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      role: parsed.data.role || null,
      note: parsed.data.note || null,
      files: scrise,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: rand.id, fisiere: scrise.length });
}

export const POST = withErrorHandler(_POST);
