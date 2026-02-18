"use client";

import { useCallback, useMemo } from "react";
import { useHexLeaning } from "@/lib/hooks/use-hex";
import { HexMap } from "@/components/maps/hex-map";
import { Badge } from "@/components/ui/badge";
import type { HexLeaningParty } from "@/lib/types";

export default function PartyLeaningPage() {
  const { data: leaningGeo, isLoading } = useHexLeaning();

  // Build processed GeoJSON: derive top party color for polygon fill
  const { processedGeo, leaningDetailMap } = useMemo(() => {
    const empty: Record<string, { total_in_hex: number; parties: HexLeaningParty[] }> = {};
    if (!leaningGeo?.features?.length) return { processedGeo: null, leaningDetailMap: empty };

    const detailMap: Record<string, { total_in_hex: number; parties: HexLeaningParty[] }> = {};

    const features = leaningGeo.features.map((f: { type: string; geometry: unknown; properties: Record<string, unknown> }) => {
      const props = f.properties;
      const parties: HexLeaningParty[] =
        typeof props.parties === "string" ? JSON.parse(props.parties as string) : (props.parties as HexLeaningParty[]) ?? [];

      detailMap[props.hex as string] = {
        total_in_hex: props.total_in_hex as number,
        parties,
      };

      const sorted = [...parties].sort((a, b) => b.voter_count - a.voter_count);
      const topColor = sorted[0]?.party_color ?? "#6B7280";

      return {
        type: "Feature",
        geometry: f.geometry,
        properties: {
          ...props,
          _top_color: topColor,
        },
      };
    });

    return {
      processedGeo: { type: "FeatureCollection", features },
      leaningDetailMap: detailMap,
    };
  }, [leaningGeo]);

  const fillColorExpr = ["get", "_top_color"];

  const buildPopupHtml = useCallback((props: Record<string, unknown>) => {
    const hex = props.hex as string;
    const detail = leaningDetailMap[hex];
    if (!detail) return "";

    const sorted = [...detail.parties].sort((a, b) => b.voter_count - a.voter_count);
    const topId = sorted[0]?.party_id;

    const rows = sorted
      .map(
        (p, i) => `
          <div style="display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:4px;${i === 0 ? "background:rgba(0,0,0,0.04);" : ""}">
            <div style="width:10px;height:10px;border-radius:50%;background:${p.party_color};flex-shrink:0"></div>
            <span style="min-width:36px;font-weight:${p.party_id === topId ? "600" : "400"}">${p.party_code}</span>
            <div style="flex:1;background:#e5e7eb;border-radius:3px;height:7px;overflow:hidden;min-width:60px">
              <div style="width:${p.pct}%;background:${p.party_color};height:100%;border-radius:3px"></div>
            </div>
            <span style="min-width:64px;text-align:right;font-variant-numeric:tabular-nums;color:#555">${p.voter_count} <span style="color:#999">(${p.pct}%)</span></span>
          </div>
        `
      )
      .join("");

    return `
      <div style="font-size:13px;min-width:260px;font-family:system-ui,-apple-system,sans-serif">
        <div style="font-weight:600;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid #e5e7eb">${detail.total_in_hex} voters</div>
        <div style="display:flex;flex-direction:column;gap:2px">${rows}</div>
      </div>
    `;
  }, [leaningDetailMap]);

  // Extract party legend from leaning data
  const partyLegend = useMemo(() => {
    if (!leaningGeo?.features) return [];
    const seen = new Map<string, string>();
    for (const f of leaningGeo.features) {
      const parties: HexLeaningParty[] =
        typeof f.properties.parties === "string" ? JSON.parse(f.properties.parties) : f.properties.parties ?? [];
      for (const p of parties) {
        if (!seen.has(p.party_code)) seen.set(p.party_code, p.party_color);
      }
    }
    return Array.from(seen.entries()).map(([code, color]) => ({ code, color }));
  }, [leaningGeo]);

  return (
    <div className="space-y-4">
      {isLoading && <Badge variant="secondary" className="animate-pulse w-fit">Loading...</Badge>}

      <div className="relative">
        <HexMap
          geojson={processedGeo ?? null}
          fillColorExpr={fillColorExpr}
          buildPopupHtml={buildPopupHtml}
          className="h-[600px] w-full rounded-md"
        />
        {partyLegend.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-md">
            <p className="text-xs font-semibold mb-2">Parties</p>
            <div className="space-y-1">
              {partyLegend.map(({ code, color }) => (
                <div key={code} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs">{code}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
