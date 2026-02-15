"use server";

import { revalidatePath } from "next/cache";
import { put, post, getGroupId } from "@/lib/api";
import type {
  ConstituentProfile,
  Nickname,
  PartyAffiliation,
  WorkplaceAssignment,
  Tag,
  PersonalTrait,
  Relationship,
} from "@/lib/types";

export async function updateProfile(constituentId: string, data: {
  full_national_id?: string;
  dob?: string;
  contact_info?: {
    mobile_numbers?: string[];
    phone_numbers?: string[];
    email?: string;
    viber?: string;
    notes?: string;
  };
  notes?: string;
}) {
  const groupId = getGroupId();
  await put<ConstituentProfile>(`/groups/${groupId}/constituents/${constituentId}/profile`, data);
  revalidatePath(`/constituents/${constituentId}`);
}

export async function updateNicknames(constituentId: string, data: {
  nicknames: { name: string; is_primary: boolean }[];
}) {
  const groupId = getGroupId();
  await put<Nickname[]>(`/groups/${groupId}/constituents/${constituentId}/nicknames`, data);
  revalidatePath(`/constituents/${constituentId}`);
}

export async function updateAffiliation(constituentId: string, data: {
  party_id: string;
}) {
  const groupId = getGroupId();
  await put<PartyAffiliation[]>(`/groups/${groupId}/constituents/${constituentId}/affiliation`, data);
  revalidatePath(`/constituents/${constituentId}`);
}

export async function updateWorkplace(constituentId: string, data: {
  organization: string;
  position: string;
  sector: string;
  island_id?: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  await put<WorkplaceAssignment[]>(`/groups/${groupId}/constituents/${constituentId}/workplace`, data);
  revalidatePath(`/constituents/${constituentId}`);
}

export async function updateTags(constituentId: string, data: {
  tags: { key: string; value: string; added_by: string; notes?: string }[];
}) {
  const groupId = getGroupId();
  await put<Tag[]>(`/groups/${groupId}/constituents/${constituentId}/tags`, data);
  revalidatePath(`/constituents/${constituentId}`);
}

export async function updateTraits(constituentId: string, data: {
  traits: { category: string; value: string; notes?: string }[];
}) {
  const groupId = getGroupId();
  await put<PersonalTrait[]>(`/groups/${groupId}/constituents/${constituentId}/traits`, data);
  revalidatePath(`/constituents/${constituentId}`);
}

export async function createRelationship(constituentId: string, data: {
  to_id: string;
  type: string;
  subtype: string;
  influence_score: number;
  notes?: string;
}) {
  const groupId = getGroupId();
  await post<Relationship[]>(`/groups/${groupId}/constituents/${constituentId}/relationships`, data);
  revalidatePath(`/constituents/${constituentId}`);
}
