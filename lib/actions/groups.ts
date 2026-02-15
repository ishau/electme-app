"use server";

import { revalidatePath } from "next/cache";
import { post, put, del, getGroupId } from "@/lib/api";
import type { Group } from "@/lib/types";

export async function addTeamMember(data: {
  name: string;
  role: string;
  constituent_id?: string;
  assigned_area?: string;
  contact_info?: {
    mobile_numbers?: string[];
    phone_numbers?: string[];
    email?: string;
    viber?: string;
    notes?: string;
  };
  is_active?: boolean;
  notes?: string;
}) {
  const groupId = getGroupId();
  await post<Group>(`/groups/${groupId}/team-members`, data);
  revalidatePath("/team");
}

export async function updateTeamMember(memberId: string, data: {
  name?: string;
  role?: string;
  assigned_area?: string;
  contact_info?: {
    mobile_numbers?: string[];
    phone_numbers?: string[];
    email?: string;
    viber?: string;
    notes?: string;
  };
  is_active?: boolean;
  notes?: string;
}) {
  const groupId = getGroupId();
  await put<Group>(`/groups/${groupId}/team-members/${memberId}`, data);
  revalidatePath("/team");
}

export async function deleteTeamMember(memberId: string) {
  const groupId = getGroupId();
  await del(`/groups/${groupId}/team-members/${memberId}`);
  revalidatePath("/team");
}
