"use client";

import { useState, useCallback, useMemo } from "react";
import { useHexPartySupport } from "@/lib/hooks/use-hex";
import { useParties } from "@/lib/hooks/use-parties";
import { HexMap } from "@/components/maps/hex-map";
import { Page } from "@/components/shared/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { HexPartySupportEntry, HexCandidateSupportLevel } from "@/lib/types";

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

const LEVEL_WEIGHTS: Record<string, number> = {
  strong_supporter: 2,
  leaning: 1,
  undecided: 0,
  soft_opposition: -1,
  hard_opposition: -2,
};

function partyScore(levels: HexCandidateSupportLevel[]): number {
  let weightedSum = 0;
  let totalVoters = 0;
  for (const l of levels) {
    weightedSum += (LEVEL_WEIGHTS[l.level] ?? 0) * l.voter_count;
    totalVoters += l.voter_count;
  }
  return totalVoters > 0 ? weightedSum / totalVoters : 0;
}

function parseParties(raw: unknown): HexPartySupportEntry[] {
  if (typeof raw === "string") return JSON.parse(raw);
  return (raw as HexPartySupportEntry[]) ?? [];
}

function parseLevels(raw: unknown): HexCandidateSupportLevel[] {
  if (typeof raw === "string") return JSON.parse(raw);
  return (raw as HexCandidateSupportLevel[]) ?? [];
}

