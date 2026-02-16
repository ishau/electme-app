import { get, post, put, del, getGroupId } from "@/lib/api";
import type {
  ConstituentProfile,
  Nickname,
  PartyAffiliation,
  WorkplaceAssignment,
  Tag,
  PersonalTrait,
  Relationship,
  SupportAssessment,
  OutreachLog,
  Atoll,
  Island,
  Constituency,
  AddressLocation,
  Group,
  VoterRegistration,
  VotingRecord,
} from "@/lib/types";

// ── Enrichment ──

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
  return put<ConstituentProfile>(`/groups/${groupId}/constituents/${constituentId}/profile`, data);
}

export async function updateNicknames(constituentId: string, data: {
  nicknames: { name: string; is_primary: boolean }[];
}) {
  const groupId = getGroupId();
  return put<Nickname[]>(`/groups/${groupId}/constituents/${constituentId}/nicknames`, data);
}

export async function updateAffiliation(constituentId: string, data: {
  party_id: string;
}) {
  const groupId = getGroupId();
  return put<PartyAffiliation[]>(`/groups/${groupId}/constituents/${constituentId}/affiliation`, data);
}

export async function updateWorkplace(constituentId: string, data: {
  organization: string;
  position: string;
  sector: string;
  island_id?: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  return put<WorkplaceAssignment[]>(`/groups/${groupId}/constituents/${constituentId}/workplace`, data);
}

export async function updateTags(constituentId: string, data: {
  tags: { key: string; value: string; added_by: string; notes?: string }[];
}) {
  const groupId = getGroupId();
  return put<Tag[]>(`/groups/${groupId}/constituents/${constituentId}/tags`, data);
}

export async function updateTraits(constituentId: string, data: {
  traits: { category: string; value: string; notes?: string }[];
}) {
  const groupId = getGroupId();
  return put<PersonalTrait[]>(`/groups/${groupId}/constituents/${constituentId}/traits`, data);
}

export async function createRelationship(constituentId: string, data: {
  to_id: string;
  type: string;
  subtype: string;
  influence_score: number;
  notes?: string;
}) {
  const groupId = getGroupId();
  return post<Relationship[]>(`/groups/${groupId}/constituents/${constituentId}/relationships`, data);
}

// ── Campaign ──

export async function logSupport(constituentId: string, data: {
  candidate_id?: string;
  level: string;
  confidence: number;
  assessed_by: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  return post<SupportAssessment>(`/groups/${groupId}/constituents/${constituentId}/support`, data);
}

export async function logOutreach(constituentId: string, data: {
  method: string;
  outcome: string;
  contacted_by: string;
  follow_up_date?: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  return post<OutreachLog>(`/groups/${groupId}/constituents/${constituentId}/outreach`, data);
}

export interface BatchResult {
  Succeeded: number;
  Failed: number;
  Errors?: string[];
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
  return post<BatchResult>(`/groups/${groupId}/support/batch`, data);
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
  return post<BatchResult>(`/groups/${groupId}/outreach/batch`, data);
}

// ── Geography ──

export async function createAtoll(data: { code: string; name: string }) {
  return post<Atoll>("/atolls", data);
}

export async function createIsland(data: { atoll_id: string; code: string; name: string }) {
  return post<Island>("/islands", data);
}

export async function createConstituency(data: {
  code: string;
  name: string;
  atoll_id: string;
  islands: string[];
}) {
  return post<Constituency>("/constituencies", data);
}

export async function saveAddressLocation(data: {
  island_id: string;
  address_name: string;
  latitude: number;
  longitude: number;
}) {
  return put<AddressLocation>("/address-locations", data);
}

export async function deleteAddressLocation(id: string) {
  return del(`/address-locations/${id}`);
}

// ── Groups / Team ──

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
  return post<Group>(`/groups/${groupId}/team-members`, data);
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
  return put<Group>(`/groups/${groupId}/team-members/${memberId}`, data);
}

export async function deleteTeamMember(memberId: string) {
  const groupId = getGroupId();
  return del(`/groups/${groupId}/team-members/${memberId}`);
}

// ── Voting ──

export async function createRegistration(data: {
  constituent_id: string;
  constituency_id: string;
  ballot_box_id?: string;
  is_reregistered: boolean;
  rereg_source: string;
}) {
  const groupId = getGroupId();
  return post<VoterRegistration>(`/groups/${groupId}/registrations`, data);
}

export async function updateTransport(registrationId: string, data: {
  status: string;
  mode?: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  return put<void>(`/groups/${groupId}/registrations/${registrationId}/transport`, data);
}

export async function recordVote(data: {
  constituent_id: string;
  constituency_id: string;
  ballot_box_id?: string;
  recorded_by: string;
  notes?: string;
}) {
  const groupId = getGroupId();
  return post<VotingRecord>(`/groups/${groupId}/votes`, data);
}

export async function recordExitPoll(voteId: string, candidateId: string) {
  const groupId = getGroupId();
  return put<void>(`/groups/${groupId}/votes/${voteId}/exit-poll`, { candidate_id: candidateId });
}
