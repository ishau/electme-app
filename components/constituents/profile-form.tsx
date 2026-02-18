"use client";

import { useState, useTransition, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GenderBadge } from "@/components/shared/gender-badge";
import { WorkplaceDialog } from "@/components/constituents/workplace-dialog";
import { updateProfile } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { ConstituentProfile, WorkplaceAssignment } from "@/lib/types";

interface BasicInfo {
  nationalId: string;
  fullNationalId?: string;
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
  workplaces?: WorkplaceAssignment[];
}

export function ProfileForm({ constituentId, profile, basicInfo, workplaces = [] }: ProfileFormProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullNationalId, setFullNationalId] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [phoneInput, setPhoneInput] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setFullNationalId(profile?.FullNationalID ?? basicInfo.fullNationalId ?? "");
      setPhoneNumbers(profile?.ContactInfo?.phone_numbers ?? []);
      setNotes(profile?.Notes ?? "");
      setPhoneInput("");
    }
    setOpen(isOpen);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateProfile(constituentId, {
          full_national_id: fullNationalId || undefined,
          contact_info: {
            phone_numbers: phoneNumbers,
          },
          notes: notes || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["constituent"] });
        toast.success("Profile updated");
        setOpen(false);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Voter Info</CardTitle>
        <div className="flex gap-1.5">
          <WorkplaceDialog constituentId={constituentId} workplaces={workplaces} />
          <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              Edit Profile
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Full National ID</Label>
                <Input
                  value={fullNationalId}
                  onChange={(e) => setFullNationalId(e.target.value)}
                  placeholder="A123456"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Numbers</Label>
                {phoneNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {phoneNumbers.map((num, i) => (
                      <Badge key={i} variant="secondary" className="font-mono text-xs gap-1 pr-1">
                        {num.startsWith("+960") ? num : `+960 ${num}`}
                        <button
                          type="button"
                          onClick={() => setPhoneNumbers(phoneNumbers.filter((_, j) => j !== i))}
                          className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5 items-center">
                  <span className="text-sm text-muted-foreground font-mono shrink-0">+960</span>
                  <Input
                    ref={phoneInputRef}
                    value={phoneInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 7);
                      setPhoneInput(v);
                    }}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if ((e.key === "Enter" || e.key === "Tab") && phoneInput.length === 7) {
                        e.preventDefault();
                        if (!phoneNumbers.includes(phoneInput)) {
                          setPhoneNumbers([...phoneNumbers, phoneInput]);
                        }
                        setPhoneInput("");
                      }
                      if (e.key === "Backspace" && !phoneInput && phoneNumbers.length > 0) {
                        setPhoneNumbers(phoneNumbers.slice(0, -1));
                      }
                    }}
                    placeholder="7XXXXXX"
                    maxLength={7}
                    className="font-mono"
                    inputMode="numeric"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={phoneInput.length !== 7}
                    onClick={() => {
                      if (!phoneNumbers.includes(phoneInput)) {
                        setPhoneNumbers([...phoneNumbers, phoneInput]);
                      }
                      setPhoneInput("");
                      phoneInputRef.current?.focus();
                    }}
                  >
                    Add
                  </Button>
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
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
          {profile?.ContactInfo?.phone_numbers && profile.ContactInfo.phone_numbers.length > 0 && (
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Phone</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {profile.ContactInfo.phone_numbers.map((num, i) => (
                  <Badge key={i} variant="secondary" className="font-mono text-xs">
                    {num.startsWith("+960") ? num : `+960 ${num}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {workplaces.some((w) => w.Period.End === null) && (() => {
            const active = workplaces.find((w) => w.Period.End === null)!;
            return (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Workplace</span>
                <span className="text-right">{active.Organization}{active.Position ? ` · ${active.Position}` : ""}</span>
              </div>
            );
          })()}
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
