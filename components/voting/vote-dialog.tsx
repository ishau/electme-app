"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import type { BoxVoter, CandidateView } from "@/lib/types";

interface VoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voter: BoxVoter;
  candidates: CandidateView[];
  constituencyId: string;
}

export function VoteDialog({
  open,
  onOpenChange,
  voter,
  candidates,
  constituencyId,
}: VoteDialogProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!voter.VotingRecordID;

  // Pre-select candidates from existing exit polls
  const initialSelected = new Set(voter.ExitPolls?.map((ep) => ep.CandidateID) ?? []);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(initialSelected);
  const [notes, setNotes] = useState("");

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

  const toggleCandidate = (id: string) => {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
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
            notes: notes || undefined,
          });
          toast.success("Vote updated");
        } else {
          await recordVote({
            constituent_id: voter.ID,
            constituency_id: constituencyId,
            candidate_ids: candidateIds.length > 0 ? candidateIds : undefined,
            notes: notes || undefined,
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
            <p className="text-sm text-muted-foreground">{voter.MaskedNationalID}</p>
          </div>

          {Object.keys(grouped).length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Exit Poll (optional)</Label>
              {Object.entries(grouped).map(([type, typeCandidates]) => (
                <div key={type} className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {typeLabel(type)}
                  </p>
                  {typeCandidates.map((c) => (
                    <label
                      key={c.ID}
                      className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCandidates.has(c.ID)}
                        onChange={() => toggleCandidate(c.ID)}
                        className="rounded"
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        {c.Number > 0 && (
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            #{c.Number}
                          </span>
                        )}
                        <span className="text-sm truncate">{c.Name}</span>
                        {c.IsOwnCandidate && (
                          <span className="text-xs text-primary font-medium shrink-0">Ours</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
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
