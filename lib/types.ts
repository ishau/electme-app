// All API response types use PascalCase keys matching the Go struct field names

// Geography
export interface Atoll {
  ID: string;
  Code: string;
  Name: string;
}

export interface Island {
  ID: string;
  AtollID: string;
  Code: string;
  Name: string;
}

export interface Constituency {
  ID: string;
  Code: string;
  Name: string;
  AtollID: string;
  Islands: string[];
}

// Party
export interface Party {
  ID: string;
  Code: string;
  Name: string;
  Color: string;
  LogoPath: string | null;
}

// Constituent search result (lightweight)
export interface ConstituentSearchResult {
  ID: string;
  FullName: string;
  MaskedNationalID: string;
  PermanentAddress: PermanentAddress;
  PrimaryNickname: string | null;
}

// Constituent (base)
export interface PermanentAddress {
  IslandID: string;
  Name: string;
}

export interface Constituent {
  ID: string;
  MaskedNationalID: string;
  FullNationalID: string | null;
  FullName: string;
  Sex: string;
  DOB: string | null;
  PermanentAddress: PermanentAddress;
  ConstituencyID: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Group
export interface ContactInfo {
  MobileNumbers: string[];
  PhoneNumbers: string[];
  Email: string;
  Viber: string;
  Notes: string;
}

export interface TeamMember {
  ID: string;
  GroupID: string;
  ConstituentID: string | null;
  Name: string;
  Role: string;
  AssignedArea: string | null;
  ContactInfo: ContactInfo;
  IsActive: boolean;
  Notes: string;
}

export interface CandidateView {
  ID: string;
  GroupID: string;
  ConstituentID: string | null;
  PartyID: string | null;
  Name: string;
  CandidateType: string;
  Number: number;
  Constituencies: string[];
  Notes: string;
  CreatedAt: string;
  IsOwnCandidate: boolean;
}

export interface Group {
  ID: string;
  Name: string;
  PartyID: string | null;
  Constituencies: string[];
  Candidates: CandidateView[];
  TeamMembers: TeamMember[];
  CreatedAt: string;
  UpdatedAt: string;
}

// Enrichment
export interface ConstituentProfile {
  GroupID: string;
  ConstituentID: string;
  FullNationalID: string | null;
  DOB: string | null;
  ContactInfo: ContactInfo;
  Notes: string;
}

export interface Nickname {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  Name: string;
  IsPrimary: boolean;
}

export interface Period {
  StartDate: string;
  EndDate: string | null;
}

export interface PartyAffiliation {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  PartyID: string;
  Period: Period;
  Source: string;
  FromPartyID: string | null;
  Notes: string;
}

export interface WorkplaceAssignment {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  Organization: string;
  Position: string;
  Sector: string;
  IslandID: string | null;
  Period: Period;
  Notes: string;
}

export interface Tag {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  Key: string;
  Value: string;
  Period: Period;
  AddedBy: string;
  Notes: string;
}

export interface PersonalTrait {
  GroupID: string;
  ConstituentID: string;
  Category: string;
  Value: string;
  Notes: string;
}

export interface Relationship {
  ID: string;
  GroupID: string;
  FromID: string;
  ToID: string;
  Type: string;
  Subtype: string;
  InfluenceScore: number;
  Notes: string;
  CreatedAt: string;
}

export interface EnrichedConstituent {
  ID: string;
  MaskedNationalID: string;
  FullNationalID: string | null;
  FullName: string;
  Sex: string;
  DOB: string | null;
  ConstituencyID: string;
  Profile: ConstituentProfile | null;
  Nicknames: Nickname[];
  Affiliations: PartyAffiliation[];
}

// Campaign
export interface SupportAssessment {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  CandidateID: string | null;
  Level: string;
  Confidence: number;
  AssessedBy: string;
  AssessedAt: string;
  Notes: string;
}

export interface SupportSummary {
  TotalAssessed: number;
  StrongSupporter: number;
  Leaning: number;
  Undecided: number;
  SoftOpposition: number;
  HardOpposition: number;
  NotAssessed: number;
}

export interface OutreachLog {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  Method: string;
  Outcome: string;
  ContactedBy: string;
  ContactedAt: string;
  FollowUpDate: string | null;
  Notes: string;
}

export interface CandidateSupportSummary {
  CandidateID: string;
  TotalAssessed: number;
  StrongSupporter: number;
  Leaning: number;
  Undecided: number;
  SoftOpposition: number;
  HardOpposition: number;
}

export interface AssessedVoter {
  ConstituentID: string;
  FullName: string;
  MaskedNationalID: string;
  FullNationalID: string | null;
  Sex: string;
  Level: string;
  Confidence: number;
  AssessedBy: string;
  AssessedAt: string;
}

export interface OutreachStats {
  TotalContacts: number;
  ByMethod: Record<string, number>;
  ByOutcome: Record<string, number>;
  UniqueContacted: number;
  PendingFollowUps: number;
}

// Voting
export interface VoterRegistration {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  ConstituencyID: string;
  BallotBoxID: string | null;
  IsReregistered: boolean;
  ReregSource: string;
  TransportStatus: string;
  TransportMode: string;
  TransportNotes: string;
}

export interface VotingRecord {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  ConstituencyID: string;
  BallotBoxID: string | null;
  HasVoted: boolean;
  VotedAt: string | null;
  ExitPollCandidateID: string | null;
  RecordedBy: string;
  Notes: string;
}

export interface TurnoutStats {
  TotalRegistered: number;
  TotalVoted: number;
  TurnoutPercent: number;
  VotedByHour: Record<number, number>;
}

// Ballot Box
export interface BallotBox {
  ID: string;
  Code: string;
  Location: string;
  IslandID: string | null;
  ConstituencyID: string;
  IsOverseas: boolean;
  Country: string;
  Capacity: number;
}

// Support levels enum
export type SupportLevel =
  | "strong_supporter"
  | "leaning"
  | "undecided"
  | "soft_opposition"
  | "hard_opposition";

// Outreach methods
export type OutreachMethod =
  | "door_to_door"
  | "phone_call"
  | "sms"
  | "viber"
  | "group_event"
  | "one_on_one"
  | "referral";

// Outreach outcomes
export type OutreachOutcome =
  | "positive"
  | "neutral"
  | "negative"
  | "not_home"
  | "refused";

// Team roles
export type TeamRole =
  | "candidate"
  | "campaign_manager"
  | "island_coordinator"
  | "ward_captain"
  | "canvasser"
  | "transport_lead"
  | "polling_agent"
  | "volunteer";

// Transport status
export type TransportStatus =
  | "not_needed"
  | "needed"
  | "arranged"
  | "confirmed";

// Voter Import
export interface VoterImportEntry {
  masked_national_id: string;
  full_national_id?: string;
  full_name: string;
  sex: string;
  dob?: string;
  island_id: string;
  address: string;
  constituency_id: string;
}

export interface ImportResult {
  Created: number;
  Updated: number;
  Skipped: number;
  Errors: { Entry: VoterImportEntry; Reason: string }[];
}

// Address Locations
export interface AddressLocation {
  ID: string;
  IslandID: string;
  AddressName: string;
  Latitude: number;
  Longitude: number;
}

export interface AddressWithCount {
  AddressName: string;
  Latitude: number | null;
  Longitude: number | null;
  Count: number;
}

export interface HeatMapPoint {
  Latitude: number;
  Longitude: number;
  Weight: number;
}

// Workplace sectors
export type WorkplaceSector =
  | "government"
  | "soe"
  | "private"
  | "self_employed"
  | "resort"
  | "ngo"
  | "unemployed"
  | "retired"
  | "student";
