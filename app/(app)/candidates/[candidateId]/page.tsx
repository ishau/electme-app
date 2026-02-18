"use client";

import { useParams } from "next/navigation";
import { useGroup } from "@/lib/hooks/use-group";
import { useCandidateSummaries, useCandidateVoters } from "@/lib/hooks/use-candidates";
import { Page } from "@/components/shared/page";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { CandidateVoterSearch } from "@/components/candidates/candidate-voter-search";
import { CandidateVoterTable } from "@/components/candidates/candidate-voter-table";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { useQueryStates, parseAsString } from "nuqs";

export default function CandidateDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();

  const [filters] = useQueryStates(
    {
      level: parseAsString.withDefault(""),
      name: parseAsString.withDefault(""),
    },
    { shallow: false }
  );

  const { data: group } = useGroup();
  const { data: summaries } = useCandidateSummaries();

  const voterParams: Record<string, string> = {};
  if (filters.level) voterParams.level = filters.level;

  const { data: voters } = useCandidateVoters(candidateId, Object.keys(voterParams).length > 0 ? voterParams : undefined);

  const candidate = group?.Candidates?.find((c) => c.ID === candidateId);
  const summary = (summaries ?? []).find((s) => s.CandidateID === candidateId);
  const total = summary?.TotalAssessed ?? 0;

  if (!candidate) return <Page title="Loading..." description=""><PageSkeleton /></Page>;

  return (
    <Page
      title={`#${candidate.Number} ${candidate.Name}`}
      description={candidate.CandidateType.replace(/_/g, " ")}
      actions={
        <div className="flex items-center gap-2">
          {candidate.IsOwnCandidate && <Badge variant="default">Own</Badge>}
          {!candidate.IsOwnCandidate && <Badge variant="secondary">Competing</Badge>}
        </div>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard title="Strong" value={summary?.StrongSupporter ?? 0} />
        <StatCard title="Leaning" value={summary?.Leaning ?? 0} />
        <StatCard title="Undecided" value={summary?.Undecided ?? 0} />
        <StatCard title="Soft Opp" value={summary?.SoftOpposition ?? 0} />
        <StatCard title="Hard Opp" value={summary?.HardOpposition ?? 0} />
      </div>

      {/* Stacked bar */}
      {total > 0 && (
        <div className="flex h-3 rounded-full overflow-hidden">
          {summary!.StrongSupporter > 0 && (
            <div
              className="bg-green-500"
              style={{ width: `${(summary!.StrongSupporter / total) * 100}%` }}
              title={`Strong: ${summary!.StrongSupporter}`}
            />
          )}
          {summary!.Leaning > 0 && (
            <div
              className="bg-yellow-400"
              style={{ width: `${(summary!.Leaning / total) * 100}%` }}
              title={`Leaning: ${summary!.Leaning}`}
            />
          )}
          {summary!.Undecided > 0 && (
            <div
              className="bg-gray-400"
              style={{ width: `${(summary!.Undecided / total) * 100}%` }}
              title={`Undecided: ${summary!.Undecided}`}
            />
          )}
          {summary!.SoftOpposition > 0 && (
            <div
              className="bg-orange-400"
              style={{ width: `${(summary!.SoftOpposition / total) * 100}%` }}
              title={`Soft Opp: ${summary!.SoftOpposition}`}
            />
          )}
          {summary!.HardOpposition > 0 && (
            <div
              className="bg-red-500"
              style={{ width: `${(summary!.HardOpposition / total) * 100}%` }}
              title={`Hard Opp: ${summary!.HardOpposition}`}
            />
          )}
        </div>
      )}

      {/* Filter bar */}
      <CandidateVoterSearch />

      {/* Voter table */}
      <CandidateVoterTable voters={voters ?? []} candidateId={candidateId} />
    </Page>
  );
}
