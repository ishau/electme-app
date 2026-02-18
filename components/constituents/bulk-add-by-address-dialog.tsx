"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { SupportLevelBadge } from "@/components/campaign/support-level-badge";
import { bulkLogSupport, bulkLogOutreach } from "@/lib/mutations";
import { get } from "@/lib/api";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PaginatedResponse, Constituent, CandidateView, Party } from "@/lib/types";
import { Check, Loader2 } from "lucide-react";

const GLOBAL_TYPES = ["president", "mayor", "wdc_president"];
const normalizeType = (t: string) => t.toLowerCase().replace(/\s+/g, "_");

const TYPE_ORDER: Record<string, number> = {
  mayor: 0,
  president: 1,
  wdc_president: 2,
  member: 3,
  "member_(reserved_for_female)": 3,
  "reserved_seat_for_female": 3,
  wdc_member: 4,
};

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  mayor: { label: "Mayor", className: "text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950" },
  president: { label: "Pres", className: "text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950" },
  wdc_president: { label: "WDC-P", className: "text-purple-600 border-purple-300 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950" },
  member: { label: "CM", className: "text-slate-600 border-slate-300 bg-slate-50 dark:text-slate-400 dark:border-slate-700 dark:bg-slate-900" },
  "member_(reserved_for_female)": { label: "CM-F", className: "text-pink-600 border-pink-300 bg-pink-50 dark:text-pink-400 dark:border-pink-800 dark:bg-pink-950" },
  "reserved_seat_for_female": { label: "CM-F", className: "text-pink-600 border-pink-300 bg-pink-50 dark:text-pink-400 dark:border-pink-800 dark:bg-pink-950" },
  wdc_member: { label: "WDC-M", className: "text-rose-600 border-rose-300 bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:bg-rose-950" },
};

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

const outcomes = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
  { value: "not_home", label: "Not Home" },
  { value: "refused", label: "Refused" },
];

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

interface AddressSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  islandId: string;
  islandName: string;
  constituencyId: string;
  candidates: CandidateView[];
  parties: Party[];
}

