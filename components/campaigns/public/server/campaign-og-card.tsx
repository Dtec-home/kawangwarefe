/**
 * CampaignOgCard — the 1200×630 social preview card drawn by next/og
 * (lane S2-UI-C, ticket 2.10). next/og supports a subset of CSS: every box
 * with more than one child needs `display: flex`, and styles are inline.
 */

import { wholeKes, type CampaignMeta } from "./campaign-meta";

// Literal colours: the image is rendered outside the page, without its CSS
// variables. They match the teal brand tokens in app/globals.css.
const TEAL_DEEP = "#0b3d48";
const TEAL = "#007a8a";
const TEAL_LIGHT = "#5fd4e0";

export function CampaignOgCard({ meta }: { meta: CampaignMeta | null }) {
  // The bar is capped at 100%; the label is the post's figure, one decimal (D14).
  const percent = meta ? Math.max(0, Math.min(100, Math.round(meta.progress.percent))) : 0;
  const percentLabel = meta ? `${Number(meta.progress.percent).toFixed(1)}%` : "";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        color: "white",
        backgroundColor: TEAL_DEEP,
        backgroundImage: `radial-gradient(circle at 100% 0%, ${TEAL} 0%, transparent 55%)`,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>SDA Church Kawangware</div>

      <div
        style={{
          display: "flex",
          fontSize: meta && meta.title.length > 40 ? 64 : 80,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          maxWidth: 1000,
        }}
      >
        {meta ? meta.title : "Give to a church campaign"}
      </div>

      {meta ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontSize: 52, fontWeight: 700 }}>{wholeKes(meta.progress.raised)}</span>
              <span style={{ fontSize: 30, opacity: 0.8 }}>{`raised of ${wholeKes(meta.progress.target)}`}</span>
            </div>
            <span style={{ fontSize: 40, fontWeight: 700, color: TEAL_LIGHT }}>{percentLabel}</span>
          </div>
          <div style={{ display: "flex", height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.18)" }}>
            <div style={{ width: `${percent}%`, height: 20, borderRadius: 10, backgroundColor: TEAL_LIGHT }} />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", fontSize: 32, opacity: 0.85 }}>Every gift moves the work forward.</div>
      )}
    </div>
  );
}
