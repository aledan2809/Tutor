import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

async function parsePDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

function extractQuestionsFromText(text: string): Array<{ content: string; correctAnswer: string }> {
  // Split by common question patterns (numbered questions)
  const blocks = text.split(/(?=\d+[\.\)]\s)/).filter((b) => b.trim().length > 20);

  return blocks.map((block) => {
    const lines = block.trim().split("\n");
    return {
      content: lines[0]?.replace(/^\d+[\.\)]\s*/, "").trim() || block.trim().substring(0, 200),
      correctAnswer: lines.slice(1).join("\n").trim() || "To be filled",
    };
  });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const domainId = formData.get("domainId") as string;
  const subject = formData.get("subject") as string;
  const topic = formData.get("topic") as string;
  const difficulty = parseInt((formData.get("difficulty") as string) || "3");

  if (!file || !domainId || !subject || !topic) {
    return NextResponse.json({ error: "Missing required fields: file, domainId, subject, topic" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();
  let questions: Array<{ content: string; correctAnswer: string; options?: string[] }> = [];

  try {
    if (fileName.endsWith(".pdf")) {
      const text = await parsePDF(buffer);
      questions = extractQuestionsFromText(text);
    } else if (fileName.endsWith(".docx")) {
      const text = await parseDOCX(buffer);
      questions = extractQuestionsFromText(text);
    } else if (fileName.endsWith(".csv")) {
      const text = buffer.toString("utf-8");
      const rows = parseCSV(text);
      questions = rows
        .filter((r) => r.content || r.question)
        .map((r) => ({
          content: r.content || r.question || "",
          correctAnswer: r.correctAnswer || r.answer || "",
          options: r.options ? r.options.split("|") : undefined,
        }));
    } else {
      return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, or CSV." }, { status: 400 });
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions could be extracted from the file." }, { status: 400 });
    }

    // Bulk create - manual content gets approved directly
    const created = await prisma.question.createMany({
      data: questions.map((q) => ({
        domainId,
        subject,
        topic,
        difficulty,
        type: q.options ? "MULTIPLE_CHOICE" as const : "OPEN" as const,
        content: q.content,
        options: q.options ? (q.options as string[]) : undefined,
        correctAnswer: q.correctAnswer,
        source: "MANUAL" as const,
        status: "APPROVED" as const,
        createdById: session!.user.id,
      })),
    });

    return NextResponse.json({ imported: created.count, total: questions.length });
  } catch (err) {
    console.error("Bulk import error:", err);
    return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
  }
}
