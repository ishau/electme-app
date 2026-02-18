"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAffiliation, deleteAffiliation } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { PartyAffiliation, Party } from "@/lib/types";

interface AffiliationCardProps {
  constituentId: string;
  affiliations: PartyAffiliation[];
  parties: Party[];
}

const SOURCE_LABELS: Record<string, string> = {
  self_declared: "Self-declared",
  observed: "Observed",
  voter_list: "Voter list",
  unknown: "Unknown",
};

export function AffiliationCard({ constituentId, affiliations, parties }: AffiliationCardProps) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPartyId, setNewPartyId] = useState("");
  const [newKnownDate, setNewKnownDate] = useState("");
  const [newSource, setNewSource] = useState("unknown");
  const [newNotes, setNewNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddAffiliation = () => {
    if (!newPartyId) {
      toast.error("Select a party");
      return;
    }
    startTransition(async () => {
      try {
        await createAffiliation(constituentId, {
          party_id: newPartyId,
          known_date: newKnownDate || undefined,
          source: newSource || undefined,
          notes: newNotes || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["constituent"] });
        toast.success("Affiliation recorded");
        setShowAddForm(false);
        setNewPartyId("");
        setNewKnownDate("");
        setNewSource("unknown");
        setNewNotes("");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const handleDeleteAffiliation = (affiliationId: string) => {
    startTransition(async () => {
      try {
        await deleteAffiliation(constituentId, affiliationId);
        queryClient.invalidateQueries({ queryKey: ["constituent"] });
        toast.success("Affiliation removed");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Affiliation History</CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        {affiliations.length > 0 ? (
          <div className="space-y-1.5">
            {affiliations.map((a) => {
              const party = parties.find((p) => p.ID === a.PartyID);
              return (
                <div key={a.ID} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/30">
                  <div className="flex items-center gap-2">
                    {party && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ backgroundColor: party.Color }}
                      >
                        {party.Code?.[0]}
                      </div>
                    )}
                    <span className="font-medium">{party?.Code ?? "?"}</span>
                    {a.KnownDate && (
                      <span className="text-muted-foreground text-xs">
                        {new Date(a.KnownDate).toLocaleDateString()}
                      </span>
                    )}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {SOURCE_LABELS[a.Source] ?? a.Source}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                    onClick={() => handleDeleteAffiliation(a.ID)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No affiliations recorded.</p>
        )}

        {showAddForm && (
          <div className="space-y-2 p-2 border rounded-md bg-muted/20 mt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Party</Label>
                <Select value={newPartyId} onValueChange={setNewPartyId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select party" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((p) => (
                      <SelectItem key={p.ID} value={p.ID}>
                        {p.Code} - {p.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={newKnownDate}
                  onChange={(e) => setNewKnownDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Source</Label>
                <Select value={newSource} onValueChange={setNewSource}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_declared">Self-declared</SelectItem>
                    <SelectItem value="observed">Observed</SelectItem>
                    <SelectItem value="voter_list">Voter list</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Input
                  className="h-8 text-xs"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs"
                disabled={isPending}
                onClick={handleAddAffiliation}
              >
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
