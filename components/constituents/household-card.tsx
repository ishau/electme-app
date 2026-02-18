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
import { AddressSupportDialog } from "@/components/constituents/bulk-add-by-address-dialog";
import { supportLevelColor, formatDateTime } from "@/lib/utils";
import { Users } from "lucide-react";
import type { Constituent, SupportAssessment, CandidateView, Party } from "@/lib/types";

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
          <div className="space-y-2">
            {others.map((n) => {
              const assessments = latestSupport[n.ID];
              return (
                <div
                  key={n.ID}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const party = n.LatestAffiliation ? (parties ?? []).find((p) => p.ID === n.LatestAffiliation!.PartyID) : null;
                        return party ? (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: party.Color }}
                            title={party.Code}
                          />
                        ) : null;
                      })()}
                      <Link
                        href={`/constituents/${n.ID}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {n.FullName}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline">{n.Sex}</Badge>
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{preview?.name} — Assessments</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {preview?.assessments.map((a) => {
              const cand = a.CandidateID ? candidateMap[a.CandidateID] : null;
              const candParty = cand?.PartyID ? (parties ?? []).find((p) => p.ID === cand.PartyID) : null;
              return (
                <div key={a.ID} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div className="flex items-center gap-2">
                    <SupportLevelBadge level={a.Level} />
                    {cand && (
                      <span className="flex items-center gap-1.5">
                        {candParty && (
                          <span
                            className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                            style={{ backgroundColor: candParty.Color }}
                          >
                            {candParty.Code?.[0]}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          #{cand.Number} {cand.Name}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(a.AssessedAt)}
                  </span>
                </div>
              );
            })}
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
