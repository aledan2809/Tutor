/**
 * The hidden marker of a drawn-instrument exercise (Aptitudini Aviație — Set extins, stage 2), read
 * out of a question's `passage`. Kept apart from the drawings so the generator tests can use it.
 *   [HEADING] 247              → heading indicator showing 247°
 *   [ATTITUDE] bank=20;pitch=5 → 20° right bank (negative = left), nose 5° up
 */
export type Instrument =
  | { kind: "heading"; heading: number }
  | { kind: "attitude"; bank: number; pitch: number };

/** Read the marker out of a question's passage; null when it is not an instrument exercise. */
export function parseInstrument(passage: string | null | undefined): Instrument | null {
  const p = passage ?? "";
  const h = p.match(/^\[HEADING\]\s*(\d{1,3})\b/);
  if (h) {
    const heading = Number(h[1]);
    return heading >= 0 && heading < 360 ? { kind: "heading", heading } : null;
  }
  const a = p.match(/^\[ATTITUDE\]\s*bank=(-?\d{1,2});\s*pitch=(-?\d{1,2})\b/);
  if (a) {
    const bank = Number(a[1]), pitch = Number(a[2]);
    return Math.abs(bank) <= 60 && Math.abs(pitch) <= 30 ? { kind: "attitude", bank, pitch } : null;
  }
  return null;
}

