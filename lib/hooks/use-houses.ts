import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { House, PaginatedResponse } from "@/lib/types";

export function useHouses(params: {
  search?: string;
  plotted?: string;
  constituency_id?: string;
  limit?: number;
  offset?: number;
}) {
  const filtered: Record<string, string> = {};
  if (params.search) filtered.search = params.search;
  if (params.plotted) filtered.plotted = params.plotted;
  if (params.constituency_id) filtered.constituency_id = params.constituency_id;
  if (params.limit) filtered.limit = String(params.limit);
  if (params.offset) filtered.offset = String(params.offset);

  return useQuery({
    queryKey: ["houses", filtered],
    queryFn: () =>
      get<PaginatedResponse<House>>("/group/houses", Object.keys(filtered).length > 0 ? filtered : undefined),
    placeholderData: keepPreviousData,
  });
}
