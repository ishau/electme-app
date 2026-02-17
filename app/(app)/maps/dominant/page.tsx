"use client";

import { useCallback, useMemo } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useHexDominant } from "@/lib/hooks/use-hex";
import { useMapIslands } from "@/lib/hooks/use-map-islands";
import { IslandSelector } from "@/components/maps/island-selector";
import { HexMap } from "@/components/maps/hex-map";
import { Page } from "@/components/shared/page";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { Badge } from "@/components/ui/badge";

export default function DominantPartyPage() {
  const { atolls, islandsByAtoll, isLoading: islandsLoading } = useMapIslands();
  const [island, setIsland] = useQueryState("island", parseAsString.withDefault(""));

  const { data: geojson, isLoading } = useHexDominant(island || undefined);

  const fillColorExpr = ["get", "party_color"];

  const buildPopupHtml = useCallback((props: Record<string, unknown>) => {
    return `
      <div style="font-size:13px">
        <div style="font-weight:600;margin-bottom:4px">${props.party_code}</div>
        <div>${props.voter_count} / ${props.total_in_hex} voters (${props.pct}%)</div>
      </div>
    `;
  }, []);

  const partyLegend = useMemo(() => {
    if (!geojson?.features) return [];
    const seen = new Map<string, string>();
    for (const f of geojson.features) {
      const code = f.properties.party_code;
      const color = f.properties.party_color;
      if (code && color && !seen.has(code)) seen.set(code, color);
    }
    return Array.from(seen.entries()).map(([code, color]) => ({ code, color }));
  }, [geojson]);

  if (islandsLoading) {
    return <Page title="Dominant Party" description="Loading..."><PageSkeleton /></Page>;
  }

  return (
    <Page title="Dominant Party" description="Winning party per hex cell based on voter affiliation">
      <div className="flex items-end gap-4 flex-wrap">
        <IslandSelector atolls={atolls} islandsByAtoll={islandsByAtoll} value={island} onChange={setIsland} />
        {isLoading && island && <Badge variant="secondary" className="mb-1 animate-pulse">Loading...</Badge>}
      </div>

      {island && (
        <div className="relative mt-4">
          <HexMap
            geojson={geojson ?? null}
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
      )}
    </Page>
  );
}