export default function PartySupportPage() {
  const { data: parties } = useParties();
  const [selectedParty, setSelectedParty] = useState("");

  const { data: partySupportGeo, isLoading } = useHexPartySupport();

  // ── Party selected: filter to that party, color by top support level ──
  const partyFilteredGeo = useMemo(() => {
    if (!partySupportGeo?.features?.length || !selectedParty) return null;

    const features = partySupportGeo.features.map((f: { type: string; geometry: unknown; properties: Record<string, unknown> }) => {
      const allParties = parseParties(f.properties.parties);
      const entry = allParties.find((p) => p.party_id === selectedParty);
      const levels = entry?.levels ?? [];
      const top = levels.length
        ? levels.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), levels[0])
        : null;

      return {
        type: "Feature",
        geometry: f.geometry,
        properties: {
          hex: f.properties.hex,
          total_in_hex: f.properties.total_in_hex,
          _levels: JSON.stringify(levels),
          top_level: top?.level ?? "none",
        },
      };
    });

    return { type: "FeatureCollection", features };
  }, [partySupportGeo, selectedParty]);

  const partyFillExpr = useMemo(() => {
    const expr: unknown[] = ["match", ["get", "top_level"]];
    for (const [level, color] of Object.entries(SUPPORT_LEVEL_COLORS)) {
      expr.push(level, color);
    }
    expr.push("#6B7280");
    return expr;
  }, []);

  const partyPopupBuilder = useCallback((props: Record<string, unknown>) => {
    const levels = parseLevels(props._levels);

    if (!levels.length) {
      return `<div style="font-size:13px">${props.total_in_hex} voters<br/><span style="color:#888">No assessment data for this party</span></div>`;
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

  // ── No party selected: color hex by the party with highest weighted score ──
  const aggregateGeo = useMemo(() => {
    if (!partySupportGeo?.features?.length || selectedParty) return null;

    const features = partySupportGeo.features.map((f: { type: string; geometry: unknown; properties: Record<string, unknown> }) => {
      const allParties = parseParties(f.properties.parties);

      let winnerColor = "#6B7280";
      let winnerCode = "";
      let bestScore = -Infinity;

      for (const p of allParties) {
        const s = partyScore(p.levels);
        if (s > bestScore) {
          bestScore = s;
          winnerColor = p.party_color;
          winnerCode = p.party_code;
        }
      }

      return {
        type: "Feature",
        geometry: f.geometry,
        properties: {
          hex: f.properties.hex,
          total_in_hex: f.properties.total_in_hex,
          _winner_color: winnerColor,
          _winner_code: winnerCode,
          _winner_score: bestScore === -Infinity ? "0" : bestScore.toFixed(2),
          _parties: JSON.stringify(allParties),
        },
      };
    });

    return { type: "FeatureCollection", features };
  }, [partySupportGeo, selectedParty]);

  const aggregateFillExpr = ["get", "_winner_color"];

  const aggregatePopupBuilder = useCallback((props: Record<string, unknown>) => {
    const allParties: HexPartySupportEntry[] =
      typeof props._parties === "string" ? JSON.parse(props._parties as string) : [];

    const sections = [...allParties]
      .sort((a, b) => partyScore(b.levels) - partyScore(a.levels))
      .map((p) => {
        const score = partyScore(p.levels);
        const levelRows = [...p.levels]
          .sort((a, b) => b.voter_count - a.voter_count)
          .map(
            (l) => `
              <div style="display:flex;align-items:center;gap:4px;margin:2px 0 2px 16px;font-size:11px">
                <div style="width:8px;height:8px;border-radius:50%;background:${SUPPORT_LEVEL_COLORS[l.level] ?? "#6B7280"};flex-shrink:0"></div>
                <span style="min-width:64px">${SUPPORT_LEVEL_LABELS[l.level] ?? l.level}</span>
                <span>${l.voter_count} (${l.pct}%)</span>
              </div>
            `
          )
          .join("");
        return `
          <div style="margin:6px 0">
            <div style="display:flex;align-items:center;gap:6px;font-weight:600">
              <div style="width:10px;height:10px;border-radius:50%;background:${p.party_color};flex-shrink:0"></div>
              ${p.party_code}
              <span style="font-weight:400;color:#888;font-size:11px">score: ${score.toFixed(1)}</span>
            </div>
            ${levelRows}
          </div>
        `;
      })
      .join("");

    return `<div style="font-size:13px"><div style="font-weight:600;margin-bottom:4px">${props.total_in_hex} voters</div>${sections}</div>`;
  }, []);

  // Extract party legend from aggregate data
  const aggregateLegend = useMemo(() => {
    if (!partySupportGeo?.features?.length) return [];
    const seen = new Map<string, string>();
    for (const f of partySupportGeo.features) {
      const allParties = parseParties(f.properties.parties);
      for (const p of allParties) {
        if (!seen.has(p.party_code)) seen.set(p.party_code, p.party_color);
      }
    }
    return Array.from(seen.entries()).map(([code, color]) => ({ code, color }));
  }, [partySupportGeo]);

  // Pick the right config
  const isPartyMode = !!selectedParty;
  const geojson = isPartyMode ? partyFilteredGeo : aggregateGeo;
  const fillExpr = isPartyMode ? partyFillExpr : aggregateFillExpr;
  const popupBuilder = isPartyMode ? partyPopupBuilder : aggregatePopupBuilder;

  return (
    <Page title="Party Support" description="Support levels across hex cells, overall or per party">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Party</label>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Select value={selectedParty} onValueChange={setSelectedParty}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="All parties (by score)" />
              </SelectTrigger>
              <SelectContent>
                {(parties ?? []).map((p) => (
                  <SelectItem key={p.ID} value={p.ID}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.Color }} />
                      {p.Code} - {p.Name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedParty && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedParty("")}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isLoading && <Badge variant="secondary" className="mb-1 animate-pulse">Loading...</Badge>}
      </div>

      <div className="relative mt-4">
        <HexMap
          geojson={geojson ?? null}
          fillColorExpr={fillExpr}
          buildPopupHtml={popupBuilder}
          className="h-[600px] w-full rounded-md"
        />

        <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-md">
          {isPartyMode ? (
            <>
              <p className="text-xs font-semibold mb-2">Support Level</p>
              <div className="space-y-1">
                {Object.entries(SUPPORT_LEVEL_LABELS).map(([level, label]) => (
                  <div key={level} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: SUPPORT_LEVEL_COLORS[level] }} />
                    <span className="text-xs">{label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold mb-2">Top Party (by support score)</p>
              <div className="space-y-1">
                {aggregateLegend.map(({ code, color }) => (
                  <div key={code} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs">{code}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
