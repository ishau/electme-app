import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { Demographics } from "@/lib/types";

export function useDemographics() {
  return useQuery({
    queryKey: ["demographics"],
    queryFn: () => get<Demographics>("/group/demographics"),
  });
}
