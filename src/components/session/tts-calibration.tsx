"use client";

import { speakItems, useTtsRate, TtsSpeedControl, ttsSupported } from "./tts";

// Pre-test gate shown BEFORE the timer starts when the exam contains read-aloud
// (TTS) questions. The student hears a sample, sets the cadence for the whole
// test, and only then presses Start — so calibration time never eats exam time.
// Addresses the complaint that the voice read too fast (and that students hit
// it mid-test with no warning).

// Single digits read one-by-one with a pause — mirrors the real dictation cadence
// so the student calibrates the exact pace they'll hear in the test.
const SAMPLE_DIGITS = ["3", "8", "5", "2", "9", "7", "1"];

export function TtsCalibration({
  onStart,
  audioQuestionCount,
}: {
  onStart: () => void;
  audioQuestionCount: number;
}) {
  const [rate, setRate] = useTtsRate();
  const supported = ttsSupported();

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="space-y-5 rounded-xl border border-gray-700 bg-gray-900 p-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">🔊 Pregătește vocea înainte de start</h2>
          <p className="text-sm text-gray-300">
            Acest test conține {audioQuestionCount}{" "}
            {audioQuestionCount === 1 ? "întrebare cu citire cu voce tare" : "întrebări cu citire cu voce tare"}{" "}
            (dictare). Reglează acum viteza vocii ca să fie pe ritmul tău — setarea se aplică
            la toate întrebările. <strong>Cronometrul pornește abia după ce apeși „Începe testul”.</strong>
          </p>
        </div>

        {supported ? (
          <>
            <div className="flex flex-col gap-3 rounded-lg border border-gray-700 bg-gray-950/40 p-4">
              <button
                type="button"
                onClick={() => speakItems(SAMPLE_DIGITS, "ro-RO", rate)}
                className="rounded-lg border border-blue-700 bg-blue-950/30 px-4 py-2.5 text-sm font-medium text-blue-200 hover:bg-blue-900/40"
              >
                🔊 Ascultă un exemplu
              </button>
              <TtsSpeedControl value={rate} onChange={setRate} />
              <p className="text-xs text-gray-500">
                Apasă „Ascultă un exemplu” după fiecare schimbare ca să verifici ritmul.
              </p>
            </div>
            <button
              type="button"
              onClick={onStart}
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              Începe testul ▶
            </button>
          </>
        ) : (
          <>
            <p className="rounded-lg border border-yellow-800 bg-yellow-950/30 p-3 text-xs text-yellow-300">
              Browserul tău nu suportă citirea cu voce tare. Vei putea totuși răspunde la
              întrebări, dar fără audio. Recomandăm Chrome sau Safari recent.
            </p>
            <button
              type="button"
              onClick={onStart}
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              Începe testul ▶
            </button>
          </>
        )}
      </div>
    </div>
  );
}
