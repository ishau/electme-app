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
  FullNationalID: string | null;
  Age: number | null;
  PermanentAddress: string;
  IslandName: string;
  Nicknames: string[] | null;
  ContactInfo: ContactInfo | null;
}

// Constituent (base)
export interface PermanentAddress {
  IslandID: string;
  IslandName: string;
  Name: string;
}

export interface Constituent {
  ID: string;
  MaskedNationalID: string;
  FullNationalID?: string | null;
  FullName: string;
  Sex: string;
  Age?: number | null;
  PermanentAddress: PermanentAddress;
  ConstituencyID: string;
  LatestAffiliation?: PartyAffiliation | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Group
export interface ContactInfo {
  phone_numbers?: string[];
  email?: string;
  notes?: string;
}

export interface TeamMember {
  ID: string;
  GroupID: string;
  Name: string;
  Role: string;
  IsActive: boolean;
  Username: string | null;
}

export interface CandidateView {
  ID: string;
  GroupID: string;
  ConstituentID: string | null;
  PartyID: string | null;
  Name: string;
  Nickname?: string;
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
  FullNationalID?: string | null;
  ContactInfo?: ContactInfo;
  Notes?: string;
}

export interface Nickname {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  Name: string;
  IsPrimary: boolean;
}

export interface Period {
  Start: string;
  End: string | null;
}

export interface PartyAffiliation {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  PartyID: string;
  KnownDate: string | null;
  Source: string;
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

export interface RelationshipView {
  ID: string;
  PersonID: string;
  Name: string;
  Address: PermanentAddress;
  RelLabel: string;
  Notes: string;
  Derived: boolean;
  Score: number;
  LatestAffiliation?: PartyAffiliation | null;
}

export interface EnrichedConstituent {
  ID: string;
  MaskedNationalID: string;
  FullNationalID: string | null;
  FullName: string;
  Sex: string;
  Age: number | null;
  PermanentAddress: PermanentAddress;
  ConstituencyID: string;
  Profile: ConstituentProfile | null;
  Nicknames: Nickname[];
  Affiliations: PartyAffiliation[];
  Workplaces?: WorkplaceAssignment[];
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
  Age?: number;
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
export interface ExitPollVote {
  ID: string;
  CandidateID: string;
  CandidateType: string;
}

export interface VotingRecord {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  ConstituencyID: string;
  HasVoted: boolean;
  VotedAt: string | null;
  RecordedBy: string;
  Notes: string;
  ExitPolls: ExitPollVote[];
}

export interface TurnoutStats {
  TotalConstituents: number;
  TotalVoted: number;
  TurnoutPercent: number;
  VotedByHour: Record<number, number>;
}

// Analytics
export interface SupportTrendPoint {
  Week: string;
  StrongSupporter: number;
  Leaning: number;
  Undecided: number;
  SoftOpposition: number;
  HardOpposition: number;
}

export interface ConstituencySupportBreakdown {
  ConstituencyID: string;
  ConstituencyName: string;
  StrongSupporter: number;
  Leaning: number;
  Undecided: number;
  SoftOpposition: number;
  HardOpposition: number;
}

export interface OutreachDayCount {
  Date: string;
  Count: number;
}

export interface TeamMemberActivity {
  ContactedBy: string;
  TotalContacts: number;
  UniqueContacted: number;
  Positive: number;
  Neutral: number;
  Negative: number;
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
}

export interface BallotBoxWithStats extends BallotBox {
  TotalVoters: number;
  VotedCount: number;
  TurnoutPercent: number;
}

export interface BoxVoter {
  ID: string;
  MaskedNationalID: string;
  FullName: string;
  Sex: string;
  Age: number | null;
  IslandName: string;
  PermanentAddress: string;
  ConstituencyID: string;
  HasVoted: boolean;
  VotedAt: string | null;
  VotingRecordID: string | null;
  ExitPolls: ExitPollVote[];
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

// House
export interface House {
  ID: string;
  HouseName: string;
  IslandID: string;
  IslandName: string;
  IslandLat: number | null;
  IslandLng: number | null;
  Lat: number | null;
  Lng: number | null;
  H3Cell: string | null;
  IsPlotted: boolean;
  ResidentCount: number;
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

// Hex Analytics (GeoJSON)
export interface HexLeaningParty {
  party_id: string;
  party_code: string;
  party_color: string;
  voter_count: number;
  pct: number;
}

export interface HexLeaningProperties {
  hex: string;
  total_in_hex: number;
  parties: HexLeaningParty[];
}

export interface HexCandidateSupportLevel {
  level: string;
  voter_count: number;
  pct: number;
}

export interface HexCandidateSupportProperties {
  hex: string;
  total_in_hex: number;
  levels: HexCandidateSupportLevel[];
}

export interface HexPartySupportEntry {
  party_id: string;
  party_code: string;
  party_color: string;
  levels: HexCandidateSupportLevel[];
}

export interface HexPartySupportProperties {
  hex: string;
  total_in_hex: number;
  parties: HexPartySupportEntry[];
}

// Demographics
export interface SexBreakdown {
  Male: number;
  Female: number;
}

export interface AgeGroupCount {
  AgeGroup: string;
  Count: number;
}

export interface IslandCount {
  IslandID: string;
  IslandName: string;
  Count: number;
}

export interface ConstituencyCount {
  ConstituencyID: string;
  ConstituencyName: string;
  Count: number;
}

export interface Demographics {
  TotalVoters: number;
  BySex: SexBreakdown;
  ByAgeGroup: AgeGroupCount[];
  ByIsland: IslandCount[];
  ByConstituency: ConstituencyCount[];
}

// New Voter Stats (age 18-20)
export interface NewVoterStats {
  Total: number;
  BySex: SexBreakdown;
  ByAge: { Age: number; Count: number }[];
  ByConstituency: ConstituencyCount[];
  ByIsland: IslandCount[];
  SupportBreakdown?: {
    Assessed: number;
    StrongSupporter: number;
    Leaning: number;
    Undecided: number;
    SoftOpposition: number;
    HardOpposition: number;
  };
}

// Affiliation source values
export type AffiliationSource = "self_declared" | "observed" | "voter_list" | "unknown";

// Transport Request
export type TransportRequestStatus =
  | "pending"
  | "arranged"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface TransportRequest {
  ID: string;
  GroupID: string;
  ConstituentID: string;
  ConstituencyID: string;
  FullName: string;
  MaskedNationalID: string;
  IslandName: string;
  VotingIslandName: string;
  InterIslandNeeded: boolean;
  InterIslandMode: string;
  InterIslandStatus: string;
  InterIslandNotes: string;
  VotingDayNeeded: boolean;
  VotingDayDirection: string;
  VotingDayStatus: string;
  VotingDayNotes: string;
  ServiceProvided: boolean | null;
  DeniedReason: string;
  AssignedTo: string;
  Notes: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface TransportStats {
  Total: number;
  InterIslandNeeded: number;
  VotingDayNeeded: number;
  Pending: number;
  Arranged: number;
  Completed: number;
  Cancelled: number;
  ServiceProvided: number;
  ServiceDenied: number;
}
