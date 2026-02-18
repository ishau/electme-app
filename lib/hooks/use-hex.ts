import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api";

// GeoJSON FeatureCollection type (generic)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJSON = any;

export function useHexLeaning() {
  return useQuery<GeoJSON>({
    queryKey: ["hexLeaning"],
    queryFn: () => get<GeoJSON>(`/group/hex/leaning`),
    placeholderData: keepPreviousData,
  });
}

export function useHexCandidateSupport(candidateId: string | undefined) {
  return useQuery<GeoJSON>({
    queryKey: ["hexCandidateSupport", candidateId],
    queryFn: () =>
      get<GeoJSON>(`/group/hex/candidate-support`, {
        candidate_id: candidateId!,
      }),
    enabled: !!candidateId,
    placeholderData: keepPreviousData,
  });
}

export function useHexPartySupport() {
  return useQuery<GeoJSON>({
    queryKey: ["hexPartySupport"],
    queryFn: () => get<GeoJSON>(`/group/hex/party-support`),
    placeholderData: keepPreviousData,
  });
}
