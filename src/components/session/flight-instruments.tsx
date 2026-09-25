/**
 * Flight instruments drawn for the aptitude exercises (Aptitudini Aviație — Set extins, stage 2).
 *
 * Same mechanism as the analog clock: the question's `passage` carries a hidden marker with the
 * instrument's state, the app draws it, and the student answers with the ordinary option buttons.
 *   [HEADING] 247              → heading indicator showing 247°
 *   [ATTITUDE] bank=20;pitch=5 → attitude indicator: 20° right bank (negative = left), nose 5° up
 * Original drawings; nothing is copied from any test provider.
 */

import type { Instrument } from "@/lib/flight-instrument-marker";

export { parseInstrument } from "@/lib/flight-instrument-marker";

export function FlightInstrument({ instrument }: { instrument: Instrument }) {
  return instrument.kind === "heading" ? (
    <HeadingIndicator heading={instrument.heading} />
  ) : (
    <AttitudeIndicator bank={instrument.bank} pitch={instrument.pitch} />
  );
}

const CX = 110, CY = 110;

/**
 * Heading indicator: the compass card turns, the lubber line at the top stays. The heading is read
 * under the lubber line — the card is rotated by −heading so that value sits at the top.
 */
function HeadingIndicator({ heading }: { heading: number }) {
  const r = 96;
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const label = (deg: number) => ({ 0: "N", 90: "E", 180: "S", 270: "W" } as Record<number, string>)[deg] ?? String(deg / 10);
  return (
    <svg viewBox="0 0 220 220" className="mx-auto h-60 w-60" role="img" aria-label="Indicator de direcție (busolă)">
      <circle cx={CX} cy={CY} r={104} fill="#111827" stroke="#374151" strokeWidth="4" />
      <g transform={`rotate(${-heading} ${CX} ${CY})`}>
        {ticks.map((deg) => {
          const a = ((deg - 90) * Math.PI) / 180;
          const long = deg % 10 === 0;
          const x1 = CX + r * Math.cos(a), y1 = CY + r * Math.sin(a);
          const x2 = CX + (r - (long ? 12 : 6)) * Math.cos(a), y2 = CY + (r - (long ? 12 : 6)) * Math.sin(a);
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f9fafb" strokeWidth={long ? 2 : 1} />;
        })}
        {Array.from({ length: 12 }, (_, i) => i * 30).map((deg) => {
          const a = ((deg - 90) * Math.PI) / 180;
          const x = CX + (r - 26) * Math.cos(a), y = CY + (r - 26) * Math.sin(a);
          return (
            <text
              key={deg}
              x={x}
              y={y + 5}
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill={deg % 90 === 0 ? "#fbbf24" : "#f9fafb"}
              transform={`rotate(${deg} ${x} ${y})`}
            >
              {label(deg)}
            </text>
          );
        })}
      </g>
      {/* Fixed parts: lubber line at the top and the aircraft symbol. */}
      <polygon points={`${CX - 7},4 ${CX + 7},4 ${CX},20`} fill="#f97316" />
      <path d={`M${CX} ${CY - 18} L${CX} ${CY + 18} M${CX - 16} ${CY - 2} L${CX + 16} ${CY - 2} M${CX - 7} ${CY + 14} L${CX + 7} ${CY + 14}`} stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Attitude indicator: the horizon moves, the aircraft symbol stays. In a right bank the world rolls
 * the other way (the horizon's right end rises); nose up moves the horizon down.
 */
function AttitudeIndicator({ bank, pitch }: { bank: number; pitch: number }) {
  const PX_PER_DEG = 3;
  const r = 96;
  const ladder = [-20, -15, -10, -5, 5, 10, 15, 20];
  return (
    <svg viewBox="0 0 220 220" className="mx-auto h-60 w-60" role="img" aria-label="Orizont artificial">
      <defs>
        <clipPath id="ai-clip">
          <circle cx={CX} cy={CY} r={r} />
        </clipPath>
      </defs>
      <g clipPath="url(#ai-clip)">
        <g transform={`rotate(${-bank} ${CX} ${CY}) translate(0 ${pitch * PX_PER_DEG})`}>
          <rect x={-200} y={-300} width={620} height={300 + CY} fill="#3b82f6" />
          <rect x={-200} y={CY} width={620} height={400} fill="#92400e" />
          <line x1={-200} y1={CY} x2={420} y2={CY} stroke="#f9fafb" strokeWidth="2.5" />
          {ladder.map((deg) => {
            const y = CY - deg * PX_PER_DEG;
            const half = deg % 10 === 0 ? 26 : 14;
            return (
              <g key={deg}>
                <line x1={CX - half} y1={y} x2={CX + half} y2={y} stroke="#f9fafb" strokeWidth="1.5" />
                {deg % 10 === 0 && (
                  <text x={CX + half + 4} y={y + 4} fontSize="10" fill="#f9fafb">
                    {Math.abs(deg)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </g>
      <circle cx={CX} cy={CY} r={r} fill="none" stroke="#374151" strokeWidth="8" />
      {/* Bank scale (fixed) and the bank pointer (turns with the horizon). */}
      {[-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60].map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        const inner = deg % 30 === 0 ? r - 16 : r - 10;
        return (
          <line key={deg} x1={CX + r * Math.cos(a)} y1={CY + r * Math.sin(a)} x2={CX + inner * Math.cos(a)} y2={CY + inner * Math.sin(a)} stroke="#f9fafb" strokeWidth="2" />
        );
      })}
      <g transform={`rotate(${-bank} ${CX} ${CY})`}>
        <polygon points={`${CX},${CY - r + 18} ${CX - 7},${CY - r + 30} ${CX + 7},${CY - r + 30}`} fill="#fbbf24" />
      </g>
      {/* Fixed aircraft symbol. */}
      <path d={`M${CX - 46} ${CY} L${CX - 16} ${CY} L${CX - 8} ${CY + 8} M${CX + 46} ${CY} L${CX + 16} ${CY} L${CX + 8} ${CY + 8}`} stroke="#f97316" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={CX} cy={CY} r="4" fill="#f97316" />
    </svg>
  );
}
