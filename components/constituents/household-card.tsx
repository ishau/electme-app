"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportLevelBadge } from "@/components/campaign/support-level-badge";
import { AddressSupportDialog } from "@/components/constituents/bulk-add-by-address-dialog";
import { Users } from "lucide-react";
import type { Constituent, SupportAssessment, CandidateView, Party } from "@/lib/types";

interface HouseholdCardProps {
  currentConstituentId: string;
  neighbors: Constituent[];
  latestSupport: Record<string, SupportAssessment>;
  address?: string;
  islandId?: string;
  islandName?: string;
  constituencyId?: string;
  candidates?: CandidateView[];
  parties?: Party[];
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
  const others = neighbors.filter((n) => n.ID !== currentConstituentId);

  if (others.length === 0) return null;

  const canBulkUpdate = address && islandId && constituencyId;

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
              const support = latestSupport[n.ID];
              return (
                <div
                  key={n.ID}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <Link
                      href={`/constituents/${n.ID}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {n.FullName}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline">{n.Sex}</Badge>
                      {n.Age != null && (
                        <span className="text-xs text-muted-foreground">{n.Age} yrs</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {support ? (
                      <SupportLevelBadge level={support.Level} />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Not assessed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
