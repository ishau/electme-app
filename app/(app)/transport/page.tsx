"use client";

import { useGroup } from "@/lib/hooks/use-group";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { useTransportRequests, useTransportStats } from "@/lib/hooks/use-transport";
import { TransportView } from "@/components/transport/transport-view";
import { Page } from "@/components/shared/page";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsPageSkeleton } from "@/components/shared/loading-skeleton";
import { Bus, Ship, Car, CheckCircle, MapPin } from "lucide-react";
import { useQueryState, parseAsString } from "nuqs";

export default function TransportPage() {
  const [constituencyParam] = useQueryState("constituency_id", parseAsString.withDefault(""));
  const [statusParam] = useQueryState("status", parseAsString.withDefault(""));
  const [searchParam] = useQueryState("search", parseAsString.withDefault(""));

  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: allConstituencies } = useConstituencies();

  const groupConstituencyIds = group?.Constituencies ?? [];
  const groupConstituencies = (allConstituencies ?? []).filter((c) =>
    groupConstituencyIds.includes(c.ID)
  );

  const constituencyId = constituencyParam || (groupConstituencyIds[0] ?? "");

  const { data: requests } = useTransportRequests({
    constituency_id: constituencyParam || undefined,
    status: statusParam || undefined,
    search: searchParam || undefined,
  });

  const { data: stats } = useTransportStats(constituencyParam || undefined);

  if (groupLoading) {
    return <Page title="Transport" description="Loading..."><StatsPageSkeleton statCount={4} /></Page>;
  }

  if (!constituencyId) {
    return (
      <Page title="Transport" description="Inter-island and voting day transport management">
        <EmptyState
          icon={MapPin}
          title="No constituencies"
          description="This group has no constituencies assigned yet."
        />
      </Page>
    );
  }

  return (
    <Page
      title="Transport"
      description="Inter-island and voting day transport management"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats?.Total ?? 0}
          icon={Bus}
        />
        <StatCard
          title="Inter-Island"
          value={stats?.InterIslandNeeded ?? 0}
          icon={Ship}
        />
        <StatCard
          title="Voting Day"
          value={stats?.VotingDayNeeded ?? 0}
          icon={Car}
        />
        <StatCard
          title="Completed"
          value={stats?.Completed ?? 0}
          icon={CheckCircle}
        />
      </div>

      <TransportView
        requests={requests ?? []}
        constituencies={groupConstituencies}
        currentConstituencyId={constituencyParam}
        currentStatus={statusParam}
        currentSearch={searchParam}
      />
    </Page>
  );
}
