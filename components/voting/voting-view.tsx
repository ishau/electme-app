"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TurnoutCard } from "@/components/voting/turnout-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordVote } from "@/lib/actions/voting";
import { toast } from "sonner";
import type { Group, Constituency, TurnoutStats } from "@/lib/types";
import { useState } from "react";

interface VotingViewProps {
  group: Group;
  constituencies: Constituency[];
  turnout: TurnoutStats | null;
  nonVoters: string[];
  currentConstituencyId: string;
}

export function VotingView({
  group,
  constituencies,
  turnout,
  nonVoters,
  currentConstituencyId,
}: VotingViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [constituentId, setConstituentId] = useState("");
  const [recordedBy, setRecordedBy] = useState("");
  const [notes, setNotes] = useState("");

  const handleConstituencyChange = (value: string) => {
    const params = new URLSearchParams();
    if (value) params.set("constituency_id", value);
    const qs = params.toString();
    router.push(`/voting${qs ? `?${qs}` : ""}`);
  };

  const handleRecordVote = (cId: string) => {
    startTransition(async () => {
      try {
        await recordVote({
          constituent_id: cId,
          constituency_id: currentConstituencyId,
          recorded_by: recordedBy || "Quick Record",
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

  const handleSubmitVote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentConstituencyId) {
      toast.error("Please select a constituency first");
      return;
    }
    handleRecordVote(constituentId);
  };

  return (
    <>
      <Select value={currentConstituencyId} onValueChange={handleConstituencyChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select constituency" />
        </SelectTrigger>
        <SelectContent>
          {(group?.Constituencies ?? []).map((cId) => {
            const c = constituencies.find((x) => x.ID === cId);
            return (
              <SelectItem key={cId} value={cId}>
                {c ? `${c.Code} — ${c.Name}` : cId.slice(0, 8)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {turnout && <TurnoutCard stats={turnout} />}

          {turnout && turnout.VotedByHour && Object.keys(turnout.VotedByHour).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Votes by Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(turnout.VotedByHour)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([hour, count]) => {
                      const maxCount = Math.max(...Object.values(turnout.VotedByHour));
                      const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={hour}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{String(hour).padStart(2, "0")}:00</span>
                            <span className="text-muted-foreground">{count} votes</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record Vote</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitVote} className="space-y-3">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Non-Voters ({nonVoters.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nonVoters.length === 0 ? (
                <p className="text-sm text-muted-foreground">Everyone has voted!</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {nonVoters.map((id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="font-mono text-xs">{id.slice(0, 12)}...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRecordVote(id)}
                        disabled={isPending}
                      >
                        Mark Voted
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
