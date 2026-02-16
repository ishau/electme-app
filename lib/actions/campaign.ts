"use server";

import { revalidatePath } from "next/cache";
import { get, post, getGroupId } from "@/lib/api";
import type { Constituent, ConstituentSearchResult, SupportAssessment, OutreachLog, PaginatedResponse } from "@/lib/types";

export async function logSupport(constituentId: string, data: {
  candidate_id?: string;
  level: string;
  confidence: number;
  assessed_by: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  await post<SupportAssessment>(`/groups/${groupId}/constituents/${constituentId}/support`, data);
  revalidatePath(`/constituents/${constituentId}`);
  revalidatePath("/candidates");
  revalidatePath("/");
}

export async function logOutreach(constituentId: string, data: {
  method: string;
  outcome: string;
  contacted_by: string;
  follow_up_date?: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  await post<OutreachLog>(`/groups/${groupId}/constituents/${constituentId}/outreach`, data);
  revalidatePath(`/constituents/${constituentId}`);
  revalidatePath("/campaign");
}

export interface BatchResult {
  Succeeded: number;
  Failed: number;
  Errors?: string[];
}

export async function fetchLatestSupport(constituentIds: string[]): Promise<Record<string, SupportAssessment>> {
  const groupId = getGroupId();
  const result: Record<string, SupportAssessment> = {};
  // Fetch in parallel
  await Promise.all(
    constituentIds.map(async (cid) => {
      try {
        const history = await get<SupportAssessment[]>(`/groups/${groupId}/constituents/${cid}/support`);
        if (history && history.length > 0) {
          result[cid] = history[0]; // Already sorted by assessed_at DESC
        }
      } catch {
        // Skip if no support data
      }
    })
  );
  return result;
}

export async function searchConstituents(query: string): Promise<ConstituentSearchResult[]> {
  if (!query || query.length < 2) return [];
  const groupId = getGroupId();
  const results = await get<ConstituentSearchResult[]>(`/groups/${groupId}/constituents/search`, { q: query });
  return results ?? [];
}

export async function fetchVotersByAddress(address: string, islandId: string, constituencyId?: string) {
  const groupId = getGroupId();
  const params: Record<string, string> = { address, island_id: islandId };
  if (constituencyId) params.constituency_id = constituencyId;
  const result = await get<PaginatedResponse<Constituent>>(`/groups/${groupId}/constituents`, params);
  return result?.data ?? [];
}

export async function bulkLogSupport(data: {
  constituent_ids: string[];
  candidate_ids?: string[];
  level: string;
  confidence: number;
  assessed_by: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  const result = await post<BatchResult>(`/groups/${groupId}/support/batch`, data);
  revalidatePath("/constituents");
  revalidatePath("/");
  return result;
}

export async function bulkLogOutreach(data: {
  constituent_ids: string[];
  method: string;
  outcome: string;
  contacted_by: string;
  follow_up_date?: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  const result = await post<BatchResult>(`/groups/${groupId}/outreach/batch`, data);
  revalidatePath("/constituents");
  revalidatePath("/campaign");
  return result;
}

