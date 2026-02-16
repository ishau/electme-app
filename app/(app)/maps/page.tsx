"use client";

import { useGroup } from "@/lib/hooks/use-group";
import { useAtolls } from "@/lib/hooks/use-geography";
import { getGroupId, get } from "@/lib/api";
import { MapView } from "@/components/maps/map-view";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Atoll, Constituency, Island } from "@/lib/types";

export default function MapsPage() {
  const groupId = getGroupId();
  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: allAtolls, isLoading: atollsLoading } = useAtolls();

  const groupConstituencyIds = group?.Constituencies ?? [];

  // Fetch each constituency individually (list endpoint doesn't include Islands)
  const { data: groupConstituencies } = useQuery({
    queryKey: ["groupConstituenciesDetailed", groupConstituencyIds],
    queryFn: () =>
      Promise.all(groupConstituencyIds.map((id) => get<Constituency>(`/constituencies/${id}`))),
    enabled: groupConstituencyIds.length > 0,
  });

  const allowedIslandIds = new Set<string>();
  const allowedAtollIds = new Set<string>();
  for (const c of groupConstituencies ?? []) {
    if (!c) continue;
    allowedAtollIds.add(c.AtollID);
    for (const islandId of c.Islands ?? []) {
      allowedIslandIds.add(islandId);
    }
  }

  const atolls = (allAtolls ?? []).filter((a) => allowedAtollIds.has(a.ID));

  // Pre-fetch islands for each relevant atoll
  const { data: islandsByAtoll } = useQuery({
    queryKey: ["islandsByAtoll", Array.from(allowedAtollIds), Array.from(allowedIslandIds)],
    queryFn: async () => {
      const result: Record<string, Island[]> = {};
      await Promise.all(
        atolls.map(async (atoll) => {
          const islands = await get<Island[]>(`/atolls/${atoll.ID}/islands`);
          result[atoll.ID] = (islands ?? []).filter((i) => allowedIslandIds.has(i.ID));
        })
      );
      return result;
    },
    enabled: atolls.length > 0,
  });

  if (groupLoading || atollsLoading) {
    return <Page title="Maps" description="Loading..."><PageSkeleton /></Page>;
  }

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
        islandsByAtoll={islandsByAtoll ?? {}}
        groupId={groupId}
      />
    </Page>
  );
}
