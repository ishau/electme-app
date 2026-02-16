"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { teamRoleLabel } from "@/lib/utils";
import type { TeamMember, TeamRole } from "@/lib/types";

const roles: TeamRole[] = [
  "candidate",
  "campaign_manager",
  "island_coordinator",
  "ward_captain",
  "canvasser",
  "transport_lead",
  "polling_agent",
  "volunteer",
];

interface TeamMemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  onSubmit: (data: {
    name: string;
    role: string;
    contact_info?: {
      phone_numbers?: string[];
      email?: string;
      notes?: string;
    };
    is_active?: boolean;
    notes?: string;
  }) => void;
  isPending: boolean;
}

export function TeamMemberForm({
  open,
  onOpenChange,
  member,
  onSubmit,
  isPending,
}: TeamMemberFormProps) {
  const [name, setName] = useState(member?.Name ?? "");
  const [role, setRole] = useState<string>(member?.Role ?? "volunteer");
  const [phone, setPhone] = useState(member?.ContactInfo?.PhoneNumbers?.join(", ") ?? "");
  const [email, setEmail] = useState(member?.ContactInfo?.Email ?? "");
  const [notes, setNotes] = useState(member?.Notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      role,
      contact_info: {
        phone_numbers: phone ? phone.split(",").map((s) => s.trim()) : [],
        email: email || undefined,
      },
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {teamRoleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phone Numbers (comma separated)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+960..." />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
