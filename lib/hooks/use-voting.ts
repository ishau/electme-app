import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { TurnoutStats } from "@/lib/types";

export function useTurnout(constituencyId: string) {
  return useQuery({
    queryKey: ["turnout", constituencyId],
    queryFn: () =>
      get<TurnoutStats>(`/group/turnout`, { constituency_id: constituencyId }),
    enabled: !!constituencyId,
    placeholderData: keepPreviousData,
  });
}
