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
import { ScrollArea } from "@/components/ui/scroll-area";
import { logOutreach } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
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

const OUTCOME_DOT: Record<string, string> = {
  positive: "bg-green-500",
  neutral: "bg-gray-400",
  negative: "bg-red-500",
  not_home: "bg-yellow-400",
  refused: "bg-orange-400",
};

export function OutreachForm({ constituentId, history }: OutreachFormProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("");
  const [outcome, setOutcome] = useState("");
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
          follow_up_date: followUpDate || undefined,
          notes: notes || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["outreachHistory"] });
        queryClient.invalidateQueries({ queryKey: ["outreachStats"] });
        queryClient.invalidateQueries({ queryKey: ["followUps"] });
        toast.success("Outreach logged");
        setOpen(false);
        setMethod("");
        setOutcome("");
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
            <ScrollArea className="max-h-80"><div className="space-y-1.5">
              {history.map((log) => (
                <div key={log.ID} className="flex items-start gap-2.5 py-1.5 px-2 border rounded text-sm">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${OUTCOME_DOT[log.Outcome] ?? "bg-gray-300"}`}
                    title={outreachOutcomeLabel(log.Outcome)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{outreachMethodLabel(log.Method)}</span>
                      <Badge variant={outcomeBadgeVariant(log.Outcome)} className="text-[10px] px-1.5 py-0">
                        {outreachOutcomeLabel(log.Outcome)}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto">
                        {formatDateTime(log.ContactedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>by {log.ContactedBy}</span>
                      {log.FollowUpDate && (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          Follow-up {log.FollowUpDate.split("T")[0]}
                        </span>
                      )}
                    </div>
                    {log.Notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.Notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div></ScrollArea>
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
                <Select
                  value={method}
                  onValueChange={(v) => setMethod(v ?? "")}
                  required
                  items={Object.fromEntries(methods.map((m) => [m, outreachMethodLabel(m)]))}
                >
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
                <Select
                  value={outcome}
                  onValueChange={(v) => setOutcome(v ?? "")}
                  required
                  items={Object.fromEntries(outcomes.map((o) => [o, outreachOutcomeLabel(o)]))}
                >
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
            <div className="space-y-1">
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
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
