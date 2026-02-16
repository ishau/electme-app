import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get, getGroupId } from "@/lib/api";
import type { TurnoutStats, VoterRegistration, Constituent } from "@/lib/types";

export function useTurnout(constituencyId: string) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["turnout", groupId, constituencyId],
    queryFn: () =>
      get<TurnoutStats>(`/groups/${groupId}/turnout`, { constituency_id: constituencyId }),
    enabled: !!constituencyId,
    placeholderData: keepPreviousData,
  });
}

export function useNonVoters(constituencyId: string) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["nonVoters", groupId, constituencyId],
    queryFn: () =>
      get<string[]>(`/groups/${groupId}/non-voters`, { constituency_id: constituencyId }),
    enabled: !!constituencyId,
    placeholderData: keepPreviousData,
  });
}

export function useVotersForConstituency(constituencyId: string) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["votersForConstituency", groupId, constituencyId],
    queryFn: () =>
      get<Constituent[]>(`/groups/${groupId}/constituents`, { constituency_id: constituencyId }).catch(() => []),
    enabled: !!constituencyId,
    placeholderData: keepPreviousData,
  });
}

export function useRegistrations(constituencyId: string) {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["registrations", groupId, constituencyId],
    queryFn: () =>
      get<VoterRegistration[]>(`/groups/${groupId}/registrations`, { constituency_id: constituencyId }),
    enabled: !!constituencyId,
    placeholderData: keepPreviousData,
  });
}

export function useTransportNeeded() {
  const groupId = getGroupId();
  return useQuery({
    queryKey: ["transportNeeded", groupId],
    queryFn: () =>
      get<VoterRegistration[]>(`/groups/${groupId}/registrations/transport-needed`),
  });
}
