import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Public route — creator-program recruitment waitlist (lead capture, no auth).
// Accepts multipart/form-data so an optional CV file can be uploaded.
const schema = z.object({
  name: z.string().min(2, "Numele este obligatoriu").max(120),
  email: z.string().email("Email invalid").max(160),
  track: z.string().min(2, "Alege ce pregătire predai").max(120),
  subject: z.string().min(2, "Alege materia").max(120),
  experience: z.string().max(2000).optional(),
  locale: z.string().max(5).optional(),
});

const CV_DIR = process.env.CV_UPLOAD_DIR || "/var/www/tutor-uploads/cv";
const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx"]);

async function _POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    track: formData.get("track"),
    subject: formData.get("subject"),
    experience: formData.get("experience") || undefined,
    locale: formData.get("locale") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Date invalide", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, email, track, subject, experience, locale } = parsed.data;
  const needsTaxHelp = formData.get("needsTaxHelp") === "true";

  // Optional CV file.
  let cvPath: string | null = null;
  const cv = formData.get("cv");
  if (cv && typeof cv === "object" && "arrayBuffer" in cv) {
    const file = cv as File;
    if (file.size > 0) {
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        return NextResponse.json({ error: "CV-ul trebuie să fie PDF, DOC sau DOCX" }, { status: 400 });
      }
      if (file.size > MAX_CV_BYTES) {
        return NextResponse.json({ error: "CV-ul depășește 5 MB" }, { status: 400 });
      }
      try {
        await mkdir(CV_DIR, { recursive: true });
        const fname = `${randomUUID()}${ext}`;
        await writeFile(path.join(CV_DIR, fname), Buffer.from(await file.arrayBuffer()));
        cvPath = path.join(CV_DIR, fname);
      } catch (e) {
        console.error("[creatori-waitlist] CV save failed:", e);
        // Don't lose the lead over a CV write failure — continue without the file.
      }
    }
  }

  await prisma.creatorWaitlist.upsert({
    where: { email },
    update: { name, track, subject, experience: experience ?? null, locale: locale ?? "ro", needsTaxHelp, ...(cvPath ? { cvPath } : {}) },
    create: { name, email, track, subject, experience: experience ?? null, locale: locale ?? "ro", needsTaxHelp, cvPath },
  });

  return NextResponse.json(
    { success: true, message: "Te-ai înscris pe lista creatorilor. Te contactăm cât putem de repede." },
    { status: 201 }
  );
}

export const POST = withErrorHandler(_POST);
