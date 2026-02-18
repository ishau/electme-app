"use client";

import { useParams } from "next/navigation";
import { useGroup } from "@/lib/hooks/use-group";
import { useCandidateSummaries, useCandidateVoters } from "@/lib/hooks/use-candidates";
import { useParties } from "@/lib/hooks/use-parties";
import { Page } from "@/components/shared/page";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { CandidateVoterSearch } from "@/components/candidates/candidate-voter-search";
import { CandidateVoterTable } from "@/components/candidates/candidate-voter-table";
import { DetailWithStatsSkeleton } from "@/components/shared/loading-skeleton";
import { useQueryStates, parseAsString } from "nuqs";

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
  const { data: parties } = useParties();

  const voterParams: Record<string, string> = {};
  if (filters.level) voterParams.level = filters.level;

  const { data: voters } = useCandidateVoters(candidateId, Object.keys(voterParams).length > 0 ? voterParams : undefined);

  const candidate = group?.Candidates?.find((c) => c.ID === candidateId);
  const summary = (summaries ?? []).find((s) => s.CandidateID === candidateId);
  const total = summary?.TotalAssessed ?? 0;
  const party = candidate?.PartyID ? (parties ?? []).find((p) => p.ID === candidate.PartyID) : null;
  const typeLabel = candidate ? (TYPE_LABEL[normalizeType(candidate.CandidateType)] ?? candidate.CandidateType.replace(/_/g, " ")) : "";

  if (!candidate) return <Page title="Loading..." description=""><DetailWithStatsSkeleton /></Page>;

  return (
    <Page
      title={`#${candidate.Number} ${candidate.Name}`}
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
              className="bg-support-strong"
              style={{ width: `${(summary!.StrongSupporter / total) * 100}%` }}
              title={`Strong: ${summary!.StrongSupporter}`}
            />
          )}
          {summary!.Leaning > 0 && (
            <div
              className="bg-support-leaning"
              style={{ width: `${(summary!.Leaning / total) * 100}%` }}
              title={`Leaning: ${summary!.Leaning}`}
            />
          )}
          {summary!.Undecided > 0 && (
            <div
              className="bg-support-undecided"
              style={{ width: `${(summary!.Undecided / total) * 100}%` }}
              title={`Undecided: ${summary!.Undecided}`}
            />
          )}
          {summary!.SoftOpposition > 0 && (
            <div
              className="bg-support-soft-opposition"
              style={{ width: `${(summary!.SoftOpposition / total) * 100}%` }}
              title={`Soft Opp: ${summary!.SoftOpposition}`}
            />
          )}
          {summary!.HardOpposition > 0 && (
            <div
              className="bg-support-hard-opposition"
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
