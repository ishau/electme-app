"use client";

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
import { SupportLevelBadge } from "@/components/campaign/support-level-badge";
import { formatDate } from "@/lib/utils";
import type { AssessedVoter } from "@/lib/types";

interface CandidateVoterTableProps {
  voters: AssessedVoter[];
  candidateId: string;
}

const PAGE_SIZE = 50;

export function CandidateVoterTable({ voters, candidateId }: CandidateVoterTableProps) {
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const nameFilter = (searchParams.get("name") || "").toLowerCase();

  const filtered = nameFilter
    ? voters.filter((v) => v.FullName.toLowerCase().includes(nameFilter))
    : voters;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageVoters = filtered.slice(offset, offset + PAGE_SIZE);

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) {
      params.set("page", String(p));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return `/candidates/${candidateId}${qs ? `?${qs}` : ""}`;
  };

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No assessed voters found.</p>
    );
  }

  return (
    <div>
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">National ID</TableHead>
              <TableHead className="hidden md:table-cell w-16">Gender</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="hidden md:table-cell w-20">Confidence</TableHead>
              <TableHead className="hidden lg:table-cell">Assessed By</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageVoters.map((v) => (
              <TableRow key={v.ConstituentID}>
                <TableCell>
                  <Link
                    href={`/constituents/${v.ConstituentID}`}
                    className="font-medium hover:underline"
                  >
                    {v.FullName}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {v.MaskedNationalID}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">{v.Sex}</Badge>
                </TableCell>
                <TableCell>
                  <SupportLevelBadge level={v.Level} />
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {v.Confidence}/5
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                  {v.AssessedBy}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                  {formatDate(v.AssessedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
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
      )}
    </div>
  );
}
