"use client";

import { useCallback, useMemo } from "react";
import { useHexDominant, useHexLeaning } from "@/lib/hooks/use-hex";
import { HexMap } from "@/components/maps/hex-map";
import { Badge } from "@/components/ui/badge";
import type { HexLeaningParty } from "@/lib/types";

export default function PartyLeaningPage() {
  const { data: dominantGeo, isLoading: dominantLoading } = useHexDominant();
  const { data: leaningGeo, isLoading: leaningLoading } = useHexLeaning();

  const isLoading = dominantLoading || leaningLoading;

  const leaningDetailMap = useMemo(() => {
    if (!leaningGeo?.features) return {};
    const map: Record<string, { total_in_hex: number; parties: HexLeaningParty[] }> = {};
    for (const f of leaningGeo.features) {
      const props = f.properties;
      map[props.hex] = {
        total_in_hex: props.total_in_hex,
        parties: typeof props.parties === "string" ? JSON.parse(props.parties) : props.parties,
      };
    }
    return map;
  }, [leaningGeo]);

  const fillColorExpr = ["get", "party_color"];

  const buildPopupHtml = useCallback((props: Record<string, unknown>) => {
    const hex = props.hex as string;
    const detail = leaningDetailMap[hex];
    if (!detail) {
      return `<div style="font-size:13px">${props.party_code}: ${props.voter_count}/${props.total_in_hex} (${props.pct}%)</div>`;
    }
    const rows = [...detail.parties]
      .sort((a, b) => b.voter_count - a.voter_count)
      .map(
        (p) => `
          <div style="display:flex;align-items:center;gap:6px;margin:3px 0">
            <div style="width:10px;height:10px;border-radius:50%;background:${p.party_color};flex-shrink:0"></div>
            <span style="min-width:32px">${p.party_code}</span>
            <div style="flex:1;background:#e5e7eb;border-radius:2px;height:8px;overflow:hidden">
              <div style="width:${p.pct}%;background:${p.party_color};height:100%"></div>
            </div>
            <span style="min-width:36px;text-align:right">${p.pct}%</span>
          </div>
        `
      )
      .join("");
    return `<div style="font-size:13px"><div style="font-weight:600;margin-bottom:6px">${detail.total_in_hex} voters</div>${rows}</div>`;
  }, [leaningDetailMap]);

  const partyLegend = useMemo(() => {
    if (!dominantGeo?.features) return [];
    const seen = new Map<string, string>();
    for (const f of dominantGeo.features) {
      const code = f.properties.party_code;
      const color = f.properties.party_color;
      if (code && color && !seen.has(code)) seen.set(code, color);
    }
    return Array.from(seen.entries()).map(([code, color]) => ({ code, color }));
  }, [dominantGeo]);

  return (
    <div className="space-y-4">
      {isLoading && <Badge variant="secondary" className="animate-pulse w-fit">Loading...</Badge>}

      <div className="relative">
        <HexMap
          geojson={dominantGeo ?? null}
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
