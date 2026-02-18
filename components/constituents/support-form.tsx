"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { SupportLevelBadge } from "@/components/campaign/support-level-badge";
import { logSupport } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime, supportLevelColor, supportLevelLabel } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SupportAssessment, CandidateView, Party } from "@/lib/types";

const GLOBAL_TYPES = ["president", "mayor", "wdc_president"];
const normalizeType = (t: string) => t.toLowerCase().replace(/\s+/g, "_");

const TYPE_ORDER: Record<string, number> = {
  mayor: 0,
  president: 1,
  wdc_president: 2,
  council_member: 3,
  wdc_member: 4,
};

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  mayor: { label: "Mayor", className: "text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950" },
  president: { label: "Pres", className: "text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950" },
  wdc_president: { label: "WDC-P", className: "text-purple-600 border-purple-300 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950" },
  council_member: { label: "CM", className: "text-slate-600 border-slate-300 bg-slate-50 dark:text-slate-400 dark:border-slate-700 dark:bg-slate-900" },
  wdc_member: { label: "WDC-M", className: "text-rose-600 border-rose-300 bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:bg-rose-950" },
};

interface SupportFormProps {
  constituentId: string;
  constituencyId: string;
  history: SupportAssessment[];
  candidates: CandidateView[];
  parties: Party[];
}

const supportLevels = [
  { value: "strong_supporter", label: "SS", full: "Strong Supporter" },
  { value: "leaning", label: "L", full: "Leaning" },
  { value: "undecided", label: "U", full: "Undecided" },
  { value: "soft_opposition", label: "SO", full: "Soft Opposition" },
  { value: "hard_opposition", label: "HO", full: "Hard Opposition" },
];

const dotColors: Record<string, { idle: string; active: string }> = {
  strong_supporter: {
    idle: "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950",
    active: "bg-green-500 ring-2 ring-green-300 ring-offset-1 dark:ring-green-700 dark:ring-offset-background",
  },
  leaning: {
    idle: "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950",
    active: "bg-yellow-400 ring-2 ring-yellow-300 ring-offset-1 dark:ring-yellow-600 dark:ring-offset-background",
  },
  undecided: {
    idle: "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800",
    active: "bg-gray-400 ring-2 ring-gray-300 ring-offset-1 dark:ring-gray-500 dark:ring-offset-background",
  },
  soft_opposition: {
    idle: "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950",
    active: "bg-orange-400 ring-2 ring-orange-300 ring-offset-1 dark:ring-orange-600 dark:ring-offset-background",
  },
  hard_opposition: {
    idle: "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950",
    active: "bg-red-500 ring-2 ring-red-300 ring-offset-1 dark:ring-red-700 dark:ring-offset-background",
  },
};

const legendDotColors: Record<string, string> = {
  strong_supporter: "bg-green-500",
  leaning: "bg-yellow-400",
  undecided: "bg-gray-400",
  soft_opposition: "bg-orange-400",
  hard_opposition: "bg-red-500",
};

