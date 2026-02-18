"use client";

import { useRouter } from "next/navigation";
import { useTransition, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { recordVote } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Group, Constituency, TurnoutStats, Constituent } from "@/lib/types";

interface VotingViewProps {
  group: Group | null;
  constituencies: Constituency[];
  turnout: TurnoutStats | null;
  nonVoters: string[];
  voters: Constituent[];
  currentConstituencyId: string;
}

export function VotingView({
  group,
  constituencies,
  turnout,
  nonVoters,
  voters,
  currentConstituencyId,
}: VotingViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const voterMap = useMemo(
    () => Object.fromEntries(voters.map((v) => [v.ID, v])),
    [voters]
  );

  const handleConstituencyChange = (value: string) => {
    const params = new URLSearchParams();
    if (value) params.set("constituency_id", value);
    const qs = params.toString();
    router.push(`/voting${qs ? `?${qs}` : ""}`);
  };

  const handleQuickRecord = (cId: string) => {
    startTransition(async () => {
      try {
        await recordVote({
          constituent_id: cId,
          constituency_id: currentConstituencyId,
          recorded_by: "Quick Record",
        });
        queryClient.invalidateQueries({ queryKey: ["turnout"] });
        queryClient.invalidateQueries({ queryKey: ["nonVoters"] });
        const voter = voterMap[cId];
        toast.success(voter ? `Vote recorded for ${voter.FullName}` : "Vote recorded");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <>
      <Select
        value={currentConstituencyId}
        onValueChange={(v) => handleConstituencyChange(v ?? "")}
        items={Object.fromEntries((group?.Constituencies ?? []).map((cId) => {
          const c = constituencies.find((x) => x.ID === cId);
          return [cId, c ? `${c.Code} — ${c.Name}` : cId.slice(0, 8)];
        }))}
      >
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
                            <div
                              className="h-full bg-gradient-to-r from-accent/80 to-accent rounded-full"
                              style={{ width: `${percent}%`, transition: "width 0.4s ease" }}
                            />
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
              <CardTitle className="text-base">
                Non-Voters
                <Badge variant="secondary" className="ml-2">{nonVoters.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nonVoters.length === 0 ? (
                <p className="text-sm text-muted-foreground">Everyone has voted!</p>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-1.5">
                    {nonVoters.map((id) => {
                      const voter = voterMap[id];
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {voter?.FullName ?? id.slice(0, 12) + "..."}
                            </p>
                            {voter && (
                              <p className="text-xs text-muted-foreground">{voter.FullNationalID ?? voter.MaskedNationalID}</p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 ml-2"
                            onClick={() => handleQuickRecord(id)}
                            disabled={isPending}
                          >
                            Mark Voted
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
