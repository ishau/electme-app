"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfile, createAffiliation, deleteAffiliation } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { ConstituentProfile, PartyAffiliation, Party } from "@/lib/types";

interface BasicInfo {
  nationalId: string;
  sex: string;
  age?: number;
  affiliationCode?: string | null;
  address?: string;
  islandName?: string;
  nicknames?: { ID: string; Name: string; IsPrimary: boolean }[];
}

interface ProfileFormProps {
  constituentId: string;
  profile: ConstituentProfile | null;
  basicInfo: BasicInfo;
  affiliations?: PartyAffiliation[];
  parties?: Party[];
}

const SOURCE_LABELS: Record<string, string> = {
  self_declared: "Self-declared",
  observed: "Observed",
  voter_list: "Voter list",
  unknown: "Unknown",
};

export function ProfileForm({ constituentId, profile, basicInfo, affiliations = [], parties = [] }: ProfileFormProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fullNationalId, setFullNationalId] = useState(profile?.FullNationalID ?? "");
  const [phone, setPhone] = useState(
    profile?.ContactInfo?.PhoneNumbers?.join(", ") ?? ""
  );
  const [email, setEmail] = useState(profile?.ContactInfo?.Email ?? "");
  const [notes, setNotes] = useState(profile?.Notes ?? "");
  const [isPending, startTransition] = useTransition();

  const [showHistory, setShowHistory] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPartyId, setNewPartyId] = useState("");
  const [newKnownDate, setNewKnownDate] = useState("");
  const [newSource, setNewSource] = useState("unknown");
  const [newNotes, setNewNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateProfile(constituentId, {
          full_national_id: fullNationalId || undefined,
          contact_info: {
            phone_numbers: phone ? phone.split(",").map((s) => s.trim()) : [],
            email: email || undefined,
          },
          notes: notes || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["constituent"] });
        toast.success("Profile updated");
        setEditing(false);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

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

  const addressDisplay = basicInfo.address
    ? basicInfo.islandName
      ? `${basicInfo.address} / ${basicInfo.islandName}`
      : basicInfo.address
    : undefined;

  const affiliationHistorySection = (
    <div className="space-y-2">
      <button
        type="button"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setShowHistory(!showHistory)}
      >
        {showHistory ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        Affiliation History ({affiliations.length})
      </button>

      {showHistory && (
        <div className="space-y-2 pl-1">
          {affiliations.length === 0 ? (
            <p className="text-xs text-muted-foreground">No affiliations recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {affiliations.map((a) => {
                const party = parties.find((p) => p.ID === a.PartyID);
                return (
                  <div key={a.ID} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/30">
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
          )}

          {!showAddForm ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs h-7"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-3 w-3" /> Add Affiliation
            </Button>
          ) : (
            <div className="space-y-2 p-2 border rounded-md bg-muted/20">
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
        </div>
      )}
    </div>
  );

  const basicInfoRows = (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">National ID</span>
        <span>{basicInfo.nationalId}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Gender</span>
        <Badge variant="outline">{basicInfo.sex}</Badge>
      </div>
      {basicInfo.age != null && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Age</span>
          <span>{basicInfo.age} yrs</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground">Affiliation</span>
        {basicInfo.affiliationCode ? (
          <Badge variant="secondary">{basicInfo.affiliationCode}</Badge>
        ) : (
          <span className="text-muted-foreground">Independent</span>
        )}
      </div>
      {addressDisplay && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Address</span>
          <span>{addressDisplay}</span>
        </div>
      )}
      {basicInfo.nicknames && basicInfo.nicknames.length > 0 && (
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground">Nicknames</span>
          <div className="flex flex-wrap gap-1 justify-end">
            {basicInfo.nicknames.map((n) => (
              <Badge key={n.ID} variant={n.IsPrimary ? "default" : "secondary"}>
                {n.Name}{n.IsPrimary && " (primary)"}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {affiliationHistorySection}
    </div>
  );

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Voter Info</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {basicInfoRows}

          {profile && (
            <>
              <Separator />
              <div className="space-y-2 text-sm">
                {profile.FullNationalID && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full National ID</span>
                    <span>{profile.FullNationalID}</span>
                  </div>
                )}
                {profile.ContactInfo?.PhoneNumbers?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{profile.ContactInfo.PhoneNumbers.join(", ")}</span>
                  </div>
                )}
                {profile.ContactInfo?.Email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{profile.ContactInfo.Email}</span>
                  </div>
                )}
                {profile.Notes && (
                  <div>
                    <span className="text-muted-foreground">Notes: </span>
                    <span>{profile.Notes}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {!profile && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">No profile data yet.</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {basicInfoRows}
        <Separator />
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Full National ID</Label>
            <Input
              value={fullNationalId}
              onChange={(e) => setFullNationalId(e.target.value)}
              placeholder="A123456"
            />
          </div>
          <div className="space-y-1">
            <Label>Phone Numbers (comma separated)</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+960..."
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
