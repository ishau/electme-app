"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { teamRoleLabel } from "@/lib/utils";
import type { TeamMember } from "@/lib/types";

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onDelete: (memberId: string) => void;
}

export function TeamMemberCard({ member, onEdit, onDelete }: TeamMemberCardProps) {
  return (
    <Card className={!member.IsActive ? "opacity-60" : ""}>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{member.Name}</p>
              {!member.IsActive && <Badge variant="outline">Inactive</Badge>}
            </div>
            <Badge variant="secondary" className="mt-1">
              {teamRoleLabel(member.Role)}
            </Badge>
            {member.Username && (
              <p className="mt-1 text-xs text-muted-foreground">@{member.Username}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(member)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(member.ID)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}