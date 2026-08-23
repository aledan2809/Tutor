import { describe, it, expect, afterEach, vi } from "vitest";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_EVENT,
  parseStoredConsent,
  readConsent,
  writeConsent,
  subscribeConsent,
} from "@/lib/cookie-consent";

// The property that matters: only an explicit stored "accepted" may unlock the
// third-party script. Everything else — absent, corrupt, unknown, hostile — must
// read as "no consent yet", never as acceptance.
describe("parseStoredConsent", () => {
  it("reads the two real choices", () => {
    expect(parseStoredConsent('{"choice":"accepted","at":"2026-08-24T00:00:00Z"}')).toBe("accepted");
    expect(parseStoredConsent('{"choice":"rejected","at":"2026-08-24T00:00:00Z"}')).toBe("rejected");
  });

  it("fails closed on anything unusable", () => {
    for (const raw of [
      null,
      undefined,
      "",
      "not json",
      "{",
      "null",
      '"accepted"', // a bare string, not the stored object
      "[]",
      "42",
      "{}",
      '{"choice":null}',
      '{"choice":"ACCEPTED"}', // case matters — we compare exactly
      '{"choice":true}',
      '{"choice":"maybe"}',
      '{"choise":"accepted"}', // typo'd key
    ]) {
      expect(parseStoredConsent(raw as string | null | undefined)).toBeNull();
    }
  });

  it("round-trips what writeConsent stores", () => {
    const stored = JSON.stringify({ choice: "accepted", at: new Date().toISOString() });
    expect(parseStoredConsent(stored)).toBe("accepted");
  });
});

// Browser-side helpers, exercised against a minimal fake window so the guards
// (no window, throwing storage) are covered rather than assumed.
type Listener = (e: Event) => void;
function fakeWindow(storage?: { getItem?: () => string | null; setItem?: () => void }) {
  const listeners = new Map<string, Set<Listener>>();
  return {
    localStorage: {
      getItem: storage?.getItem ?? (() => null),
      setItem: storage?.setItem ?? (() => {}),
    },
    addEventListener: (t: string, fn: Listener) => {
      if (!listeners.has(t)) listeners.set(t, new Set());
      listeners.get(t)!.add(fn);
    },
    removeEventListener: (t: string, fn: Listener) => listeners.get(t)?.delete(fn),
    dispatchEvent: (e: Event) => {
      listeners.get(e.type)?.forEach((fn) => fn(e));
      return true;
    },
  };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  vi.restoreAllMocks();
});

describe("readConsent", () => {
  it("returns null with no window (server render)", () => {
    expect(readConsent()).toBeNull();
  });

  it("returns null when storage itself throws", () => {
    (globalThis as { window?: unknown }).window = fakeWindow({
      getItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readConsent()).toBeNull();
  });

  it("reads the stored choice under the shared key", () => {
    const getItem = vi.fn(() => '{"choice":"accepted"}');
    (globalThis as { window?: unknown }).window = fakeWindow({ getItem });
    expect(readConsent()).toBe("accepted");
    expect(getItem).toHaveBeenCalledWith(COOKIE_CONSENT_KEY);
  });
});

describe("writeConsent + subscribeConsent", () => {
  it("notifies subscribers on the same page view", () => {
    const win = fakeWindow();
    (globalThis as { window?: unknown }).window = win;
    (globalThis as { CustomEvent?: unknown }).CustomEvent ??= class {
      type: string;
      detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type;
        this.detail = init?.detail;
      }
    };

    const seen: string[] = [];
    const off = subscribeConsent((c) => seen.push(c));
    writeConsent("accepted");
    expect(seen).toEqual(["accepted"]);

    off();
    writeConsent("rejected");
    expect(seen).toEqual(["accepted"]); // unsubscribed
  });

  it("still notifies when persisting fails", () => {
    (globalThis as { window?: unknown }).window = fakeWindow({
      setItem: () => {
        throw new Error("quota");
      },
    });
    const seen: string[] = [];
    subscribeConsent((c) => seen.push(c));
    expect(() => writeConsent("accepted")).not.toThrow();
    expect(seen).toEqual(["accepted"]);
  });

  it("uses one event name shared by writer and reader", () => {
    expect(COOKIE_CONSENT_EVENT).toBe("etutor:cookie-consent");
  });
});
