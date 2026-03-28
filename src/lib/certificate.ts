import { prisma } from "@/lib/prisma";
import { mkdir } from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";

interface CertificateData {
  sessionId: string;
  userId: string;
  domainId: string;
  userName: string;
  domainName: string;
  score: number;
  passingScore: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: Date;
  formatName: string;
}

function generateVerificationCode(sessionId: string): string {
  const hash = crypto.createHash("sha256").update(sessionId + "tutor-cert").digest("hex");
  return hash.slice(0, 12).toUpperCase();
}

export async function generateCertificate(data: CertificateData): Promise<string> {
  const dirPath = path.join(
    process.cwd(),
    "public",
    "certificates",
    data.userId,
    data.domainId
  );
  await mkdir(dirPath, { recursive: true });

  const fileName = `${data.sessionId}.pdf`;
  const filePath = path.join(dirPath, fileName);
  const publicPath = `/certificates/${data.userId}/${data.domainId}/${fileName}`;

  const verificationCode = generateVerificationCode(data.sessionId);
  await buildCertificatePdf(data, verificationCode, filePath);

  await prisma.examCertificate.create({
    data: {
      sessionId: data.sessionId,
      userId: data.userId,
      domainId: data.domainId,
      score: data.score,
      filePath: publicPath,
    },
  });

  return publicPath;
}

function buildCertificatePdf(
  data: CertificateData,
  verificationCode: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [842, 595], // A4 landscape
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
    });

    const stream = createWriteStream(outputPath);
    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.pipe(stream);

    const width = 842;
    const centerX = width / 2;

    const date = data.completedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ─── Outer border ───
    doc.lineWidth(3).strokeColor("#1a365d")
      .rect(15, 15, width - 30, 595 - 30).stroke();

    // ─── Inner border ───
    doc.lineWidth(0.5).strokeColor("#cbd5e0")
      .rect(22, 22, width - 44, 595 - 44).stroke();

    // ─── Dashed inner border ───
    doc.lineWidth(0.5).strokeColor("#e2e8f0")
      .dash(4, { space: 3 })
      .rect(28, 28, width - 56, 595 - 56).stroke()
      .undash();

    // ─── Header: Platform name ───
    doc.font("Helvetica").fontSize(10).fillColor("#4a5568");
    doc.text("TUTOR LEARNING PLATFORM", 0, 55, {
      align: "center",
      width,
      characterSpacing: 4,
    });

    // ─── Title ───
    doc.font("Helvetica-Bold").fontSize(32).fillColor("#1a365d");
    doc.text("CERTIFICATE OF ACHIEVEMENT", 0, 80, {
      align: "center",
      width,
      characterSpacing: 2,
    });

    // ─── Domain name ───
    doc.font("Helvetica").fontSize(14).fillColor("#718096");
    doc.text(data.domainName.toUpperCase(), 0, 120, {
      align: "center",
      width,
      characterSpacing: 2,
    });

    // ─── Horizontal rule ───
    doc.strokeColor("#e2e8f0").lineWidth(0.5)
      .moveTo(centerX - 150, 148).lineTo(centerX + 150, 148).stroke();

    // ─── "This certificate is presented to" ───
    doc.font("Helvetica").fontSize(11).fillColor("#718096");
    doc.text("THIS CERTIFICATE IS PRESENTED TO", 0, 168, {
      align: "center",
      width,
      characterSpacing: 2,
    });

    // ─── Student name ───
    doc.font("Helvetica-Bold").fontSize(28).fillColor("#2d3748");
    doc.text(data.userName, 0, 195, {
      align: "center",
      width,
    });

    // ─── Name underline ───
    const nameWidth = doc.widthOfString(data.userName);
    doc.strokeColor("#1a365d").lineWidth(1.5)
      .moveTo(centerX - nameWidth / 2 - 10, 228)
      .lineTo(centerX + nameWidth / 2 + 10, 228)
      .stroke();

    // ─── Description ───
    doc.font("Helvetica").fontSize(12).fillColor("#4a5568");
    const desc = `For successfully completing the ${data.formatName} examination with a score of ${data.score}%, answering ${data.correctAnswers} out of ${data.totalQuestions} questions correctly.`;
    doc.text(desc, 120, 250, {
      align: "center",
      width: width - 240,
      lineGap: 4,
    });

    // ─── Score badge ───
    const badgeText = `Score: ${data.score}%  (Passing: ${data.passingScore}%)`;
    const badgeWidth = 260;
    const badgeX = centerX - badgeWidth / 2;
    const badgeY = 310;
    doc.roundedRect(badgeX, badgeY, badgeWidth, 36, 4)
      .fill("#1a365d");
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#ffffff");
    doc.text(badgeText, badgeX, badgeY + 10, {
      align: "center",
      width: badgeWidth,
    });

    // ─── Footer separator ───
    doc.strokeColor("#e2e8f0").lineWidth(0.5)
      .moveTo(50, 450).lineTo(width - 50, 450).stroke();

    // ─── Footer: Date ───
    doc.font("Helvetica").fontSize(12).fillColor("#2d3748");
    doc.text(date, 60, 465, { align: "center", width: 200 });
    doc.font("Helvetica").fontSize(9).fillColor("#a0aec0");
    doc.text("DATE OF COMPLETION", 60, 482, {
      align: "center",
      width: 200,
      characterSpacing: 1,
    });

    // ─── Footer: Verification code ───
    // Box background
    const codeText = `CERT-${verificationCode}`;
    const codeBoxWidth = 180;
    const codeBoxX = centerX - codeBoxWidth / 2;
    doc.roundedRect(codeBoxX, 458, codeBoxWidth, 26, 3)
      .fillAndStroke("#f7fafc", "#e2e8f0");
    doc.font("Courier").fontSize(10).fillColor("#718096");
    doc.text(codeText, codeBoxX, 465, {
      align: "center",
      width: codeBoxWidth,
      characterSpacing: 1.5,
    });
    doc.font("Helvetica").fontSize(9).fillColor("#a0aec0");
    doc.text("VERIFICATION CODE", codeBoxX, 488, {
      align: "center",
      width: codeBoxWidth,
      characterSpacing: 1,
    });

    // ─── Footer: Issued by ───
    doc.font("Helvetica").fontSize(12).fillColor("#2d3748");
    doc.text("Tutor Platform", width - 260, 465, {
      align: "center",
      width: 200,
    });
    doc.font("Helvetica").fontSize(9).fillColor("#a0aec0");
    doc.text("ISSUED BY", width - 260, 482, {
      align: "center",
      width: 200,
      characterSpacing: 1,
    });

    // ─── Decorative corner elements ───
    const cornerSize = 20;
    doc.strokeColor("#1a365d").lineWidth(1.5);
    // Top-left
    doc.moveTo(35, 55).lineTo(35, 35).lineTo(55, 35).stroke();
    // Top-right
    doc.moveTo(width - 35 - cornerSize, 35).lineTo(width - 35, 35).lineTo(width - 35, 55).stroke();
    // Bottom-left
    doc.moveTo(35, 595 - 55).lineTo(35, 595 - 35).lineTo(55, 595 - 35).stroke();
    // Bottom-right
    doc.moveTo(width - 55, 595 - 35).lineTo(width - 35, 595 - 35).lineTo(width - 35, 595 - 55).stroke();

    doc.end();
  });
}
