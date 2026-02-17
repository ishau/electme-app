import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get, getGroupId } from "@/lib/api";

// GeoJSON FeatureCollection type (generic)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJSON = any;

export function useHexDominant() {
  const groupId = getGroupId();
  return useQuery<GeoJSON>({
    queryKey: ["hexDominant", groupId],
    queryFn: () => get<GeoJSON>(`/groups/${groupId}/hex/dominant`),
    placeholderData: keepPreviousData,
  });
}

export function useHexLeaning() {
  const groupId = getGroupId();
  return useQuery<GeoJSON>({
    queryKey: ["hexLeaning", groupId],
    queryFn: () => get<GeoJSON>(`/groups/${groupId}/hex/leaning`),
    placeholderData: keepPreviousData,
  });
}

export function useHexCandidateSupport(candidateId: string | undefined) {
  const groupId = getGroupId();
  return useQuery<GeoJSON>({
    queryKey: ["hexCandidateSupport", groupId, candidateId],
    queryFn: () =>
      get<GeoJSON>(`/groups/${groupId}/hex/candidate-support`, {
        candidate_id: candidateId!,
      }),
    enabled: !!candidateId,
    placeholderData: keepPreviousData,
  });
}

export function useHexPartySupport() {
  const groupId = getGroupId();
  return useQuery<GeoJSON>({
    queryKey: ["hexPartySupport", groupId],
    queryFn: () => get<GeoJSON>(`/groups/${groupId}/hex/party-support`),
    placeholderData: keepPreviousData,
  });
}
