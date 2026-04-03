import { NextResponse } from "next/server";

// Standardized API error responses
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Wrapper for API route handlers with automatic error handling
export async function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error("[API Error]", error);

    if (error instanceof ApiError) {
      const response: Record<string, unknown> = {
        error: error.message,
      };
      if (error.details) {
        response.details = error.details;
      }
      return NextResponse.json(response, { status: error.statusCode });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Database errors (Prisma)
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Resource already exists" },
          { status: 409 }
        );
      }
      if (error.message.includes("Record to delete does not exist")) {
        return NextResponse.json(
          { error: "Resource not found" },
          { status: 404 }
        );
      }
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Resource not found" },
          { status: 404 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Common error responses
export const ApiErrors = {
  unauthorized: () => NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  ),
  forbidden: () => NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  ),
  notFound: () => NextResponse.json(
    { error: "Not found" },
    { status: 404 }
  ),
  badRequest: (message?: string) => NextResponse.json(
    { error: message || "Bad request" },
    { status: 400 }
  ),
  conflict: (message?: string) => NextResponse.json(
    { error: message || "Conflict" },
    { status: 409 }
  ),
  internalError: (message?: string) => NextResponse.json(
    { error: message || "Internal server error" },
    { status: 500 }
  ),
};
