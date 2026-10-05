import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { trackFunnel, trackFunnelOnce } from "@/lib/funnel-events";

/** True E2E 2026-10-05 §6, step 4: the funnel's events reach Umami (window.umami.track). */

type Win = { umami?: { track: ReturnType<typeof vi.fn> }; sessionStorage: Storage };

function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

describe("funnel events", () => {
  let win: Win;
  beforeEach(() => {
    win = { umami: { track: vi.fn() }, sessionStorage: fakeStorage() };
    vi.stubGlobal("window", win);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends the event with where it came from", () => {
    trackFunnel("cta_try", { from: "home" });
    expect(win.umami!.track).toHaveBeenCalledWith("cta_try", { from: "home" });
  });

  it("sends first_question once per browser session", () => {
    trackFunnelOnce("first_question", { where: "demo" });
    trackFunnelOnce("first_question", { where: "demo" });
    expect(win.umami!.track).toHaveBeenCalledTimes(1);
  });

  it("still sends when storage is blocked, and never throws without the tracker", () => {
    win.sessionStorage = {
      ...fakeStorage(),
      getItem: () => {
        throw new Error("blocked");
      },
    } as Storage;
    trackFunnelOnce("first_question");
    expect(win.umami!.track).toHaveBeenCalledTimes(1);
    delete win.umami;
    expect(() => trackFunnel("register_done")).not.toThrow();
  });
});
