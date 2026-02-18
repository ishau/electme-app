"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  const [email, setEmail] = useState(profile?.ContactInfo?.Email ?? "");
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

  const addressDisplay = basicInfo.address
    ? basicInfo.islandName
      ? `${basicInfo.address} / ${basicInfo.islandName}`
      : basicInfo.address
    : undefined;

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
