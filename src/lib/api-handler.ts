import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (...args: any[]) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an API route handler with try-catch error handling.
 * Returns 500 with a generic error message on unhandled exceptions.
 */
export function withErrorHandler<T extends RouteHandler>(handler: T): T {
  const wrapped = async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      const req = args[0] as NextRequest | Request;
      const pathname =
        req instanceof NextRequest
          ? req.nextUrl.pathname
          : new URL(req.url).pathname;
      console.error(`[API Error] ${req.method} ${pathname}:`, error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
  return wrapped as T;
}
