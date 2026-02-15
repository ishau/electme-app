"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { logOutreach } from "@/lib/actions/campaign";
import { formatDateTime, outreachMethodLabel, outreachOutcomeLabel } from "@/lib/utils";
import { toast } from "sonner";
import type { OutreachLog } from "@/lib/types";

interface OutreachFormProps {
  constituentId: string;
  history: OutreachLog[];
}

const methods = [
  "door_to_door", "phone_call", "sms", "viber", "group_event", "one_on_one", "referral",
];

const outcomes = ["positive", "neutral", "negative", "not_home", "refused"];

function outcomeBadgeVariant(outcome: string) {
  switch (outcome) {
    case "positive": return "default" as const;
    case "neutral": return "secondary" as const;
    case "negative": return "destructive" as const;
    default: return "outline" as const;
  }
}

export function OutreachForm({ constituentId, history }: OutreachFormProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("");
  const [outcome, setOutcome] = useState("");
  const [contactedBy, setContactedBy] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await logOutreach(constituentId, {
          method,
          outcome,
          contacted_by: contactedBy,
          follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : undefined,
          notes: notes || undefined,
        });
        toast.success("Outreach logged");
        setOpen(false);
        setMethod("");
        setOutcome("");
        setContactedBy("");
        setFollowUpDate("");
        setNotes("");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Outreach</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Log Contact
          </Button>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((log) => (
                <div key={log.ID} className="p-2 border rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{outreachMethodLabel(log.Method)}</Badge>
                      <Badge variant={outcomeBadgeVariant(log.Outcome)}>
                        {outreachOutcomeLabel(log.Outcome)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(log.ContactedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    By {log.ContactedBy}
                    {log.FollowUpDate && ` | Follow-up: ${log.FollowUpDate.split("T")[0]}`}
                  </p>
                  {log.Notes && (
                    <p className="text-xs mt-1">{log.Notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No outreach contacts yet.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Outreach Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((m) => (
                      <SelectItem key={m} value={m}>
                        {outreachMethodLabel(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Outcome</Label>
                <Select value={outcome} onValueChange={setOutcome} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    {outcomes.map((o) => (
                      <SelectItem key={o} value={o}>
                        {outreachOutcomeLabel(o)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Contacted By</Label>
                <Input
                  value={contactedBy}
                  onChange={(e) => setContactedBy(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
