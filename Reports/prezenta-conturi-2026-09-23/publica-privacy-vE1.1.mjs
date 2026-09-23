// Publică vE1.1 a politicii de confidențialitate Tutor în Legal Hub (NO-TOUCH, aprobat de Alex 23.09.2026).
// Rulare pe VPS2 din /var/www/legal:  node publica-privacy-vE1.1.mjs [--apply]
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import fs from "node:fs";

const DOC_ID = "cmtomg5sw000at6785ckfxw1j";   // tutor · PRIVACY · ro
const PREV_ID = "cmtomg5te000ct6787kpbtef1";  // vE1.0
const md = fs.readFileSync(new URL("./privacy-vE1.1-propus.md", import.meta.url), "utf8");
const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();
try {
  const doc = await prisma.legalDocument.findUnique({ where: { id: DOC_ID } });
  const prev = await prisma.documentVersion.findUnique({ where: { id: PREV_ID } });
  const all = await prisma.documentVersion.findMany({ where: { documentId: DOC_ID }, select: { version: true, publishedAt: true, effectiveFrom: true, effectiveUntil: true } });
  console.log("doc:", doc && { id: doc.id, type: doc.type, locale: doc.locale }, "\nversiuni:", all);
  if (!doc || !prev || prev.documentId !== DOC_ID) throw new Error("documentul/versiunea nu corespund");
  if (all.some(v => v.version === "vE1.1")) throw new Error("vE1.1 există deja");
  if (!apply) { console.log("DRY-RUN — nimic scris. Lungime nouă:", md.length); process.exit(0); }
  const now = new Date();
  const v = await prisma.$transaction(async tx => {
    const created = await tx.documentVersion.create({ data: {
      documentId: DOC_ID, version: "vE1.1", contentMarkdown: md,
      contentHash: crypto.createHash("sha256").update(md).digest("hex"),
      variables: prev.variables, publishedAt: now, effectiveFrom: now } });
    await tx.documentVersion.update({ where: { id: PREV_ID }, data: { effectiveUntil: now } });
    return created;
  });
  console.log("PUBLICAT:", v.id, v.version, v.effectiveFrom.toISOString());
} finally { await prisma.$disconnect(); }
