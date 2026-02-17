import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import type { Atoll, Island, AddressLocation, AddressWithCount, HeatMapPoint } from "@/lib/types";

export function useAtolls() {
  return useQuery({
    queryKey: ["atolls"],
    queryFn: () => get<Atoll[]>("/atolls"),
  });
}

export function useIslands(atollId: string) {
  return useQuery({
    queryKey: ["islands", atollId],
    queryFn: () => get<Island[]>(`/atolls/${atollId}/islands`),
    enabled: !!atollId,
  });
}

export function useAddressLocations(islandId: string) {
  return useQuery({
    queryKey: ["addressLocations", islandId],
    queryFn: () => get<AddressLocation[]>(`/islands/${islandId}/address-locations`),
    enabled: !!islandId,
  });
}

export function useUniqueAddresses(islandId: string) {
  return useQuery({
    queryKey: ["uniqueAddresses", islandId],
    queryFn: () => get<AddressWithCount[]>(`/islands/${islandId}/unique-addresses`),
    enabled: !!islandId,
  });
}

export function useAddressesWithCounts(islandId: string) {
  const { user } = useAuth();
  const groupId = user?.group_id ?? "";
  return useQuery({
    queryKey: ["addressesWithCounts", islandId, groupId],
    queryFn: () => get<AddressWithCount[]>(`/islands/${islandId}/addresses`, { group_id: groupId }),
    enabled: !!islandId && !!groupId,
  });
}

export function useHeatMapData(islandId: string) {
  const { user } = useAuth();
  const groupId = user?.group_id ?? "";
  return useQuery({
    queryKey: ["heatMapData", islandId, groupId],
    queryFn: () => get<HeatMapPoint[]>(`/islands/${islandId}/heat-map`, { group_id: groupId }),
    enabled: !!islandId && !!groupId,
  });
}
