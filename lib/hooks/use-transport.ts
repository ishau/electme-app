import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { TransportRequest, TransportStats } from "@/lib/types";

export function useTransportRequests(params: {
  constituency_id?: string;
  status?: string;
  search?: string;
}) {
  const filtered: Record<string, string> = {};
  if (params.constituency_id) filtered.constituency_id = params.constituency_id;
  if (params.status) filtered.status = params.status;
  if (params.search) filtered.search = params.search;

  return useQuery({
    queryKey: ["transport", filtered],
    queryFn: () => get<TransportRequest[]>("/group/transport", filtered),
    placeholderData: keepPreviousData,
  });
}

export function useTransportStats(constituencyId?: string) {
  const params: Record<string, string> = {};
  if (constituencyId) params.constituency_id = constituencyId;

  return useQuery({
    queryKey: ["transportStats", constituencyId ?? ""],
    queryFn: () => get<TransportStats>("/group/transport/stats", params),
  });
}
