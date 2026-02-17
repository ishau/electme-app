"use client";

import { useState, useCallback, useMemo } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useHexCandidateSupport } from "@/lib/hooks/use-hex";
import { useMapIslands } from "@/lib/hooks/use-map-islands";
import { IslandSelector } from "@/components/maps/island-selector";
import { HexMap } from "@/components/maps/hex-map";
import { Page } from "@/components/shared/page";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HexCandidateSupportLevel } from "@/lib/types";

const SUPPORT_LEVEL_COLORS: Record<string, string> = {
  strong_supporter: "#16a34a",
  leaning: "#86efac",
  undecided: "#fbbf24",
  soft_opposition: "#fb923c",
  hard_opposition: "#dc2626",
};

const SUPPORT_LEVEL_LABELS: Record<string, string> = {
  strong_supporter: "Strong Supporter",
  leaning: "Leaning",
  undecided: "Undecided",
  soft_opposition: "Soft Opposition",
  hard_opposition: "Hard Opposition",
};

export default function CandidateSupportPage() {
  const { atolls, islandsByAtoll, group, isLoading: islandsLoading } = useMapIslands();
  const [island, setIsland] = useQueryState("island", parseAsString.withDefault(""));
  const [selectedCandidate, setSelectedCandidate] = useState("");

  const candidates = group?.Candidates ?? [];

  const { data: candidateSupportGeo, isLoading } = useHexCandidateSupport(
    island || undefined,
    selectedCandidate || undefined
  );

  // Pre-process: add top_level for fill coloring
  const processedGeo = useMemo(() => {
    if (!candidateSupportGeo?.features?.length) return null;

    const features = candidateSupportGeo.features.map((f: { type: string; geometry: unknown; properties: Record<string, unknown> }) => {
      const levelsRaw = f.properties.levels;
      const levels: HexCandidateSupportLevel[] =
        typeof levelsRaw === "string" ? JSON.parse(levelsRaw) : (levelsRaw as HexCandidateSupportLevel[]) ?? [];

      const top = levels.length
        ? levels.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), levels[0])
        : null;

      return {
        type: "Feature",
        geometry: f.geometry,
        properties: { ...f.properties, _levels: JSON.stringify(levels), top_level: top?.level ?? "none" },
      };
    });

    return { type: "FeatureCollection", features };
  }, [candidateSupportGeo]);

  const fillColorExpr = useMemo(() => {
    const expr: unknown[] = ["match", ["get", "top_level"]];
    for (const [level, color] of Object.entries(SUPPORT_LEVEL_COLORS)) {
      expr.push(level, color);
    }
    expr.push("#6B7280");
    return expr;
  }, []);

  const buildPopupHtml = useCallback((props: Record<string, unknown>) => {
    const levelsRaw = props._levels;
    const levels: HexCandidateSupportLevel[] =
      typeof levelsRaw === "string" ? JSON.parse(levelsRaw) : (levelsRaw as HexCandidateSupportLevel[]) ?? [];

    if (!levels.length) {
      return `<div style="font-size:13px">${props.total_in_hex} voters<br/><span style="color:#888">No assessment data</span></div>`;
    }

    const rows = [...levels]
      .sort((a, b) => b.voter_count - a.voter_count)
      .map(
        (l) => `
          <div style="display:flex;align-items:center;gap:6px;margin:3px 0">
            <div style="width:10px;height:10px;border-radius:50%;background:${SUPPORT_LEVEL_COLORS[l.level] ?? "#6B7280"};flex-shrink:0"></div>
            <span style="min-width:80px">${SUPPORT_LEVEL_LABELS[l.level] ?? l.level}</span>
            <div style="flex:1;background:#e5e7eb;border-radius:2px;height:8px;overflow:hidden">
              <div style="width:${l.pct}%;background:${SUPPORT_LEVEL_COLORS[l.level] ?? "#6B7280"};height:100%"></div>
            </div>
            <span style="min-width:36px;text-align:right">${l.pct}%</span>
          </div>
        `
      )
      .join("");
    return `<div style="font-size:13px"><div style="font-weight:600;margin-bottom:6px">${props.total_in_hex} voters</div>${rows}</div>`;
  }, []);

  if (islandsLoading) {
    return <Page title="Candidate Support" description="Loading..."><PageSkeleton /></Page>;
  }

  return (
    <Page title="Candidate Support" description="Support levels for a specific candidate across hex cells">
      <div className="flex items-end gap-4 flex-wrap">
        <IslandSelector atolls={atolls} islandsByAtoll={islandsByAtoll} value={island} onChange={setIsland} />

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Candidate</label>
          <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
            <SelectTrigger className="w-[300px] mt-1.5">
              <SelectValue placeholder="Select candidate" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.ID} value={c.ID}>
                  {c.Name} ({c.CandidateType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && island && selectedCandidate && (
          <Badge variant="secondary" className="mb-1 animate-pulse">Loading...</Badge>
        )}
      </div>

      {island && selectedCandidate && (
        <div className="relative mt-4">
          <HexMap
            geojson={processedGeo ?? null}
            fillColorExpr={fillColorExpr}
            buildPopupHtml={buildPopupHtml}
            className="h-[600px] w-full rounded-md"
          />
          <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-md">
            <p className="text-xs font-semibold mb-2">Support Level</p>
            <div className="space-y-1">
              {Object.entries(SUPPORT_LEVEL_LABELS).map(([level, label]) => (
                <div key={level} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: SUPPORT_LEVEL_COLORS[level] }} />
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
