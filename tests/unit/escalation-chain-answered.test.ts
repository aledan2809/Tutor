import { describe, it, expect } from "vitest";
import { answeredSince, chainClosed, waitsUntilLater, withoutRungState, RUNG_WAIT_MS } from "@/lib/escalation/engine";

const start = new Date("2026-09-17T10:00:00Z");
const at = (min: number) => new Date(start.getTime() + min * 60_000);

describe("did the child answer the chain", () => {
  it("a tap after the chain started stops it, on any notification (review 3, minor 2b)", () => {
    // Reminders at 13:00 and 13:05: the tap on the 13:00 push at 13:07 answers the 13:05 chain too.
    expect(answeredSince(at(0), at(7), null).acknowledged).toBe(true);
  });

  it("a tap before the chain started (yesterday's) doesn't", () => {
    expect(answeredSince(at(0), at(-24 * 60 + 5), null).acknowledged).toBe(false);
    expect(answeredSince(at(0), null, null).acknowledged).toBe(false);
  });

  it("a session finished after the start counts, even one started before it", () => {
    expect(answeredSince(at(0), null, { startedAt: at(-10), endedAt: at(12) }).actionDone).toBe(true);
    expect(answeredSince(at(0), null, { startedAt: at(3), endedAt: null }).actionDone).toBe(true);
  });

  it("a session finished before the start doesn't", () => {
    expect(answeredSince(at(0), null, { startedAt: at(-30), endedAt: at(-5) }).actionDone).toBe(false);
    expect(answeredSince(at(0), null, null).actionDone).toBe(false);
  });
});

describe("a rung waiting for later", () => {
  const now = at(0);

  it("waits while its time is ahead, and not once it has passed", () => {
    expect(waitsUntilLater({ nextAttemptAt: at(5).toISOString() }, now)).toBe(true);
    expect(waitsUntilLater({ nextAttemptAt: at(-1).toISOString() }, now)).toBe(false);
  });

  it("anything else means no wait: nothing set, a broken value, no metadata", () => {
    expect(waitsUntilLater({ reason: "evening_quick" }, now)).toBe(false);
    expect(waitsUntilLater({ nextAttemptAt: "soon" }, now)).toBe(false);
    expect(waitsUntilLater(null, now)).toBe(false);
    expect(waitsUntilLater([1, 2], now)).toBe(false);
  });

  it("waits a quarter of an hour, as when the cron ran every 15 minutes (review 3, minor 3)", () => {
    expect(RUNG_WAIT_MS).toBe(15 * 60_000);
  });
});

describe("what a rung passes on to the next one", () => {
  it("its failures, waits and end marks stay with it; the reminder's own data travels", () => {
    const next = withoutRungState({
      reason: "evening_quick",
      url: "/dashboard/practice?start=quick",
      sendFailures: 2,
      nextAttemptAt: at(5).toISOString(),
      retryCount: 1,
      lastRetryAt: at(-3).toISOString(),
      answered: true,
      stuck: true,
      closed: "paused",
    });
    expect(next).toEqual({ reason: "evening_quick", url: "/dashboard/practice?start=quick" });
  });

  it("the wait for the child's study time happens once per chain, so the mark travels (review r6, X1)", () => {
    // Stripped per rung, every later rung waited another quarter of an hour: the chain reached the
    // parent much later than the 6 / 18 minutes the page promises.
    const next = withoutRungState({ reason: "evening_quick", deferredOnce: true, nextAttemptAt: at(5).toISOString() });
    expect(next).toEqual({ reason: "evening_quick", deferredOnce: true });
  });
});

describe("a closed chain", () => {
  it("is recognised by its mark, whatever the reason", () => {
    expect(chainClosed({ reason: "evening_quick", closed: "answered" })).toBe(true);
    expect(chainClosed({ closed: "paused" })).toBe(true);
  });

  it("an open one has no mark", () => {
    expect(chainClosed({ reason: "evening_quick" })).toBe(false);
    expect(chainClosed(null)).toBe(false);
    expect(chainClosed(["closed"])).toBe(false);
  });
});
