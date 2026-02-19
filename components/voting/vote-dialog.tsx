"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GenderBadge } from "@/components/shared/gender-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { recordVote, updateVote, deleteVote } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BoxVoter, CandidateView, Party } from "@/lib/types";

interface VoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voter: BoxVoter;
  candidates: CandidateView[];
  parties: Party[];
  constituencyId: string;
}

export function VoteDialog({
  open,
  onOpenChange,
  voter,
  candidates,
  parties,
  constituencyId,
}: VoteDialogProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!voter.VotingRecordID;

  const partyMap = Object.fromEntries(parties.map((p) => [p.ID, p]));

  // Pre-select candidates from existing exit polls
  const initialSelected = new Set(voter.ExitPolls?.map((ep) => ep.CandidateID) ?? []);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(initialSelected);

  // Filter candidates to those in this constituency
  const relevantCandidates = candidates.filter((c) =>
    c.Constituencies?.includes(constituencyId)
  );

  // Group by candidate type
  const grouped = relevantCandidates.reduce<Record<string, CandidateView[]>>((acc, c) => {
    const type = c.CandidateType || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(c);
    return acc;
  }, {});

  // Single-seat types: only one candidate per type
  const singleSeatTypes = new Set(["Mayor", "President", "WDC President"]);
  const isSingleSeat = (type: string) => singleSeatTypes.has(type);

  const toggleCandidate = (id: string, type: string) => {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (isSingleSeat(type)) {
          const sameTypeCandidates = grouped[type] ?? [];
          for (const c of sameTypeCandidates) {
            next.delete(c.ID);
          }
        }
        next.add(id);
      }
      return next;
    });
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["boxVoters"] });
    queryClient.invalidateQueries({ queryKey: ["ballotBoxes"] });
    queryClient.invalidateQueries({ queryKey: ["turnout"] });
  };

  const handleSubmit = () => {
    const candidateIds = Array.from(selectedCandidates);

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateVote(voter.VotingRecordID!, {
            candidate_ids: candidateIds.length > 0 ? candidateIds : undefined,
          });
          toast.success("Vote updated");
        } else {
          await recordVote({
            constituent_id: voter.ID,
            constituency_id: constituencyId,
            candidate_ids: candidateIds.length > 0 ? candidateIds : undefined,
          });
          toast.success(`Vote recorded for ${voter.FullName}`);
        }
        invalidate();
        onOpenChange(false);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const handleDelete = () => {
    if (!voter.VotingRecordID) return;
    startTransition(async () => {
      try {
        await deleteVote(voter.VotingRecordID!);
        toast.success("Vote deleted");
        invalidate();
        onOpenChange(false);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const typeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Vote" : "Record Vote"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 border rounded-md bg-muted/50">
            <p className="font-medium">{voter.FullName}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <GenderBadge sex={voter.Sex} />
              {voter.Age != null && <span>{voter.Age} yrs</span>}
              {voter.PermanentAddress && (
                <>
                  <span>·</span>
                  <span className="truncate">{voter.PermanentAddress}</span>
                </>
              )}
            </div>
          </div>

          {Object.keys(grouped).length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Exit Poll (optional)</Label>
              {Object.entries(grouped).map(([type, typeCandidates]) => (
                <div key={type} className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {typeLabel(type)}
                  </p>
                  <div className="space-y-1.5">
                    {typeCandidates.map((c) => {
                      const party = c.PartyID ? partyMap[c.PartyID] : null;
                      return (
                        <label
                          key={c.ID}
                          className="flex items-center gap-2.5 p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedCandidates.has(c.ID)}
                            onCheckedChange={() => toggleCandidate(c.ID, type)}
                          />
                          <CandidateLabel candidate={c} party={party} />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEdit && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="sm:mr-auto"
            >
              Delete Vote
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Update" : "Record Vote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CandidateLabel({ candidate: c, party }: { candidate: CandidateView; party: Party | null }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {c.Number > 0 && (
        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
          #{c.Number}
        </span>
      )}
      <span className="text-sm truncate">{c.Name}{c.Nickname ? ` (${c.Nickname})` : ""}</span>
      {party && (
        <span
          className="shrink-0 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold text-white leading-none"
          style={{ backgroundColor: party.Color }}
        >
          {party.Code}
        </span>
      )}
    </div>
  );
}
