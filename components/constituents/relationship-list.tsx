"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConstituentSearchCombobox } from "@/components/constituents/constituent-search-combobox";
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
import { Rating } from "@/components/ui/rating";
import { createRelationship } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RelationshipView, Party } from "@/lib/types";

interface RelationshipListProps {
  constituentId: string;
  relationships: RelationshipView[];
  parties: Party[];
}

const relationshipTypes = [
  { value: "parent_child", label: "Parent / Child" },
  { value: "sibling", label: "Sibling" },
  { value: "spouse", label: "Spouse" },
  { value: "influencer", label: "Influencer" },
  { value: "friend", label: "Friend" },
  { value: "colleague", label: "Colleague" },
];

export function RelationshipList({ constituentId, relationships, parties }: RelationshipListProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [toId, setToId] = useState("");
  const [type, setType] = useState("");
  const [role, setRole] = useState("parent");
  const [influenceScore, setInfluenceScore] = useState(0);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createRelationship(constituentId, {
          to_id: toId,
          type,
          role: type === "parent_child" ? role : undefined,
          influence_score: influenceScore,
          notes: notes || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["relationships"] });
        toast.success("Relationship added");
        setOpen(false);
        setToId("");
        setType("");
        setRole("parent");
        setInfluenceScore(0);
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
          <CardTitle className="text-base">Relationships</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {relationships.filter((r) => !r.Derived).length > 0 ? (
            <div className="space-y-2">
              {relationships.filter((r) => !r.Derived).map((rel, i) => (
                <div key={rel.ID || `derived-${i}`} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant={rel.Derived ? "secondary" : "outline"} className="capitalize shrink-0">
                      {rel.RelLabel.replace(/_/g, " ")}
                    </Badge>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const party = rel.LatestAffiliation ? parties.find((p) => p.ID === rel.LatestAffiliation!.PartyID) : null;
                          return party ? (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: party.Color }}
                              title={party.Code}
                            />
                          ) : null;
                        })()}
                        <Link
                          href={`/constituents/${rel.PersonID}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {rel.Name}
                        </Link>
                      </div>
                      {rel.Address?.Name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {rel.Address.IslandName ? `${rel.Address.Name} / ${rel.Address.IslandName}` : rel.Address.Name}
                        </p>
                      )}
                    </div>
                  </div>
                  {rel.Score > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {rel.Score}/10
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No relationships recorded.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Relationship</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Related Person</Label>
              <ConstituentSearchCombobox
                value={toId}
                onSelect={(id) => setToId(id)}
                excludeId={constituentId}
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v ?? "")}
                required
                items={Object.fromEntries(relationshipTypes.map((r) => [r.value, r.label]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipTypes.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {type === "parent_child" && (
              <div className="space-y-1">
                <Label>This person is the...</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v ?? "parent")}
                  items={{ parent: "Parent (selected person is the child)", child: "Child (selected person is the parent)" }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent (selected person is the child)</SelectItem>
                    <SelectItem value="child">Child (selected person is the parent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {type === "influencer" && (
              <Rating value={influenceScore} onChange={setInfluenceScore} max={10} label="Influence Score" />
            )}
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
