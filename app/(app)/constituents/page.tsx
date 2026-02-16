import { get, getGroupId } from "@/lib/api";
import type { Constituent, Constituency, Group, Island, PaginatedResponse } from "@/lib/types";
import { ConstituencySwitcher } from "@/components/constituents/constituency-switcher";
import { ConstituentSearch } from "@/components/constituents/constituent-search";
import { ConstituentTable } from "@/components/constituents/constituent-table";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

const PAGE_SIZE = 50;

export default async function ConstituentsPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; constituency_id?: string; sex?: string; address?: string; page?: string }>;
}) {
  const params = await searchParams;
  const groupId = getGroupId();

  const [group, allConstituencies] = await Promise.all([
    get<Group>(`/groups/${groupId}`),
    get<Constituency[]>("/constituencies"),
  ]);

  // Only show the group's constituencies
  const groupConstituencyIds = group?.Constituencies ?? [];
  const groupConstituencies = (allConstituencies ?? []).filter((c) =>
    groupConstituencyIds.includes(c.ID)
  );

  // Backend requires constituency_id — default to the group's first constituency
  const constituencyId =
    params.constituency_id || groupConstituencyIds[0] || "";

  if (!constituencyId || groupConstituencies.length === 0) {
    return (
      <Page title="Voters" description="Browse and search constituent records">
        <EmptyState
          icon={Users}
          title="No constituencies"
          description="This group has no constituencies assigned yet."
        />
      </Page>
    );
  }

  const activeConstituency = groupConstituencies.find((c) => c.ID === constituencyId);

  // Fetch islands for the active constituency's atoll
  const islands = activeConstituency?.AtollID
    ? (await get<Island[]>(`/atolls/${activeConstituency.AtollID}/islands`)) ?? []
    : [];

  const page = params.page ? parseInt(params.page) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const apiParams: Record<string, string> = {
    constituency_id: constituencyId,
    offset: String(offset),
    limit: String(PAGE_SIZE),
  };
  if (params.name) apiParams.name = params.name;
  if (params.sex) apiParams.sex = params.sex;
  if (params.address) apiParams.address = params.address;

  const result = await get<PaginatedResponse<Constituent>>(
    `/groups/${groupId}/constituents`,
    apiParams
  );

  const pageData = result?.data ?? [];

  return (
    <Page
      title="Voters"
      description={activeConstituency ? `${activeConstituency.Code} — ${activeConstituency.Name}` : "Browse and search constituent records"}
    >
      <ConstituencySwitcher
        constituencies={groupConstituencies}
        currentConstituencyId={constituencyId}
      />

      <ConstituentSearch />

      {pageData.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No voters found"
          description={params.name ? "Try a different search term." : "No voters in this constituency yet."}
        />
      ) : (
        <ConstituentTable
          constituents={pageData}
          limit={PAGE_SIZE}
          offset={offset}
          constituencyId={constituencyId}
          islands={islands}
          candidates={group?.Candidates ?? []}
        />
      )}
    </Page>
  );
}
