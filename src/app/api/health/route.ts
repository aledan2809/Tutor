import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";

/**
 * GET /api/health — Health check endpoint for deployment validation
 *
 * Returns application status, database connectivity, and uptime.
 * Used by PM2 and monitoring tools to verify the app is running.
 */
async function _GET() {
  const start = Date.now();

  // Check database connectivity
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  const latency = Date.now() - start;

  const status = dbStatus === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status: dbStatus === "ok" ? "healthy" : "degraded",
      version: process.env.npm_package_version || "0.1.0",
      uptime: process.uptime(),
      db: dbStatus,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export const GET = withErrorHandler(_GET);
