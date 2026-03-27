import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

export async function generateCertificate(data: CertificateData): Promise<string> {
  const dirPath = path.join(
    process.cwd(),
    "public",
    "certificates",
    data.userId,
    data.domainId
  );
  await mkdir(dirPath, { recursive: true });

  const fileName = `${data.sessionId}.html`;
  const filePath = path.join(dirPath, fileName);
  const publicPath = `/certificates/${data.userId}/${data.domainId}/${fileName}`;

  const html = buildCertificateHtml(data);
  await writeFile(filePath, html, "utf-8");

  // Save record
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

function buildCertificateHtml(data: CertificateData): string {
  const date = data.completedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Certificate - ${escapeHtml(data.domainName)}</title>
<style>
@page { size: landscape; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Georgia', 'Times New Roman', serif;
  background: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}
.certificate {
  width: 1056px;
  height: 816px;
  background: white;
  position: relative;
  border: 3px solid #1a365d;
  padding: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
.certificate::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid #cbd5e0;
}
.header { text-align: center; }
.header h1 {
  font-size: 42px;
  color: #1a365d;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.header .subtitle {
  font-size: 16px;
  color: #718096;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.body { text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
.body .presented {
  font-size: 14px;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.body .name {
  font-size: 36px;
  color: #2d3748;
  border-bottom: 2px solid #1a365d;
  display: inline-block;
  padding-bottom: 8px;
  margin: 0 auto;
}
.body .description {
  font-size: 16px;
  color: #4a5568;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}
.score-badge {
  display: inline-block;
  background: #1a365d;
  color: white;
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 18px;
  font-family: 'Arial', sans-serif;
}
.footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}
.footer .col {
  text-align: center;
  min-width: 200px;
}
.footer .label {
  font-size: 12px;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.footer .value {
  font-size: 14px;
  color: #2d3748;
  margin-top: 4px;
}
@media print {
  body { background: white; padding: 0; }
  .certificate { border: none; }
}
</style>
</head>
<body>
<div class="certificate">
  <div class="header">
    <h1>Certificate of Achievement</h1>
    <div class="subtitle">${escapeHtml(data.domainName)}</div>
  </div>
  <div class="body">
    <div class="presented">This certificate is presented to</div>
    <div class="name">${escapeHtml(data.userName)}</div>
    <div class="description">
      For successfully completing the <strong>${escapeHtml(data.formatName)}</strong>
      examination with a score of <strong>${data.score}%</strong>,
      answering ${data.correctAnswers} out of ${data.totalQuestions} questions correctly.
    </div>
    <div class="score-badge">Score: ${data.score}% (Passing: ${data.passingScore}%)</div>
  </div>
  <div class="footer">
    <div class="col">
      <div class="value">${date}</div>
      <div class="label">Date of Completion</div>
    </div>
    <div class="col">
      <div class="value">${data.sessionId.slice(0, 12).toUpperCase()}</div>
      <div class="label">Certificate ID</div>
    </div>
    <div class="col">
      <div class="value">Tutor Platform</div>
      <div class="label">Issued By</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
