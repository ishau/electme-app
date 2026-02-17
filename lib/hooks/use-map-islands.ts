import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGroup } from "@/lib/hooks/use-group";
import { useAtolls } from "@/lib/hooks/use-geography";
import { get } from "@/lib/api";
import type { Atoll, Constituency, Island } from "@/lib/types";

export function useMapIslands() {
  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: allAtolls, isLoading: atollsLoading } = useAtolls();

  const groupConstituencyIds = group?.Constituencies ?? [];

  const { data: groupConstituencies } = useQuery({
    queryKey: ["groupConstituenciesDetailed", groupConstituencyIds],
    queryFn: () =>
      Promise.all(groupConstituencyIds.map((id) => get<Constituency>(`/constituencies/${id}`))),
    enabled: groupConstituencyIds.length > 0,
  });

  const { allowedIslandIds, allowedAtollIds } = useMemo(() => {
    const islands = new Set<string>();
    const atolls = new Set<string>();
    for (const c of groupConstituencies ?? []) {
      if (!c) continue;
      atolls.add(c.AtollID);
      for (const islandId of c.Islands ?? []) {
        islands.add(islandId);
      }
    }
    return { allowedIslandIds: islands, allowedAtollIds: atolls };
  }, [groupConstituencies]);

  const atolls: Atoll[] = useMemo(
    () => (allAtolls ?? []).filter((a) => allowedAtollIds.has(a.ID)),
    [allAtolls, allowedAtollIds]
  );

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

  return {
    group,
    atolls,
    islandsByAtoll: islandsByAtoll ?? {},
    isLoading: groupLoading || atollsLoading,
  };
}
