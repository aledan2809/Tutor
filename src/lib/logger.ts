/**
 * Structured logger for API routes and services.
 * Includes userId and sessionId context where available.
 * Excludes sensitive data (PII, tokens) from logs.
 */

interface LogContext {
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

function formatMessage(level: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const parts = [`[${timestamp}] [${level}] ${message}`];

  if (context?.userId) {
    parts.push(`userId=${context.userId}`);
  }
  if (context?.sessionId) {
    parts.push(`sessionId=${context.sessionId}`);
  }

  return parts.join(" ");
}

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;
  const sanitized = { ...context };
  // Strip sensitive fields
  const sensitiveKeys = ["password", "token", "secret", "accessToken", "refreshToken", "authorization", "cookie"];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
}

export const logger = {
  info(message: string, context?: LogContext) {
    const sanitized = sanitizeContext(context);
    console.log(formatMessage("INFO", message), sanitized ? sanitized : "");
  },

  warn(message: string, context?: LogContext) {
    const sanitized = sanitizeContext(context);
    console.warn(formatMessage("WARN", message), sanitized ? sanitized : "");
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const sanitized = sanitizeContext(context);
    const formatted = formatMessage("ERROR", message);

    if (error instanceof Error) {
      console.error(formatted, {
        ...sanitized,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      });
    } else {
      console.error(formatted, sanitized ? sanitized : "", error ?? "");
    }
  },
};
