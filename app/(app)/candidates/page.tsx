import Link from "next/link";
import { get, getGroupId } from "@/lib/api";
import type { Group, CandidateSupportSummary, Constituency, CandidateView } from "@/lib/types";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog } from "lucide-react";

// Candidate types that span multiple constituencies — grouped by type instead
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

export default async function CandidatesPage() {
  const groupId = getGroupId();
  const [group, summaries, constituencies] = await Promise.all([
    get<Group>(`/groups/${groupId}`),
    get<CandidateSupportSummary[]>(`/groups/${groupId}/support-by-candidate`).catch(() => [] as CandidateSupportSummary[]),
    get<Constituency[]>("/constituencies"),
  ]);

  const summaryMap = Object.fromEntries(
    (summaries ?? []).map((s) => [s.CandidateID, s])
  );

  const constituencyMap = Object.fromEntries(
    constituencies.map((c) => [c.ID, c])
  );

  const candidates = group.Candidates ?? [];

  const normalizeType = (type: string) => type.toLowerCase().replace(/\s+/g, "_");
  const isMultiConstituencyType = (type: string) =>
    MULTI_CONSTITUENCY_TYPES.includes(normalizeType(type));

  // Separate multi-constituency candidates (President, Mayor, WDC President)
  const multiConstCandidates = candidates.filter((c) => isMultiConstituencyType(c.CandidateType));
  const regularCandidates = candidates.filter((c) => !isMultiConstituencyType(c.CandidateType));

  // Build groups for multi-constituency types
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

  // Build groups for regular candidates by constituency
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

  // Sort: Mayor, President, WDC President first, then constituencies by Code alphabetically
  candidateGroups.sort((a, b) =>
    a.sortOrder !== b.sortOrder
      ? a.sortOrder - b.sortOrder
      : a.sortKey.localeCompare(b.sortKey)
  );

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
            {ownCandidates.map((c) => (
              <Link key={c.ID} href={`/candidates/${c.ID}`}>
                <Card className="border-accent/30 hover:border-accent transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.Name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{c.CandidateType.replace(/_/g, " ")}</p>
                      {c.Notes && <p className="text-xs text-muted-foreground mt-1">{c.Notes}</p>}
                      {summaryMap[c.ID] && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {summaryMap[c.ID].TotalAssessed} assessed
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-accent">#{c.Number}</span>
                      <Badge variant="default" className="ml-2">Own</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {opponents.map((c) => (
              <Link key={c.ID} href={`/candidates/${c.ID}`}>
                <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.Name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{c.CandidateType.replace(/_/g, " ")}</p>
                      {summaryMap[c.ID] && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {summaryMap[c.ID].TotalAssessed} assessed
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-muted-foreground">#{c.Number}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </Page>
  );
}
