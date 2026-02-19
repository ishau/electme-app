"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createTransportRequest,
  updateTransportRequest,
  deleteTransportRequest,
} from "@/lib/mutations";
import { useTransportRequests } from "@/lib/hooks/use-transport";
import { useQueryClient } from "@tanstack/react-query";
import {
  transportRequestStatusLabel,
  transportRequestStatusColor,
  transportModeLabel,
  votingDayDirectionLabel,
  serviceOutcomeLabel,
  serviceOutcomeColor,
  formatDateTime,
} from "@/lib/utils";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import type { TransportRequest } from "@/lib/types";

interface TransportCardProps {
  constituentId: string;
  constituencyId: string;
}

export function TransportCard({ constituentId, constituencyId }: TransportCardProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editRequest, setEditRequest] = useState<TransportRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: requests } = useTransportRequests({
    search: constituentId,
  });

  // Filter to this constituent's requests
  const myRequests = (requests ?? []).filter((r) => r.ConstituentID === constituentId);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["transport"] });
    queryClient.invalidateQueries({ queryKey: ["transportStats"] });
  };

  const handleDelete = (req: TransportRequest) => {
    if (!confirm("Delete this transport request?")) return;
    startTransition(async () => {
      try {
        await deleteTransportRequest(req.ID);
        invalidate();
        toast.success("Transport request deleted");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Transport</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            Add Request
          </Button>
        </CardHeader>
        <CardContent>
          {myRequests.length > 0 ? (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div key={req.ID} className="p-3 border rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {req.InterIslandNeeded && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            Inter-Island: {transportModeLabel(req.InterIslandMode)}
                          </Badge>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${transportRequestStatusColor(req.InterIslandStatus)}`}>
                            {transportRequestStatusLabel(req.InterIslandStatus)}
                          </span>
                        </div>
                      )}
                      {req.VotingDayNeeded && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            Voting Day: {votingDayDirectionLabel(req.VotingDayDirection)}
                          </Badge>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${transportRequestStatusColor(req.VotingDayStatus)}`}>
                            {transportRequestStatusLabel(req.VotingDayStatus)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setEditRequest(req)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(req)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium ${serviceOutcomeColor(req.ServiceProvided)}`}>
                      Service: {serviceOutcomeLabel(req.ServiceProvided)}
                    </span>
                    {req.AssignedTo && <span>Assigned: {req.AssignedTo}</span>}
                    <span>{formatDateTime(req.CreatedAt)}</span>
                  </div>
                  {req.Notes && (
                    <p className="text-xs text-muted-foreground">{req.Notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No transport requests yet.</p>
          )}
        </CardContent>
      </Card>

      <AddTransportForm
        open={addOpen}
        onOpenChange={setAddOpen}
        constituentId={constituentId}
        constituencyId={constituencyId}
        onSuccess={invalidate}
      />

      {editRequest && (
        <EditTransportForm
          open={!!editRequest}
          onOpenChange={(open) => !open && setEditRequest(null)}
          request={editRequest}
          onSuccess={invalidate}
        />
      )}
    </>
  );
}

// --- Add form ---

function AddTransportForm({
  open,
  onOpenChange,
  constituentId,
  constituencyId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constituentId: string;
  constituencyId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [interIslandNeeded, setInterIslandNeeded] = useState(false);
  const [interIslandMode, setInterIslandMode] = useState("");
  const [votingDayNeeded, setVotingDayNeeded] = useState(false);
  const [votingDayDirection, setVotingDayDirection] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setInterIslandNeeded(false);
    setInterIslandMode("");
    setVotingDayNeeded(false);
    setVotingDayDirection("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!interIslandNeeded && !votingDayNeeded) {
      toast.error("Enable at least one transport type");
      return;
    }

    startTransition(async () => {
      try {
        await createTransportRequest({
          constituent_id: constituentId,
          constituency_id: constituencyId,
          inter_island_needed: interIslandNeeded,
          inter_island_mode: interIslandNeeded ? interIslandMode : undefined,
          voting_day_needed: votingDayNeeded,
          voting_day_direction: votingDayNeeded ? votingDayDirection : undefined,
          notes: notes || undefined,
        });
        onSuccess();
        toast.success("Transport request created");
        reset();
        onOpenChange(false);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transport Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>Inter-Island Transport</Label>
              <Button
                type="button"
                variant={interIslandNeeded ? "default" : "outline"}
                size="sm"
                onClick={() => setInterIslandNeeded(!interIslandNeeded)}
              >
                {interIslandNeeded ? "Enabled" : "Disabled"}
              </Button>
            </div>
            {interIslandNeeded && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mode</Label>
                <Select
                  value={interIslandMode}
                  onValueChange={(v) => setInterIslandMode(v ?? "")}
                  items={{ air: "Air", sea: "Sea" }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="air">Air</SelectItem>
                    <SelectItem value="sea">Sea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>Voting Day Transport</Label>
              <Button
                type="button"
                variant={votingDayNeeded ? "default" : "outline"}
                size="sm"
                onClick={() => setVotingDayNeeded(!votingDayNeeded)}
              >
                {votingDayNeeded ? "Enabled" : "Disabled"}
              </Button>
            </div>
            {votingDayNeeded && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Direction</Label>
                <Select
                  value={votingDayDirection}
                  onValueChange={(v) => setVotingDayDirection(v ?? "")}
                  items={{ to_center: "To Center", from_center: "From Center", both: "Both Ways" }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to_center">To Center</SelectItem>
                    <SelectItem value="from_center">From Center</SelectItem>
                    <SelectItem value="both">Both Ways</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit form ---

function EditTransportForm({
  open,
  onOpenChange,
  request,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: TransportRequest;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [interIslandNeeded, setInterIslandNeeded] = useState(request.InterIslandNeeded);
  const [interIslandMode, setInterIslandMode] = useState(request.InterIslandMode);
  const [interIslandStatus, setInterIslandStatus] = useState(request.InterIslandStatus);
  const [votingDayNeeded, setVotingDayNeeded] = useState(request.VotingDayNeeded);
  const [votingDayDirection, setVotingDayDirection] = useState(request.VotingDayDirection);
  const [votingDayStatus, setVotingDayStatus] = useState(request.VotingDayStatus);
  const [assignedTo, setAssignedTo] = useState(request.AssignedTo);
  const [notes, setNotes] = useState(request.Notes);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "arranged", label: "Arranged" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await updateTransportRequest(request.ID, {
          inter_island_needed: interIslandNeeded,
          inter_island_mode: interIslandNeeded ? interIslandMode : "",
          inter_island_status: interIslandNeeded ? interIslandStatus : "",
          voting_day_needed: votingDayNeeded,
          voting_day_direction: votingDayNeeded ? votingDayDirection : "",
          voting_day_status: votingDayNeeded ? votingDayStatus : "",
          assigned_to: assignedTo,
          notes,
        });
        onSuccess();
        toast.success("Transport request updated");
        onOpenChange(false);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transport Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>Inter-Island</Label>
              <Button
                type="button"
                variant={interIslandNeeded ? "default" : "outline"}
                size="sm"
                onClick={() => setInterIslandNeeded(!interIslandNeeded)}
              >
                {interIslandNeeded ? "Enabled" : "Disabled"}
              </Button>
            </div>
            {interIslandNeeded && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Mode</Label>
                  <Select
                    value={interIslandMode}
                    onValueChange={(v) => setInterIslandMode(v ?? "")}
                    items={{ air: "Air", sea: "Sea" }}
                  >
                    <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="sea">Sea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={interIslandStatus}
                    onValueChange={(v) => setInterIslandStatus(v ?? "")}
                    items={Object.fromEntries(statusOptions.map((o) => [o.value, o.label]))}
                  >
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>Voting Day</Label>
              <Button
                type="button"
                variant={votingDayNeeded ? "default" : "outline"}
                size="sm"
                onClick={() => setVotingDayNeeded(!votingDayNeeded)}
              >
                {votingDayNeeded ? "Enabled" : "Disabled"}
              </Button>
            </div>
            {votingDayNeeded && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Direction</Label>
                  <Select
                    value={votingDayDirection}
                    onValueChange={(v) => setVotingDayDirection(v ?? "")}
                    items={{ to_center: "To Center", from_center: "From Center", both: "Both Ways" }}
                  >
                    <SelectTrigger><SelectValue placeholder="Direction" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to_center">To Center</SelectItem>
                      <SelectItem value="from_center">From Center</SelectItem>
                      <SelectItem value="both">Both Ways</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={votingDayStatus}
                    onValueChange={(v) => setVotingDayStatus(v ?? "")}
                    items={Object.fromEntries(statusOptions.map((o) => [o.value, o.label]))}
                  >
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Assigned To</Label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Team member..."
            />
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