function SupportDots({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (level: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {supportLevels.map((sl) => {
        const isActive = value === sl.value;
        const colors = dotColors[sl.value];
        return (
          <button
            key={sl.value}
            type="button"
            title={sl.full}
            onClick={() => onChange(sl.value)}
            className={cn(
              "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
              isActive ? colors.active : colors.idle
            )}
          />
        );
      })}
    </div>
  );
}

export function SupportForm({ constituentId, constituencyId, history, candidates: allCandidates, parties }: SupportFormProps) {
  const queryClient = useQueryClient();
  const partyMap = Object.fromEntries(parties.map((p) => [p.ID, p]));
  const candidates = allCandidates
    .filter(
      (c) =>
        GLOBAL_TYPES.includes(normalizeType(c.CandidateType)) ||
        (c.Constituencies ?? []).includes(constituencyId)
    )
    .sort((a, b) => {
      const aOwn = a.IsOwnCandidate ? 0 : 1;
      const bOwn = b.IsOwnCandidate ? 0 : 1;
      if (aOwn !== bOwn) return aOwn - bOwn;
      const aType = TYPE_ORDER[normalizeType(a.CandidateType)] ?? 99;
      const bType = TYPE_ORDER[normalizeType(b.CandidateType)] ?? 99;
      return aType - bType;
    });
  const [open, setOpen] = useState(false);
  const [candidateLevels, setCandidateLevels] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState(3);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const candidateMap = Object.fromEntries(
    candidates.map((c) => [c.ID, c])
  );

  function toggleLevel(candidateId: string, level: string) {
    setCandidateLevels((prev) => {
      const next = { ...prev };
      if (next[candidateId] === level) {
        delete next[candidateId];
      } else {
        next[candidateId] = level;
      }
      return next;
    });
  }

  function setAll(level: string) {
    setCandidateLevels((prev) => {
      const allSame = candidates.every((c) => prev[c.ID] === level);
      if (allSame) {
        return {};
      }
      const next: Record<string, string> = {};
      for (const c of candidates) {
        next[c.ID] = level;
      }
      return next;
    });
  }

  const assessedCount = Object.keys(candidateLevels).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const entries = Object.entries(candidateLevels);
        if (entries.length === 0) {
          toast.error("Select a support level for at least one candidate");
          return;
        }
        await Promise.all(
          entries.map(([candidateId, level]) =>
            logSupport(constituentId, {
              level,
              confidence,
              notes: notes || undefined,
              candidate_id: candidateId,
            })
          )
        );
        queryClient.invalidateQueries({ queryKey: ["supportHistory"] });
        queryClient.invalidateQueries({ queryKey: ["supportSummary"] });
        queryClient.invalidateQueries({ queryKey: ["candidateSummaries"] });
        queryClient.invalidateQueries({ queryKey: ["candidateSupport"] });
        toast.success(`${entries.length} assessment${entries.length > 1 ? "s" : ""} logged`);
        setOpen(false);
        setCandidateLevels({});
        setConfidence(3);
        setNotes("");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Support</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Log Assessment
          </Button>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <ScrollArea className="max-h-80"><div className="space-y-4">
              {(() => {
                const partyMap2 = Object.fromEntries(parties.map((p) => [p.ID, p]));
                // Group by candidate
                const byCand = new Map<string, SupportAssessment[]>();
                for (const a of history) {
                  const key = a.CandidateID ?? "_none";
                  if (!byCand.has(key)) byCand.set(key, []);
                  byCand.get(key)!.push(a);
                }
                for (const arr of byCand.values()) {
                  arr.sort((a, b) => new Date(b.AssessedAt).getTime() - new Date(a.AssessedAt).getTime());
                }
                // Group by type
                const byType = new Map<string, { candId: string; cand: CandidateView | undefined; assessments: SupportAssessment[] }[]>();
                for (const [candId, assessments] of byCand) {
                  const cand = candId !== "_none" ? candidateMap[candId] : undefined;
                  const type = cand ? normalizeType(cand.CandidateType) : "_unknown";
                  if (!byType.has(type)) byType.set(type, []);
                  byType.get(type)!.push({ candId, cand, assessments });
                }
                const sortedTypes = [...byType.entries()].sort(
                  ([a], [b]) => (TYPE_ORDER[a] ?? 99) - (TYPE_ORDER[b] ?? 99)
                );

                return sortedTypes.map(([type, candEntries]) => (
                  <div key={type}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      {TYPE_BADGE[type]?.label ?? type.replace(/_/g, " ")}
                    </h4>
                    <div className="space-y-1.5">
                      {candEntries.map(({ candId, cand, assessments }) => {
                        const latest = assessments[0];
                        const older = assessments.slice(1);
                        const candParty = cand?.PartyID ? partyMap2[cand.PartyID] : undefined;
                        return (
                          <div key={candId} className="py-1.5 px-2 border rounded text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: candParty?.Color ?? "#a3a3a3" }}
                                title={candParty?.Code ?? "IND"}
                              />
                              <span className="font-medium truncate">
                                {cand ? `#${cand.Number} ${cand.Name}` : "General"}
                              </span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto">
                                {formatDateTime(latest.AssessedAt)}
                              </span>
                              <SupportLevelBadge level={latest.Level} />
                            </div>
                            <div className="flex items-center gap-3 mt-1 ml-5 text-xs text-muted-foreground">
                              <span>by {latest.AssessedBy}</span>
                              <span>{latest.Confidence}/5 conf.</span>
                              {latest.Notes && <span className="truncate">{latest.Notes}</span>}
                            </div>
                            {older.length > 0 && (
                              <div className="mt-1.5 ml-5 space-y-1">
                                {older.map((h) => (
                                  <div key={h.ID} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className={`w-2 h-2 rounded-sm shrink-0 ${supportLevelColor(h.Level).split(" ")[0]}`} />
                                    <span>{supportLevelLabel(h.Level)}</span>
                                    <span>—</span>
                                    <span>{formatDateTime(h.AssessedAt)}</span>
                                    <span className="text-muted-foreground/60">by {h.AssessedBy}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div></ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">No assessments yet.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Support Assessment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {candidates.length > 0 && (
              <div className="space-y-1">
                <Label>
                  Candidates{assessedCount > 0 && ` (${assessedCount})`}
                </Label>
                <div className="rounded-md border">
                  {/* Set all row — sticky header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-muted border-b">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Set all</span>
                    <SupportDots value={undefined} onChange={setAll} />
                  </div>
                  {/* Candidate rows */}
                  <ScrollArea className="max-h-56"><div className="divide-y">
                    {candidates.map((c) => {
                      const party = c.PartyID ? partyMap[c.PartyID] : null;
                      const typeBadge = TYPE_BADGE[normalizeType(c.CandidateType)];
                      return (
                        <div
                          key={c.ID}
                          className="flex items-center justify-between px-3 py-2"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 mr-3">
                            <span
                              className="shrink-0 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold text-white leading-none"
                              style={{ backgroundColor: party ? party.Color : "#9ca3af" }}
                            >
                              {party ? party.Code : "IDP"}
                            </span>
                            <span className="text-sm font-medium truncate">
                              #{c.Number} {c.Name}
                            </span>
                            {typeBadge && (
                              <span className={cn("shrink-0 inline-flex items-center rounded border px-1 py-0.5 text-[10px] font-medium leading-none", typeBadge.className)}>
                                {typeBadge.label}
                              </span>
                            )}
                          </div>
                          <SupportDots
                            value={candidateLevels[c.ID]}
                            onChange={(level) => toggleLevel(c.ID, level)}
                          />
                        </div>
                      );
                    })}
                  </div></ScrollArea>
                </div>
                {/* Legend */}
                <div className="flex gap-3 justify-end pt-0.5">
                  {supportLevels.map((sl) => (
                    <div key={sl.value} className="flex items-center gap-1">
                      <span className={cn("w-2.5 h-2.5 rounded-full", legendDotColors[sl.value])} />
                      <span className="text-[10px] text-muted-foreground">{sl.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Rating value={confidence} onChange={setConfidence} max={5} label="Confidence" />
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || assessedCount === 0}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
