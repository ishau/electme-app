import { get, getGroupId } from "@/lib/api";
import type { Constituent, Constituency, Group, Island } from "@/lib/types";
import { ConstituencySwitcher } from "@/components/constituents/constituency-switcher";
import { ConstituentSearch } from "@/components/constituents/constituent-search";
import { ConstituentTable } from "@/components/constituents/constituent-table";
import { AddVoterForm } from "@/components/constituents/add-voter-form";
import { ImportVotersDialog } from "@/components/constituents/import-voters-dialog";
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

  // Fetch islands for the active constituency's atoll (for the add-voter form)
  const islands = activeConstituency?.AtollID
    ? (await get<Island[]>(`/atolls/${activeConstituency.AtollID}/islands`)) ?? []
    : [];

  // API returns a plain array — pagination params are passed but the backend
  // may ignore them, so we handle pagination client-side as a fallback
  const apiParams: Record<string, string> = {
    constituency_id: constituencyId,
  };
  if (params.name) apiParams.name = params.name;
  if (params.sex) apiParams.sex = params.sex;
  if (params.address) apiParams.address = params.address;

  const allConstituents = await get<Constituent[]>(
    `/groups/${groupId}/constituents`,
    apiParams
  );

  const constituents = allConstituents ?? [];
  const total = constituents.length;
  const page = params.page ? parseInt(params.page) : 1;
  const offset = (page - 1) * PAGE_SIZE;
  const pageData = constituents.slice(offset, offset + PAGE_SIZE);

  return (
    <Page
      title="Voters"
      description={activeConstituency ? `${activeConstituency.Code} — ${activeConstituency.Name}` : "Browse and search constituent records"}
      actions={
        <>
          <ImportVotersDialog constituencyId={constituencyId} />
          <AddVoterForm constituencyId={constituencyId} islands={islands} />
        </>
      }
    >
      <ConstituencySwitcher
        constituencies={groupConstituencies}
        currentConstituencyId={constituencyId}
      />

      <ConstituentSearch
        currentName={params.name ?? ""}
        currentConstituencyId={constituencyId}
        currentSex={params.sex ?? ""}
        currentAddress={params.address ?? ""}
      />

      {pageData.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No voters found"
          description={params.name ? "Try a different search term." : "No voters in this constituency yet."}
        />
      ) : (
        <ConstituentTable
          constituents={pageData}
          total={total}
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
