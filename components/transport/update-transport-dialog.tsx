"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTransportRequest } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TransportRequest } from "@/lib/types";

interface UpdateTransportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: TransportRequest | null;
}

export function UpdateTransportDialog({
  open,
  onOpenChange,
  request,
}: UpdateTransportDialogProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const [interIslandNeeded, setInterIslandNeeded] = useState(false);
  const [interIslandMode, setInterIslandMode] = useState("");
  const [interIslandStatus, setInterIslandStatus] = useState("");
  const [interIslandNotes, setInterIslandNotes] = useState("");
  const [votingDayNeeded, setVotingDayNeeded] = useState(false);
  const [votingDayDirection, setVotingDayDirection] = useState("");
  const [votingDayStatus, setVotingDayStatus] = useState("");
  const [votingDayNotes, setVotingDayNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (request) {
      setInterIslandNeeded(request.InterIslandNeeded);
      setInterIslandMode(request.InterIslandMode);
      setInterIslandStatus(request.InterIslandStatus);
      setInterIslandNotes(request.InterIslandNotes);
      setVotingDayNeeded(request.VotingDayNeeded);
      setVotingDayDirection(request.VotingDayDirection);
      setVotingDayStatus(request.VotingDayStatus);
      setVotingDayNotes(request.VotingDayNotes);
      setAssignedTo(request.AssignedTo);
      setNotes(request.Notes);
    }
  }, [request]);

  const handleSubmit = () => {
    if (!request) return;

    startTransition(async () => {
      try {
        await updateTransportRequest(request.ID, {
          inter_island_needed: interIslandNeeded,
          inter_island_mode: interIslandNeeded ? interIslandMode : "",
          inter_island_status: interIslandNeeded ? interIslandStatus : "",
          inter_island_notes: interIslandNotes,
          voting_day_needed: votingDayNeeded,
          voting_day_direction: votingDayNeeded ? votingDayDirection : "",
          voting_day_status: votingDayNeeded ? votingDayStatus : "",
          voting_day_notes: votingDayNotes,
          assigned_to: assignedTo,
          notes,
        });
        queryClient.invalidateQueries({ queryKey: ["transport"] });
        queryClient.invalidateQueries({ queryKey: ["transportStats"] });
        toast.success("Transport request updated");
        onOpenChange(false);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  if (!request) return null;

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "arranged", label: "Arranged" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transport Request</DialogTitle>
          <DialogDescription>
            {request.FullName} ({request.MaskedNationalID})
          </DialogDescription>
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Mode</Label>
                    <Select
                      value={interIslandMode}
                      onValueChange={(v) => setInterIslandMode(v ?? "")}
                      items={{ air: "Air", sea: "Sea" }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
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
                      items={Object.fromEntries(statusOptions.map((opt) => [opt.value, opt.label]))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <Textarea
                    value={interIslandNotes}
                    onChange={(e) => setInterIslandNotes(e.target.value)}
                    rows={2}
                    placeholder="Inter-island notes..."
                  />
                </div>
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Direction</Label>
                    <Select
                      value={votingDayDirection}
                      onValueChange={(v) => setVotingDayDirection(v ?? "")}
                      items={{ to_center: "To Center", from_center: "From Center", both: "Both Ways" }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
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
                      items={Object.fromEntries(statusOptions.map((opt) => [opt.value, opt.label]))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <Textarea
                    value={votingDayNotes}
                    onChange={(e) => setVotingDayNotes(e.target.value)}
                    rows={2}
                    placeholder="Voting day notes..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Team member name..."
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="General notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
