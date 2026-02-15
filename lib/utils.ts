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

export function supportLevelColor(level: string): string {
  switch (level) {
    case "strong_supporter":
      return "bg-green-500 text-white";
    case "leaning":
      return "bg-yellow-400 text-yellow-900";
    case "undecided":
      return "bg-gray-400 text-white";
    case "soft_opposition":
      return "bg-orange-400 text-white";
    case "hard_opposition":
      return "bg-red-500 text-white";
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

export function transportStatusLabel(status: string): string {
  switch (status) {
    case "not_needed":
      return "Not Needed";
    case "needed":
      return "Needed";
    case "arranged":
      return "Arranged";
    case "confirmed":
      return "Confirmed";
    default:
      return status;
  }
}

export function transportStatusColor(status: string): string {
  switch (status) {
    case "not_needed":
      return "bg-gray-100 text-gray-700";
    case "needed":
      return "bg-red-100 text-red-700";
    case "arranged":
      return "bg-yellow-100 text-yellow-700";
    case "confirmed":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
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
