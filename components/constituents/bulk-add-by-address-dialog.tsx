"use client";

import { useEffect, useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
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
import {
  fetchVotersByAddress,
  bulkLogSupport,
  bulkLogOutreach,
} from "@/lib/actions/campaign";
import type { Constituent, CandidateView } from "@/lib/types";
import { Check, Loader2 } from "lucide-react";

interface AddressSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  islandId: string;
  islandName: string;
  constituencyId: string;
  candidates: CandidateView[];
}

const supportLevels = [
  { value: "strong_supporter", label: "Strong Supporter" },
  { value: "leaning", label: "Leaning" },
  { value: "undecided", label: "Undecided" },
  { value: "soft_opposition", label: "Soft Opposition" },
  { value: "hard_opposition", label: "Hard Opposition" },
];

const outcomes = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
  { value: "not_home", label: "Not Home" },
  { value: "refused", label: "Refused" },
];

export function AddressSupportDialog({
  open,
  onOpenChange,
  address,
  islandId,
  islandName,
  constituencyId,
  candidates,
}: AddressSupportDialogProps) {
  const [voters, setVoters] = useState<Constituent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Support fields
  const [level, setLevel] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [confidence, setConfidence] = useState(3);
  const [assessedBy, setAssessedBy] = useState("");
  const [notes, setNotes] = useState("");

  // Outreach fields
  const [outcome, setOutcome] = useState("");

  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  // Fetch voters when dialog opens
  useEffect(() => {
    if (open && address && islandId) {
      setLoading(true);
      setDone(false);
      fetchVotersByAddress(address, islandId, constituencyId).then((v) => {
        setVoters(v);
        setSelected(new Set(v.map((voter) => voter.ID)));
        setLoading(false);
      });
    }
  }, [open, address, islandId, constituencyId]);

  function reset() {
    setVoters([]);
    setSelected(new Set());
    setLevel("");
    setSelectedCandidates(new Set());
    setConfidence(3);
    setAssessedBy("");
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

  function toggleCandidate(id: string) {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (selected.size === 0 || !level || !assessedBy) return;

    const ids = Array.from(selected);

    startTransition(async () => {
      try {
        // Log support for all selected voters (× selected candidates)
        const candidateIds = Array.from(selectedCandidates);
        const supportResult = await bulkLogSupport({
          constituent_ids: ids,
          level,
          confidence,
          assessed_by: assessedBy,
          candidate_ids: candidateIds.length > 0 ? candidateIds : undefined,
          notes: notes || undefined,
        });

        // If outreach outcome is set, also log door-to-door outreach
        if (outcome) {
          await bulkLogOutreach({
            constituent_ids: ids,
            method: "door_to_door",
            outcome,
            contacted_by: assessedBy,
            notes: notes || undefined,
          });
        }

        const msg = `${supportResult.Succeeded} voter${supportResult.Succeeded === 1 ? "" : "s"} assessed`;
        toast.success(msg);
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
                <SupportLevelBadge level={level} />
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
            {/* Voter list with selection */}
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">
                  {voters.length} voter{voters.length === 1 ? "" : "s"} at this address
                </Label>
                <Button type="button" variant="ghost" size="sm" onClick={toggleAll}>
                  {selected.size === voters.length ? "Deselect all" : "Select all"}
                </Button>
              </div>
              {voters.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No voters found at this address.
                </p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {voters.map((v) => (
                    <button
                      key={v.ID}
                      type="button"
                      onClick={() => toggleVoter(v.ID)}
                      className={`w-full flex items-center justify-between p-2 rounded-md border text-left text-sm transition-colors ${
                        selected.has(v.ID)
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30 opacity-50"
                      }`}
                    >
                      <div>
                        <span className="font-medium">{v.FullName}</span>
                        <span className="text-muted-foreground ml-2">{v.FullNationalID ?? v.MaskedNationalID}</span>
                      </div>
                      <Badge variant="outline">{v.Sex}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {voters.length > 0 && (
              <>
                {/* Support assessment fields */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-medium">Support Assessment</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Support Level</Label>
                      <Select value={level} onValueChange={setLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportLevels.map((l) => (
                            <SelectItem key={l.value} value={l.value}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Rating value={confidence} onChange={setConfidence} max={5} label="Confidence" />
                  </div>

                  {candidates.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">Candidates {selectedCandidates.size > 0 && `(${selectedCandidates.size})`}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {candidates.map((c) => (
                          <button
                            key={c.ID}
                            type="button"
                            onClick={() => toggleCandidate(c.ID)}
                            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                              selectedCandidates.has(c.ID)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background hover:bg-accent"
                            }`}
                          >
                            #{c.Number} {c.Name}
                          </button>
                        ))}
                      </div>
                      {selectedCandidates.size === 0 && (
                        <p className="text-xs text-muted-foreground">Tap to select. None = general assessment.</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Assessed By</Label>
                      <Input
                        value={assessedBy}
                        onChange={(e) => setAssessedBy(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Visit Outcome</Label>
                      <Select value={outcome} onValueChange={setOutcome}>
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
                      rows={2}
                      placeholder="Optional notes for all selected voters"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isPending || selected.size === 0 || !level || !assessedBy}
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
