import { describe, it, expect, afterEach } from "vitest";
import { inMessageWindow } from "@/lib/message-window";

const at = (iso: string) => new Date(iso);

describe("inMessageWindow", () => {
  afterEach(() => {
    delete process.env.MESSAGE_WINDOW_HOURS;
  });
  it("9:00 to 20:00 in Bucharest by default", () => {
    expect(inMessageWindow(at("2026-10-01T05:59:00Z"))).toBe(false); // 08:59
    expect(inMessageWindow(at("2026-10-01T06:00:00Z"))).toBe(true); // 09:00
    expect(inMessageWindow(at("2026-10-01T16:59:00Z"))).toBe(true); // 19:59
    expect(inMessageWindow(at("2026-10-01T17:00:00Z"))).toBe(false); // 20:00
  });
  it("a test stack can open it round the clock; nonsense keeps the default", () => {
    process.env.MESSAGE_WINDOW_HOURS = "0-24";
    expect(inMessageWindow(at("2026-10-01T21:30:00Z"))).toBe(true); // 00:30
    process.env.MESSAGE_WINDOW_HOURS = "20-9";
    expect(inMessageWindow(at("2026-10-01T21:30:00Z"))).toBe(false);
  });
});
