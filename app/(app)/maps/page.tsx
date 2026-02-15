import { get, getGroupId } from "@/lib/api";
import type { Atoll, Constituency, Group, Island } from "@/lib/types";
import { MapView } from "@/components/maps/map-view";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { MapPin } from "lucide-react";

export default async function MapsPage() {
  const groupId = getGroupId();

  const [group, allAtolls] = await Promise.all([
    get<Group>(`/groups/${groupId}`),
    get<Atoll[]>("/atolls"),
  ]);

  const groupConstituencyIds = group?.Constituencies ?? [];

  // Fetch each constituency individually (list endpoint doesn't include Islands)
  const groupConstituencies = await Promise.all(
    groupConstituencyIds.map((id) => get<Constituency>(`/constituencies/${id}`))
  );

  // Collect unique island IDs and atoll IDs from the group's constituencies
  const allowedIslandIds = new Set<string>();
  const allowedAtollIds = new Set<string>();
  for (const c of groupConstituencies) {
    if (!c) continue;
    allowedAtollIds.add(c.AtollID);
    for (const islandId of c.Islands ?? []) {
      allowedIslandIds.add(islandId);
    }
  }

  const atolls = (allAtolls ?? []).filter((a) => allowedAtollIds.has(a.ID));

  // Pre-fetch islands for each relevant atoll, filtered to allowed islands
  const islandsByAtoll: Record<string, Island[]> = {};
  await Promise.all(
    atolls.map(async (atoll) => {
      const islands = await get<Island[]>(`/atolls/${atoll.ID}/islands`);
      islandsByAtoll[atoll.ID] = (islands ?? []).filter((i) =>
        allowedIslandIds.has(i.ID)
      );
    })
  );

  if (atolls.length === 0) {
    return (
      <Page title="Maps" description="Address locations and voter density maps">
        <EmptyState
          icon={MapPin}
          title="No islands assigned"
          description="This group has no constituencies with islands assigned."
        />
      </Page>
    );
  }

  return (
    <Page title="Maps" description="Address locations and voter density maps">
      <MapView
        atolls={atolls}
        islandsByAtoll={islandsByAtoll}
        groupId={groupId}
      />
    </Page>
  );
}
