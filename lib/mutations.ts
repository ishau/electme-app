import { post, put, del } from "@/lib/api";
import type {
  ConstituentProfile,
  Nickname,
  PartyAffiliation,
  WorkplaceAssignment,
  Tag,
  PersonalTrait,
  SupportAssessment,
  OutreachLog,
  Group,
  VoterRegistration,
  VotingRecord,
} from "@/lib/types";

// ── Enrichment ──

export async function updateProfile(constituentId: string, data: {
  full_national_id?: string;
  contact_info?: {
    phone_numbers?: string[];
    email?: string;
    notes?: string;
  };
  notes?: string;
}) {
  return put<ConstituentProfile>(`/group/constituents/${constituentId}/profile`, data);
}

export async function updateNicknames(constituentId: string, data: {
  nicknames: { name: string; is_primary: boolean }[];
}) {
  return put<Nickname[]>(`/group/constituents/${constituentId}/nicknames`, data);
}

export async function createAffiliation(constituentId: string, data: {
  party_id: string;
  known_date?: string;
  source?: string;
  notes?: string;
}) {
  return post<PartyAffiliation>(`/group/constituents/${constituentId}/affiliations`, data);
}

export async function updateAffiliation(constituentId: string, affiliationId: string, data: {
  party_id: string;
  known_date?: string;
  source?: string;
  notes?: string;
}) {
  return put<PartyAffiliation>(`/group/constituents/${constituentId}/affiliations/${affiliationId}`, data);
}

export async function deleteAffiliation(constituentId: string, affiliationId: string) {
  return del(`/group/constituents/${constituentId}/affiliations/${affiliationId}`);
}

export async function updateWorkplace(constituentId: string, data: {
  organization: string;
  position: string;
  sector: string;
  island_id?: string;
  notes?: string;
}) {
  return put<WorkplaceAssignment[]>(`/group/constituents/${constituentId}/workplace`, data);
}

export async function updateTags(constituentId: string, data: {
  tags: { key: string; value: string; added_by: string; notes?: string }[];
}) {
  return put<Tag[]>(`/group/constituents/${constituentId}/tags`, data);
}

export async function updateTraits(constituentId: string, data: {
  traits: { category: string; value: string; notes?: string }[];
}) {
  return put<PersonalTrait[]>(`/group/constituents/${constituentId}/traits`, data);
}

export async function createRelationship(constituentId: string, data: {
  to_id: string;
  type: string;
  role?: string;
  influence_score: number;
  notes?: string;
}) {
  return post<{ status: string }>(`/group/constituents/${constituentId}/relationships`, data);
}

// ── Campaign ──

export async function logSupport(constituentId: string, data: {
  candidate_id?: string;
  level: string;
  confidence: number;
  assessed_by: string;
  notes?: string;
}) {
  return post<SupportAssessment>(`/group/constituents/${constituentId}/support`, data);
}

export async function logOutreach(constituentId: string, data: {
  method: string;
  outcome: string;
  contacted_by: string;
  follow_up_date?: string;
  notes?: string;
}) {
  return post<OutreachLog>(`/group/constituents/${constituentId}/outreach`, data);
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
  return post<BatchResult>(`/group/support/batch`, data);
}

export async function bulkLogOutreach(data: {
  constituent_ids: string[];
  method: string;
  outcome: string;
  contacted_by: string;
  follow_up_date?: string;
  notes?: string;
}) {
  return post<BatchResult>(`/group/outreach/batch`, data);
}

// ── Groups / Team ──

export async function addTeamMember(data: {
  name: string;
  role: string;
  is_active?: boolean;
  username?: string;
  password?: string;
}) {
  return post<Group>(`/group/team-members`, data);
}

export async function updateTeamMember(memberId: string, data: {
  name?: string;
  role?: string;
  is_active?: boolean;
  password?: string;
}) {
  return put<Group>(`/group/team-members/${memberId}`, data);
}

export async function deleteTeamMember(memberId: string) {
  return del(`/group/team-members/${memberId}`);
}

// ── Voting ──

export async function createRegistration(data: {
  constituent_id: string;
  constituency_id: string;
  ballot_box_id?: string;
  is_reregistered: boolean;
  rereg_source: string;
}) {
  return post<VoterRegistration>(`/group/registrations`, data);
}

export async function updateTransport(registrationId: string, data: {
  status: string;
  mode?: string;
  notes?: string;
}) {
  return put<void>(`/group/registrations/${registrationId}/transport`, data);
}

export async function recordVote(data: {
  constituent_id: string;
  constituency_id: string;
  ballot_box_id?: string;
  recorded_by: string;
  notes?: string;
}) {
  return post<VotingRecord>(`/group/votes`, data);
}

export async function recordExitPoll(voteId: string, candidateId: string) {
  return put<void>(`/group/votes/${voteId}/exit-poll`, { candidate_id: candidateId });
}
