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
import type { Relationship } from "@/lib/types";

interface RelationshipListProps {
  constituentId: string;
  relationships: Relationship[];
}

const relationshipTypes = [
  { type: "family", subtypes: ["spouse", "parent", "child", "sibling", "in_law", "relative"] },
  { type: "influence", subtypes: ["influencer", "follower"] },
  { type: "friend", subtypes: [] },
  { type: "colleague", subtypes: [] },
];

export function RelationshipList({ constituentId, relationships }: RelationshipListProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [toId, setToId] = useState("");
  const [type, setType] = useState("");
  const [subtype, setSubtype] = useState("");
  const [influenceScore, setInfluenceScore] = useState(0);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const availableSubtypes =
    relationshipTypes.find((r) => r.type === type)?.subtypes ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createRelationship(constituentId, {
          to_id: toId,
          type,
          subtype: subtype || type,
          influence_score: influenceScore,
          notes: notes || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["relationships"] });
        toast.success("Relationship added");
        setOpen(false);
        setToId("");
        setType("");
        setSubtype("");
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
          {relationships.length > 0 ? (
            <div className="space-y-2">
              {relationships.map((rel) => {
                const isFrom = rel.FromID === constituentId;
                const otherId = isFrom ? rel.ToID : rel.FromID;
                const otherName = isFrom ? rel.ToName : rel.FromName;
                const otherAddress = isFrom ? rel.ToAddress : rel.FromAddress;
                return (
                  <div key={rel.ID} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="capitalize shrink-0">
                        {rel.Type}
                      </Badge>
                      {rel.Subtype && rel.Subtype !== rel.Type && (
                        <Badge variant="secondary" className="capitalize shrink-0">
                          {rel.Subtype.replace(/_/g, " ")}
                        </Badge>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/constituents/${otherId}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {otherName}
                        </Link>
                        {otherAddress?.Name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {otherAddress.IslandName ? `${otherAddress.Name} / ${otherAddress.IslandName}` : otherAddress.Name}
                          </p>
                        )}
                      </div>
                    </div>
                    {rel.InfluenceScore > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        Inf: {rel.InfluenceScore}/10
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No relationships recorded.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v);
                    setSubtype("");
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map((r) => (
                      <SelectItem key={r.type} value={r.type}>
                        {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {availableSubtypes.length > 0 && (
                <div className="space-y-1">
                  <Label>Subtype</Label>
                  <Select value={subtype} onValueChange={setSubtype}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subtype" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubtypes.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Rating value={influenceScore} onChange={setInfluenceScore} max={10} label="Influence Score" />
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
