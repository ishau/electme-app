import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type {
  Constituent,
  EnrichedConstituent,
  SupportAssessment,
  OutreachLog,
  RelationshipView,
  PaginatedResponse,
  ConstituentSearchResult,
} from "@/lib/types";

export function useConstituents(params: Record<string, string>) {
  return useQuery({
    queryKey: ["constituents", params],
    queryFn: () =>
      get<PaginatedResponse<Constituent>>(`/group/constituents`, params),
    placeholderData: keepPreviousData,
  });
}

export function useEnrichedConstituent(constituentId: string) {
  return useQuery({
    queryKey: ["constituent", constituentId],
    queryFn: () =>
      get<EnrichedConstituent>(`/group/constituents/${constituentId}`),
    enabled: !!constituentId,
  });
}

export function useBaseConstituent(constituentId: string) {
  return useQuery({
    queryKey: ["baseConstituent", constituentId],
    queryFn: () => get<Constituent>(`/constituents/${constituentId}`),
    enabled: !!constituentId,
  });
}

export function useSupportHistory(constituentId: string) {
  return useQuery({
    queryKey: ["supportHistory", constituentId],
    queryFn: () =>
      get<SupportAssessment[]>(`/group/constituents/${constituentId}/support`),
    enabled: !!constituentId,
  });
}

export function useOutreachHistory(constituentId: string) {
  return useQuery({
    queryKey: ["outreachHistory", constituentId],
    queryFn: () =>
      get<OutreachLog[]>(`/group/constituents/${constituentId}/outreach`),
    enabled: !!constituentId,
  });
}

export function useRelationships(constituentId: string) {
  return useQuery({
    queryKey: ["relationships", constituentId],
    queryFn: () =>
      get<RelationshipView[]>(`/group/constituents/${constituentId}/relationships`),
    enabled: !!constituentId,
  });
}

export function useSearchConstituents(query: string) {
  return useQuery({
    queryKey: ["searchConstituents", query],
    queryFn: () =>
      get<ConstituentSearchResult[]>(`/group/constituents/search`, { q: query }),
    enabled: query.length >= 2,
  });
}

export function useNeighbors(address: string | undefined, islandId: string | undefined) {
  return useQuery({
    queryKey: ["neighbors", address, islandId],
    queryFn: () =>
      get<PaginatedResponse<Constituent>>(`/group/constituents`, {
        address: address!,
        island_id: islandId!,
        exact_address: "true",
      }),
    enabled: !!address && !!islandId,
    select: (data) => data?.data ?? [],
  });
}

export function useLatestSupport(constituentIds: string[]) {
  return useQuery({
    queryKey: ["latestSupport", constituentIds],
    queryFn: async () => {
      const result: Record<string, SupportAssessment> = {};
      await Promise.all(
        constituentIds.map(async (cid) => {
          try {
            const history = await get<SupportAssessment[]>(
              `/group/constituents/${cid}/support`
            );
            if (history && history.length > 0) {
              result[cid] = history[0];
            }
          } catch {
            // skip
          }
        })
      );
      return result;
    },
    enabled: constituentIds.length > 0,
  });
}