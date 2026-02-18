import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { TransportStats } from "@/lib/types";

export function useTransportStats() {
  return useQuery({
    queryKey: ["transportStats"],
    queryFn: () => get<TransportStats>("/group/transport/stats"),
  });
}
