"use client";

import Link from "next/link";
import { useGroup } from "@/lib/hooks/use-group";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { useParties } from "@/lib/hooks/use-parties";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { UserCog } from "lucide-react";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { candidateDisplayName } from "@/lib/utils";
import type { CandidateView } from "@/lib/types";

const MULTI_CONSTITUENCY_TYPES = ["president", "mayor", "wdc_president"];
const MULTI_CONSTITUENCY_SORT_ORDER: Record<string, number> = {
  mayor: 0,
  president: 1,
  wdc_president: 2,
};

interface CandidateGroup {
  key: string;
  label: string;
  sortOrder: number;
  sortKey: string;
  ownCandidates: CandidateView[];
  opponents: CandidateView[];
}

const normalizeType = (type: string) => type.toLowerCase().replace(/\s+/g, "_");
const isMultiConstituencyType = (type: string) =>
  MULTI_CONSTITUENCY_TYPES.includes(normalizeType(type));

const TYPE_LABEL: Record<string, string> = {
  mayor: "Mayor",
  president: "President",
  wdc_president: "WDC President",
  member: "Council Member",
  "member_(reserved_for_female)": "Council Member (Women's Seat)",
  "reserved_seat_for_female": "Council Member (Women's Seat)",
  wdc_member: "WDC Member",
};

export default function CandidatesPage() {
  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: constituencies } = useConstituencies();
  const { data: parties } = useParties();

  const constituencyMap = Object.fromEntries(
    (constituencies ?? []).map((c) => [c.ID, c])
  );

  const partyMap = Object.fromEntries(
    (parties ?? []).map((p) => [p.ID, p])
  );

  const candidates = group?.Candidates ?? [];

  const multiConstCandidates = candidates.filter((c) => isMultiConstituencyType(c.CandidateType));
  const regularCandidates = candidates.filter((c) => !isMultiConstituencyType(c.CandidateType));

  const candidateGroups: CandidateGroup[] = [];
  const seenTypes = new Set<string>();

  for (const candidate of multiConstCandidates) {
    const typeKey = normalizeType(candidate.CandidateType);
    if (!seenTypes.has(typeKey)) {
      seenTypes.add(typeKey);
      candidateGroups.push({
        key: `type-${typeKey}`,
        label: TYPE_LABEL[typeKey] ?? typeKey.replace(/_/g, " "),
        sortOrder: MULTI_CONSTITUENCY_SORT_ORDER[typeKey] ?? 99,
        sortKey: typeKey,
        ownCandidates: multiConstCandidates.filter(
          (c) => normalizeType(c.CandidateType) === typeKey && c.IsOwnCandidate
        ),
        opponents: multiConstCandidates.filter(
          (c) => normalizeType(c.CandidateType) === typeKey && !c.IsOwnCandidate
        ),
      });
    }
  }

  const seenConstituencies = new Set<string>();

  for (const candidate of regularCandidates) {
    for (const cId of candidate.Constituencies ?? []) {
      if (!seenConstituencies.has(cId)) {
        seenConstituencies.add(cId);
        const constituency = constituencyMap[cId];
        if (constituency) {
          candidateGroups.push({
            key: `const-${cId}`,
            label: constituency.Name,
            sortOrder: 100,
            sortKey: constituency.Code,
            ownCandidates: regularCandidates.filter(
              (c) => c.IsOwnCandidate && (c.Constituencies ?? []).includes(cId)
            ),
            opponents: regularCandidates.filter(
              (c) => !c.IsOwnCandidate && (c.Constituencies ?? []).includes(cId)
            ),
          });
        }
      }
    }
  }

  candidateGroups.sort((a, b) =>
    a.sortOrder !== b.sortOrder
      ? a.sortOrder - b.sortOrder
      : a.sortKey.localeCompare(b.sortKey)
  );

  if (groupLoading) {
    return <Page title="Candidates" description="Loading..."><CardGridSkeleton /></Page>;
  }

  return (
    <Page title="Candidates" description="Own and competing candidates by constituency">
      {candidates.length === 0 && (
        <EmptyState icon={UserCog} title="No candidates" description="Candidates are managed through the backend." />
      )}

      {candidateGroups.map(({ key, label, ownCandidates, opponents }) => (
        <div key={key} className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {label}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...ownCandidates, ...opponents].map((c) => {
              const party = c.PartyID ? partyMap[c.PartyID] : null;
              return (
                <Link key={c.ID} href={`/candidates/${c.ID}`}>
                  <Card className="transition-colors cursor-pointer hover:bg-muted/50">
                    <CardContent className="px-3 py-2 flex items-center gap-2.5">
                      <span
                        className="shrink-0 inline-flex items-center justify-center rounded-sm w-7 h-7 text-[10px] font-bold text-white"
                        style={{ backgroundColor: party?.Color ?? "#9ca3af" }}
                      >
                        {party?.Code ?? "IND"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {candidateDisplayName(c)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {party?.Name ?? "Independent"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </Page>
  );
}
