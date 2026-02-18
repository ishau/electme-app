"use client";

import { useGroup } from "@/lib/hooks/use-group";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { useConstituents } from "@/lib/hooks/use-constituents";
import { useParties } from "@/lib/hooks/use-parties";
import { ConstituentSearch } from "@/components/constituents/constituent-search";
import { ConstituentTable } from "@/components/constituents/constituent-table";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Users } from "lucide-react";
import { useQueryStates, parseAsString } from "nuqs";

const PAGE_SIZE = 50;

export default function ConstituentsPage() {
  const [filters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
      constituency_id: parseAsString.withDefault(""),
    },
    { shallow: false }
  );

  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: allConstituencies } = useConstituencies();
  const { data: parties } = useParties();

  const groupConstituencyIds = group?.Constituencies ?? [];
  const groupConstituencies = (allConstituencies ?? []).filter((c) =>
    groupConstituencyIds.includes(c.ID)
  );

  const constituencyId = filters.constituency_id;
  const activeConstituency = groupConstituencies.find((c) => c.ID === constituencyId);

  const page = filters.page ? parseInt(filters.page) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const apiParams: Record<string, string> = {
    offset: String(offset),
    limit: String(PAGE_SIZE),
  };
  if (constituencyId) apiParams.constituency_id = constituencyId;
  if (filters.q) apiParams.q = filters.q;

  const { data: result, isLoading: constituentsLoading } = useConstituents(apiParams);

  const pageData = result?.data ?? [];

  if (groupLoading) {
    return (
      <Page title="Voters" description="Loading...">
        <TableSkeleton rows={10} />
      </Page>
    );
  }

  return (
    <Page
      title="Voters"
      description={activeConstituency ? `${activeConstituency.Code} — ${activeConstituency.Name}` : "All constituencies"}
    >
      <ConstituentSearch constituencies={groupConstituencies} />

      {constituentsLoading ? (
        <TableSkeleton rows={10} />
      ) : pageData.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No voters found"
          description={filters.q ? "Try a different search term." : "No voters in this constituency yet."}
        />
      ) : (
        <ConstituentTable
          constituents={pageData}
          limit={PAGE_SIZE}
          offset={offset}
          constituencyId={constituencyId}
          candidates={group?.Candidates ?? []}
          parties={parties ?? []}
        />
      )}
    </Page>
  );
}
