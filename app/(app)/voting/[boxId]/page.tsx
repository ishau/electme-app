"use client";

import { use } from "react";
import Link from "next/link";
import { useGroup } from "@/lib/hooks/use-group";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { useBallotBoxes } from "@/lib/hooks/use-ballot-boxes";
import { useBoxVoters } from "@/lib/hooks/use-ballot-boxes";
import { TurnoutCard } from "@/components/voting/turnout-card";
import { BoxVoterTable } from "@/components/voting/box-voter-table";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton, CardSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Users } from "lucide-react";
import { useQueryStates, parseAsString } from "nuqs";

const PAGE_SIZE = 50;

interface BoxDetailPageProps {
  params: Promise<{ boxId: string }>;
}

export default function BoxDetailPage({ params }: BoxDetailPageProps) {
  const { boxId } = use(params);

  const [filters, setFilters] = useQueryStates(
    {
      constituency_id: parseAsString.withDefault(""),
      voted: parseAsString.withDefault(""),
      q: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false }
  );

  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: allConstituencies } = useConstituencies();

  const groupConstituencyIds = group?.Constituencies ?? [];
  const groupConstituencies = (allConstituencies ?? []).filter((c) =>
    groupConstituencyIds.includes(c.ID)
  );

  const constituencyId = filters.constituency_id || groupConstituencies[0]?.ID || "";
  const activeConstituency = groupConstituencies.find((c) => c.ID === constituencyId);

  const { data: boxes } = useBallotBoxes(constituencyId);
  const currentBox = boxes?.find((b) => b.ID === boxId);

  const page = filters.page ? parseInt(filters.page) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const apiParams: Record<string, string> = {
    offset: String(offset),
    limit: String(PAGE_SIZE),
  };
  if (constituencyId) apiParams.constituency_id = constituencyId;
  if (filters.voted) apiParams.voted = filters.voted;
  if (filters.q) apiParams.q = filters.q;

  const { data: votersResult, isLoading: votersLoading } = useBoxVoters(boxId, apiParams);

  const voters = votersResult?.Data ?? [];
  const total = votersResult?.Total ?? 0;
  const limit = votersResult?.Limit ?? PAGE_SIZE;
  const voterOffset = votersResult?.Offset ?? offset;

  if (groupLoading) {
    return (
      <Page title="Ballot Box" description="Loading...">
        <CardSkeleton />
        <TableSkeleton rows={8} />
      </Page>
    );
  }

  return (
    <Page
      title={currentBox ? `Box ${currentBox.Code}` : "Ballot Box"}
      description={
        <span className="flex items-center gap-2">
          {currentBox?.Location}
          {currentBox?.IsOverseas && (
            <Badge variant="outline" className="text-xs">
              {currentBox.Country || "Overseas"}
            </Badge>
          )}
        </span>
      }
      actions={
        <Link href={`/voting?constituency_id=${constituencyId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
      }
    >
      {currentBox && (
        <TurnoutCard
          total={currentBox.TotalVoters}
          voted={currentBox.VotedCount}
          percent={currentBox.TurnoutPercent}
          totalLabel="Voters"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={filters.voted || "all"}
          onValueChange={(value) => {
            setFilters({ voted: value === "all" ? null : value, page: null });
          }}
          items={{
            all: "All voters",
            true: "Voted",
            false: "Not voted",
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All voters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All voters</SelectItem>
            <SelectItem value="true">Voted</SelectItem>
            <SelectItem value="false">Not voted</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value || null, page: null })}
            className="pl-9"
          />
        </div>
      </div>

      {votersLoading ? (
        <TableSkeleton rows={8} />
      ) : voters.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No voters found"
          description={filters.q ? "Try a different search term." : "No voters match the current filter."}
        />
      ) : (
        <BoxVoterTable
          voters={voters}
          total={total}
          limit={limit}
          offset={voterOffset}
          boxId={boxId}
          constituencyId={constituencyId}
          candidates={group?.Candidates ?? []}
        />
      )}
    </Page>
  );
}
