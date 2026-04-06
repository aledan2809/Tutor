import crypto from "crypto";

const IMPERSONATION_SECRET = process.env.IMPERSONATION_SECRET || process.env.AUTH_SECRET || "fallback-change-me";
export const IMPERSONATION_TTL_MS = 60 * 60 * 1000; // 1 hour

export function signImpersonationToken(payload: { adminId: string; impersonatedUserId: string; exp: number }): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString("base64url");
  const signature = crypto.createHmac("sha256", IMPERSONATION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyImpersonationToken(token: string): { adminId: string; impersonatedUserId: string; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = crypto.createHmac("sha256", IMPERSONATION_SECRET).update(encoded).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
  if (Date.now() > payload.exp) return null;
  return payload;
}
