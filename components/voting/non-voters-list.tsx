"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recordVote } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface NonVotersListProps {
  nonVoterIds: string[];
  constituencyId?: string;
}

export function NonVotersList({ nonVoterIds, constituencyId }: NonVotersListProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const handleQuickRecord = (constituentId: string) => {
    if (!constituencyId) {
      toast.error("No constituency selected");
      return;
    }
    startTransition(async () => {
      try {
        await recordVote({
          constituent_id: constituentId,
          constituency_id: constituencyId,
          recorded_by: "Quick Record",
        });
        queryClient.invalidateQueries({ queryKey: ["turnout"] });
        queryClient.invalidateQueries({ queryKey: ["nonVoters"] });
        toast.success("Vote recorded");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Non-Voters ({nonVoterIds.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {nonVoterIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Everyone has voted!</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {nonVoterIds.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span className="font-mono text-xs">{id.slice(0, 12)}...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRecord(id)}
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
  );
}
