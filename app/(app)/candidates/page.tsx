"use client";

import Link from "next/link";
import { useGroup } from "@/lib/hooks/use-group";
import { useCandidateSummaries } from "@/lib/hooks/use-candidates";
import { useConstituencies } from "@/lib/hooks/use-constituencies";
import { useParties } from "@/lib/hooks/use-parties";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { UserCog } from "lucide-react";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
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

export default function CandidatesPage() {
  const { data: group, isLoading: groupLoading } = useGroup();
  const { data: summaries } = useCandidateSummaries();
  const { data: constituencies } = useConstituencies();
  const { data: parties } = useParties();

  const summaryMap = Object.fromEntries(
    (summaries ?? []).map((s) => [s.CandidateID, s])
  );

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
      const label = typeKey.replace(/_/g, " ");
      candidateGroups.push({
        key: `type-${typeKey}`,
        label: label.charAt(0).toUpperCase() + label.slice(1),
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
    return <Page title="Candidates" description="Loading..."><PageSkeleton /></Page>;
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ownCandidates.map((c) => {
              const party = c.PartyID ? partyMap[c.PartyID] : null;
              return (
                <Link key={c.ID} href={`/candidates/${c.ID}`}>
                  <Card className="transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {party ? (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: party.Color }}
                            title={party.Name}
                          >
                            {party.Code}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                            IND
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{c.Name}</p>
                          <p className="text-sm text-muted-foreground">
                            {party ? party.Name : "Independent"}
                          </p>
                          {summaryMap[c.ID] && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {summaryMap[c.ID].TotalAssessed} assessed
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">{c.Number}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            {opponents.map((c) => {
              const party = c.PartyID ? partyMap[c.PartyID] : null;
              return (
                <Link key={c.ID} href={`/candidates/${c.ID}`}>
                  <Card className="transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {party ? (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: party.Color }}
                            title={party.Name}
                          >
                            {party.Code}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                            IND
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{c.Name}</p>
                          <p className="text-sm text-muted-foreground">
                            {party ? party.Name : "Independent"}
                          </p>
                          {summaryMap[c.ID] && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {summaryMap[c.ID].TotalAssessed} assessed
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-muted-foreground">{c.Number}</span>
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
