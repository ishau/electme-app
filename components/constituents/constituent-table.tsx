"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenderBadge } from "@/components/shared/gender-badge";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AddressSupportDialog } from "@/components/constituents/bulk-add-by-address-dialog";
import type { Constituent, CandidateView, Party } from "@/lib/types";

interface BulkAddState {
  address: string;
  islandId: string;
  islandName: string;
}

interface ConstituentTableProps {
  constituents: Constituent[];
  limit: number;
  offset: number;
  constituencyId: string;
  candidates: CandidateView[];
  parties: Party[];
}

export function ConstituentTable({
  constituents,
  limit,
  offset,
  constituencyId,
  candidates,
  parties,
}: ConstituentTableProps) {
  const searchParams = useSearchParams();
  const [bulkAdd, setBulkAdd] = useState<BulkAddState | null>(null);

  const currentPage = Math.floor(offset / limit) + 1;
  const hasNextPage = constituents.length === limit;

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return `/constituents${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">National ID</TableHead>
              <TableHead className="hidden lg:table-cell w-16">Age</TableHead>
              <TableHead className="hidden md:table-cell w-16">Gender</TableHead>
              <TableHead className="hidden md:table-cell">Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {constituents.map((c) => (
              <TableRow key={c.ID}>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const party = c.LatestAffiliation ? parties.find((p) => p.ID === c.LatestAffiliation!.PartyID) : null;
                      return party ? (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: party.Color }}
                          title={party.Code}
                        />
                      ) : null;
                    })()}
                    <div className="min-w-0">
                      <Link
                        href={`/constituents/${c.ID}`}
                        className="font-medium hover:underline"
                      >
                        {c.FullName}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5 md:hidden">
                        <GenderBadge sex={c.Sex} />
                        {c.Age != null && (
                          <span className="text-xs text-muted-foreground">{c.Age} yrs</span>
                        )}
                        {c.PermanentAddress?.Name && (
                          <span className="text-xs text-muted-foreground truncate">
                            {c.PermanentAddress.IslandName
                              ? `${c.PermanentAddress.Name} / ${c.PermanentAddress.IslandName}`
                              : c.PermanentAddress.Name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {c.FullNationalID ?? c.MaskedNationalID}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {c.Age ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <GenderBadge sex={c.Sex} />
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {c.PermanentAddress?.Name ? (
                    <button
                      type="button"
                      className="hover:text-foreground hover:underline text-left cursor-pointer"
                      onClick={() => {
                        setBulkAdd({
                          address: c.PermanentAddress.Name,
                          islandId: c.PermanentAddress.IslandID,
                          islandName: c.PermanentAddress.IslandName ?? c.PermanentAddress.IslandID,
                        });
                      }}
                    >
                      {c.PermanentAddress.IslandName
                        ? `${c.PermanentAddress.Name} / ${c.PermanentAddress.IslandName}`
                        : c.PermanentAddress.Name}
                    </button>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {offset + 1}–{offset + constituents.length}
        </p>
        <div className="flex items-center gap-2">
          <Link href={buildPageUrl(currentPage - 1)}>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          </Link>
          <span className="text-sm">
            Page {currentPage}
          </span>
          <Link href={buildPageUrl(currentPage + 1)}>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {bulkAdd && (
        <AddressSupportDialog
          open={!!bulkAdd}
          onOpenChange={(v) => { if (!v) setBulkAdd(null); }}
          address={bulkAdd.address}
          islandId={bulkAdd.islandId}
          islandName={bulkAdd.islandName}
          constituencyId={constituencyId}
          candidates={candidates}
          parties={parties}
        />
      )}
    </div>
  );
}
