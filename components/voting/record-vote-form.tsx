"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recordVote } from "@/lib/actions/voting";
import { toast } from "sonner";

interface RecordVoteFormProps {
  constituencyId?: string;
}

export function RecordVoteForm({ constituencyId }: RecordVoteFormProps) {
  const [constituentId, setConstituentId] = useState("");
  const [recordedBy, setRecordedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!constituencyId) {
      toast.error("Please select a constituency first");
      return;
    }
    startTransition(async () => {
      try {
        await recordVote({
          constituent_id: constituentId,
          constituency_id: constituencyId,
          recorded_by: recordedBy,
          notes: notes || undefined,
        });
        toast.success("Vote recorded");
        setConstituentId("");
        setNotes("");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record Vote</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Constituent ID</Label>
            <Input
              value={constituentId}
              onChange={(e) => setConstituentId(e.target.value)}
              placeholder="Paste constituent ID"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Recorded By</Label>
            <Input
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              placeholder="Polling agent name"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Recording..." : "Record Vote"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
