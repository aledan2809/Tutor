import { describe, it, expect, vi, afterEach } from "vitest";
import { withSendTimeout } from "@/lib/send-timeout";

describe("withSendTimeout", () => {
  afterEach(() => vi.useRealTimers());

  it("returns the answer when it comes in time", async () => {
    expect(await withSendTimeout(Promise.resolve("ok"), "x", 1000)).toBe("ok");
  });

  it("stops waiting on a call that never answers, with a TimeoutError", async () => {
    vi.useFakeTimers();
    const pending = withSendTimeout(new Promise<never>(() => {}), "Telegram", 20_000);
    const caught = pending.catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(20_001);
    const err = await caught;
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).name).toBe("TimeoutError");
    expect((err as Error).message).toContain("Telegram");
  });

  it("passes the call's own error through", async () => {
    await expect(withSendTimeout(Promise.reject(new Error("refuzat")), "x", 1000)).rejects.toThrow("refuzat");
  });
});
