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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Rating } from "@/components/ui/rating";
import { logSupport } from "@/lib/actions/campaign";
import { toast } from "sonner";
import { ClipboardPlus } from "lucide-react";

interface AssessVoterDialogProps {
  candidateId: string;
}

const supportLevels = [
  { value: "strong_supporter", label: "Strong Supporter" },
  { value: "leaning", label: "Leaning" },
  { value: "undecided", label: "Undecided" },
  { value: "soft_opposition", label: "Soft Opposition" },
  { value: "hard_opposition", label: "Hard Opposition" },
];

export function AssessVoterDialog({ candidateId }: AssessVoterDialogProps) {
  const [open, setOpen] = useState(false);
  const [constituentId, setConstituentId] = useState("");
  const [level, setLevel] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [assessedBy, setAssessedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setConstituentId("");
    setLevel("");
    setConfidence(3);
    setAssessedBy("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!constituentId.trim() || !level || !assessedBy.trim()) return;

    startTransition(async () => {
      try {
        await logSupport(constituentId.trim(), {
          candidate_id: candidateId,
          level,
          confidence,
          assessed_by: assessedBy.trim(),
          notes: notes || undefined,
        });
        toast.success("Assessment logged");
        setOpen(false);
        resetForm();
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardPlus className="h-4 w-4 mr-2" />
          Assess Voter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assess Voter</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Voter ID</Label>
            <Input
              placeholder="Paste constituent ID"
              value={constituentId}
              onChange={(e) => setConstituentId(e.target.value)}
              required
            />
          </div>
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
  );
}
