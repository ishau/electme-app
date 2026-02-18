import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Hex colors for support levels — use in Recharts fills, MapLibre styles, inline styles */
export const SUPPORT_LEVEL_HEX: Record<string, string> = {
  strong_supporter: "#7f2df7",
  leaning: "#a37dff",
  undecided: "#9ba0a9",
  soft_opposition: "#e66eee",
  hard_opposition: "#a100b7",
};

export function supportLevelColor(level: string): string {
  switch (level) {
    case "strong_supporter":
      return "bg-support-strong text-white";
    case "leaning":
      return "bg-support-leaning text-white";
    case "undecided":
      return "bg-support-undecided text-white";
    case "soft_opposition":
      return "bg-support-soft-opposition text-white";
    case "hard_opposition":
      return "bg-support-hard-opposition text-white";
    default:
      return "bg-gray-200 text-gray-700";
  }
}

export function supportLevelLabel(level: string): string {
  switch (level) {
    case "strong_supporter":
      return "Strong Supporter";
    case "leaning":
      return "Leaning";
    case "undecided":
      return "Undecided";
    case "soft_opposition":
      return "Soft Opposition";
    case "hard_opposition":
      return "Hard Opposition";
    default:
      return level;
  }
}

export function outreachMethodLabel(method: string): string {
  switch (method) {
    case "door_to_door":
      return "Door to Door";
    case "phone_call":
      return "Phone Call";
    case "sms":
      return "SMS";
    case "viber":
      return "Viber";
    case "group_event":
      return "Group Event";
    case "one_on_one":
      return "One on One";
    case "referral":
      return "Referral";
    default:
      return method;
  }
}

export function outreachOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case "positive":
      return "Positive";
    case "neutral":
      return "Neutral";
    case "negative":
      return "Negative";
    case "not_home":
      return "Not Home";
    case "refused":
      return "Refused";
    default:
      return outcome;
  }
}

export function teamRoleLabel(role: string): string {
  switch (role) {
    case "candidate":
      return "Candidate";
    case "campaign_manager":
      return "Campaign Manager";
    case "island_coordinator":
      return "Island Coordinator";
    case "ward_captain":
      return "Ward Captain";
    case "canvasser":
      return "Canvasser";
    case "transport_lead":
      return "Transport Lead";
    case "polling_agent":
      return "Polling Agent";
    case "volunteer":
      return "Volunteer";
    default:
      return role;
  }
}

export function transportModeLabel(mode: string): string {
  switch (mode) {
    case "air":
      return "Air";
    case "sea":
      return "Sea";
    case "vehicle":
      return "Vehicle";
    default:
      return "—";
  }
}

export function transportRequestStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "arranged":
      return "Arranged";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function transportRequestStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "arranged":
      return "bg-blue-100 text-blue-700";
    case "in_progress":
      return "bg-indigo-100 text-indigo-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function votingDayDirectionLabel(direction: string): string {
  switch (direction) {
    case "to_center":
      return "To Center";
    case "from_center":
      return "From Center";
    case "both":
      return "Both Ways";
    default:
      return "—";
  }
}

export function serviceOutcomeLabel(provided: boolean | null): string {
  if (provided === null) return "Pending";
  return provided ? "Provided" : "Denied";
}

export function serviceOutcomeColor(provided: boolean | null): string {
  if (provided === null) return "bg-gray-100 text-gray-700";
  return provided ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
}

export function sectorLabel(sector: string): string {
  switch (sector) {
    case "government":
      return "Government";
    case "soe":
      return "SOE";
    case "private":
      return "Private";
    case "self_employed":
      return "Self Employed";
    case "resort":
      return "Resort";
    case "ngo":
      return "NGO";
    case "unemployed":
      return "Unemployed";
    case "retired":
      return "Retired";
    case "student":
      return "Student";
    default:
      return sector;
  }
}
