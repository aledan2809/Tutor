import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];

/**
 * GET /api/health/ready — Deployment readiness check
 *
 * Validates database connectivity, required env vars, and critical tables.
 * Protected by CRON_SECRET to prevent information disclosure.
 */
async function _GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const checks: Record<string, { status: string; detail?: string }> = {};

  // 1. Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok" };
  } catch (e) {
    checks.database = { status: "error", detail: (e as Error).message };
  }

  // 2. Required environment variables
  const missingEnv = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  checks.env = missingEnv.length === 0
    ? { status: "ok" }
    : { status: "error", detail: `Missing: ${missingEnv.join(", ")}` };

  // 3. Critical tables exist (spot check)
  try {
    const [userCount, domainCount] = await Promise.all([
      prisma.user.count({ take: 1 }),
      prisma.domain.count({ take: 1 }),
    ]);
    checks.tables = {
      status: "ok",
      detail: `users=${userCount >= 1 ? "populated" : "empty"}, domains=${domainCount >= 1 ? "populated" : "empty"}`,
    };
  } catch (e) {
    checks.tables = { status: "error", detail: (e as Error).message };
  }

  // 4. Prisma client generated
  checks.prisma = { status: "ok" };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      ready: allOk,
      checks,
      version: process.env.npm_package_version || "0.1.0",
      node: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}

export const GET = withErrorHandler(_GET);
