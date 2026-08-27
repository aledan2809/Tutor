import { describe, it, expect, beforeEach, vi } from "vitest";
import { speak, speakItems, cancelSpeech } from "@/lib/tts";

/**
 * The lock on the answer inputs is released by `onEnd`. Every path that ends a
 * dictation must fire it — a memory drill whose keyboard never unlocks is worse
 * than one with no voice.
 */
class FakeUtterance {
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  lang = "";
  rate = 1;
  constructor(public text: string) {}
}

let spoken: FakeUtterance[] = [];

function installSpeech(mode: "ok" | "error" = "ok") {
  spoken = [];
  (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    FakeUtterance as unknown;
  (globalThis as unknown as { window: unknown }).window = {
    speechSynthesis: {
      cancel: () => {},
      speak: (u: FakeUtterance) => {
        spoken.push(u);
        // Deliver the callback asynchronously, like the real API.
        setTimeout(() => (mode === "ok" ? u.onend?.() : u.onerror?.()), 0);
      },
    },
    localStorage: { getItem: () => null, setItem: () => {} },
  };
}

const flush = () => new Promise((r) => setTimeout(r, 60));

beforeEach(() => {
  vi.useRealTimers();
  delete (globalThis as unknown as Record<string, unknown>).window;
  delete (globalThis as unknown as Record<string, unknown>).SpeechSynthesisUtterance;
});

describe("dictation lifecycle", () => {
  it("locks at the start and releases at the end of a list", async () => {
    installSpeech("ok");
    const seen: string[] = [];
    speakItems(["1", "2", "3"], "ro-RO", 1, 1, {
      onStart: () => seen.push("start"),
      onEnd: () => seen.push("end"),
    });
    expect(seen).toEqual(["start"]);
    await flush();
    expect(seen).toEqual(["start", "end"]);
    expect(spoken.map((u) => u.text)).toEqual(["1", "2", "3"]);
  });

  it("releases even when a voice errors mid-list", async () => {
    installSpeech("error");
    const seen: string[] = [];
    speakItems(["1", "2"], "ro-RO", 1, 1, {
      onStart: () => seen.push("start"),
      onEnd: () => seen.push("end"),
    });
    await flush();
    expect(seen).toContain("end");
  });

  it("releases immediately when the browser cannot speak at all", () => {
    // No window/speechSynthesis installed. Returning silently here would leave
    // the inputs disabled with nothing ever coming to re-enable them.
    const seen: string[] = [];
    speakItems(["1"], "ro-RO", 1, 1, { onEnd: () => seen.push("end") });
    expect(seen).toEqual(["end"]);
    speak("salut", "ro-RO", 1, { onEnd: () => seen.push("end2") });
    expect(seen).toEqual(["end", "end2"]);
  });

  it("a superseded dictation does not release the new one's lock", async () => {
    installSpeech("ok");
    const seen: string[] = [];
    speakItems(["1", "2", "3"], "ro-RO", 1, 50, { onEnd: () => seen.push("old-end") });
    cancelSpeech(); // whoever cancelled is about to start their own
    await flush();
    // The abandoned sequence must stay quiet — firing here would unlock the
    // inputs in the middle of the replacement dictation.
    expect(seen).toEqual([]);
  });

  it("single-utterance speak reports both ends of its life", async () => {
    installSpeech("ok");
    const seen: string[] = [];
    speak("miscarile", "en-US", 1, {
      onStart: () => seen.push("start"),
      onEnd: () => seen.push("end"),
    });
    expect(seen).toEqual(["start"]);
    await flush();
    expect(seen).toEqual(["start", "end"]);
  });
});
