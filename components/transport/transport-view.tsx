"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { UpdateTransportDialog } from "./update-transport-dialog";
import { MarkServiceDialog } from "./mark-service-dialog";
import { Bus, Pencil, CheckCircle, Trash2 } from "lucide-react";
import { deleteTransportRequest } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import {
  transportRequestStatusLabel,
  transportRequestStatusColor,
  transportModeLabel,
  votingDayDirectionLabel,
  serviceOutcomeLabel,
  serviceOutcomeColor,
} from "@/lib/utils";
import { toast } from "sonner";
import type { TransportRequest, Constituency } from "@/lib/types";

interface TransportViewProps {
  requests: TransportRequest[];
  constituencies: Constituency[];
  currentConstituencyId: string;
  currentStatus: string;
  currentSearch: string;
}

export function TransportView({
  requests,
  constituencies,
  currentConstituencyId,
  currentStatus,
  currentSearch,
}: TransportViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const [editRequest, setEditRequest] = useState<TransportRequest | null>(null);
  const [serviceRequest, setServiceRequest] = useState<TransportRequest | null>(null);

  const buildUrl = (params: { constituency_id?: string; status?: string; search?: string }) => {
    const sp = new URLSearchParams();
    const cid = params.constituency_id ?? currentConstituencyId;
    const st = params.status ?? currentStatus;
    const q = params.search ?? currentSearch;
    if (cid) sp.set("constituency_id", cid);
    if (st) sp.set("status", st);
    if (q) sp.set("search", q);
    const qs = sp.toString();
    return `/transport${qs ? `?${qs}` : ""}`;
  };

  const handleConstituencyChange = (value: string) => {
    router.push(buildUrl({ constituency_id: value === "all" ? "" : value }));
  };

  const handleStatusChange = (value: string) => {
    router.push(buildUrl({ status: value === "all" ? "" : value }));
  };

  const handleSearchChange = (value: string) => {
    router.push(buildUrl({ search: value }));
  };

  const handleDelete = (req: TransportRequest) => {
    if (!confirm(`Delete transport request for ${req.FullName}?`)) return;
    startTransition(async () => {
      try {
        await deleteTransportRequest(req.ID);
        queryClient.invalidateQueries({ queryKey: ["transport"] });
        queryClient.invalidateQueries({ queryKey: ["transportStats"] });
        toast.success("Transport request deleted");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={currentConstituencyId || "all"} onValueChange={handleConstituencyChange}>
          <SelectTrigger className="sm:w-[220px]">
            <SelectValue placeholder="All constituencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All constituencies</SelectItem>
            {constituencies.map((c) => (
              <SelectItem key={c.ID} value={c.ID}>
                {c.Code} — {c.Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentStatus || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="arranged">Arranged</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search by name..."
          value={currentSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="sm:w-[220px]"
        />
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={Bus}
          title="No transport requests"
          description="No transport requests match the current filters."
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voter</TableHead>
                <TableHead className="hidden md:table-cell">Island</TableHead>
                <TableHead>Inter-Island</TableHead>
                <TableHead>Voting Day</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
                <TableHead className="hidden lg:table-cell">Notes</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.ID}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{req.FullName}</div>
                      <div className="text-xs text-muted-foreground">{req.MaskedNationalID}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      <div>{req.IslandName}</div>
                      {req.VotingIslandName && req.VotingIslandName !== req.IslandName && (
                        <div className="text-xs text-muted-foreground">
                          Voting: {req.VotingIslandName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {req.InterIslandNeeded ? (
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {transportModeLabel(req.InterIslandMode)}
                        </Badge>
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${transportRequestStatusColor(req.InterIslandStatus)}`}>
                            {transportRequestStatusLabel(req.InterIslandStatus)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {req.VotingDayNeeded ? (
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {votingDayDirectionLabel(req.VotingDayDirection)}
                        </Badge>
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${transportRequestStatusColor(req.VotingDayStatus)}`}>
                            {transportRequestStatusLabel(req.VotingDayStatus)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${serviceOutcomeColor(req.ServiceProvided)}`}>
                      {serviceOutcomeLabel(req.ServiceProvided)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm">{req.AssignedTo || "—"}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{req.Notes || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setEditRequest(req)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setServiceRequest(req)}
                        title="Record service"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(req)}
                        disabled={isPending}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <UpdateTransportDialog
        open={!!editRequest}
        onOpenChange={(open) => !open && setEditRequest(null)}
        request={editRequest}
      />
      <MarkServiceDialog
        open={!!serviceRequest}
        onOpenChange={(open) => !open && setServiceRequest(null)}
        request={serviceRequest}
      />
    </div>
  );
}
