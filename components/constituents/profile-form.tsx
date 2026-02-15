"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateProfile } from "@/lib/actions/enrichment";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { ConstituentProfile } from "@/lib/types";

interface BasicInfo {
  nationalId: string;
  sex: string;
  dob?: string;
  affiliationCode?: string | null;
  address?: string;
  nicknames?: { ID: string; Name: string; IsPrimary: boolean }[];
}

interface ProfileFormProps {
  constituentId: string;
  profile: ConstituentProfile | null;
  basicInfo: BasicInfo;
}

export function ProfileForm({ constituentId, profile, basicInfo }: ProfileFormProps) {
  const [editing, setEditing] = useState(false);
  const [fullNationalId, setFullNationalId] = useState(profile?.FullNationalID ?? "");
  const [dob, setDob] = useState(profile?.DOB ? profile.DOB.split("T")[0] : "");
  const [mobile, setMobile] = useState(
    profile?.ContactInfo?.MobileNumbers?.join(", ") ?? ""
  );
  const [email, setEmail] = useState(profile?.ContactInfo?.Email ?? "");
  const [viber, setViber] = useState(profile?.ContactInfo?.Viber ?? "");
  const [notes, setNotes] = useState(profile?.Notes ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateProfile(constituentId, {
          full_national_id: fullNationalId || undefined,
          dob: dob || undefined,
          contact_info: {
            mobile_numbers: mobile ? mobile.split(",").map((s) => s.trim()) : [],
            email: email || undefined,
            viber: viber || undefined,
          },
          notes: notes || undefined,
        });
        toast.success("Profile updated");
        setEditing(false);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

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
      {basicInfo.dob && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date of Birth</span>
          <span>{formatDate(basicInfo.dob)}</span>
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
      {basicInfo.address && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Address</span>
          <span>{basicInfo.address}</span>
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
                {profile.DOB && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth (Profile)</span>
                    <span>{profile.DOB.split("T")[0]}</span>
                  </div>
                )}
                {profile.ContactInfo?.MobileNumbers?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mobile</span>
                    <span>{profile.ContactInfo.MobileNumbers.join(", ")}</span>
                  </div>
                )}
                {profile.ContactInfo?.Email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{profile.ContactInfo.Email}</span>
                  </div>
                )}
                {profile.ContactInfo?.Viber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Viber</span>
                    <span>{profile.ContactInfo.Viber}</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Full National ID</Label>
              <Input
                value={fullNationalId}
                onChange={(e) => setFullNationalId(e.target.value)}
                placeholder="A123456"
              />
            </div>
            <div className="space-y-1">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Mobile Numbers (comma separated)</Label>
            <Input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+960..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Viber</Label>
              <Input
                value={viber}
                onChange={(e) => setViber(e.target.value)}
                placeholder="+960..."
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
