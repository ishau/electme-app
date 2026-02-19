"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useGroup } from "@/lib/hooks/use-group";
import { useParties } from "@/lib/hooks/use-parties";
import { Page } from "@/components/shared/page";
import { Badge } from "@/components/ui/badge";
import { CandidateNicknameDialog } from "@/components/candidates/candidate-nickname-dialog";
import { DetailWithStatsSkeleton } from "@/components/shared/loading-skeleton";
import { candidateDisplayName, cn } from "@/lib/utils";
import { BarChart3, List } from "lucide-react";

const normalizeType = (t: string) => t.toLowerCase().replace(/\s+/g, "_");
const TYPE_LABEL: Record<string, string> = {
  mayor: "Mayor",
  president: "President",
  wdc_president: "WDC President",
  member: "Council Member",
  "member_(reserved_for_female)": "Council Member (Women's Seat)",
  "reserved_seat_for_female": "Council Member (Women's Seat)",
  wdc_member: "WDC Member",
};

export default function CandidateDetailLayout({ children }: { children: React.ReactNode }) {
  const { candidateId } = useParams<{ candidateId: string }>();
  const pathname = usePathname();

  const { data: group, isLoading } = useGroup();
  const { data: parties } = useParties();

  const candidate = group?.Candidates?.find((c) => c.ID === candidateId);
  const party = candidate?.PartyID ? (parties ?? []).find((p) => p.ID === candidate.PartyID) : null;
  const typeLabel = candidate ? (TYPE_LABEL[normalizeType(candidate.CandidateType)] ?? candidate.CandidateType.replace(/_/g, " ")) : "";

  const tabs = [
    { label: "Insights", href: `/candidates/${candidateId}/insights`, icon: BarChart3 },
    { label: "Voters", href: `/candidates/${candidateId}/voters`, icon: List },
  ];

  if (isLoading || !candidate) {
    return (
      <Page title="Loading..." description="">
        <DetailWithStatsSkeleton />
      </Page>
    );
  }

  return (
    <Page
      title={candidateDisplayName(candidate)}
      description={
        <span className="flex items-center gap-2">
          {party && (
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold text-white leading-none"
              style={{ backgroundColor: party.Color }}
            >
              {party.Code}
            </span>
          )}
          <span>{party?.Name ?? "Independent"} · {typeLabel}</span>
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          {candidate.IsOwnCandidate && (
            <CandidateNicknameDialog candidateId={candidateId} currentNickname={candidate.Nickname} />
          )}
          {!candidate.IsOwnCandidate && <Badge variant="secondary">Competing</Badge>}
        </div>
      }
    >
      <nav className="flex gap-1 border-b overflow-x-auto -mt-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </Page>
  );
}
