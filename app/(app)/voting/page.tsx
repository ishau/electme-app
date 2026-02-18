"use client";

import Link from "next/link";
import { useGroup } from "@/lib/hooks/use-group";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { useBallotBoxes } from "@/lib/hooks/use-ballot-boxes";
import { useTurnout } from "@/lib/hooks/use-voting";
import { TurnoutCard } from "@/components/voting/turnout-card";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Box, Users, Vote } from "lucide-react";
import { useQueryState, parseAsString } from "nuqs";

export default function VotingDayPage() {
  const [constituencyId, setConstituencyId] = useQueryState(
    "constituency_id",
    parseAsString.withDefault("")
  );

  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: allConstituencies } = useConstituencies();

  const groupConstituencyIds = group?.Constituencies ?? [];
  const groupConstituencies = (allConstituencies ?? []).filter((c) =>
    groupConstituencyIds.includes(c.ID)
  );

  const selectedId = constituencyId || groupConstituencies[0]?.ID || "";
  const activeConstituency = groupConstituencies.find((c) => c.ID === selectedId);

  const { data: boxes, isLoading: boxesLoading } = useBallotBoxes(selectedId);
  const { data: turnout } = useTurnout(selectedId);

  if (groupLoading) {
    return (
      <Page title="Voting Day" description="Loading...">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Voting Day"
      description={activeConstituency ? `${activeConstituency.Code} — ${activeConstituency.Name}` : "Select a constituency"}
    >
      <Select
        value={selectedId || "all"}
        onValueChange={(value) => {
          setConstituencyId(value === "all" ? null : value);
        }}
        items={{
          all: "Select constituency",
          ...Object.fromEntries(groupConstituencies.map((c) => [c.ID, `${c.Code} — ${c.Name}`])),
        }}
      >
        <SelectTrigger className="w-full sm:w-[280px]">
          <SelectValue placeholder="Select constituency" />
        </SelectTrigger>
        <SelectContent>
          {groupConstituencies.length === 0 && (
            <SelectItem value="all" disabled>
              No constituencies
            </SelectItem>
          )}
          {groupConstituencies.map((c) => (
            <SelectItem key={c.ID} value={c.ID}>
              {c.Code} — {c.Name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {turnout && (
        <TurnoutCard
          total={turnout.TotalConstituents}
          voted={turnout.TotalVoted}
          percent={turnout.TurnoutPercent}
        />
      )}

      {boxesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !boxes || boxes.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No ballot boxes"
          description={selectedId ? "No ballot boxes found for this constituency." : "Select a constituency to view ballot boxes."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxes.map((box) => {
            const ringColor =
              box.TurnoutPercent >= 70 ? "text-green-600" :
              box.TurnoutPercent >= 40 ? "text-yellow-600" :
              "text-muted-foreground";

            return (
              <Link
                key={box.ID}
                href={`/voting/${box.ID}?constituency_id=${selectedId}`}
              >
                <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-lg">{box.Code}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {box.Location}
                        </p>
                      </div>
                      {box.IsOverseas && (
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {box.Country || "Overseas"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{box.TotalVoters}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Vote className="h-3.5 w-3.5" />
                        <span>{box.VotedCount}</span>
                      </div>
                      <span className={`text-sm font-medium ${ringColor}`}>
                        {box.TurnoutPercent.toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Page>
  );
}
