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

interface BulkAddState {
  address: string;
  islandId: string;
  islandName: string;
}

interface ConstituentTableProps {
  constituents: Constituent[];
  total: number;
  limit: number;
  offset: number;
  constituencyId: string;
  islands: Island[];
  candidates: CandidateView[];
}

export function ConstituentTable({
  constituents,
  total,
  limit,
  offset,
  constituencyId,
  islands,
  candidates,
}: ConstituentTableProps) {
  const searchParams = useSearchParams();
  const [bulkAdd, setBulkAdd] = useState<BulkAddState | null>(null);

  const islandMap = Object.fromEntries(islands.map((isl) => [isl.ID, isl]));
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

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
                  {c.MaskedNationalID}
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
          Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Link href={buildPageUrl(currentPage - 1)}>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Link href={buildPageUrl(currentPage + 1)}>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
            >
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
        />
      )}
    </div>
  );
}
