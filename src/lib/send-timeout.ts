/**
 * A time limit for one outgoing message (01.10.2026, after the parent-alert loop): a push, a Telegram,
 * WhatsApp or SMS call that never answers used to hold a cron run past its lease, and the next run then
 * worked from a stale list. The call itself may still finish in the background; the run stops waiting.
 * E-mail has its own limits in email.ts.
 */
export const SEND_TIMEOUT_MS = 20_000;

export class SendTimeoutError extends Error {
  name = "TimeoutError";
}

export async function withSendTimeout<T>(work: Promise<T>, label: string, ms = SEND_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SendTimeoutError(`${label}: no answer after ${ms} ms`)), ms);
  });
  try {
    return await Promise.race([work, limit]);
  } finally {
    clearTimeout(timer);
  }
}
