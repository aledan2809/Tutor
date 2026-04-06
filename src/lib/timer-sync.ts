/**
 * Timer Sync Utility
 *
 * Corrects client-side timer drift by comparing with server timestamps.
 * Max allowed drift: ±2 seconds. Logs warnings for larger desyncs.
 */

const MAX_DRIFT_MS = 2000; // ±2 seconds

/**
 * Calculate the clock offset between client and server.
 * Returns offset in milliseconds (positive = client is ahead).
 */
export function calculateClockOffset(serverTimestamp: number): number {
  const clientNow = Date.now();
  return clientNow - serverTimestamp;
}

/**
 * Check if the drift between client and server exceeds the threshold.
 * Logs a warning if drift is too large.
 */
export function checkTimerSync(serverTimestamp: number): {
  offset: number;
  driftExceeded: boolean;
} {
  const offset = calculateClockOffset(serverTimestamp);
  const driftExceeded = Math.abs(offset) > MAX_DRIFT_MS;

  if (driftExceeded) {
    console.warn(
      `[TimerSync] Clock drift detected: ${offset}ms (threshold: ±${MAX_DRIFT_MS}ms). Applying correction.`
    );
  }

  return { offset, driftExceeded };
}

/**
 * Get a corrected remaining time for a session timer.
 *
 * @param durationSeconds - Total session duration in seconds
 * @param startedAtMs - Session start time (client-side timestamp)
 * @param serverTimestamp - Server timestamp from the latest API response
 * @returns Corrected remaining seconds
 */
export function getCorrectedRemainingTime(
  durationSeconds: number,
  startedAtMs: number,
  serverTimestamp: number
): number {
  const { offset, driftExceeded } = checkTimerSync(serverTimestamp);

  const clientNow = Date.now();
  let elapsed = clientNow - startedAtMs;

  // Apply drift correction if exceeded threshold
  if (driftExceeded) {
    elapsed -= offset;
  }

  const remaining = Math.max(0, durationSeconds * 1000 - elapsed) / 1000;
  return Math.round(remaining);
}
