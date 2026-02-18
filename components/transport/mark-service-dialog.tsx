"use client";

import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { markTransportService } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TransportRequest } from "@/lib/types";

interface MarkServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: TransportRequest | null;
}

export function MarkServiceDialog({
  open,
  onOpenChange,
  request,
}: MarkServiceDialogProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const [provided, setProvided] = useState<boolean | null>(null);
  const [deniedReason, setDeniedReason] = useState("");

  const handleSubmit = () => {
    if (!request || provided === null) {
      toast.error("Please select whether service was provided");
      return;
    }

    startTransition(async () => {
      try {
        await markTransportService(request.ID, {
          provided,
          denied_reason: !provided ? deniedReason : undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["transport"] });
        queryClient.invalidateQueries({ queryKey: ["transportStats"] });
        toast.success("Service outcome recorded");
        setProvided(null);
        setDeniedReason("");
        onOpenChange(false);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Service Outcome</DialogTitle>
          <DialogDescription>
            {request.FullName} ({request.MaskedNationalID})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Was transport service provided?</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={provided === true ? "default" : "outline"}
                className="flex-1"
                onClick={() => setProvided(true)}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={provided === false ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => setProvided(false)}
              >
                No
              </Button>
            </div>
          </div>

          {provided === false && (
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={deniedReason}
                onChange={(e) => setDeniedReason(e.target.value)}
                placeholder="Why couldn't the service be provided..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || provided === null}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
