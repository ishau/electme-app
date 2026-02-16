import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get, getGroupId } from "@/lib/api";
import type {
  Constituent,
  EnrichedConstituent,
  SupportAssessment,
  OutreachLog,
  Relationship,
  PaginatedResponse,
  ConstituentSearchResult,
} from "@/lib/types";

export function useConstituents(params: Record<string, string>) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["constituents", groupId, params],
    queryFn: () =>
      get<PaginatedResponse<Constituent>>(`/groups/${groupId}/constituents`, params),
    placeholderData: keepPreviousData,
  });
}

export function useEnrichedConstituent(constituentId: string) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["constituent", groupId, constituentId],
    queryFn: () =>
      get<EnrichedConstituent>(`/groups/${groupId}/constituents/${constituentId}`),
    enabled: !!constituentId,
  });
}

export function useBaseConstituent(constituentId: string) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["baseConstituent", constituentId],
    queryFn: () => get<Constituent>(`/constituents/${constituentId}`),
    enabled: !!constituentId,
  });
}

export function useSupportHistory(constituentId: string) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["supportHistory", groupId, constituentId],
    queryFn: () =>
      get<SupportAssessment[]>(`/groups/${groupId}/constituents/${constituentId}/support`),
    enabled: !!constituentId,
  });
}

export function useOutreachHistory(constituentId: string) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["outreachHistory", groupId, constituentId],
    queryFn: () =>
      get<OutreachLog[]>(`/groups/${groupId}/constituents/${constituentId}/outreach`),
    enabled: !!constituentId,
  });
}

export function useRelationships(constituentId: string) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["relationships", groupId, constituentId],
    queryFn: () =>
      get<Relationship[]>(`/groups/${groupId}/constituents/${constituentId}/relationships`),
    enabled: !!constituentId,
  });
}

export function useSearchConstituents(query: string) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["searchConstituents", groupId, query],
    queryFn: () =>
      get<ConstituentSearchResult[]>(`/groups/${groupId}/constituents/search`, { q: query }),
    enabled: query.length >= 2,
  });
}

export function useNeighbors(address: string | undefined, islandId: string | undefined) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["neighbors", groupId, address, islandId],
    queryFn: () =>
      get<PaginatedResponse<Constituent>>(`/groups/${groupId}/constituents`, {
        address: address!,
        island_id: islandId!,
        exact_address: "true",
      }),
    enabled: !!address && !!islandId,
    select: (data) => data?.data ?? [],
  });
}

export function useLatestSupport(constituentIds: string[]) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["latestSupport", groupId, constituentIds],
    queryFn: async () => {
      const result: Record<string, SupportAssessment> = {};
      await Promise.all(
        constituentIds.map(async (cid) => {
          try {
            const history = await get<SupportAssessment[]>(
              `/groups/${groupId}/constituents/${cid}/support`
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
