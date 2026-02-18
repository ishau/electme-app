"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupportLevelBadge } from "@/components/campaign/support-level-badge";
import { GenderBadge } from "@/components/shared/gender-badge";
import { AddressSupportDialog } from "@/components/constituents/bulk-add-by-address-dialog";
import { supportLevelColor, supportLevelLabel, formatDate, candidateDisplayName } from "@/lib/utils";
import { Users } from "lucide-react";
import type { Constituent, SupportAssessment, CandidateView, Party } from "@/lib/types";

const normalizeType = (t: string) => t.toLowerCase().replace(/\s+/g, "_");

const TYPE_ORDER: Record<string, number> = {
  mayor: 0,
  president: 1,
  wdc_president: 2,
  member: 3,
  "member_(reserved_for_female)": 3,
  "reserved_seat_for_female": 3,
  wdc_member: 4,
};

const TYPE_LABEL: Record<string, string> = {
  mayor: "Mayor",
  president: "President",
  wdc_president: "WDC President",
  member: "Council Member",
  "member_(reserved_for_female)": "Council Member (Women's Seat)",
  "reserved_seat_for_female": "Council Member (Women's Seat)",
  wdc_member: "WDC Member",
};

interface HouseholdCardProps {
  currentConstituentId: string;
  neighbors: Constituent[];
  latestSupport: Record<string, SupportAssessment[]>;
  address?: string;
  islandId?: string;
  islandName?: string;
  constituencyId?: string;
  candidates?: CandidateView[];
  parties?: Party[];
}

interface PreviewState {
  name: string;
  assessments: SupportAssessment[];
}

export function HouseholdCard({
  currentConstituentId,
  neighbors,
  latestSupport,
  address,
  islandId,
  islandName,
  constituencyId,
  candidates,
  parties,
}: HouseholdCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const others = neighbors.filter((n) => n.ID !== currentConstituentId);

  if (others.length === 0) return null;

  const canBulkUpdate = address && islandId && constituencyId;

  const candidateMap = Object.fromEntries(
    (candidates ?? []).map((c) => [c.ID, c])
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Same Address ({others.length})
          </CardTitle>
          {canBulkUpdate && (
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Users className="h-4 w-4 mr-1" />
              Bulk Update
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {others.map((n) => {
              const assessments = latestSupport[n.ID];
              const affiliatedParty = n.LatestAffiliation
                ? (parties ?? []).find((p) => p.ID === n.LatestAffiliation!.PartyID)
                : undefined;
              return (
                <div
                  key={n.ID}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <Link
                      href={`/constituents/${n.ID}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {n.FullName}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <GenderBadge sex={n.Sex} />
                      {affiliatedParty && (
                        <span
                          className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold text-white leading-none"
                          style={{ backgroundColor: affiliatedParty.Color }}
                        >
                          {affiliatedParty.Code}
                        </span>
                      )}
                      {n.Age != null && (
                        <span className="text-xs text-muted-foreground">{n.Age} yrs</span>
                      )}
                    </div>
                  </div>
                  {assessments && assessments.length > 0 ? (
                    <button
                      type="button"
                      className="flex items-center gap-0.5 cursor-pointer hover:opacity-70 transition-opacity min-w-8 min-h-8 justify-end"
                      onClick={() => setPreview({ name: n.FullName, assessments })}
                    >
                      {(() => {
                        const latest = new Map<string, SupportAssessment>();
                        for (const a of assessments) {
                          const key = a.CandidateID ?? "_none";
                          const existing = latest.get(key);
                          if (!existing || new Date(a.AssessedAt) > new Date(existing.AssessedAt)) {
                            latest.set(key, a);
                          }
                        }
                        return [...latest.values()].map((a) => {
                          const cand = a.CandidateID ? candidateMap[a.CandidateID] : null;
                          const candParty = cand?.PartyID ? (parties ?? []).find((p) => p.ID === cand.PartyID) : null;
                          return (
                            <span key={a.ID} className="flex flex-col items-center gap-px">
                              <span className={`w-1.5 h-4 rounded-sm ${supportLevelColor(a.Level).split(" ")[0]}`} />
                              <span
                                className="w-1.5 h-1.5 rounded-[1px]"
                                style={{ backgroundColor: candParty?.Color ?? "#d4d4d4" }}
                              />
                            </span>
                          );
                        });
                      })()}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Not assessed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(v) => { if (!v) setPreview(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">{preview?.name} — Assessments</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto space-y-3">
            {(() => {
              if (!preview) return null;
              const byCand = new Map<string, SupportAssessment[]>();
              for (const a of preview.assessments) {
                const key = a.CandidateID ?? "_none";
                if (!byCand.has(key)) byCand.set(key, []);
                byCand.get(key)!.push(a);
              }
              for (const arr of byCand.values()) {
                arr.sort((a, b) => new Date(b.AssessedAt).getTime() - new Date(a.AssessedAt).getTime());
              }
              const byType = new Map<string, { candId: string; cand: CandidateView | null; assessments: SupportAssessment[] }[]>();
              for (const [candId, assessments] of byCand) {
                const cand = candId !== "_none" ? candidateMap[candId] ?? null : null;
                const type = cand ? normalizeType(cand.CandidateType) : "_unknown";
                if (!byType.has(type)) byType.set(type, []);
                byType.get(type)!.push({ candId, cand, assessments });
              }
              const sortedTypes = [...byType.entries()].sort(
                ([a], [b]) => (TYPE_ORDER[a] ?? 99) - (TYPE_ORDER[b] ?? 99)
              );

              return sortedTypes.map(([type, candEntries]) => (
                <div key={type}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {TYPE_LABEL[type] ?? type}
                  </h4>
                  <div className="space-y-1.5">
                    {candEntries.map(({ candId, cand, assessments: candAssessments }) => {
                      const latest = candAssessments[0];
                      const history = candAssessments.slice(1);
                      const candParty = cand?.PartyID ? (parties ?? []).find((p) => p.ID === cand.PartyID) : null;
                      return (
                        <div key={candId} className="py-1.5 px-2 border rounded text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: candParty?.Color ?? "#a3a3a3" }}
                              title={candParty?.Code ?? "IND"}
                            />
                            <span className="font-medium truncate">
                              {cand ? candidateDisplayName(cand) : "General"}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto">
                              {formatDate(latest.AssessedAt)}
                            </span>
                            <SupportLevelBadge level={latest.Level} />
                          </div>
                          {history.length > 0 && (
                            <div className="mt-1.5 ml-5 space-y-1">
                              {history.map((h) => (
                                <div key={h.ID} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className={`w-2 h-2 rounded-sm shrink-0 ${supportLevelColor(h.Level).split(" ")[0]}`} />
                                  <span>{supportLevelLabel(h.Level)}</span>
                                  <span>—</span>
                                  <span>{formatDate(h.AssessedAt)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {canBulkUpdate && (
        <AddressSupportDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          address={address}
          islandId={islandId}
          islandName={islandName ?? ""}
          constituencyId={constituencyId}
          candidates={candidates ?? []}
          parties={parties ?? []}
        />
      )}
    </>
  );
}
