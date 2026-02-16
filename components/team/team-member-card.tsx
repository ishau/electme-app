"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Phone, Mail } from "lucide-react";
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
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{member.Name}</p>
              {!member.IsActive && <Badge variant="outline">Inactive</Badge>}
            </div>
            <Badge variant="secondary" className="mt-1">
              {teamRoleLabel(member.Role)}
            </Badge>
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
        {(member.ContactInfo?.PhoneNumbers?.length > 0 || member.ContactInfo?.Email) && (
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {member.ContactInfo.PhoneNumbers?.map((num) => (
              <div key={num} className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {num}
              </div>
            ))}
            {member.ContactInfo.Email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {member.ContactInfo.Email}
              </div>
            )}
          </div>
        )}
        {member.Notes && (
          <p className="mt-2 text-xs text-muted-foreground">{member.Notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
