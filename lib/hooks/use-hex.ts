import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get, getGroupId } from "@/lib/api";

// GeoJSON FeatureCollection type (generic)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJSON = any;

export function useHexDominant(islandId: string | undefined) {
  const groupId = getGroupId();
  return useQuery<GeoJSON>({
    queryKey: ["hexDominant", islandId],
    queryFn: () =>
      get<GeoJSON>(`/groups/${groupId}/hex/dominant`, {
        island_id: islandId!,
      }),
    enabled: !!islandId,
    placeholderData: keepPreviousData,
  });
}

export function useHexLeaning(islandId: string | undefined) {
  const groupId = getGroupId();
  return useQuery<GeoJSON>({
    queryKey: ["hexLeaning", islandId],
    queryFn: () =>
      get<GeoJSON>(`/groups/${groupId}/hex/leaning`, {
        island_id: islandId!,
      }),
    enabled: !!islandId,
    placeholderData: keepPreviousData,
  });
}

export function useHexCandidateSupport(
  islandId: string | undefined,
  candidateId: string | undefined
) {
  const groupId = getGroupId();
  return useQuery<GeoJSON>({
    queryKey: ["hexCandidateSupport", islandId, candidateId],
    queryFn: () =>
      get<GeoJSON>(`/groups/${groupId}/hex/candidate-support`, {
        island_id: islandId!,
        candidate_id: candidateId!,
      }),
    enabled: !!islandId && !!candidateId,
    placeholderData: keepPreviousData,
  });
}

export function useHexPartySupport(islandId: string | undefined) {
  const groupId = getGroupId();
  return useQuery<GeoJSON>({
    queryKey: ["hexPartySupport", islandId],
    queryFn: () =>
      get<GeoJSON>(`/groups/${groupId}/hex/party-support`, {
        island_id: islandId!,
      }),
    enabled: !!islandId,
    placeholderData: keepPreviousData,
  });
}
