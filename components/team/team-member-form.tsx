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
    is_active?: boolean;
    username?: string; // only for add
    password?: string;
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
  const [username, setUsername] = useState(member?.Username ?? "");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      role,
      ...(!member && username ? { username } : {}),
      password: password || undefined,
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
          {!member && (
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="For login access" />
            </div>
          )}
          <div className="space-y-2">
            <Label>{member ? "New Password" : "Password"}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={member ? "Leave blank to keep current" : "Set password"} />
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
