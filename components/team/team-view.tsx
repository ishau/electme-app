"use client";

import { useState, useTransition } from "react";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { TeamMemberForm } from "@/components/team/team-member-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import { updateTeamMember, deleteTeamMember } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TeamMember } from "@/lib/types";

interface TeamViewProps {
  members: TeamMember[];
}

export function TeamView({ members }: TeamViewProps) {
  const queryClient = useQueryClient();
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEdit = (data: {
    name: string;
    role: string;
    contact_info?: {
      mobile_numbers?: string[];
      email?: string;
      viber?: string;
      notes?: string;
    };
    is_active?: boolean;
    notes?: string;
  }) => {
    if (!editingMember) return;
    startTransition(async () => {
      try {
        await updateTeamMember(editingMember.ID, data);
        queryClient.invalidateQueries({ queryKey: ["group"] });
        toast.success("Team member updated");
        setEditingMember(null);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const handleDelete = (memberId: string) => {
    if (!confirm("Delete this team member?")) return;
    startTransition(async () => {
      try {
        await deleteTeamMember(memberId);
        queryClient.invalidateQueries({ queryKey: ["group"] });
        toast.success("Team member removed");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <>
      {members.length === 0 ? (
        <EmptyState icon={Users} title="No team members" description="Add your first team member." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <TeamMemberCard
              key={member.ID}
              member={member}
              onEdit={setEditingMember}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editingMember && (
        <TeamMemberForm
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          member={editingMember}
          onSubmit={handleEdit}
          isPending={isPending}
        />
      )}
    </>
  );
}
