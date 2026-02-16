"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { SupportLevelBadge } from "@/components/campaign/support-level-badge";
import { logSupport } from "@/lib/actions/campaign";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { SupportAssessment, CandidateView } from "@/lib/types";

const GLOBAL_TYPES = ["president", "mayor", "wdc_president"];
const normalizeType = (t: string) => t.toLowerCase().replace(/\s+/g, "_");

interface SupportFormProps {
  constituentId: string;
  constituencyId: string;
  history: SupportAssessment[];
  candidates: CandidateView[];
}

const supportLevels = [
  { value: "strong_supporter", label: "Strong Supporter" },
  { value: "leaning", label: "Leaning" },
  { value: "undecided", label: "Undecided" },
  { value: "soft_opposition", label: "Soft Opposition" },
  { value: "hard_opposition", label: "Hard Opposition" },
];

export function SupportForm({ constituentId, constituencyId, history, candidates: allCandidates }: SupportFormProps) {
  const candidates = allCandidates.filter(
    (c) =>
      GLOBAL_TYPES.includes(normalizeType(c.CandidateType)) ||
      (c.Constituencies ?? []).includes(constituencyId)
  );
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [confidence, setConfidence] = useState(3);
  const [assessedBy, setAssessedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const candidateMap = Object.fromEntries(
    candidates.map((c) => [c.ID, c])
  );

  function toggleCandidate(id: string) {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const candidateIds = Array.from(selectedCandidates);
        if (candidateIds.length === 0) {
          await logSupport(constituentId, {
            level,
            confidence,
            assessed_by: assessedBy,
            notes: notes || undefined,
          });
        } else {
          await Promise.all(
            candidateIds.map((cid) =>
              logSupport(constituentId, {
                level,
                confidence,
                assessed_by: assessedBy,
                notes: notes || undefined,
                candidate_id: cid,
              })
            )
          );
        }
        const count = Math.max(candidateIds.length, 1);
        toast.success(`${count} assessment${count > 1 ? "s" : ""} logged`);
        setOpen(false);
        setLevel("");
        setSelectedCandidates(new Set());
        setConfidence(3);
        setAssessedBy("");
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
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((assessment) => (
                <div
                  key={assessment.ID}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <SupportLevelBadge level={assessment.Level} />
                    {assessment.CandidateID && candidateMap[assessment.CandidateID] && (
                      <span className="text-xs text-muted-foreground ml-2">
                        for #{candidateMap[assessment.CandidateID].Number} {candidateMap[assessment.CandidateID].Name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">
                      Confidence: {assessment.Confidence}/5
                    </span>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{assessment.AssessedBy}</p>
                    <p>{formatDateTime(assessment.AssessedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="space-y-1">
              <Label>Support Level</Label>
              <Select value={level} onValueChange={setLevel} required>
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
            {candidates.length > 0 && (
              <div className="space-y-1">
                <Label>Candidates {selectedCandidates.size > 0 && `(${selectedCandidates.size})`}</Label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
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
            <Rating value={confidence} onChange={setConfidence} max={5} label="Confidence" />
            <div className="space-y-1">
              <Label>Assessed By</Label>
              <Input
                value={assessedBy}
                onChange={(e) => setAssessedBy(e.target.value)}
                required
              />
            </div>
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
