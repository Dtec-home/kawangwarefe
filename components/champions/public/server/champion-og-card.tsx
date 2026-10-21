/**
 * ChampionOgCard — the 1200×630 social preview of a champion's page, drawn
 * by next/og (lane S5-UI-I). Same look as S2's CampaignOgCard; next/og needs
 * `display: flex` on every box with more than one child, and inline styles.
 */

import { wholeKes } from "@/components/campaigns/public/server/campaign-meta";
import type { ChampionMeta } from "./champion-meta";

// Literal colours (no CSS variables in next/og), as in CampaignOgCard.
const TEAL_DEEP = "#0b3d48";
const TEAL = "#007a8a";
const TEAL_LIGHT = "#5fd4e0";

export function ChampionOgCard({ meta }: { meta: ChampionMeta | null }) {
  const target = meta ? Number.parseFloat(meta.personalTarget ?? "") : Number.NaN;
  const percent =
    meta && Number.isFinite(target) && target > 0
      ? Math.max(0, Math.min(100, Math.round((Number.parseFloat(meta.raised) / target) * 100)))
      : null;
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
      <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>
        {meta ? meta.campaign.title : "SDA Church Kawangware"}
      </div>

      <div
        style={{
          display: "flex",
          fontSize: meta && meta.championName.length > 24 ? 64 : 80,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          maxWidth: 1000,
        }}
      >
        {meta ? `Raised by ${meta.championName}` : "Give through a church champion"}
      </div>

      {meta ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontSize: 52, fontWeight: 700 }}>{wholeKes(meta.raised)}</span>
              <span style={{ fontSize: 30, opacity: 0.8 }}>
                {meta.personalTarget ? `raised of ${wholeKes(meta.personalTarget)}` : "raised"}
              </span>
            </div>
            {percent !== null ? (
              <span style={{ fontSize: 40, fontWeight: 700, color: TEAL_LIGHT }}>{`${percent}%`}</span>
            ) : null}
          </div>
          {percent !== null ? (
            <div style={{ display: "flex", height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.18)" }}>
              <div style={{ width: `${percent}%`, height: 20, borderRadius: 10, backgroundColor: TEAL_LIGHT }} />
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ display: "flex", fontSize: 32, opacity: 0.85 }}>Every gift moves the work forward.</div>
      )}
    </div>
  );
}
