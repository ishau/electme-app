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
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AddressSupportDialog } from "@/components/constituents/bulk-add-by-address-dialog";
import type { Constituent, Island, CandidateView } from "@/lib/types";

function calculateAge(dob: string): number {
  const [year, month, day] = dob.split("T")[0].split("-").map(Number);
  // Current date in GMT+5
  const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const nowY = now.getUTCFullYear();
  const nowM = now.getUTCMonth() + 1;
  const nowD = now.getUTCDate();
  let age = nowY - year;
  if (nowM < month || (nowM === month && nowD < day)) age--;
  return age;
}

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
  islands: Island[];
  candidates: CandidateView[];
}

export function ConstituentTable({
  constituents,
  limit,
  offset,
  constituencyId,
  islands,
  candidates,
}: ConstituentTableProps) {
  const searchParams = useSearchParams();
  const [bulkAdd, setBulkAdd] = useState<BulkAddState | null>(null);

  const GLOBAL_TYPES = ["president", "mayor", "wdc_president"];
  const normalizeType = (t: string) => t.toLowerCase().replace(/\s+/g, "_");

  const eligibleCandidates = candidates.filter(
    (c) =>
      GLOBAL_TYPES.includes(normalizeType(c.CandidateType)) ||
      (c.Constituencies ?? []).includes(constituencyId)
  );

  const islandMap = Object.fromEntries(islands.map((isl) => [isl.ID, isl]));
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
                  <Link
                    href={`/constituents/${c.ID}`}
                    className="font-medium hover:underline"
                  >
                    {c.FullName}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {c.FullNationalID ?? c.MaskedNationalID}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {c.DOB ? calculateAge(c.DOB) : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">{c.Sex}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {c.PermanentAddress?.Name ? (
                    <button
                      type="button"
                      className="hover:text-accent-foreground hover:underline text-left"
                      onClick={() => {
                        setBulkAdd({
                          address: c.PermanentAddress.Name,
                          islandId: c.PermanentAddress.IslandID,
                          islandName: islandMap[c.PermanentAddress.IslandID]?.Name ?? c.PermanentAddress.IslandID,
                        });
                      }}
                    >
                      {c.PermanentAddress.Name}
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
          candidates={eligibleCandidates}
        />
      )}
    </div>
  );
}
