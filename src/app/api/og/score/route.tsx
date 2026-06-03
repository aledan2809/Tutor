import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// Dynamic branded score card for social sharing (Faza 0 / Tier 1 viral artifact).
// GET /api/og/score?s=4&t=5 -> 1200x630 PNG. Text kept ASCII-safe so the default
// font renders cleanly without bundling custom fonts.
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const score = Math.max(0, Math.min(50, parseInt(sp.get("s") || "0", 10) || 0));
  const total = Math.max(1, Math.min(50, parseInt(sp.get("t") || "5", 10) || 5));
  const pct = Math.round((score / total) * 100);
  const accent = pct >= 80 ? "#22c55e" : pct >= 50 ? "#3b82f6" : "#f59e0b";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0a0e1a 0%, #111827 100%)",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#3b82f6" }}>
          etutor.ro
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ display: "flex", fontSize: 36, color: "#9ca3af" }}>
            Am luat la un test grilă
          </div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
            <span style={{ fontSize: 180, fontWeight: 800, color: accent, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: 90, fontWeight: 700, color: "#6b7280" }}>/{total}</span>
            <span style={{ fontSize: 60, fontWeight: 700, color: accent, marginLeft: 28 }}>
              {pct}%
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#ffffff" }}>
            Bati scorul meu?
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#9ca3af", marginTop: 6 }}>
            Lipesti orice text, primesti testul in 10 secunde
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
