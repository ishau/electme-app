"use server";

import { revalidatePath } from "next/cache";
import { post, put, getGroupId } from "@/lib/api";
import type { VoterRegistration, VotingRecord } from "@/lib/types";

export async function createRegistration(data: {
  constituent_id: string;
  constituency_id: string;
  ballot_box_id?: string;
  is_reregistered: boolean;
  rereg_source: string;
}) {
  const groupId = getGroupId();
  await post<VoterRegistration>(`/groups/${groupId}/registrations`, data);
  revalidatePath("/registrations");
}

export async function updateTransport(registrationId: string, data: {
  status: string;
  mode?: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  await put<void>(`/groups/${groupId}/registrations/${registrationId}/transport`, data);
  revalidatePath("/registrations");
}

export async function recordVote(data: {
  constituent_id: string;
  constituency_id: string;
  ballot_box_id?: string;
  recorded_by: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  await post<VotingRecord>(`/groups/${groupId}/votes`, data);
  revalidatePath("/voting");
}

export async function recordExitPoll(voteId: string, candidateId: string) {
  const groupId = getGroupId();
  await put<void>(`/groups/${groupId}/votes/${voteId}/exit-poll`, { candidate_id: candidateId });
  revalidatePath("/voting");
}
