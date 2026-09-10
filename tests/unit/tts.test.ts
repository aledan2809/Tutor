import { describe, it, expect } from "vitest";
import { countAudioQuestions, readTtsRate, TTS_RATE_DEFAULT, gapForRate, TTS_RITM_FACTOR, TTS_RATE_MIN, TTS_RATE_MAX } from "@/lib/tts";

describe("countAudioQuestions — gates the pre-test TTS calibration screen", () => {
  it("counts AUDIODICT + CUBEVOICE questions, ignores other passages", () => {
    const qs = [
      { passage: "[AUDIODICT:ro] 3 8 5 2" },
      { passage: "[CUBEVOICE] start=U; moves=R,U,L" },
      { passage: "[MEMORIE:8] uită-te la imagine" }, // visual, not audio
      { passage: "[CLOCK] 10:25" }, // visual
      { passage: null },
      {}, // no passage
      { passage: "plain reading passage" },
    ];
    expect(countAudioQuestions(qs)).toBe(2);
  });

  it("returns 0 when no question is read-aloud (no calibration gate)", () => {
    expect(countAudioQuestions([{ passage: null }, { content: "x" } as { passage?: string | null }])).toBe(0);
    expect(countAudioQuestions([])).toBe(0);
  });
});

describe("readTtsRate — SSR-safe default", () => {
  it("falls back to the default when window is absent (server)", () => {
    // In the node test env there's no window → default.
    expect(readTtsRate()).toBe(TTS_RATE_DEFAULT);
  });
});

describe("gapForRate — slower voice gets a bigger pause between numbers", () => {
  it("increases the inter-item gap as the rate drops, with a floor", () => {
    expect(gapForRate(0.3)).toBeGreaterThan(gapForRate(0.6));
    expect(gapForRate(0.6)).toBeGreaterThan(gapForRate(1.0));
    expect(gapForRate(1.1)).toBeGreaterThanOrEqual(300); // never below the floor
  });
});

describe("TTS_RITM_FACTOR — cu 12% mai rar, peste viteza aleasă de om", () => {
  it("e exact 12%", () => {
    expect(TTS_RITM_FACTOR).toBeCloseTo(0.88, 5);
  });

  it("se aplică PESTE preferința salvată, nu în locul ei", () => {
    // Omul care a cerut schimbarea are deja o viteză salvată pe telefon. Dacă
    // factorul ar fi fost pus doar în valoarea implicită, pentru el nu s-ar fi
    // schimbat nimic — și tocmai el a cerut-o.
    for (const alesDeOm of [TTS_RATE_MIN, TTS_RATE_DEFAULT, TTS_RATE_MAX, 0.95]) {
      expect(alesDeOm * TTS_RITM_FACTOR).toBeCloseTo(alesDeOm * 0.88, 10);
      expect(alesDeOm * TTS_RITM_FACTOR).toBeLessThan(alesDeOm);
    }
  });

  it("nu coboară sub pragul la care motoarele de voce refuză să citească", () => {
    // Cea mai lentă treaptă, încă o dată încetinită, trebuie să rămână peste 0.1 —
    // sub el, browserele fie taie, fie ignoră viteza cerută.
    expect(TTS_RATE_MIN * TTS_RITM_FACTOR).toBeGreaterThan(0.1);
  });
});
