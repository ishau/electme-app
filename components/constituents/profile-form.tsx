"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenderBadge } from "@/components/shared/gender-badge";
import { updateProfile } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ConstituentProfile } from "@/lib/types";

interface BasicInfo {
  nationalId: string;
  sex: string;
  age?: number;
  address?: string;
  islandName?: string;
  nicknames?: { ID: string; Name: string; IsPrimary: boolean }[];
}

interface ProfileFormProps {
  constituentId: string;
  profile: ConstituentProfile | null;
  basicInfo: BasicInfo;
}

export function ProfileForm({ constituentId, profile, basicInfo }: ProfileFormProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fullNationalId, setFullNationalId] = useState(profile?.FullNationalID ?? "");
  const [phone, setPhone] = useState(
    profile?.ContactInfo?.PhoneNumbers?.join(", ") ?? ""
  );
  const [notes, setNotes] = useState(profile?.Notes ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateProfile(constituentId, {
          full_national_id: fullNationalId || undefined,
          contact_info: {
            phone_numbers: phone ? phone.split(",").map((s) => s.trim()) : [],
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

  const addressDisplay = basicInfo.address
    ? basicInfo.islandName
      ? `${basicInfo.address} / ${basicInfo.islandName}`
      : basicInfo.address
    : undefined;

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Voter Info</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">National ID</span>
              <span>{profile?.FullNationalID || basicInfo.nationalId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender</span>
              <GenderBadge sex={basicInfo.sex} />
            </div>
            {basicInfo.age != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age</span>
                <span>{basicInfo.age} yrs</span>
              </div>
            )}
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
                    <span key={n.ID} className={`text-xs px-1.5 py-0.5 rounded ${n.IsPrimary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {n.Name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile?.ContactInfo?.PhoneNumbers && profile.ContactInfo.PhoneNumbers.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{profile.ContactInfo.PhoneNumbers.join(", ")}</span>
              </div>
            )}
            {profile?.Notes && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Notes</span>
                <span className="text-right max-w-[60%]">{profile.Notes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gender</span>
            <GenderBadge sex={basicInfo.sex} />
          </div>
          {basicInfo.age != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age</span>
              <span>{basicInfo.age} yrs</span>
            </div>
          )}
          {addressDisplay && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span>{addressDisplay}</span>
            </div>
          )}
        </div>
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