export function AddressSupportDialog({
  open,
  onOpenChange,
  address,
  islandId,
  islandName,
  constituencyId,
  candidates: allCandidates,
  parties,
}: AddressSupportDialogProps) {
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

  const params: Record<string, string> = { address, island_id: islandId };
  if (constituencyId) params.constituency_id = constituencyId;

  const { data: votersResult, isLoading: loading } = useQuery({
    queryKey: ["addressVoters", address, islandId, constituencyId],
    queryFn: () =>
      get<PaginatedResponse<Constituent>>(`/group/constituents`, params),
    enabled: open && !!address && !!islandId,
  });

  const voters = votersResult?.data ?? [];

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Auto-select all voters when data first loads
  if (voters.length > 0 && !initialized) {
    setSelected(new Set(voters.map((v) => v.ID)));
    setInitialized(true);
  }

  // Support fields
  const [candidateLevels, setCandidateLevels] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState(3);
  const [notes, setNotes] = useState("");

  // Outreach fields
  const [outcome, setOutcome] = useState("");

  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const assessedCount = Object.keys(candidateLevels).length;

  function reset() {
    setSelected(new Set());
    setInitialized(false);
    setCandidateLevels({});
    setConfidence(3);
    setNotes("");
    setOutcome("");
    setDone(false);
  }

  function toggleVoter(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === voters.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(voters.map((v) => v.ID)));
    }
  }

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

  function handleSubmit() {
    if (selected.size === 0 || assessedCount === 0) return;

    const ids = Array.from(selected);

    startTransition(async () => {
      try {
        // Group candidates by level to minimize API calls
        const levelToCandidates: Record<string, string[]> = {};
        for (const [candidateId, level] of Object.entries(candidateLevels)) {
          if (!levelToCandidates[level]) levelToCandidates[level] = [];
          levelToCandidates[level].push(candidateId);
        }

        const results = await Promise.all(
          Object.entries(levelToCandidates).map(([level, candidateIds]) =>
            bulkLogSupport({
              constituent_ids: ids,
              level,
              confidence,
              candidate_ids: candidateIds,
              notes: notes || undefined,
            })
          )
        );

        // If outreach outcome is set, also log door-to-door outreach
        if (outcome) {
          await bulkLogOutreach({
            constituent_ids: ids,
            method: "door_to_door",
            outcome,
            notes: notes || undefined,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["supportSummary"] });
        queryClient.invalidateQueries({ queryKey: ["outreachStats"] });
        queryClient.invalidateQueries({ queryKey: ["latestSupport"] });
        queryClient.invalidateQueries({ queryKey: ["candidateSummaries"] });
        queryClient.invalidateQueries({ queryKey: ["candidateSupport"] });
        const total = results.reduce((sum, r) => sum + r.Succeeded, 0);
        toast.success(`${total} assessment${total === 1 ? "" : "s"} logged`);
        setDone(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Door-to-Door — {address}</DialogTitle>
          <DialogDescription>{islandName}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Finding voters at this address...
            </span>
          </div>
        ) : done ? (
          <>
            <div className="rounded-md border p-4 text-center">
              <Check className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="font-medium">Assessment logged for {selected.size} voter{selected.size === 1 ? "" : "s"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {assessedCount} candidate{assessedCount === 1 ? "" : "s"} assessed
                {outcome && (
                  <Badge variant="outline" className="ml-2">{outcome}</Badge>
                )}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Voter chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {voters.length} voter{voters.length === 1 ? "" : "s"} at this address
                  {voters.length > 0 && selected.size < voters.length && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({selected.size} selected)
                    </span>
                  )}
                </Label>
                {voters.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={toggleAll}>
                    {selected.size === voters.length ? "Deselect all" : "Select all"}
                  </Button>
                )}
              </div>
              {voters.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No voters found at this address.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {voters.map((v) => {
                    const isSelected = selected.has(v.ID);
                    return (
                      <button
                        key={v.ID}
                        type="button"
                        onClick={() => toggleVoter(v.ID)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-muted bg-muted/30 text-muted-foreground line-through"
                        )}
                      >
                        {v.FullName}
                        <span className={cn("text-xs", isSelected ? "text-muted-foreground" : "text-muted-foreground/60")}>
                          {v.Sex === "F" ? "F" : "M"}{v.Age != null ? ` ${v.Age}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {voters.length > 0 && (
              <>
                {/* Support assessment — per-candidate dots */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-medium">
                    Support Assessment{assessedCount > 0 && ` (${assessedCount})`}
                  </Label>

                  {candidates.length > 0 && (
                    <div className="space-y-1">
                      <div className="rounded-md border">
                        {/* Set all row — sticky header */}
                        <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-2 bg-muted border-b gap-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Set all</span>
                          <SupportDots value={undefined} onChange={setAll} />
                        </div>
                        {/* Candidate rows */}
                        <ScrollArea className="h-56"><div className="divide-y">
                          {candidates.map((c) => {
                            const party = c.PartyID ? partyMap[c.PartyID] : null;
                            const typeBadge = TYPE_BADGE[normalizeType(c.CandidateType)];
                            return (
                              <div
                                key={c.ID}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-2 gap-1"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
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

                  <div className="grid grid-cols-2 gap-3">
                    <Rating value={confidence} onChange={setConfidence} max={5} label="Confidence" />
                    <div className="space-y-1">
                      <Label className="text-xs">Visit Outcome</Label>
                      <Select
                        value={outcome}
                        onValueChange={(v) => setOutcome(v ?? "")}
                        items={Object.fromEntries(outcomes.map((o) => [o.value, o.label]))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {outcomes.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={1}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isPending || selected.size === 0 || assessedCount === 0}
                  >
                    {isPending
                      ? "Saving..."
                      : `Assess ${selected.size} voter${selected.size === 1 ? "" : "s"}`}
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
