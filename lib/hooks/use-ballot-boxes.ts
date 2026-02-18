import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { BallotBoxWithStats, BoxVoter } from "@/lib/types";

export function useBallotBoxes(constituencyId: string) {
  return useQuery({
    queryKey: ["ballotBoxes", constituencyId],
    queryFn: () =>
      get<BallotBoxWithStats[]>(`/group/ballot-boxes`, { constituency_id: constituencyId }),
    enabled: !!constituencyId,
    placeholderData: keepPreviousData,
  });
}

interface BoxVotersResponse {
  Data: BoxVoter[];
  Total: number;
  Limit: number;
  Offset: number;
}

export function useBoxVoters(boxId: string, params: Record<string, string>) {
  return useQuery({
    queryKey: ["boxVoters", boxId, params],
    queryFn: () =>
      get<BoxVotersResponse>(`/group/ballot-boxes/${boxId}/voters`, params),
    enabled: !!boxId,
    placeholderData: keepPreviousData,
  });
}
