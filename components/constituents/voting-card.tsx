"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { recordVote } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface VotingCardProps {
  constituentId: string;
  constituencyId: string;
  fullName: string;
  hasVoted?: boolean;
}

export function VotingCard({ constituentId, constituencyId, fullName, hasVoted }: VotingCardProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [recordedBy, setRecordedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [justRecorded, setJustRecorded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!constituencyId) {
      toast.error("Constituency not available");
      return;
    }
    startTransition(async () => {
      try {
        await recordVote({
          constituent_id: constituentId,
          constituency_id: constituencyId,
          recorded_by: recordedBy || "Field Agent",
          notes: notes || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["turnout"] });
        queryClient.invalidateQueries({ queryKey: ["nonVoters"] });
        toast.success(`Vote recorded for ${fullName}`);
        setRecordedBy("");
        setNotes("");
        setJustRecorded(true);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const voted = hasVoted || justRecorded;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Voting Day</CardTitle>
        {voted && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Voted
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {voted ? (
          <p className="text-sm text-muted-foreground">Vote has been recorded for this voter.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Recorded By</Label>
              <Input
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                placeholder="Polling agent name"
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
        )}
      </CardContent>
    </Card>
  );
}
