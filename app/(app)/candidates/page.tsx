import Link from "next/link";
import { get, getGroupId } from "@/lib/api";
import type { Group, CandidateSupportSummary } from "@/lib/types";
import { Page } from "@/components/shared/page";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog } from "lucide-react";

export default async function CandidatesPage() {
  const groupId = getGroupId();
  const [group, summaries] = await Promise.all([
    get<Group>(`/groups/${groupId}`),
    get<CandidateSupportSummary[]>(`/groups/${groupId}/support-by-candidate`).catch(() => [] as CandidateSupportSummary[]),
  ]);

  const summaryMap = Object.fromEntries(
    (summaries ?? []).map((s) => [s.CandidateID, s])
  );

  const ownCandidates = group.Candidates?.filter((c) => c.IsOwnCandidate) ?? [];
  const otherCandidates = group.Candidates?.filter((c) => !c.IsOwnCandidate) ?? [];

  return (
    <Page title="Candidates" description="Own and competing candidates">
      {(!group.Candidates || group.Candidates.length === 0) && (
        <EmptyState icon={UserCog} title="No candidates" description="Candidates are managed through the backend." />
      )}

      {ownCandidates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Own Candidates</h3>
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
          </div>
        </div>
      )}

      {otherCandidates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Competing Candidates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherCandidates.map((c) => (
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
      )}
    </Page>
  );
}
