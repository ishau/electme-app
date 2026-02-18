import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { TurnoutStats, VoterRegistration, Constituent, PaginatedResponse } from "@/lib/types";

export function useTurnout(constituencyId: string) {
  return useQuery({
    queryKey: ["turnout", constituencyId],
    queryFn: () =>
      get<TurnoutStats>(`/group/turnout`, { constituency_id: constituencyId }),
    enabled: !!constituencyId,
    placeholderData: keepPreviousData,
  });
}

export function useNonVoters(constituencyId: string) {
  return useQuery({
    queryKey: ["nonVoters", constituencyId],
    queryFn: () =>
      get<string[]>(`/group/non-voters`, { constituency_id: constituencyId }),
    enabled: !!constituencyId,
    placeholderData: keepPreviousData,
  });
}

export function useVotersForConstituency(constituencyId: string) {
  return useQuery({
    queryKey: ["votersForConstituency", constituencyId],
    queryFn: () =>
      get<PaginatedResponse<Constituent>>(`/group/constituents`, { constituency_id: constituencyId })
        .then((res) => res.data)
        .catch(() => []),
    enabled: !!constituencyId,
    placeholderData: keepPreviousData,
  });
}

export function useRegistrations(constituencyId: string) {
  return useQuery({
    queryKey: ["registrations", constituencyId],
    queryFn: () =>
      get<VoterRegistration[]>(`/group/registrations`, { constituency_id: constituencyId }),
    enabled: !!constituencyId,
    placeholderData: keepPreviousData,
  });
}

export function useTransportNeeded() {
  return useQuery({
    queryKey: ["transportNeeded"],
    queryFn: () =>
      get<VoterRegistration[]>(`/group/registrations/transport-needed`),
  });
}