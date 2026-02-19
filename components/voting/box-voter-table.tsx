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
import { VoteDialog } from "@/components/voting/vote-dialog";
import type { BoxVoter, CandidateView, Party } from "@/lib/types";

interface BoxVoterTableProps {
  voters: BoxVoter[];
  total: number;
  limit: number;
  offset: number;
  boxId: string;
  constituencyId: string;
  candidates: CandidateView[];
  parties: Party[];
}

export function BoxVoterTable({
  voters,
  total,
  limit,
  offset,
  boxId,
  constituencyId,
  candidates,
  parties,
}: BoxVoterTableProps) {
  const searchParams = useSearchParams();
  const [dialogVoter, setDialogVoter] = useState<BoxVoter | null>(null);

  const currentPage = Math.floor(offset / limit) + 1;
  const hasNextPage = offset + voters.length < total;

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return `/voting/${boxId}${qs ? `?${qs}` : ""}`;
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
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-28">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voters.map((v) => (
              <TableRow key={v.ID}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.FullName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 md:hidden">
                      <GenderBadge sex={v.Sex} />
                      {v.Age != null && (
                        <span className="text-xs text-muted-foreground">{v.Age} yrs</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {v.MaskedNationalID}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {v.Age ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <GenderBadge sex={v.Sex} />
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm truncate max-w-[200px]">
                  {v.PermanentAddress || "—"}
                </TableCell>
                <TableCell>
                  {v.HasVoted ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Voted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not Voted
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {v.HasVoted ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDialogVoter(v)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDialogVoter(v)}
                    >
                      Record
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {total === 0 ? 0 : offset + 1}–{offset + voters.length} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Link href={buildPageUrl(currentPage - 1)}>
            <Button variant="outline" size="sm" disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          </Link>
          <span className="text-sm">Page {currentPage}</span>
          <Link href={buildPageUrl(currentPage + 1)}>
            <Button variant="outline" size="sm" disabled={!hasNextPage}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {dialogVoter && (
        <VoteDialog
          open={!!dialogVoter}
          onOpenChange={(open) => { if (!open) setDialogVoter(null); }}
          voter={dialogVoter}
          candidates={candidates}
          parties={parties}
          constituencyId={constituencyId}
        />
      )}
    </div>
  );
}
